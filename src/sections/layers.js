// src/sections/layers.js — 5-Layer cinematic experience upgrade
// Layer 1: Hero pressure — particle density + helix speed ramp on hover dwell
// Layer 2: Projects life — card shimmer, downward particle bias, aurora pre-bleed
// Layer 3: Transition zone — grid convergence, coordinate floaters, globe glow bleed
// Layer 4: Globe parallax rise — surfaces slower than scroll, dots-first reveal
// Layer 5: About cooldown — quieter particles, softer palette

export function initLayers() {
  // ── Shared state ─────────────────────────────────────────────────────────────────────
  let heroHoverStart = null;
  let heroHoverPressure = 0;
  const hooks = window._particleHooks = window._particleHooks || {};

  // ── LAYER 1: Hero pressure system ───────────────────────────────────────────────
  const hero = document.getElementById('hero');
  if (hero) {
    hero.addEventListener('mouseenter', () => { heroHoverStart = performance.now(); });
    hero.addEventListener('mouseleave', () => {
      heroHoverStart = null;
      heroHoverPressure = 0;
      hooks.densityBoost = 0;
      hooks.helixBoost   = 0;
    });
  }

  // ── LAYER 2: Aurora bleed visibility ──────────────────────────────────────────
  const aurora = document.getElementById('aurora-bleed');
  const projectsSection = document.getElementById('projects');

  // ── LAYER 3: Transition zone ────────────────────────────────────────────────────
  const tz        = document.getElementById('transition-zone');
  const tzCanvas  = document.getElementById('tz-canvas');
  const tzCoords  = document.getElementById('tz-coords');
  const tzReticle = document.getElementById('tz-reticle');

  const COORDS = [
    '28.6°N  77.2°E',
    '35.6°N 139.7°E',
    '51.5°N   0.1°W',
    '40.7°N  74.0°W',
    '37.7°N 122.4°W',
    '1.3°N  103.8°E',
    '48.8°N   2.3°E',
    '19.0°N  72.8°E',
    '55.7°N  37.6°E',
    '-33.8°S 151.2°E',
  ];

  function spawnCoords() {
    if (!tzCoords) return;
    tzCoords.innerHTML = '';
    COORDS.forEach((label, i) => {
      const el = document.createElement('div');
      el.className = 'tz-coord-item';
      el.textContent = label;
      el.style.left  = (8 + Math.random() * 80) + '%';
      el.style.top   = (10 + Math.random() * 75) + '%';
      el.style.animationDelay = (i * 0.65) + 's';
      el.style.animationDuration = (5 + Math.random() * 4) + 's';
      tzCoords.appendChild(el);
    });
  }

  function initTZCanvas() {
    if (!tzCanvas) return;
    const ctx = tzCanvas.getContext('2d');
    let W, H;

    function resize() {
      W = tzCanvas.width  = tzCanvas.offsetWidth  || 800;
      H = tzCanvas.height = tzCanvas.offsetHeight || 400;
    }
    resize();
    window.addEventListener('resize', resize);

    function drawGrid(p) {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const alpha = Math.min(p * 1.4, 0.7);
      const lines = 12;
      for (let i = 0; i < lines; i++) {
        const frac   = i / lines;
        const startX = frac * W;
        const endX   = cx + (startX - cx) * (1 - p);
        const endY   = cy + (0 - cy)      * (1 - p);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = 'rgba(212,166,82,0.35)';
        ctx.lineWidth   = 0.8;
        ctx.beginPath(); ctx.moveTo(startX, 0); ctx.lineTo(endX, endY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(startX, H); ctx.lineTo(endX, H - endY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, frac * H); ctx.lineTo(W - endX, frac * H * (1 - p) + cy * p); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W, frac * H); ctx.lineTo(endX,     frac * H * (1 - p) + cy * p); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Globe glow bleed from bottom
      const glowAlpha = p * 0.45;
      const grd = ctx.createRadialGradient(cx, H + 60, 0, cx, H + 60, H * 0.85);
      grd.addColorStop(0,   'rgba(122,90,143,' + glowAlpha + ')');
      grd.addColorStop(0.4, 'rgba(212,166,82,' + (glowAlpha * 0.4) + ')');
      grd.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    }

    tzCanvas._setProgress = p => drawGrid(p);
    drawGrid(0);
  }

  initTZCanvas();
  spawnCoords();

  // ── LAYER 4: Globe parallax wrap ──────────────────────────────────────────────
  const globeWrap = document.getElementById('globe-parallax-wrap');

  // ── LAYER 5: About cooldown ────────────────────────────────────────────────────
  const aboutSection = document.getElementById('about');
  if (aboutSection) aboutSection.classList.add('about-cooldown');

  // ── Main RAF scroll loop ────────────────────────────────────────────────────────
  let ticking = false;

  function onFrame() {
    // Layer 1: hero pressure ramp
    if (heroHoverStart !== null) {
      heroHoverPressure = Math.min((performance.now() - heroHoverStart) / 4000, 1);
    } else {
      heroHoverPressure = Math.max(heroHoverPressure - 0.02, 0);
    }
    hooks.densityBoost = heroHoverPressure * 0.7;
    hooks.helixBoost   = heroHoverPressure * 0.004;

    // Layer 2: aurora bleed
    if (aurora && projectsSection) {
      const pr = projectsSection.getBoundingClientRect();
      aurora.classList.toggle('visible', pr.bottom < window.innerHeight * 1.3 && pr.bottom > 0);
    }

    // Layer 3: TZ progress
    if (tz && tzCanvas && tzCanvas._setProgress) {
      const tzR = tz.getBoundingClientRect();
      const p   = Math.max(0, Math.min(1, 1 - (tzR.top / window.innerHeight)));
      tzCanvas._setProgress(p);
      if (tzReticle) tzReticle.classList.toggle('visible', p > 0.15);
      tz.style.background = 'rgb(' + Math.round(8 - p*2) + ',' + Math.round(7 - p*2) + ',' + Math.round(10 - p*2) + ')';
    }

    // Layer 4: globe parallax
    if (globeWrap) {
      const gr     = globeWrap.getBoundingClientRect();
      const offset = (gr.top - window.innerHeight / 2) * 0.18;
      globeWrap.style.transform = 'translateY(' + offset + 'px)';
    }

    // Layer 5: about cooldown softens particles
    if (aboutSection) {
      const ar = aboutSection.getBoundingClientRect();
      const inAbout = ar.top < window.innerHeight && ar.bottom > 0;
      if (inAbout) hooks.densityBoost = hooks.densityBoost * 0.3;
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onFrame); ticking = true; }
  }, { passive: true });

  requestAnimationFrame(onFrame);
}
