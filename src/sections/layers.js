// src/sections/layers.js — hero hover pressure only
// Section progress CSS vars have been migrated to gsap-scroll.js (ScrollTrigger).
// This file only tracks the mouse-dwell pressure on the hero for the particle/helix boost.

export function initLayers() {
  const root = document.documentElement;
  const hooks = window._particleHooks = window._particleHooks || {};

  const hero = document.getElementById('hero');
  let hoverStart = null;
  let pressure = 0;
  let ticking = true;

  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const smooth = (from, to, rate) => from + (to - from) * rate;

  if (hero) {
    hero.addEventListener('mouseenter', () => { hoverStart = performance.now(); });
    hero.addEventListener('mousemove', () => {
      if (hoverStart === null) hoverStart = performance.now();
    });
    hero.addEventListener('mouseleave', () => { hoverStart = null; });
  }

  function frame(now) {
    if (!ticking) return;
    requestAnimationFrame(frame);

    const heroRect = hero ? hero.getBoundingClientRect() : null;
    const heroVisible = heroRect ? heroRect.bottom > 0 && heroRect.top < window.innerHeight : false;
    const dwell = hoverStart && heroVisible ? clamp((now - hoverStart) / 3200) : 0;
    pressure = smooth(pressure, dwell, hoverStart ? 0.055 : 0.08);

    hooks.densityBoost = (hooks.densityBoost || 0) + pressure * 1.2;
    hooks.helixBoost = pressure * 0.8;

    root.style.setProperty('--hero-pressure', pressure.toFixed(3));
  }

  requestAnimationFrame(frame);
  window.addEventListener('pagehide', () => { ticking = false; });
}
