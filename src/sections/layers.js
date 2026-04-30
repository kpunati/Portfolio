// src/sections/layers.js — hero hover pressure only
// Section progress CSS vars have been migrated to gsap-scroll.js (ScrollTrigger).
// This file only tracks the mouse-dwell pressure on the hero for the particle/helix boost.

export function initLayers() {
  const root = document.documentElement;
  const hooks = window._particleHooks = window._particleHooks || {};

  const hero = document.getElementById('hero');
  let isHovering = false;
  let pressure = 0;
  let ticking = false;

  function start() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }

  if (hero) {
    hero.addEventListener('mouseenter', () => { isHovering = true; start(); });
    hero.addEventListener('mouseleave', () => { isHovering = false; start(); });
  }

  function frame() {
    if (!ticking) return;

    const heroRect = hero ? hero.getBoundingClientRect() : null;
    const heroVisible = heroRect ? heroRect.bottom > 0 && heroRect.top < window.innerHeight : false;
    
    // If we've scrolled past the hero, force hovering to false
    const targetPressure = (isHovering && heroVisible) ? 1.0 : 0.0;
    
    // Fluidly increment or decrement pressure towards the target at a constant rate
    // 0.006 per frame = ~2.8 seconds to fully transition either way
    if (pressure < targetPressure) {
      pressure = Math.min(1.0, pressure + 0.006);
    } else if (pressure > targetPressure) {
      pressure = Math.max(0.0, pressure - 0.006);
    }

    hooks.densityBoost = (hooks.densityBoost || 0) + pressure * 1.2;
    hooks.helixBoost = pressure * 0.8;

    root.style.setProperty('--hero-pressure', pressure.toFixed(3));

    if (!isHovering && !heroVisible && pressure === 0) {
      ticking = false;
      return;
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', start, { passive: true });
  window.addEventListener('resize', start, { passive: true });
  start();
  window.addEventListener('pagehide', () => { ticking = false; });
}
