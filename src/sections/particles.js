// src/sections/particles.js
// Scroll reveal, tab switcher, hero particle canvas, Three.js DNA helix with scroll journey.
// Called by main.js after markup is injected.

export function initParticles(options = {}) {

const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(
    e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } }
  );
}, { threshold: 0.13 });
revealEls.forEach(el => revealObs.observe(el));

document.querySelectorAll('.embed-shell').forEach(shell => {
  shell.querySelectorAll('.embed-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      shell.querySelectorAll('.embed-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
});

  if (options.prefersReducedMotion) return;

  (function(){
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const SPACING=52, RADIUS=130, REPEL=34, DRIFT=0.14, CONN=98, DOT_R=1.3;
  let W, H, mouse={x:-999,y:-999}, nodes=[], scrollY=0;

  window._particleHooks = window._particleHooks || { densityBoost: 0 };

  function resize(){
    W=canvas.width=window.innerWidth;
    H=canvas.height=window.innerHeight;
    buildGrid();
  }
  function buildGrid(){
    nodes=[];
    const sp = SPACING;
    const cols=Math.ceil(W/sp)+1, rows=Math.ceil(H/sp)+1;
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      nodes.push({ ox:c*sp, oy:r*sp, x:c*sp, y:r*sp, vx:0, vy:0, plum:Math.random()<0.09 });
    }
  }
  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', e=>{ mouse.x=e.clientX; mouse.y=e.clientY; });
  document.addEventListener('scroll', ()=>{ scrollY=window.scrollY; }, {passive:true});

  function draw(){
    ctx.clearRect(0,0,W,H);
    const scrollZone = scrollY / (document.body.scrollHeight - H);
    const inProjects = scrollZone > 0.12 && scrollZone < 0.45;
    const hooks = window._particleHooks || {};
    const boost = hooks.densityBoost || 0;
    const calm = hooks.aboutCalm || 0;
    const downBias = Math.max(inProjects ? 0.18 : 0, (hooks.projectsDrift || 0) * 0.42);
    const baseAlpha = Math.max(0.08, 1 - calm * 0.55);

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

    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i],b=nodes[j];
        const dx=a.x-b.x, dy=a.y-b.y;
        const d=Math.sqrt(dx*dx+dy*dy);
        if(d<CONN){
          const al=(1-d/CONN)*(0.18 + boost * 0.16) * baseAlpha;
          ctx.beginPath();
          ctx.strokeStyle=a.plum&&b.plum?`rgba(150,120,180,${al})`:`rgba(212,166,82,${al})`;
          ctx.lineWidth=.5;
          ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }

    nodes.forEach(n=>{
      ctx.beginPath();
      ctx.arc(n.x,n.y,DOT_R+(boost*.4),0,Math.PI*2);
      ctx.fillStyle=n.plum?`rgba(150,120,180,${(0.22+boost*.42) * baseAlpha})`:`rgba(212,166,82,${(0.22+boost*.42) * baseAlpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  resize(); draw();
})();

  /* ── Three.js Helix — Full-Page Drifting ────────────────────── */
(function(){
  if(typeof THREE === 'undefined') return;
  const canvas = document.getElementById('helix-canvas');
  if(!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5.5);

  function resize(){
    const W=window.innerWidth, H=window.innerHeight;
    renderer.setSize(W, H);
    camera.aspect=W/H;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const TURNS=6, PPT=60, TOTAL=TURNS*PPT, HEIGHT=8, HRAD=1.2;
  function makeHelixPoints(phase){
    const pts=[];
    for(let i=0;i<=TOTAL;i++){
      const t=i/TOTAL, angle=t*TURNS*Math.PI*2+phase, y=(t-.5)*HEIGHT;
      pts.push(new THREE.Vector3(Math.cos(angle)*HRAD, y, Math.sin(angle)*HRAD));
    }
    return pts;
  }

  const mat1 = new THREE.MeshBasicMaterial({color:0xD4A652, transparent:true, opacity:.82});
  const mat2 = new THREE.MeshBasicMaterial({color:0x9B6FCC, transparent:true, opacity:.65});

  const helix1 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(makeHelixPoints(0)), TOTAL, 0.055, 8, false), mat1);
  const helix2 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(makeHelixPoints(Math.PI)), TOTAL, 0.040, 8, false), mat2);

  const rungGroup = new THREE.Group();
  const RUNGS = TURNS * 8;
  for(let i=0;i<=RUNGS;i++){
    const t=i/RUNGS, angle=t*TURNS*Math.PI*2, y=(t-.5)*HEIGHT;
    const p1=new THREE.Vector3(Math.cos(angle)*HRAD, y, Math.sin(angle)*HRAD);
    const p2=new THREE.Vector3(Math.cos(angle+Math.PI)*HRAD, y, Math.sin(angle+Math.PI)*HRAD);
    var rc=new THREE.LineCurve3(p1,p2);
    rungGroup.add(new THREE.Mesh(new THREE.TubeGeometry(rc,1,0.009,4,false),new THREE.MeshBasicMaterial({color:0xD4A652,transparent:true,opacity:.28})));
  }

  const helixGroup = new THREE.Group();
  helixGroup.add(helix1, helix2, rungGroup);
  scene.add(helixGroup);

  let targetRotY=0, currentRotY=0, currentX=0, currentY=0, scrollY=0;

  document.addEventListener('mousemove', e=>{
    targetRotY = (e.clientX/window.innerWidth - .5) * .7;
  });
  window.addEventListener('scroll', ()=>{ scrollY=window.scrollY; }, {passive:true});

  function getPageHeight(){ return document.body.scrollHeight - window.innerHeight; }

  function animate(t){
    requestAnimationFrame(animate);
    const time = t * .001;
    const pageH = getPageHeight();
    const progress = pageH > 0 ? scrollY / pageH : 0;

    currentRotY += (targetRotY - currentRotY) * .04;

    let targetCamX, targetCamY, targetScale, targetOpacity;

    if(progress < 0.15){
      targetCamX = 0; targetCamY = 0; targetScale = 1; targetOpacity = 1;
    } else if(progress < 0.45){
      const p = (progress - 0.15) / 0.30;
      targetCamX = p * 2.8; targetCamY = -p * 0.4;
      targetScale = 1 - p * 0.35; targetOpacity = 1 - p * 0.25;
    } else if(progress < 0.75){
      const p = (progress - 0.45) / 0.30;
      targetCamX = 2.8 + p * 0.4; targetCamY = -0.4 - p * 0.3;
      targetScale = 0.65 - p * 0.05; targetOpacity = 0.75 - p * 0.1;
    } else {
      const p = (progress - 0.75) / 0.25;
      targetCamX = 3.2 - p * 3.5; targetCamY = -0.7 + p * 0.4;
      targetScale = 0.60 + p * 0.1; targetOpacity = 0.65 - p * 0.5;
    }

    currentX += (targetCamX - currentX) * 0.06;
    currentY += (targetCamY - currentY) * 0.06;

    helixGroup.position.x = currentX;
    helixGroup.position.y = currentY;

    const s = helixGroup.scale.x + (targetScale - helixGroup.scale.x) * 0.06;
    helixGroup.scale.setScalar(s);

    const helixBoost = (window._particleHooks && window._particleHooks.helixBoost) || 0;
    helixGroup.rotation.y = time * (0.28 + helixBoost) + currentRotY;

    const breathe = 1 + Math.sin(time * 0.5) * 0.015;
    helix1.scale.setScalar(breathe);
    helix2.scale.setScalar(breathe);

    const op = mat1.opacity + (targetOpacity * 0.55 - mat1.opacity) * 0.06;
    mat1.opacity = op;
    mat2.opacity = op * 0.64;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
})();

}
