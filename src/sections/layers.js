// src/sections/layers.js - cinematic scroll choreography

export function initLayers() {
  const root = document.documentElement;
  const hooks = window._particleHooks = window._particleHooks || {};
  const globeHooks = window._globeHooks = window._globeHooks || {};

  const hero = document.getElementById('hero');
  const projects = document.getElementById('projects');
  const aurora = document.getElementById('aurora-bleed');
  const tz = document.getElementById('transition-zone');
  const tzCanvas = document.getElementById('tz-canvas');
  const tzCoords = document.getElementById('tz-coords');
  const tzReticle = document.getElementById('tz-reticle');
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

  const coordLabels = [
    '28.6 N 77.2 E',
    '35.6 N 139.7 E',
    '37.7 N 122.4 W',
    '51.5 N 0.1 W',
    'ISS ALT 408 KM',
    'VEL 27,600 KM/H',
    'M4.8 SIGNAL',
    'FIRE CLUSTER 91',
    'ORBIT 51.6 DEG',
    'TRACE LOCK'
  ];

  function seedCoords() {
    if (!tzCoords) return;
    tzCoords.innerHTML = '';
    coordLabels.forEach((label, index) => {
      const el = document.createElement('div');
      el.className = 'tz-coord-item';
      el.textContent = label;
      el.style.left = `${8 + (index * 17) % 78}%`;
      el.style.top = `${12 + (index * 29) % 70}%`;
      el.style.animationDelay = `${index * 0.42}s`;
      el.style.animationDuration = `${6 + (index % 4) * 1.4}s`;
      tzCoords.appendChild(el);
    });
  }

  let tzCtx = null;
  let tzW = 0;
  let tzH = 0;
  let tzTime = 0;

  function resizeTZ() {
    if (!tzCanvas || !tz) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    tzW = Math.max(1, tz.clientWidth);
    tzH = Math.max(1, tz.clientHeight);
    tzCanvas.width = Math.floor(tzW * dpr);
    tzCanvas.height = Math.floor(tzH * dpr);
    tzCanvas.style.width = `${tzW}px`;
    tzCanvas.style.height = `${tzH}px`;
    tzCtx = tzCanvas.getContext('2d');
    tzCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawTransition(progress, dt) {
    if (!tzCtx) return;
    tzTime += dt * 0.001;
    tzCtx.clearRect(0, 0, tzW, tzH);

    const cx = tzW / 2;
    const cy = tzH / 2;
    const eased = progress * progress * (3 - 2 * progress);

    const bg = tzCtx.createLinearGradient(0, 0, 0, tzH);
    bg.addColorStop(0, `rgba(18,16,14,${0.72 - eased * 0.42})`);
    bg.addColorStop(0.55, `rgba(7,6,8,${0.86 + eased * 0.12})`);
    bg.addColorStop(1, `rgba(2,2,4,${0.96})`);
    tzCtx.fillStyle = bg;
    tzCtx.fillRect(0, 0, tzW, tzH);

    const lines = 18;
    for (let i = 0; i <= lines; i++) {
      const x = (i / lines) * tzW;
      const y = (i / lines) * tzH;
      const wave = Math.sin(tzTime * 1.4 + i * 0.8) * 16;
      const alpha = (0.08 + eased * 0.42) * (1 - Math.abs(i / lines - 0.5) * 0.55);

      tzCtx.strokeStyle = `rgba(212,166,82,${alpha})`;
      tzCtx.lineWidth = 0.65;
      tzCtx.beginPath();
      tzCtx.moveTo(x, 0);
      tzCtx.quadraticCurveTo(cx + wave, cy - tzH * 0.16, cx + (x - cx) * (1 - eased) * 0.28, cy);
      tzCtx.stroke();

      tzCtx.strokeStyle = `rgba(122,90,143,${alpha * 0.9})`;
      tzCtx.beginPath();
      tzCtx.moveTo(tzW, y);
      tzCtx.quadraticCurveTo(cx + tzW * 0.22, cy + wave, cx, cy + (y - cy) * (1 - eased) * 0.24);
      tzCtx.stroke();

      tzCtx.strokeStyle = `rgba(212,166,82,${alpha * 0.75})`;
      tzCtx.beginPath();
      tzCtx.moveTo(0, y);
      tzCtx.quadraticCurveTo(cx - tzW * 0.22, cy - wave, cx, cy + (y - cy) * (1 - eased) * 0.24);
      tzCtx.stroke();
    }

    const pulse = 0.75 + Math.sin(tzTime * 2.2) * 0.25;
    const bottomGlow = tzCtx.createRadialGradient(cx, tzH + 40, 0, cx, tzH + 40, tzH * 0.95);
    bottomGlow.addColorStop(0, `rgba(96,119,255,${0.2 * eased})`);
    bottomGlow.addColorStop(0.28, `rgba(122,90,143,${0.42 * eased * pulse})`);
    bottomGlow.addColorStop(0.58, `rgba(212,166,82,${0.2 * eased})`);
    bottomGlow.addColorStop(1, 'rgba(0,0,0,0)');
    tzCtx.fillStyle = bottomGlow;
    tzCtx.fillRect(0, 0, tzW, tzH);

    const lock = tzCtx.createRadialGradient(cx, cy, 0, cx, cy, 180);
    lock.addColorStop(0, `rgba(255,34,68,${0.18 * eased * pulse})`);
    lock.addColorStop(0.34, `rgba(212,166,82,${0.12 * eased})`);
    lock.addColorStop(1, 'rgba(0,0,0,0)');
    tzCtx.fillStyle = lock;
    tzCtx.fillRect(0, 0, tzW, tzH);

    tzCtx.fillStyle = `rgba(244,239,231,${0.025 * eased})`;
    for (let y = 0; y < tzH; y += 5) tzCtx.fillRect(0, y, tzW, 1);
  }

  seedCoords();
  resizeTZ();
  window.addEventListener('resize', resizeTZ);

  let lastTime = performance.now();
  function frame(now) {
    if (!ticking) return;
    requestAnimationFrame(frame);
    const dt = Math.min(34, now - lastTime);
    lastTime = now;

    const heroRect = hero ? hero.getBoundingClientRect() : null;
    const heroVisible = heroRect ? heroRect.bottom > 0 && heroRect.top < window.innerHeight : false;
    const dwell = hoverStart && heroVisible ? clamp((now - hoverStart) / 3200) : 0;
    pressure = smooth(pressure, dwell, hoverStart ? 0.055 : 0.08);

    const projectsProgress = sectionProgress(projects, 1.02, 0.12);
    const projectsRect = projects ? projects.getBoundingClientRect() : null;
    const auroraProgress = projectsRect
      ? clamp((window.innerHeight - projectsRect.bottom + 360) / 520)
      : 0;

    const tzRect = tz ? tz.getBoundingClientRect() : null;
    const tzProgress = tzRect ? clamp((window.innerHeight * 0.86 - tzRect.top) / (window.innerHeight * 0.95)) : 0;
    const globeRect = globeWrap ? globeWrap.getBoundingClientRect() : null;
    const globeProgress = globeRect ? clamp((window.innerHeight * 0.94 - globeRect.top) / (window.innerHeight * 0.72)) : 0;
    const aboutProgress = sectionProgress(about, 0.9, 0.22);

    hooks.densityBoost = pressure * 1.2 + projectsProgress * 0.28;
    hooks.helixBoost = pressure * 1.05 + projectsProgress * 0.18;
    hooks.projectsDrift = projectsProgress;
    hooks.aboutCalm = aboutProgress;
    globeHooks.emerge = globeProgress;

    root.style.setProperty('--hero-pressure', pressure.toFixed(3));
    root.style.setProperty('--projects-depth', projectsProgress.toFixed(3));
    root.style.setProperty('--aurora-progress', auroraProgress.toFixed(3));
    root.style.setProperty('--tz-progress', tzProgress.toFixed(3));
    root.style.setProperty('--globe-emerge', globeProgress.toFixed(3));
    root.style.setProperty('--about-calm', aboutProgress.toFixed(3));

    if (aurora) aurora.classList.toggle('visible', auroraProgress > 0.02);
    if (tzReticle) tzReticle.classList.toggle('visible', tzProgress > 0.1);
    if (tz) tz.classList.toggle('is-locked', tzProgress > 0.32);
    if (projects) projects.classList.toggle('projects-active', projectsProgress > 0.12);
    if (globeShell) globeShell.classList.toggle('is-emerging', globeProgress > 0.02 && globeProgress < 0.82);

    drawTransition(tzProgress, dt);

    if (globeWrap) {
      const lift = (1 - globeProgress) * 160 - tzProgress * 28;
      const scale = 0.965 + globeProgress * 0.035;
      globeWrap.style.transform = `translate3d(0, ${lift.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    }
  }

  requestAnimationFrame(frame);

  window.addEventListener('pagehide', () => { ticking = false; });
}
