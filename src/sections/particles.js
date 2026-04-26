// src/sections/particles.js
// Scroll reveal observer, dashboard tab switcher, hero particle canvas, Three.js helix.
// Called by main.js after markup is injected into the DOM.

export function initParticles() {
  /* ── Scroll Reveal ──────────────────────────────────────────── */
const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(
    e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } }
  );
}, { threshold: 0.13 });
revealEls.forEach(el => revealObs.observe(el));

/* ── Dashboard tab switcher ─────────────────────────────────── */
document.querySelectorAll('.embed-shell').forEach(shell => {
  shell.querySelectorAll('.embed-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      shell.querySelectorAll('.embed-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
});

  (function(){
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const SPACING=52, RADIUS=130, REPEL=34, DRIFT=0.14, CONN=98, DOT_R=1.3;
  let W, H, mouse={x:-999,y:-999}, nodes=[], scrollY=0, raf;

  // Layer enhancement hooks (set by layers.js)
  window._particleHooks = { densityBoost: 0 };

  function resize(){
    W=canvas.width=window.innerWidth;
    H=canvas.height=window.innerHeight;
    buildGrid();
  }
  function buildGrid(){
    nodes=[];
    const extraRows = Math.ceil(window._particleHooks.densityBoost * 2);
    const sp = SPACING - (window._particleHooks.densityBoost * 8);
    const cols=Math.ceil(W/sp)+1, rows=Math.ceil(H/sp)+1+extraRows;
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      nodes.push({
        ox:c*sp, oy:r*sp,
        x:c*sp, y:r*sp,
        vx:0, vy:0,
        plum: Math.random()<0.09
      });
    }
  }
  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', e=>{ mouse.x=e.clientX; mouse.y=e.clientY; });
  document.addEventListener('scroll', ()=>{ scrollY=window.scrollY; }, {passive:true});

  function draw(){
    ctx.clearRect(0,0,W,H);
    const scrollZone = scrollY / (document.body.scrollHeight - H);
    // Section bias: in projects zone, add downward drift (Layer 2)
    const inProjects = scrollZone > 0.12 && scrollZone < 0.45;
    const downBias = inProjects ? 0.18 : 0;

    nodes.forEach(n=>{
      const dx=mouse.x-n.x, dy=mouse.y-n.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<RADIUS){ n.vx-=(dx/dist)*(RADIUS-dist)*0.012; n.vy-=(dy/dist)*(RADIUS-dist)*0.012; }
      if(dist<REPEL){ n.vx-=(dx/dist)*2.2; n.vy-=(dy/dist)*2.2; }
      n.vx+=(n.ox-n.x)*0.035; n.vy+=(n.oy-n.y)*0.035;
      n.vx*=0.78; n.vy*=0.78;
      n.vx+=(Math.random()-.5)*DRIFT;
      n.vy+=(Math.random()-.5)*DRIFT + downBias;
      n.x+=n.vx; n.y+=n.vy;
    });

    // connections
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i],b=nodes[j];
        const dx=a.x-b.x, dy=a.y-b.y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<CONN){
          const al=(1-d/CONN)*0.18;
          ctx.beginPath();
          ctx.strokeStyle=a.plum&&b.plum?`rgba(150,120,180,${al})`:`rgba(212,166,82,${al})`;
          ctx.lineWidth=.5;
          ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }

    // dots
    const boost = window._particleHooks.densityBoost || 0;
    nodes.forEach(n=>{
      ctx.beginPath();
      ctx.arc(n.x,n.y,DOT_R+(boost*.4),0,Math.PI*2);
      ctx.fillStyle=n.plum?`rgba(150,120,180,${0.22+boost*.3})`:`rgba(212,166,82,${0.22+boost*.3})`;
      ctx.fill();
      if(boost>0.3){
        const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,DOT_R*5);
        g.addColorStop(0,`rgba(212,166,82,${boost*.18})`); g.addColorStop(1,'rgba(212,166,82,0)');
        ctx.beginPath(); ctx.arc(n.x,n.y,DOT_R*5,0,Math.PI*2);
        ctx.fillStyle=g; ctx.fill();
      }
    });
    raf=requestAnimationFrame(draw);
  }
  resize(); draw();
})();

  /* ── Three.js Helix — Full-Page Drifting ────────────────────── */
(function(){
  if(typeof THREE === 'undefined') return;
  const canvas = document.getElementById('helix-canvas');
  if(!canvas) return;

  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5);

  // Helix geometry
  function makeHelixPoints(turns, pointsPerTurn, radius, height, offset){
    const positions = [];
    const total = turns * pointsPerTurn;
    for(let i=0;i<total;i++){
      const t = i/total;
      const angle = t * turns * Math.PI * 2 + offset;
      positions.push(
        Math.cos(angle)*radius,
        (t-.5)*height,
        Math.sin(angle)*radius
      );
    }
    return new Float32Array(positions);
  }

  function makeStrand(offset, color){
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(makeHelixPoints(4,80,0.38,5.5,offset),3));
    const mat = new THREE.LineBasicMaterial({color, transparent:true, opacity:0.55});
    return new THREE.Line(geo, mat);
  }

  const strand1 = makeStrand(0,      0xD4A652);
  const strand2 = makeStrand(Math.PI,0x7A5A8F);
  const group   = new THREE.Group();
  group.add(strand1, strand2);

  // Cross-rungs
  const TURNS=4, PTS=80, RUNGS=TURNS*4;
  const rungGeo = new THREE.BufferGeometry();
  const rungPos = [];
  for(let i=0;i<RUNGS;i++){
    const t = i/RUNGS;
    const angle = t*TURNS*Math.PI*2;
    const y = (t-.5)*5.5;
    rungPos.push(Math.cos(angle)*.38, y, Math.sin(angle)*.38);
    rungPos.push(Math.cos(angle+Math.PI)*.38, y, Math.sin(angle+Math.PI)*.38);
  }
  rungGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rungPos),3));
  const rungMat = new THREE.LineSegmentsGeometry
    ? new THREE.LineBasicMaterial({color:0xD4A652, transparent:true, opacity:0.18})
    : new THREE.LineBasicMaterial({color:0xD4A652, transparent:true, opacity:0.18});
  group.add(new THREE.LineSegments(rungGeo, rungMat));

  scene.add(group);

  // Drift params
  let driftX=0, driftY=0, driftVX=(Math.random()-.5)*.0006, driftVY=(Math.random()-.5)*.0004;
  let baseSpeed = 0.0018;

  window.addEventListener('resize',()=>{
    renderer.setSize(window.innerWidth,window.innerHeight);
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
  });

  function animate(){
    requestAnimationFrame(animate);
    // Layer 1: speed boost from hover pressure
    const speed = baseSpeed + ((window._particleHooks||{}).helixBoost||0);
    group.rotation.y += speed;
    group.rotation.x += speed*.25;

    driftX+=driftVX; driftY+=driftVY;
    if(Math.abs(driftX)>.9){ driftVX*=-1; }
    if(Math.abs(driftY)>.6){ driftVY*=-1; }
    group.position.x = driftX;
    group.position.y = driftY;

    renderer.render(scene, camera);
  }
  animate();
})();
  }
