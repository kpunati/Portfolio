// src/sections/gsap-scroll.js
// GSAP ScrollTrigger integration — replaces per-frame getBoundingClientRect calls
// in layers.js and adds project sidebar alignment + hero typewriter.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { visualScheduler } from '../performance/visualScheduler.js';

export function initGSAPScrollAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  const root = document.documentElement;
  const hooks = window._particleHooks = window._particleHooks || {};
  const globeHooks = window._globeHooks = window._globeHooks || {};
  let dashboardEntered = false;

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
      visualScheduler.setSectionProgress('projects', p);
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
      visualScheduler.setSectionProgress('aurora', p);
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
      visualScheduler.setSectionProgress('globe', p);
      visualScheduler.setSectionProgress('dashboards', p);
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
      if (globeShell) {
        globeShell.classList.toggle('is-emerging', p > 0.02 && p < 0.82);
        if (!dashboardEntered && p > 0.18) {
          dashboardEntered = true;
          globeShell.classList.add('is-dashboard-ready');
          document.getElementById('dashboards')?.classList.add('dashboards-entered');
        }
      }
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
      visualScheduler.setSectionProgress('scan', p);
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
      visualScheduler.setSectionProgress('about', p);
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

  ScrollTrigger.batch('.reveal-opacity:not(.visible)', {
    start: 'top 87%',
    once: true,
    onEnter(elements) {
      gsap.to(elements, {
        opacity: 1,
        duration: 0.72,
        ease: 'power3.out',
        stagger: 0.09,
        overwrite: 'auto',
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
  const cards = Array.from(document.querySelectorAll('.project-card'));
  const steps = Array.from(document.querySelectorAll('.project-stage-steps span'));
  const stageCopy = document.querySelector('.project-stage-copy');
  const stageTrack = document.querySelector('.project-stage-track');
  const stage = document.querySelector('.project-scroll-stage');
  const projectCount = Math.min(panels.length, cards.length, steps.length);
  const maxProjectIndex = projectCount - 1;
  let activeIndex = -1;
  let scrollIndex = 0;
  let scrollProgress = 0;
  if (projectCount < 2) return;

  function setProjectSystemProgress(progress) {
    if (!stageCopy) return;
    stageCopy.style.setProperty('--system-progress', progress.toFixed(3));
  }

  function updateProjectSystemPosition() {
    if (!stage || !stageCopy || !stageTrack) return;
    if (window.innerWidth <= 900) {
      stageTrack.style.setProperty('--system-y', '0px');
      stageTrack.style.transform = '';
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const copyHeight = stageCopy.offsetHeight;
    const stageHeight = stage.offsetHeight;
    const viewportCenterInStage = (window.innerHeight * 0.5) - stageRect.top;
    const targetY = viewportCenterInStage - (copyHeight * 0.5);
    const maxY = Math.max(0, stageHeight - copyHeight);
    const clampedY = Math.max(0, Math.min(maxY, targetY));

    stageTrack.style.setProperty('--system-y', `${Math.round(clampedY)}px`);
    stageTrack.style.transform = `translate3d(0, ${Math.round(clampedY)}px, 0)`;
  }

  function setProjectPanel(index) {
    panels.forEach((panel, panelIndex) => {
      const isActive = panelIndex === index;
      panel.classList.toggle('is-active', isActive);
      if (isActive) {
        gsap.to(panel, {
          autoAlpha: 1,
          y: 0,
          duration: 0.24,
          ease: 'power2.out',
          overwrite: true
        });
      } else {
        gsap.set(panel, { autoAlpha: 0, y: 10, overwrite: true });
      }
    });
  }

  function setProjectActive(index, progress, shouldDispatch = true) {
    const nextIndex = Math.max(0, Math.min(maxProjectIndex, index));
    document.documentElement.style.setProperty('--active-project', String(nextIndex));
    document.documentElement.style.setProperty('--project-local-progress', progress.toFixed(3));
    setProjectSystemProgress(progress);
    if (nextIndex === activeIndex) return;
    activeIndex = nextIndex;
    setProjectPanel(nextIndex);
    cards.forEach((card, cardIndex) => {
      const isActive = cardIndex === nextIndex;
      card.classList.toggle('is-active', isActive);
      card.style.setProperty('--card-depth', isActive ? '1' : '0.22');
    });
    steps.forEach((step, stepIndex) => {
      const isActive = stepIndex === nextIndex;
      step.classList.toggle('is-active', isActive);
      if (isActive) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    if (shouldDispatch) {
      window.dispatchEvent(new CustomEvent('portfolio:project-focus', {
        detail: { index: nextIndex, progress }
      }));
    }
  }

  // Stack panels, but show exactly one at a time so project copy cannot overlap.
  gsap.set(panels, { position: 'absolute', top: 0, left: 0, right: 0, autoAlpha: 0, y: 10 });
  gsap.set(panels[0], { autoAlpha: 1, y: 0 });
  setProjectActive(0, 0, false);
  updateProjectSystemPosition();

  ScrollTrigger.create({
    trigger: stage,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: updateProjectSystemPosition,
    onEnter: updateProjectSystemPosition,
    onEnterBack: updateProjectSystemPosition,
    onLeave: updateProjectSystemPosition,
    onLeaveBack: updateProjectSystemPosition,
    onRefresh: updateProjectSystemPosition
  });

  // Active cards and step indicators follow scroll position only.
  ScrollTrigger.create({
    trigger: '#projects',
    start: 'top 28%',
    end: 'bottom 34%',
    scrub: 0.8,
    onUpdate(self) {
      scrollProgress = self.progress;
      scrollIndex = Math.min(Math.floor(self.progress * projectCount), maxProjectIndex);
      updateProjectSystemPosition();
      setProjectActive(scrollIndex, scrollProgress);
    },
    onRefresh() {
      updateProjectSystemPosition();
    }
  });

  window.addEventListener('scroll', updateProjectSystemPosition, { passive: true });
  window.addEventListener('resize', updateProjectSystemPosition, { passive: true });
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

  // Once typewriter finishes, start a continuous staggered wave across every character
  tl.eventCallback('onComplete', () => {
    gsap.to(eyebrow.querySelectorAll('.eyebrow-char'), {
      y: -3,
      duration: 0.88,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      stagger: {
        each: 0.055,
        repeat: -1
      }
    });
  });
}
