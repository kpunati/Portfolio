// src/main.js — Portfolio orchestrator
// Injects markup first, then chains all inits in order after a rAF
// to guarantee the injected DOM is fully parsed before any module touches it.

import { markup } from './markup.js';
import { initGlobe }     from './scene/globe.js';
import { initParticles } from './sections/particles.js';
import { initMomentum }  from './sections/momentum.js';
import { initLayers }    from './sections/layers.js';

function boot() {
  // 1. Inject all HTML into #app
  const app = document.getElementById('app');
  if (!app) { console.error('main.js: #app not found'); return; }
  app.innerHTML = markup;

  // 2. Wait two rAF ticks so the browser lays out the injected DOM
  //    before any module tries to query canvas / section elements.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // 3. Globe first — heaviest, starts its own rAF loop internally
      initGlobe();

      // 4. Particles + helix (needs hero-canvas + helix-canvas in DOM)
      initParticles();

      // 5. Scroll momentum, rail, aurora, TZ canvas
      initMomentum();

      // 6. Cinematic layer hooks (hero pressure, parallax, cooldown)
      initLayers();
    });
  });
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
