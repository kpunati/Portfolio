// src/sections/momentum.js — Scroll momentum & interactive UI systems
// Called by main.js after markup is injected into the DOM.

import { gsap } from 'gsap';
import { visualScheduler } from '../performance/visualScheduler.js';

export function initMomentum() {
/* ═══════════════════════════════════════════════════════════════
   SCROLL-MOMENTUM & INTERACTIVE UI SYSTEMS
   ═══════════════════════════════════════════════════════════════ */
(function() {

  /* ── Shared scroll state ── */
  var SY = window.scrollY || 0;
  var needsUiUpdate = true;
  var rafPending = false;
  var rectCache = {};

  function updateCache() {
    sections.forEach(function(id) {
      var el = document.getElementById(id);
      if(el) {
        var rect = el.getBoundingClientRect();
        rectCache[id] = { top: rect.top + SY, height: rect.height };
      }
    });
  }

  window.addEventListener('scroll', function(){
    SY = window.scrollY;
    var pageHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    visualScheduler.setScroll(SY, SY / pageHeight);
    needsUiUpdate = true;
    scheduleUiUpdate();
  }, {passive:true});

  var resizeTimeout;
  window.addEventListener('resize', function(){ 
    needsUiUpdate = true; 
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      updateCache();
      scheduleUiUpdate();
    }, 150);
  });

  /* ── Helpers ── */
  function sectionTop(id){
    return rectCache[id] ? rectCache[id].top : 0;
  }
  function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}

  /* ────────────────────────────────────────────────────────────
     1. JOURNEY RAIL — scroll tracking
  ──────────────────────────────────────────────────────────── */
  var rail = document.getElementById('journey-rail');
  var sections = ['hero','projects','dashboards','about'];
  var railDots  = {
    hero:       document.getElementById('rail-hero'),
    projects:   document.getElementById('rail-projects'),
    dashboards: document.getElementById('rail-dashboards'),
    about:      document.getElementById('rail-about')
  };
  var railLines = [
    document.getElementById('rail-line-1'),
    document.getElementById('rail-line-2'),
    document.getElementById('rail-line-3')
  ];
  var commandStrip = document.getElementById('command-strip');
  var commandSection = document.getElementById('command-section');
  var commandProgress = document.getElementById('command-progress-bar');
  var labels = {
    hero: 'Hero',
    projects: 'Projects',
    dashboards: 'Live Dashboards',
    about: 'About'
  };

  // Rail click navigation
  document.querySelectorAll('.rail-node').forEach(function(node){
    node.addEventListener('click', function(){
      var t = node.getAttribute('data-target');
      var el = document.getElementById(t);
      if(el) el.scrollIntoView({behavior:'smooth'});
    });
  });


  /* ── Project card tilt + click to open modal ────────────────── */
  Array.prototype.slice.call(document.querySelectorAll('.project-card')).forEach(function(card) {
    card.addEventListener('mousemove', function(event) {
      var rect = card.getBoundingClientRect();
      var x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      var y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      card.style.setProperty('--tilt-x', (-y * 4.5).toFixed(2) + 'deg');
      card.style.setProperty('--tilt-y', (x * 5.5).toFixed(2) + 'deg');
    });
    card.addEventListener('mouseleave', function() {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
    card.addEventListener('click', function() {
      var idx = parseInt(card.getAttribute('data-project-open'), 10);
      if (!isNaN(idx)) openProjectModal(idx);
    });
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var idx = parseInt(card.getAttribute('data-project-open'), 10);
        if (!isNaN(idx)) openProjectModal(idx);
      }
    });
  });

  /* ── Project detail modal ── */
  var PROJECT_DATA = [
    {
      kicker: 'AI Powered BI Dashboard',
      title: 'Stock Sentiment Analysis',
      desc: 'End-to-end financial intelligence platform driven by a custom AI agent. The agent continuously ingests live market news and social signals, scores sentiment in real time, and surfaces actionable insights alongside fully interactive stock charts with customizable technical indicators \u2014 RSI, MACD, Bollinger Bands, and more.',
      steps: ['Data ingestion', 'Agent reasoning', 'Live visualisation'],
      chips: [
        { label: 'Python', cls: 'chip-gold' },
        { label: 'Agentic AI', cls: 'chip-gold' },
        { label: 'Live Charts', cls: 'chip-neutral' },
        { label: 'APIs', cls: 'chip-neutral' }
      ],
      link: 'https://stock-dashboardv2.vercel.app/',
      accentColor: 'var(--color-primary)'
    },
    {
      kicker: 'AI App',
      title: 'Neural Kitchen',
      desc: 'AI-powered web app that generates tailored recipes from whatever ingredients you have on hand. Combines a large language model with a curated ingredient knowledge graph to return relevant, practical meal ideas \u2014 with dietary filters and substitution suggestions.',
      steps: ['Ingredient parsing', 'LLM generation', 'Recipe delivery'],
      chips: [
        { label: 'LLM', cls: 'chip-plum' },
        { label: 'AI', cls: 'chip-plum' },
        { label: 'Python', cls: 'chip-neutral' },
        { label: 'API', cls: 'chip-neutral' }
      ],
      link: 'https://neuralkitchen.vercel.app',
      accentColor: '#B8A0CC'
    },
    {
      kicker: 'Automation',
      title: 'AI Aware Newsletter',
      desc: 'Fully automated newsletter pipeline that scrapes AI research sources daily, summarises them using LLMs, formats a structured digest, and distributes on a fixed schedule \u2014 zero manual intervention from end to end.',
      steps: ['Scrape & summarise', 'Format digest', 'Schedule & send'],
      chips: [
        { label: 'Automation', cls: 'chip-success' },
        { label: 'LLM', cls: 'chip-plum' },
        { label: 'Python', cls: 'chip-neutral' },
        { label: 'Scheduling', cls: 'chip-neutral' }
      ],
      link: 'https://aiaware.beehiiv.com',
      accentColor: 'var(--color-success)'
    }
  ];

  var projectDetailModal  = document.getElementById('project-detail-modal');
  var projectDetailClose  = document.getElementById('project-detail-close');
  var projectDetailBack   = document.getElementById('project-detail-backdrop');
  var pdKicker  = document.getElementById('project-detail-kicker');
  var pdTitle   = document.getElementById('project-detail-title');
  var pdDesc    = document.getElementById('project-detail-desc');
  var pdSteps   = document.getElementById('project-detail-steps');
  var pdChips   = document.getElementById('project-detail-chips');
  var pdLink    = document.getElementById('project-detail-link');
  var pdLastFocus = null;

  function openProjectModal(idx) {
    var data = PROJECT_DATA[idx];
    if (!data || !projectDetailModal) return;
    pdLastFocus = document.activeElement;
    if (pdKicker) { pdKicker.textContent = data.kicker; pdKicker.style.color = data.accentColor; }
    if (pdTitle)  pdTitle.textContent = data.title;
    if (pdDesc)   pdDesc.textContent  = data.desc;
    if (pdSteps)  pdSteps.innerHTML   = data.steps.map(function(s, i){
      return '<span><b>0' + (i + 1) + '</b> ' + s + '</span>';
    }).join('');
    if (pdChips)  pdChips.innerHTML   = data.chips.map(function(c){
      return '<span class="chip ' + c.cls + '">' + c.label + '</span>';
    }).join('');
    if (pdLink)   pdLink.href = data.link;
    projectDetailModal.classList.add('open');
    projectDetailModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (projectDetailClose) projectDetailClose.focus();
    // Let spotlight system re-cache the now-visible modal card rect
    requestAnimationFrame(function() { window.dispatchEvent(new Event('resize')); });
  }

  function closeProjectModal() {
    if (!projectDetailModal) return;
    projectDetailModal.classList.remove('open');
    projectDetailModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (pdLastFocus && typeof pdLastFocus.focus === 'function') pdLastFocus.focus();
  }

  if (projectDetailClose) projectDetailClose.addEventListener('click', closeProjectModal);
  if (projectDetailBack)  projectDetailBack.addEventListener('click', closeProjectModal);
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && projectDetailModal && projectDetailModal.classList.contains('open')) closeProjectModal();
  });


  var contactModal = document.getElementById('contact-modal');
  var contactForm = document.getElementById('contact-form');
  var contactStatus = document.getElementById('contact-status');
  var contactSubmit = contactForm ? contactForm.querySelector('button[type="submit"]') : null;
  var lastFocus = null;

  function openContactModal() {
    if(!contactModal) return;
    lastFocus = document.activeElement;
    contactModal.classList.add('open');
    contactModal.setAttribute('aria-hidden', 'false');
    if(contactStatus) {
      contactStatus.textContent = '';
      contactStatus.classList.remove('success', 'error');
    }
    document.body.style.overflow = 'hidden';
    var firstInput = contactModal.querySelector('input, textarea, button');
    if(firstInput) firstInput.focus();
  }

  function closeContactModal() {
    if(!contactModal) return;
    contactModal.classList.remove('open');
    contactModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if(lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  document.querySelectorAll('[data-contact-open]').forEach(function(trigger){
    trigger.addEventListener('click', openContactModal);
  });
  document.querySelectorAll('[data-contact-close]').forEach(function(trigger){
    trigger.addEventListener('click', closeContactModal);
  });
  document.addEventListener('keydown', function(event){
    if(event.key === 'Escape' && contactModal && contactModal.classList.contains('open')) closeContactModal();
  });
  if(contactForm) {
    contactForm.addEventListener('submit', async function(event){
      event.preventDefault();
      var formData = new FormData(contactForm);
      var payload = {
        name: String(formData.get('name') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        message: String(formData.get('message') || '').trim()
      };

      if(contactStatus) {
        contactStatus.textContent = 'Transmitting signal...';
        contactStatus.classList.remove('success', 'error');
      }
      if(contactSubmit) {
        contactSubmit.disabled = true;
        contactSubmit.textContent = 'Sending...';
      }

      try {
        var response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        var result = await response.json().catch(function(){ return {}; });

        if(!response.ok) {
          throw new Error(result.error || 'Message could not be sent.');
        }

        if(contactStatus) {
          contactStatus.textContent = 'Signal sent. I will reply directly from my inbox.';
          contactStatus.classList.add('success');
        }
        contactForm.reset();
      } catch(error) {
        if(contactStatus) {
          contactStatus.textContent = error.message || 'Message could not be sent. Please try again.';
          contactStatus.classList.add('error');
        }
      } finally {
        if(contactSubmit) {
          contactSubmit.disabled = false;
          contactSubmit.textContent = 'Prepare Signal';
        }
      }
    });
  }

  function updateRail(){
    if(!rail) return;
    if(SY > 80) rail.classList.add('visible');
    else rail.classList.remove('visible');

    var VH = window.innerHeight;
    var activeIdx = 0;
    sections.forEach(function(id, i){
      var top = sectionTop(id);
      if(SY + VH * 0.4 >= top) activeIdx = i;
    });
    sections.forEach(function(id, i){
      var dot = railDots[id];
      if(!dot) return;
      if(i === activeIdx) dot.classList.add('active');
      else dot.classList.remove('active');
    });
    railLines.forEach(function(line, i){
      if(!line) return;
      if(i < activeIdx) line.classList.add('active');
      else line.classList.remove('active');
    });

    if(commandStrip) {
      if(SY > VH * 0.35) commandStrip.classList.add('visible');
      else commandStrip.classList.remove('visible');
    }
    if(commandSection) commandSection.textContent = labels[sections[activeIdx]] || 'Portfolio';
    if(commandProgress) {
      var pageHeight = Math.max(1, document.body.scrollHeight - VH);
      commandProgress.style.width = (clamp(SY / pageHeight, 0, 1) * 100).toFixed(1) + '%';
    }
  }

  /* ────────────────────────────────────────────────────────────
     2. RAF SCHEDULER
  ──────────────────────────────────────────────────────────── */
  function scheduleUiUpdate() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function() {
      rafPending = false;
      if (needsUiUpdate) {
        updateRail();
        needsUiUpdate = false;
      }
    });
  }
  updateCache();
  visualScheduler.setScroll(SY, SY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight));
  scheduleUiUpdate();

  /* ── Mobile Nav Drawer ────────────────────────────────────────── */
  const drawer   = document.getElementById('mobile-nav-drawer');
  const toggle   = document.querySelector('.nav-mobile-toggle');
  const closeBtn = document.getElementById('mobile-nav-close');

  function openDrawer() {
    if (!drawer) return;
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    // GSAP stagger entrance for nav links
    if (typeof gsap !== 'undefined') {
      gsap.fromTo('.mobile-nav-link, .mobile-nav-cta',
        { x: 28, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.38, ease: 'power3.out', stagger: 0.06, delay: 0.18, clearProps: 'transform,opacity' }
      );
    }
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle)   toggle.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  // Close on backdrop click or any link/button inside with data-mobile-nav-close
  document.querySelectorAll('[data-mobile-nav-close]').forEach(function(el) {
    el.addEventListener('click', closeDrawer);
  });
  const backdrop = document.getElementById('mobile-nav-backdrop');
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  // Escape key closes drawer
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && drawer && drawer.getAttribute('aria-hidden') === 'false') closeDrawer();
  });

  /* ── Footer year ─────────────────────────────────────────────── */
  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

})();
}
