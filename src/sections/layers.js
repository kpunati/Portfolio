// src/sections/layers.js - hero hover pressure only
// Section progress CSS vars are owned by gsap-scroll.js. This module only
// feeds the shared scheduler with the lightweight hero pressure state.

import { visualScheduler } from '../performance/visualScheduler.js';

export function initLayers() {
  const root = document.documentElement;
  const hooks = window._particleHooks = window._particleHooks || {};
  const hero = document.getElementById('hero');

  let isHovering = false;
  let heroVisible = true;
  let pressure = 0;

  if (hero) {
    hero.addEventListener('mouseenter', () => { isHovering = true; });
    hero.addEventListener('mouseleave', () => { isHovering = false; });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        heroVisible = entries[0]?.isIntersecting ?? true;
      }, { threshold: 0.01 });
      observer.observe(hero);
    }
  }

  visualScheduler.register('hero-pressure', {
    frameInterval: 16,
    shouldRun() {
      return heroVisible || isHovering || pressure > 0.001;
    },
    update() {
      const targetPressure = (isHovering && heroVisible) ? 1 : 0;
      if (pressure < targetPressure) {
        pressure = Math.min(1, pressure + 0.006);
      } else if (pressure > targetPressure) {
        pressure = Math.max(0, pressure - 0.006);
      }

      hooks.densityBoost = (hooks.densityBoost || 0) + pressure * 1.2;
      hooks.helixBoost = pressure * 0.8;
      root.style.setProperty('--hero-pressure', pressure.toFixed(3));
    }
  });
}
