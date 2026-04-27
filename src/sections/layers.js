// src/sections/layers.js - cinematic scroll choreography

export function initLayers() {
  const root = document.documentElement;
  const hooks = window._particleHooks = window._particleHooks || {};
  const globeHooks = window._globeHooks = window._globeHooks || {};

  const hero = document.getElementById('hero');
  const projects = document.getElementById('projects');
  const aurora = document.getElementById('aurora-bleed');
  const globeWrap = document.getElementById('globe-parallax-wrap');
  const globeShell = document.getElementById('globe-embed-shell');
  const about = document.getElementById('about');

  if (about) about.classList.add('about-cooldown');
  if (globeShell) globeShell.classList.add('globe-stage');

  let hoverStart = null;
  let pressure = 0;
  let ticking = true;

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const smooth = (from, to, rate) => from + (to - from) * rate;

  function sectionProgress(el, start = 0.85, end = 0.15) {
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    return clamp((vh * start - rect.top) / (vh * (start - end) + rect.height * 0.35));
  }

  if (hero) {
    hero.addEventListener('mouseenter', () => { hoverStart = performance.now(); });
    hero.addEventListener('mousemove', () => {
      if (hoverStart === null) hoverStart = performance.now();
    });
    hero.addEventListener('mouseleave', () => { hoverStart = null; });
  }

  let lastTime = performance.now();
  function frame(now) {
    if (!ticking) return;
    requestAnimationFrame(frame);
    lastTime = now;

    const heroRect = hero ? hero.getBoundingClientRect() : null;
    const heroVisible = heroRect ? heroRect.bottom > 0 && heroRect.top < window.innerHeight : false;
    const dwell = hoverStart && heroVisible ? clamp((now - hoverStart) / 3200) : 0;
    pressure = smooth(pressure, dwell, hoverStart ? 0.055 : 0.08);

    const projectsProgress = sectionProgress(projects, 1.08, 0.08);
    const projectsRect = projects ? projects.getBoundingClientRect() : null;
    const auroraProgress = projectsRect
      ? clamp((window.innerHeight - projectsRect.bottom + 360) / 520)
      : 0;

    const globeRect = globeWrap ? globeWrap.getBoundingClientRect() : null;
    const globeProgress = globeRect ? clamp((window.innerHeight * 0.98 - globeRect.top) / (window.innerHeight * 0.86)) : 0;
    const scanProgress = globeRect ? clamp((window.innerHeight * 1.24 - globeRect.top) / (window.innerHeight * 0.78)) * (1 - globeProgress * 0.62) : 0;
    const aboutProgress = sectionProgress(about, 0.9, 0.22);

    hooks.densityBoost = pressure * 1.2 + projectsProgress * 0.28;
    hooks.helixBoost = pressure * 0.8 + projectsProgress * 0.1;
    hooks.projectsDrift = projectsProgress + scanProgress * 0.35;
    hooks.aboutCalm = aboutProgress;
    globeHooks.emerge = globeProgress;

    root.style.setProperty('--hero-pressure', pressure.toFixed(3));
    root.style.setProperty('--projects-depth', projectsProgress.toFixed(3));
    root.style.setProperty('--aurora-progress', auroraProgress.toFixed(3));
    root.style.setProperty('--scan-progress', scanProgress.toFixed(3));
    root.style.setProperty('--globe-emerge', globeProgress.toFixed(3));
    root.style.setProperty('--about-calm', aboutProgress.toFixed(3));

    if (aurora) aurora.classList.toggle('visible', auroraProgress > 0.02);
    if (projects) projects.classList.toggle('projects-active', projectsProgress > 0.12);
    if (globeShell) globeShell.classList.toggle('is-emerging', globeProgress > 0.02 && globeProgress < 0.82);

    if (globeWrap) {
      const lift = (1 - globeProgress) * 150;
      const scale = 0.965 + globeProgress * 0.035;
      globeWrap.style.transform = `translate3d(0, ${lift.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    }
  }

  requestAnimationFrame(frame);

  window.addEventListener('pagehide', () => { ticking = false; });
}
