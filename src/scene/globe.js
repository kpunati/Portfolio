import * as THREE from 'three';
import { visualScheduler } from '../performance/visualScheduler.js';

export function initGlobe(options = {}) {
// ── GLOBE DASHBOARD ───────────────────────────────────────────────────────
(function() {
  function showGlobeError(message){
    var shell=document.getElementById('globe-embed-shell');
    var loading=document.getElementById('g-loading');
    if(shell) shell.classList.add('globe-error');
    if(loading) {
      loading.classList.add('is-error');
      var text=loading.querySelector('p');
      if(text) text.textContent=message||'Globe renderer unavailable.';
    }
  }
  try {
  var GS = {eq:[],fire:[],iss:{lat:0,lon:0,alt:0,vel:0,vis:'daylight'},lastISS:0};
  var FIRE_CACHE_KEY = 'gfire4';
  var GLOBE_R = 1.0;
  var quality = options.visualQuality || window.__portfolioVisualQuality || 'balanced';
  var isLite = quality === 'lite';
  var isBalanced = quality === 'balanced';
  function hideLoader(){
    var loading=document.getElementById('g-loading');
    if(loading) loading.classList.add('hidden');
  }
  function readCache(key){
    try {
      var cached=localStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch(e) {
      console.warn('Globe cache invalid:', key, e);
      localStorage.removeItem(key);
      return null;
    }
  }
  function mC(m){return m<2.5?'#C084FC':m<4?'#E040FB':m<6?'#F000FF':'#FF00CC';}
  function mB(m){return m<2.5?'rgba(192,132,252,.15)':m<4?'rgba(224,64,251,.15)':m<6?'rgba(240,0,255,.15)':'rgba(255,0,204,.15)';}
  function sT(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
  function tAgo(ms){var s=Math.floor((Date.now()-ms)/1000);return s<60?s+'s ago':s<3600?Math.floor(s/60)+'m ago':s<86400?Math.floor(s/3600)+'h ago':Math.floor(s/86400)+'d ago';}
  function fireRegion(f){
    var lon = ((f.lon + 540) % 360) - 180;
    if (lon >= -170 && lon < -30 && f.lat >= 0) return 'na';
    if (lon >= -90 && lon < -30 && f.lat < 0) return 'sa';
    if (lon >= -20 && lon <= 55 && f.lat >= -35 && f.lat <= 38) return 'af';
    if (lon >= 55 && lon <= 180 && f.lat >= -10) return 'asia';
    return 'oc';
  }
  function fireSpread(points){
    var seen={};
    points.forEach(function(f){ seen[fireRegion(f)] = true; });
    return Object.keys(seen).length;
  }
  function setFireSource(text, mode){
    sT('gc-fire-source', text);
    var badge=document.getElementById('gc-fire-mode');
    if(!badge) return;
    badge.classList.remove('is-live','is-reference','is-resolving');
    badge.classList.add(mode==='live'?'is-live':mode==='reference'?'is-reference':'is-resolving');
    badge.innerHTML='<i></i>'+(mode==='reference'?'Fires ref':mode==='live'?'Fires live':'Fires');
  }
  function parseFireCSV(csv){
    var lines=csv.trim().split('\n');
    if(lines.length<2) throw new Error('FIRMS empty');
    var hdr=lines[0].split(',');
    var latI=hdr.indexOf('latitude'), lonI=hdr.indexOf('longitude'), brightI=hdr.indexOf('bright_ti4');
    if(latI<0){latI=0;lonI=1;brightI=2;}
    var pts=[];
    for(var i=1;i<lines.length;i++){
      var c=lines[i].split(',');
      var la=parseFloat(c[latI]),lo=parseFloat(c[lonI]),br=parseFloat(c[brightI])||320;
      if(!isNaN(la)&&!isNaN(lo))pts.push({lat:la,lon:lo,bright:br});
    }
    return pts;
  }
  function balancedFireSample(points,max){
    var buckets={na:[],sa:[],af:[],asia:[],oc:[]};
    points.forEach(function(f){ buckets[fireRegion(f)].push(f); });
    Object.keys(buckets).forEach(function(k){ buckets[k].sort(function(a,b){return (b.bright||0)-(a.bright||0);}); });
    var target=Math.max(1,Math.floor(max/Object.keys(buckets).length));
    var selected=[];
    Object.keys(buckets).forEach(function(k){ selected=selected.concat(buckets[k].slice(0,target)); });
    if(selected.length<max){
      var used=new Set(selected);
      points.sort(function(a,b){return (b.bright||0)-(a.bright||0);}).forEach(function(f){
        if(selected.length<max&&!used.has(f)){ selected.push(f); used.add(f); }
      });
    }
    return selected.slice(0,max);
  }
  function makeGlobalFireReference(){
    var anchors=[
      {lat:54,lon:-124,bright:344},{lat:38,lon:-121,bright:352},{lat:18,lon:-98,bright:336},
      {lat:-9,lon:-62,bright:358},{lat:-22,lon:-48,bright:342},{lat:-35,lon:-70,bright:330},
      {lat:8,lon:12,bright:356},{lat:-2,lon:28,bright:348},{lat:-18,lon:32,bright:338},
      {lat:46,lon:16,bright:326},{lat:58,lon:88,bright:350},{lat:31,lon:104,bright:340},
      {lat:21,lon:78,bright:346},{lat:-6,lon:116,bright:334},{lat:-19,lon:146,bright:354},
      {lat:-31,lon:121,bright:342}
    ];
    var pts=[];
    anchors.forEach(function(a,i){
      for(var j=0;j<8;j++){
        var lat=a.lat+((j%4)-1.5)*1.8;
        var lon=a.lon+(Math.floor(j/4)-0.5)*4.2+(i%3-1)*1.4;
        pts.push({
          lat:Math.max(-82,Math.min(82,lat)),
          lon:((lon+540)%360)-180,
          bright:a.bright+j*2+(i%4)
        });
      }
    });
    return balancedFireSample(pts,600);
  }

  var canvas = document.getElementById('globe-canvas-inner');
  if (!canvas) return;
  var wrap   = canvas.parentElement;
  var isMobile = window.innerWidth < 760;
  var globeHooks = window._globeHooks = window._globeHooks || { emerge: 0 };
  var renderer = new THREE.WebGLRenderer({canvas:canvas,alpha:true,antialias:!isLite, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile || isLite ? 1 : isBalanced ? 1.25 : 1.5));
  renderer.setClearColor(0x000000,0);

  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45,1,.1,100);
  camera.position.set(0,0,2.8);

  function resize(){
    var W=wrap.clientWidth, H=wrap.clientHeight;
    renderer.setSize(W,H,false);
    camera.aspect=W/H; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(wrap); resize();

  // Earth
  var texLoader = new THREE.TextureLoader();
  var earthTex  = texLoader.load(import.meta.env.BASE_URL + 'earth-texture.jpg',
    function(){},
    undefined,
    function(e){ console.warn('Globe texture failed:', e); showGlobeError('Globe texture unavailable.'); }
  );
  earthTex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), isLite ? 2 : 4);
  var earthMat  = new THREE.MeshPhongMaterial({map:earthTex,specular:new THREE.Color(0x1a2233),shininess:4});
  var earthMesh = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R,isLite ? 40 : 56,isLite ? 40 : 56),earthMat);
  scene.add(earthMesh);
  var atmMesh = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R*1.025,isLite ? 24 : 32,isLite ? 24 : 32),new THREE.MeshBasicMaterial({color:0x6fa8ff,transparent:true,opacity:.15,side:THREE.FrontSide,depthWrite:false}));
  scene.add(atmMesh);
  scene.add(new THREE.AmbientLight(0xffffff,.62));
  var sunLight = new THREE.DirectionalLight(0xfff8f0,0.95); sunLight.position.set(12,6,-8); scene.add(sunLight);

  // Earthquake dots
  var MAX_EQ=300, _d=new THREE.Object3D();
  var eqMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.012,isLite ? 4 : 6,isLite ? 4 : 6),new THREE.MeshBasicMaterial({color:0xE040FB,transparent:true,opacity:.95}),MAX_EQ);
  eqMesh.count=0; scene.add(eqMesh);

  // Fire dots
  var MAX_FIRE = isLite ? 320 : 500;
  var fireMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.007,4,4),new THREE.MeshBasicMaterial({color:0xE8763A,transparent:true,opacity:.78}),MAX_FIRE);
  fireMesh.count=0; scene.add(fireMesh);

  // ISS
  var issMesh = new THREE.Mesh(new THREE.SphereGeometry(.028,12,12),new THREE.MeshBasicMaterial({color:0xFF2244}));
  earthMesh.add(issMesh);
  var issRingGeo=new THREE.RingGeometry(.038,.052,24);
  var issRingMat=new THREE.MeshBasicMaterial({color:0xFF2244,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false});
  var issRingMesh=new THREE.Mesh(issRingGeo,issRingMat); earthMesh.add(issRingMesh);

  // ISS label
  var lc=document.createElement('canvas'); lc.width=128;lc.height=32;
  var lx=lc.getContext('2d'); lx.font='bold 14px sans-serif'; lx.fillStyle='#FF2244'; lx.textAlign='center'; lx.fillText('ISS',64,20);
  var issLabel=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(lc),transparent:true}));
  issLabel.scale.set(.22,.065,1); earthMesh.add(issLabel);

  // ISS trail
  var TRAIL=60, trailPos=new Float32Array(TRAIL*3), trailGeo=new THREE.BufferGeometry();
  trailGeo.setAttribute('position',new THREE.BufferAttribute(trailPos,3)); trailGeo.setDrawRange(0,0);
  var issTrail=new THREE.Line(trailGeo,new THREE.LineBasicMaterial({color:0xFF2244,transparent:true,opacity:.45}));
  earthMesh.add(issTrail); var trailIdx=0;

  function ll2v(lat,lon,r){
    var phi=(90-lat)*Math.PI/180, theta=(lon+180)*Math.PI/180;
    return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));
  }

  function updateEQ(){
    eqMesh.count=Math.min(GS.eq.length,MAX_EQ);
    GS.eq.slice(0,MAX_EQ).forEach(function(q,i){
      var p=ll2v(q.lat,q.lon,GLOBE_R+.005); _d.position.copy(p); _d.lookAt(0,0,0);
      var s=.55+q.mag*.28; _d.scale.setScalar(s); _d.updateMatrix();
      eqMesh.setMatrixAt(i,_d.matrix);
      eqMesh.setColorAt(i,new THREE.Color(mC(q.mag)));
    });
    eqMesh.instanceMatrix.needsUpdate=true;
    if(eqMesh.instanceColor) eqMesh.instanceColor.needsUpdate=true;
  }
  function updateFire(){
    fireMesh.count=Math.min(GS.fire.length,MAX_FIRE);
    GS.fire.slice(0,MAX_FIRE).forEach(function(f,i){
      var p=ll2v(f.lat,f.lon,GLOBE_R+.003); _d.position.copy(p); _d.scale.setScalar(1); _d.updateMatrix();
      fireMesh.setMatrixAt(i,_d.matrix);
    });
    fireMesh.instanceMatrix.needsUpdate=true;
  }
  function updateISS(){
    var pos=ll2v(GS.iss.lat,GS.iss.lon,GLOBE_R+.035);
    issMesh.position.copy(pos);
    issRingMesh.position.copy(pos); issRingMesh.lookAt(0,0,0);
    issLabel.position.copy(pos.clone().multiplyScalar(1.12));
    var ti=(trailIdx%TRAIL)*3; trailPos[ti]=pos.x; trailPos[ti+1]=pos.y; trailPos[ti+2]=pos.z;
    trailIdx++; trailGeo.setDrawRange(0,Math.min(trailIdx,TRAIL));
    trailGeo.attributes.position.needsUpdate=true;
  }

  // Interaction
  var isDrag=false, prevM={x:0,y:0}, autoRot=true, autoSpd=.0006;
  var globeLeft = canvas.parentElement;
  // Hoist Raycaster — create once, reuse on every mousemove (avoids GC churn)
  var _ray = new THREE.Raycaster();
  var _pointer = new THREE.Vector2();
  globeLeft.addEventListener('mousedown',function(e){isDrag=true;autoRot=false;visualScheduler.pause('terrain');prevM={x:e.clientX,y:e.clientY};});
  globeLeft.addEventListener('mousemove',function(e){
    var rect=globeLeft.getBoundingClientRect();
    var mx=(e.clientX-rect.left)/rect.width*2-1, my=-(e.clientY-rect.top)/rect.height*2+1;
    if(isDrag){
      var dx=e.clientX-prevM.x, dy=e.clientY-prevM.y;
      [earthMesh,atmMesh,eqMesh,fireMesh].forEach(function(m){m.rotation.y+=dx*.005; m.rotation.x+=dy*.005;});
      // issLabel is child of earthMesh, no manual update needed
      prevM={x:e.clientX,y:e.clientY};
      document.getElementById('g-tooltip').style.display='none'; return;
    }
    var ray=_ray; _pointer.set(mx,my); ray.setFromCamera(_pointer,camera);
    var hits=ray.intersectObject(eqMesh);
    if(hits.length&&GS.eq[hits[0].instanceId]){
      var q=GS.eq[hits[0].instanceId];
      document.getElementById('g-tt-title').textContent='M'+q.mag.toFixed(1)+' — '+q.place;
      document.getElementById('g-tt-sub').textContent='Depth: '+q.depth+'km · '+tAgo(q.time);
      var tt=document.getElementById('g-tooltip');
      tt.style.left=(e.clientX-rect.left+12)+'px'; tt.style.top=(e.clientY-rect.top-10)+'px'; tt.style.display='block';
    } else { document.getElementById('g-tooltip').style.display='none'; }
  });
  globeLeft.addEventListener('mouseup',function(){isDrag=false;visualScheduler.resume('terrain');setTimeout(function(){autoRot=true;},3000);});
  globeLeft.addEventListener('mouseleave',function(){isDrag=false;visualScheduler.resume('terrain');document.getElementById('g-tooltip').style.display='none';});
  globeLeft.addEventListener('wheel',function(e){camera.position.z=Math.max(1.6,Math.min(5,camera.position.z+e.deltaY*.002));},{passive:true});

	  // Scheduler-owned render loop
	  var issT=0, isVis=true, isInViewport=true, hasRendered=false;
  document.addEventListener('visibilitychange',function(){isVis=!document.hidden; updateDataTimers();});
  var observer = new IntersectionObserver(function(entries){
    isInViewport = entries[0].isIntersecting;
    updateDataTimers();
  }, { threshold: 0.01 });
  observer.observe(canvas);

	  function updateGlobe(){
	    var emerge = Math.max(0, Math.min(1, globeHooks.emerge || 0));
	    var stageLift = (1 - emerge) * 0.18;
    earthMesh.position.y = stageLift;
    atmMesh.position.y = stageLift;
    eqMesh.position.y = stageLift;
    fireMesh.position.y = stageLift;
	    camera.position.z += ((2.95 - emerge * 0.28) - camera.position.z) * 0.015;
	    if(autoRot)[earthMesh,atmMesh,eqMesh,fireMesh].forEach(function(m){m.rotation.y+=autoSpd * (1 + emerge * 1.6);});
	    // issLabel auto-rotates as child of earthMesh
	    issT+=.04; issRingMat.opacity=.4+Math.sin(issT)*.3; issRingMesh.scale.setScalar(1+Math.sin(issT)*.14);
	  }

	  function renderGlobe(){
	    renderer.render(scene,camera);
	    if(!hasRendered) {
      hasRendered=true;
      hideLoader();
      var shell=document.getElementById('globe-embed-shell');
	      if(shell) shell.classList.add('globe-rendered');
	    }
	  }

	  visualScheduler.register('globe', {
	    frameInterval: isLite ? 34 : isBalanced ? 24 : 16,
	    shouldRun:function(){ return isVis && isInViewport; },
	    update:function(){ updateGlobe(); },
	    render:function(){ renderGlobe(); },
	    destroy:function(){
	      observer.disconnect();
	      stopDataTimers();
	      renderer.dispose();
	    }
	  });

  // Data
  function fetchEQ(){
    var d=readCache('geq');
    if(d&&Date.now()-d.ts<60000){GS.eq=d.data;renderEQUI();updateEQ();return;}
    fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson')
    .then(function(r){return r.json();})
    .then(function(j){
      GS.eq=j.features.filter(function(f){return f.properties.mag>=1.5;})
        .map(function(f){return {mag:f.properties.mag,place:f.properties.place||'Unknown',time:f.properties.time,depth:Math.round(f.geometry.coordinates[2]),lat:f.geometry.coordinates[1],lon:f.geometry.coordinates[0]};  })
        .sort(function(a,b){return b.mag-a.mag;});
      localStorage.setItem('geq',JSON.stringify({ts:Date.now(),data:GS.eq}));
      renderEQUI(); updateEQ();
    }).catch(function(e){console.warn('EQ fail',e);});
  }
  function renderEQUI(){
    sT('gc-eq-count',GS.eq.length); sT('gb-eq',GS.eq.length);
    document.getElementById('gc-eq-badge').textContent=GS.eq.length;
    sT('gb-mag','M'+(GS.eq.length?Math.max.apply(null,GS.eq.map(function(q){return q.mag;})).toFixed(1):'--'));
    document.getElementById('gc-eq-list').innerHTML=GS.eq.slice(0,20).map(function(q){
      return '<div class="eq-row"><div class="eq-mag" style="background:'+mB(q.mag)+';color:'+mC(q.mag)+'">'+q.mag.toFixed(1)+'</div><div class="eq-info"><div class="eq-place">'+q.place+'</div><div class="eq-time">'+tAgo(q.time)+'</div></div><div class="eq-dep">'+q.depth+'km</div></div>';
    }).join('');
    sT('gc-updated',new Date().toLocaleTimeString());
  }
  function fetchFire(){
    var d=readCache(FIRE_CACHE_KEY);
    if(d){
      if(Date.now()-d.ts<21600000 && d.data && d.data.length && fireSpread(d.data)>1){
        GS.fire=d.data;setFireSource(d.source||'Source: NASA fire data',d.mode);renderFireUI();updateFire();return;
      }
      localStorage.removeItem(FIRE_CACHE_KEY);
    }

    fetch('https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open&limit=500&days=90')
      .then(function(r){return r.json();})
      .then(function(j){
        var pts = j.events.flatMap(function(ev){
          return ev.geometry.map(function(g){
            return {lat:g.coordinates[1], lon:g.coordinates[0], bright:320};
          });
        }).filter(function(f){
          return !isNaN(f.lat)&&!isNaN(f.lon)&&Math.abs(f.lat)<=90&&Math.abs(f.lon)<=180;
        });
        var seen={};
        pts = pts.filter(function(f){
          var k=f.lat.toFixed(1)+','+f.lon.toFixed(1);
          if(seen[k]) return false; seen[k]=true; return true;
        });
        if(pts.length && fireSpread(pts)>1) {
          GS.fire = pts.slice(0,600);
          setFireSource('Source: NASA EONET live wildfire events','live');
          localStorage.setItem(FIRE_CACHE_KEY,JSON.stringify({ts:Date.now(),data:GS.fire,source:'Source: NASA EONET live wildfire events',mode:'live'}));
          renderFireUI(); updateFire();
          return;
        }
        throw new Error('EONET region-limited');
      })
      .catch(function(e){
        console.warn('EONET limited/unavailable, using FIRMS global reference:', e);
        fetch('https://firms.modaps.eosdis.nasa.gov/content/notebooks/sample_viirs_snpp_071223.csv')
          .then(function(r){return r.text();})
          .then(function(csv){
            GS.fire = balancedFireSample(parseFireCSV(csv),600);
            setFireSource('Source: NASA FIRMS global VIIRS reference layer','reference');
            localStorage.setItem(FIRE_CACHE_KEY,JSON.stringify({ts:Date.now(),data:GS.fire,source:'Source: NASA FIRMS global VIIRS reference layer',mode:'reference'}));
            renderFireUI(); updateFire();
          })
          .catch(function(e2){
            console.warn('FIRMS reference also failed, using bundled global reference',e2);
            GS.fire = makeGlobalFireReference();
            setFireSource('Source: bundled global wildfire reference layer','reference');
            localStorage.setItem(FIRE_CACHE_KEY,JSON.stringify({ts:Date.now(),data:GS.fire,source:'Source: bundled global wildfire reference layer',mode:'reference'}));
            renderFireUI(); updateFire();
          });
      });
  }
  function renderFireUI(){
    sT('gc-fire-count',GS.fire.length); sT('gb-fire',GS.fire.length); sT('gc-ftotal',GS.fire.length);
    var counts={na:0,sa:0,af:0,asia:0,oc:0};
    GS.fire.forEach(function(f){ counts[fireRegion(f)]++; });
    sT('gc-fna',counts.na);
    sT('gc-fsa',counts.sa);
    sT('gc-faf',counts.af);
    sT('gc-fasia',counts.asia);
    sT('gc-foc',counts.oc);
    if(GS.fire.length&&GS.fire[0].bright){
      var avg=Math.round(GS.fire.reduce(function(s,f){return s+(f.bright||0);},0)/GS.fire.length);
      sT('gc-fbright',avg+'K');
    } else { sT('gc-fbright','--'); }
    sT('gc-updated',new Date().toLocaleTimeString());
  }
  function fetchISS(){
    if(Date.now()-GS.lastISS<2000) return; GS.lastISS=Date.now();
    fetch('https://api.wheretheiss.at/v1/satellites/25544')
    .then(function(r){return r.json();})
    .then(function(d){
      GS.iss={lat:d.latitude,lon:d.longitude,alt:Math.round(d.altitude),vel:Math.round(d.velocity),vis:d.visibility};
      renderISSUI(); updateISS();
    }).catch(function(e){console.warn('ISS fail',e);});
  }
  function renderISSUI(){
    var i=GS.iss;
    document.getElementById('gc-lat').innerHTML=i.lat.toFixed(3)+'<span class="acc">&deg;</span>';
    document.getElementById('gc-lon').innerHTML=i.lon.toFixed(3)+'<span class="acc">&deg;</span>';
    sT('gc-alt2',i.alt+' km'); sT('gc-spd',i.vel.toLocaleString()+' km/h');
    sT('gc-vis',i.vis==='daylight'?'Day':'Night');
    sT('gb-alt',i.alt+' km');
    sT('gc-iss-pos',i.lat.toFixed(1)+'\u00b0, '+i.lon.toFixed(1)+'\u00b0');
    sT('gc-updated',new Date().toLocaleTimeString());
  }

  var dataTimers=[];
  function startDataTimers(){
    if(dataTimers.length) return;
    fetchEQ(); fetchFire(); fetchISS();
    dataTimers=[
      setInterval(fetchISS, isLite ? 5000 : 2500),
      setInterval(fetchEQ, 90000),
      setInterval(fetchFire, 420000)
    ];
  }
  function stopDataTimers(){
    dataTimers.forEach(function(id){ clearInterval(id); });
    dataTimers=[];
  }
  function updateDataTimers(){
    if(isVis && isInViewport) startDataTimers();
    else stopDataTimers();
  }
  startDataTimers();
  } catch(error) {
    console.error('Globe init failed:', error);
    showGlobeError('Globe renderer unavailable.');
  }
})();
}
