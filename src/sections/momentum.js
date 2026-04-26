// src/sections/momentum.js — Scroll momentum & interactive UI systems
// Called by main.js after markup is injected into the DOM.

export function initMomentum() {
/* ═══════════════════════════════════════════════════════════════
   SCROLL-MOMENTUM & INTERACTIVE UI SYSTEMS
   ═══════════════════════════════════════════════════════════════ */
(function() {

  /* ── Shared scroll state ── */
  var SY = 0;
  window.addEventListener('scroll', function(){ SY = window.scrollY; }, {passive:true});

  /* ── Helpers ── */
  function sectionTop(id){
    var el=document.getElementById(id)||document.querySelector('#'+id);
    return el ? el.getBoundingClientRect().top + SY : 0;
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

  // Rail click navigation
  document.querySelectorAll('.rail-node').forEach(function(node){
    node.addEventListener('click', function(){
      var t = node.getAttribute('data-target');
      var el = document.getElementById(t);
      if(el) el.scrollIntoView({behavior:'smooth'});
    });
  });

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
  }

  /* ────────────────────────────────────────────────────────────
     2. AURORA BLEED — fade in as user nears bottom of projects
  ──────────────────────────────────────────────────────────── */
  var auroraBleed = document.getElementById('aurora-bleed');
  var projectsSection = document.getElementById('projects');

  function updateAurora(){
    if(!auroraBleed || !projectsSection) return;
    var rect = projectsSection.getBoundingClientRect();
    var VH = window.innerHeight;
    var progress = clamp((VH - rect.bottom + 200) / 300, 0, 1);
    auroraBleed.style.opacity = progress;
  }

  /* ────────────────────────────────────────────────────────────
     3. TRANSITION ZONE — canvas grid convergence + coord floaters
  ──────────────────────────────────────────────────────────── */
  var tzCanvas = document.getElementById('tz-canvas');
  var tzReticle = document.getElementById('tz-reticle');
  var tzCoords  = document.getElementById('tz-coords');
  var tzZone    = document.getElementById('transition-zone');
  var tzCtx     = tzCanvas ? tzCanvas.getContext('2d') : null;

  var coordPool = [
    '28.6°N  77.2°E','35.6°N 139.6°E','-33.8°S 151.2°E','51.5°N  0.1°W',
    '40.7°N  74.0°W','-23.5°S  46.6°W','55.7°N  37.6°E','1.3°N  103.8°E',
    '48.8°N   2.3°E','19.4°N  99.1°W','-26.2°S  28.0°E','30.0°N  31.2°E',
    'ALT: 408 KM','VEL: 27,600 KM/H','INC: 51.6°','ECC: 0.0002',
    'M4.2 — HONSHU','M5.1 — CHILE','FIRE: -15.2°S 130.1°E'
  ];
  var lastCoordSpawn = 0;

  function spawnCoord(){
    if(!tzCoords) return;
    var text = coordPool[Math.floor(Math.random()*coordPool.length)];
    var el = document.createElement('div');
    el.className = 'tz-coord-item';
    el.textContent = text;
    el.style.left = (10 + Math.random()*75) + '%';
    el.style.bottom = (5 + Math.random()*30) + '%';
    el.style.animationDelay = (Math.random()*1.5) + 's';
    el.style.animationDuration = (5 + Math.random()*4) + 's';
    tzCoords.appendChild(el);
    setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 9000);
  }

  function resizeTZ(){
    if(!tzCanvas || !tzZone) return;
    tzCanvas.width  = tzZone.clientWidth;
    tzCanvas.height = tzZone.clientHeight;
  }
  if(tzZone) new ResizeObserver(resizeTZ).observe(tzZone);
  resizeTZ();

  var tzT = 0;
  function drawTZ(dt){
    if(!tzCtx || !tzCanvas) return;
    var W = tzCanvas.width, H = tzCanvas.height;
    tzCtx.clearRect(0,0,W,H);

    var rect = tzZone ? tzZone.getBoundingClientRect() : null;
    if(!rect) return;
    var VH = window.innerHeight;
    var progress = clamp(1 - (rect.top / VH), 0, 1);
    if(progress <= 0) return;

    if(tzReticle){
      if(progress > 0.15) tzReticle.classList.add('visible');
      else tzReticle.classList.remove('visible');
    }

    if(progress > 0.1 && dt - lastCoordSpawn > 1200){
      spawnCoord(); lastCoordSpawn = dt;
    }

    var cx = W/2, cy = H/2;
    tzT += 0.012;

    var LINES = 14;
    for(var i=0;i<LINES;i++){
      var frac = i/LINES;
      var wave = Math.sin(tzT + frac*Math.PI*2)*0.04;
      var alpha = clamp(progress*0.55 + wave, 0, 0.55);
      tzCtx.beginPath();
      tzCtx.moveTo(0, frac*H);
      tzCtx.quadraticCurveTo(W*0.3, cy + (frac-0.5)*H*0.4, cx + Math.sin(tzT*0.5)*20, cy + Math.cos(tzT*0.3+frac)*15);
      tzCtx.strokeStyle = 'rgba(212,166,82,'+alpha*0.4+')';
      tzCtx.lineWidth = 0.6;
      tzCtx.stroke();
      tzCtx.beginPath();
      tzCtx.moveTo(W, frac*H);
      tzCtx.quadraticCurveTo(W*0.7, cy + (frac-0.5)*H*0.4, cx + Math.sin(tzT*0.5)*20, cy + Math.cos(tzT*0.3+frac)*15);
      tzCtx.strokeStyle = 'rgba(122,90,143,'+alpha*0.3+')';
      tzCtx.lineWidth = 0.5;
      tzCtx.stroke();
    }

    var gAlpha = (0.12 + Math.sin(tzT*1.8)*0.06) * progress;
    var grd = tzCtx.createRadialGradient(cx,cy,0,cx,cy,160);
    grd.addColorStop(0,'rgba(255,34,68,'+gAlpha+')');
    grd.addColorStop(0.4,'rgba(212,166,82,'+gAlpha*0.5+')');
    grd.addColorStop(1,'rgba(0,0,0,0)');
    tzCtx.fillStyle = grd;
    tzCtx.fillRect(0,0,W,H);

    for(var y=0;y<H;y+=4){
      tzCtx.fillStyle = 'rgba(0,0,0,0.03)';
      tzCtx.fillRect(0,y,W,1);
    }
  }

  /* ────────────────────────────────────────────────────────────
     4. GLOBE PARALLAX RISE
  ──────────────────────────────────────────────────────────── */
  var globeWrap = document.getElementById('globe-parallax-wrap');

  function updateGlobeParallax(){
    if(!globeWrap) return;
    var rect = globeWrap.getBoundingClientRect();
    var VH = window.innerHeight;
    var progress = clamp((VH - rect.top) / VH, 0, 1);
    var offset = (1 - progress) * 80;
    globeWrap.style.transform = 'translateY('+offset+'px)';
  }

  /* ────────────────────────────────────────────────────────────
     5. RAF LOOP
  ──────────────────────────────────────────────────────────── */
  function loop(dt){
    requestAnimationFrame(loop);
    updateRail();
    updateAurora();
    drawTZ(dt);
    updateGlobeParallax();
  }
  requestAnimationFrame(loop);

})();
}
