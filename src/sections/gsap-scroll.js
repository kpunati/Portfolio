// src/sections/gsap-scroll.js
// GSAP ScrollTrigger integration — replaces per-frame getBoundingClientRect calls
// in layers.js and adds project sidebar alignment + hero typewriter.

export function initGSAPScrollAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('gsap-scroll: GSAP/ScrollTrigger not available');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const root = document.documentElement;
  const hooks = window._particleHooks = window._particleHooks || {};
  const globeHooks = window._globeHooks = window._globeHooks || {};

  /* ─────────────────────────────────────────────────────────────────
     1. SECTION PROGRESS → CSS CUSTOM PROPERTIES
     Replaces the per-frame getBoundingClientRect() calls in layers.js.
     ScrollTrigger only fires on actual scroll events — zero layout thrash.
  ───────────────────────────────────────────────────────────────── */

  // Projects depth
  ScrollTrigger.create({
    trigger: '#projects',
    start: 'top 85%',
    end: 'bottom 15%',
    scrub: 0.3,
    onUpdate(self) {
      const p = self.progress;
      root.style.setProperty('--projects-depth', p.toFixed(3));
      hooks.densityBoost = p * 1.28;
      hooks.projectsDrift = p;
      const el = document.getElementById('projects');
      if (el) el.classList.toggle('projects-active', p > 0.12);
    }
  });

  // Aurora bleed (trailing edge of projects section)
  ScrollTrigger.create({
    trigger: '#projects',
    start: 'center 60%',
    end: 'bottom 10%',
    scrub: 0.4,
    onUpdate(self) {
      const p = self.progress;
      root.style.setProperty('--aurora-progress', p.toFixed(3));
      const aurora = document.getElementById('aurora-bleed');
      if (aurora) aurora.classList.toggle('visible', p > 0.02);
    }
  });

  // Globe emerge (dashboards section)
  ScrollTrigger.create({
    trigger: '#dashboards',
    start: 'top 98%',
    end: 'top 18%',
    scrub: 0.4,
    onUpdate(self) {
      const p = self.progress;
      root.style.setProperty('--globe-emerge', p.toFixed(3));
      globeHooks.emerge = p;
      // Globe parallax lift — replaces the per-frame transform in layers.js
      const globeWrap = document.getElementById('globe-parallax-wrap');
      if (globeWrap) {
        const lift = (1 - p) * 150;
        const scale = 0.965 + p * 0.035;
        globeWrap.style.transform = `translate3d(0,${lift.toFixed(1)}px,0) scale(${scale.toFixed(3)})`;
      }
      const globeShell = document.getElementById('globe-embed-shell');
      if (globeShell) globeShell.classList.toggle('is-emerging', p > 0.02 && p < 0.82);
    }
  });

  // Scan progress (dashboards interior)
  ScrollTrigger.create({
    trigger: '#dashboards',
    start: 'top 24%',
    end: 'bottom 22%',
    scrub: 0.4,
    onUpdate(self) {
      const p = self.progress * (1 - self.progress * 0.62);
      root.style.setProperty('--scan-progress', p.toFixed(3));
      hooks.projectsDrift = (hooks.projectsDrift || 0) + p * 0.35;
    }
  });

  // About calm
  ScrollTrigger.create({
    trigger: '#about',
    start: 'top 90%',
    end: 'top 22%',
    scrub: 0.4,
    onUpdate(self) {
      const p = self.progress;
      root.style.setProperty('--about-calm', p.toFixed(3));
      hooks.aboutCalm = p;
    }
  });

  /* ─────────────────────────────────────────────────────────────────
     2. SCROLL REVEAL — batched GSAP (replaces IntersectionObserver)
     ScrollTrigger.batch fires once per group, avoids per-element observers.
  ───────────────────────────────────────────────────────────────── */
  ScrollTrigger.batch('.reveal:not(.visible)', {
    start: 'top 87%',
    once: true,
    onEnter(elements) {
      gsap.to(elements, {
        opacity: 1,
        y: 0,
        duration: 0.72,
        ease: 'power3.out',
        stagger: 0.09,
        overwrite: true,
        onStart() { elements.forEach(el => el.classList.add('visible')); }
      });
    }
  });

  /* ─────────────────────────────────────────────────────────────────
     3. PROJECT SIDEBAR ALIGNMENT
     As the user scrolls through the 340vh projects stage, GSAP scrubs
     between per-project panels in the sidebar so the copy tracks
     whichever card is currently in focus.
  ───────────────────────────────────────────────────────────────── */
  initProjectSidebar();

  /* ─────────────────────────────────────────────────────────────────
     4. HERO ENTRANCE — typewriter eyebrow + sequence
  ───────────────────────────────────────────────────────────────── */
  initHeroEntrance();
}

/* ── Project Sidebar Scrub ──────────────────────────────────────── */
function initProjectSidebar() {
  const panels = document.querySelectorAll('.project-panel');
  if (panels.length < 2) return;

  // Stack all panels absolutely inside their wrapper
  gsap.set(panels, { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0, y: 28 });
  gsap.set(panels[0], { opacity: 1, y: 0 });

  // Build a scrubbed timeline: panel 0 → 1 → 2
  const tl = gsap.timeline({ paused: true });

  // 0 → 1
  tl.to(panels[0], { opacity: 0, y: -22, duration: 0.38, ease: 'power2.in' }, 0.12)
    .to(panels[1], { opacity: 1, y: 0,  duration: 0.42, ease: 'power2.out' }, 0.22)
  // 1 → 2
    .to(panels[1], { opacity: 0, y: -22, duration: 0.38, ease: 'power2.in' }, 0.62)
    .to(panels[2], { opacity: 1, y: 0,  duration: 0.42, ease: 'power2.out' }, 0.72);

  ScrollTrigger.create({
    trigger: '#projects',
    start: 'top 18%',
    end: 'bottom 22%',
    scrub: 1.2,
    animation: tl
  });

  // Also keep the step-indicator highlight in sync
  ScrollTrigger.create({
    trigger: '#projects',
    start: 'top 18%',
    end: 'bottom 22%',
    scrub: 0.8,
    onUpdate(self) {
      const idx = Math.min(Math.floor(self.progress * 3), 2);
      document.documentElement.style.setProperty('--active-project', String(idx));
    }
  });
}

/* ── Hero Entrance ──────────────────────────────────────────────── */
function initHeroEntrance() {
  const eyebrow = document.querySelector('.hero-eyebrow');
  if (!eyebrow) return;

  const lines = [
    eyebrow.getAttribute('data-line1') || '',
    eyebrow.getAttribute('data-line2') || ''
  ].filter(Boolean);
  if (!lines.length) return;

  // Clear the CSS animation (we take control with GSAP)
  eyebrow.style.animation = 'none';
  eyebrow.style.opacity = '1';
  eyebrow.style.transform = 'translateY(0)';
  eyebrow.innerHTML = '';

  const tl = gsap.timeline({ delay: 0.35 });

  lines.forEach((line, lineIdx) => {
    // Line separator
    if (lineIdx > 0) {
      const sep = document.createElement('span');
      sep.className = 'eyebrow-sep';
      sep.setAttribute('aria-hidden', 'true');
      eyebrow.appendChild(sep);
      tl.from(sep, { opacity: 0, scaleX: 0, duration: 0.22, ease: 'power2.out' }, '>-0.1');
    }

    // Typewriter each character
    [...line].forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'eyebrow-char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      eyebrow.appendChild(span);
      tl.fromTo(span,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.028, ease: 'none' },
        lineIdx === 0 ? (i * 0.028 + 0.05) : ('>' + (i === 0 ? 0 : -0.016))
      );
    });
  });
}
