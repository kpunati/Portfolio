// src/sections/momentum.js — Scroll momentum & interactive UI systems
// Called by main.js after markup is injected into the DOM.

export function initMomentum() {
/* ═══════════════════════════════════════════════════════════════
   SCROLL-MOMENTUM & INTERACTIVE UI SYSTEMS
   ═══════════════════════════════════════════════════════════════ */
(function() {

  /* ── Shared scroll state ── */
  var SY = window.scrollY || 0;
  var needsUiUpdate = true;
  var rectCache = {};

  function updateCache() {
    sections.forEach(function(id) {
      var el = document.getElementById(id);
      if(el) {
        var rect = el.getBoundingClientRect();
        rectCache[id] = { top: rect.top + SY, height: rect.height };
      }
    });
    projectCards.forEach(function(card, i) {
      var rect = card.getBoundingClientRect();
      rectCache['card-' + i] = { top: rect.top + SY, height: rect.height };
    });
    if(projectsSection) {
      var rect = projectsSection.getBoundingClientRect();
      rectCache['projects-section'] = { top: rect.top + SY, height: rect.height };
    }
  }

  window.addEventListener('scroll', function(){
    SY = window.scrollY;
    needsUiUpdate = true;
  }, {passive:true});

  var resizeTimeout;
  window.addEventListener('resize', function(){ 
    needsUiUpdate = true; 
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateCache, 150);
  });

  /* ── Helpers ── */
  function sectionTop(id){
    return rectCache[id] ? rectCache[id].top : 0;
  }
  function lerp(a,b,t){return a+(b-a)*t;}
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

  var projectCards = Array.prototype.slice.call(document.querySelectorAll('.project-card'));
  var projectSteps = Array.prototype.slice.call(document.querySelectorAll('.project-stage-steps span'));
  var projectsSection = document.getElementById('projects');
  var activeProjectIndex = -1;
  var projectProgress = 0;

  function setActiveProject(index) {
    if(index === activeProjectIndex) return;
    activeProjectIndex = index;
    projectCards.forEach(function(card, cardIndex){
      if(cardIndex === index) card.classList.add('is-active');
      else card.classList.remove('is-active');
    });
    projectSteps.forEach(function(step, stepIndex){
      if(stepIndex === index) {
        step.classList.add('is-active');
        step.setAttribute('aria-current', 'step');
      } else {
        step.classList.remove('is-active');
        step.removeAttribute('aria-current');
      }
    });
    document.documentElement.style.setProperty('--active-project', String(Math.max(0, index)));
    window.dispatchEvent(new CustomEvent('portfolio:project-focus', {
      detail: { index: index, progress: projectProgress }
    }));
  }

  function updateProjectProgress() {
    var cached = rectCache['projects-section'];
    if(!cached) return;
    var top = cached.top - SY;
    var travel = Math.max(1, cached.height - window.innerHeight);
    projectProgress = clamp(-top / travel, 0, 1);
    document.documentElement.style.setProperty('--project-local-progress', projectProgress.toFixed(3));
  }

  function updateProjectFocus() {
    if(!projectCards.length) return;
    updateProjectProgress();
    var viewportCenter = window.innerHeight * 0.5;
    var progressIndex = clamp(Math.floor(projectProgress * projectCards.length), 0, projectCards.length - 1);
    var bestIndex = -1;
    var bestDistance = Infinity;
    projectCards.forEach(function(card, index){
      var cached = rectCache['card-' + index];
      if(!cached) return;
      var top = cached.top - SY;
      var bottom = top + cached.height;
      if(bottom < 120 || top > window.innerHeight - 80) return;
      var center = top + cached.height * 0.5;
      var distance = Math.abs(center - viewportCenter);
      var visible = clamp((Math.min(bottom, window.innerHeight) - Math.max(top, 0)) / Math.max(1, cached.height), 0, 1);
      var depth = clamp(1 - distance / Math.max(1, window.innerHeight * 0.62), 0, 1);
      card.style.setProperty('--card-depth', depth.toFixed(3));
      card.style.setProperty('--card-visible', visible.toFixed(3));
      if(distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    if(bestIndex < 0) bestIndex = progressIndex;
    setActiveProject(bestIndex);
  }

  projectCards.forEach(function(card, index){
    card.addEventListener('mousemove', function(event){
      var rect = card.getBoundingClientRect();
      var x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      var y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      card.style.setProperty('--tilt-x', (-y * 4.5).toFixed(2) + 'deg');
      card.style.setProperty('--tilt-y', (x * 5.5).toFixed(2) + 'deg');
    });
    card.addEventListener('mouseenter', function(){ setActiveProject(index); });
    card.addEventListener('focus', function(){ setActiveProject(index); });
    card.addEventListener('mouseleave', function(){
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      updateProjectFocus();
      needsUiUpdate = true;
    });
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
    updateProjectFocus();
  }

  /* ────────────────────────────────────────────────────────────
     2. RAF LOOP
  ──────────────────────────────────────────────────────────── */
  function loop(){
    requestAnimationFrame(loop);
    if(needsUiUpdate) {
      updateRail();
      needsUiUpdate = false;
    }
  }
  updateCache();
  requestAnimationFrame(loop);

})();
}
