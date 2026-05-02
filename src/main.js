// src/main.js - Portfolio orchestrator

import { markup } from './markup.js';
import { visualScheduler } from './performance/visualScheduler.js';

function whenIdle(callback) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: 1200 });
    return;
  }
  window.setTimeout(callback, 180);
}

function detectVisualQuality(prefersReducedMotion) {
  if (prefersReducedMotion) return 'lite';
  const cores = navigator.hardwareConcurrency || 4;
  const hasMemorySignal = typeof navigator.deviceMemory === 'number';
  const memory = hasMemorySignal ? navigator.deviceMemory : 8;
  const dpr = window.devicePixelRatio || 1;
  const mobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;

  if (mobile || cores <= 4 || (hasMemorySignal && memory <= 4)) return 'lite';
  if (dpr >= 2.5) return 'balanced';
  if (cores < 8 || memory < 8 || dpr > 1.75) return 'balanced';
  return 'full';
}

function setVisualQuality(quality) {
  document.documentElement.dataset.visualQuality = quality;
  document.documentElement.classList.toggle('visual-quality-full', quality === 'full');
  document.documentElement.classList.toggle('visual-quality-balanced', quality === 'balanced');
  document.documentElement.classList.toggle('visual-quality-lite', quality === 'lite');
  window.__portfolioVisualQuality = quality;
}

function loadGlobeWhenNeeded(options = {}) {
  const dashboards = document.getElementById('dashboards');
  let loaded = false;

  const load = async () => {
    if (loaded) return;
    loaded = true;
    try {
      const { initGlobe } = await import('./scene/globe.js');
      initGlobe(options);
    } catch (error) {
      console.error('main.js: globe boot failed', error);
      const shell = document.getElementById('globe-embed-shell');
      const loading = document.getElementById('g-loading');
      if (shell) shell.classList.add('globe-error');
      if (loading) {
        loading.classList.add('is-error');
        const text = loading.querySelector('p');
        if (text) text.textContent = 'Globe renderer unavailable.';
      }
    }
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
  const visualQuality = detectVisualQuality(prefersReducedMotion);
  setVisualQuality(visualQuality);
  visualScheduler.configure({ prefersReducedMotion, visualQuality });

  const [
    { initMomentum },
    { initLayers },
    { initSpotlight },
    { initGSAPScrollAnimations },
  ] = await Promise.all([
    import('./sections/momentum.js'),
    import('./sections/layers.js'),
    import('./sections/spotlight.js'),
    import('./sections/gsap-scroll.js'),
  ]);

  initMomentum();
  initLayers();

  if (!prefersReducedMotion) {
    initSpotlight();
  }

  // GSAP ScrollTrigger animations — handles section progress vars,
  // scroll reveal, project sidebar scrub, and hero typewriter.
  initGSAPScrollAnimations();

  const loadHelixWhenNeeded = () => {
    const helixCanvas = document.getElementById('helix-canvas');
    const projects = document.getElementById('projects');
    if (!helixCanvas || !projects || prefersReducedMotion) return;

    let loaded = false;
    const load = async () => {
      if (loaded) return;
      loaded = true;
      const { initParticles } = await import('./sections/particles.js');
      initParticles({ prefersReducedMotion, visualQuality });
    };

    if (!('IntersectionObserver' in window)) {
      whenIdle(load);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        load();
      }
    }, { rootMargin: '900px 0px', threshold: 0.01 });

    observer.observe(projects);
  };

  if (!prefersReducedMotion) {
    whenIdle(async () => {
      const { initDataTerrain } = await import('./scene/dataTerrain.js');
      initDataTerrain({ visualQuality });
    });
  }

  loadHelixWhenNeeded();
  loadGlobeWhenNeeded({ visualQuality });
}

function boot() {
  const app = document.getElementById('app');
  if (!app) { console.error('main.js: #app not found'); return; }
  app.innerHTML = markup;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bootVisuals().then(() => {
        const loader = document.getElementById('liquid-loader');
        if (loader) {
          // Trigger the liquid bar fill
          loader.classList.add('expanding');
          // Wait for the bar to fill (1400ms), then fade out the loader
          setTimeout(() => loader.classList.add('hidden'), 1400);
        }
      }).catch((error) => {
        console.error('main.js: visual boot failed', error);
        const loader = document.getElementById('liquid-loader');
        if (loader) loader.classList.add('hidden');
      });
    });
  });

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
