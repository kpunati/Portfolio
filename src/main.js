// src/main.js - Portfolio orchestrator

import { markup } from './markup.js';

function whenIdle(callback) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: 1200 });
    return;
  }
  window.setTimeout(callback, 180);
}

function loadGlobeWhenNeeded() {
  const dashboards = document.getElementById('dashboards');
  let loaded = false;

  const load = async () => {
    if (loaded) return;
    loaded = true;
    const { initGlobe } = await import('./scene/globe.js');
    initGlobe();
  };

  if (!dashboards || !('IntersectionObserver' in window)) {
    whenIdle(load);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      load();
    }
  }, { rootMargin: '900px 0px', threshold: 0.01 });

  observer.observe(dashboards);
}

async function bootVisuals() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [
    { initParticles },
    { initMomentum },
    { initLayers },
  ] = await Promise.all([
    import('./sections/particles.js'),
    import('./sections/momentum.js'),
    import('./sections/layers.js'),
  ]);

  initParticles({ prefersReducedMotion });
  initMomentum();
  initLayers();

  if (!prefersReducedMotion) {
    whenIdle(async () => {
      const { initDataTerrain } = await import('./scene/dataTerrain.js');
      initDataTerrain();
    });
  }

  loadGlobeWhenNeeded();
}

function boot() {
  const app = document.getElementById('app');
  if (!app) { console.error('main.js: #app not found'); return; }
  app.innerHTML = markup;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bootVisuals().catch((error) => {
        console.error('main.js: visual boot failed', error);
      });
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
