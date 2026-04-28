export function initGlobe() {
  if (typeof THREE === 'undefined') {
    setTimeout(initGlobe, 300); return;
  }
// ── GLOBE DASHBOARD ───────────────────────────────────────────────────────
(function() {
  var GS = {eq:[],fire:[],iss:{lat:0,lon:0,alt:0,vel:0,vis:'daylight'},lastISS:0};
  var FIRE_CACHE_KEY = 'gfire3';
  var GLOBE_R = 1.0;
  function mC(m){return m<2.5?'#C084FC':m<4?'#E040FB':m<6?'#F000FF':'#FF00CC';}
  function mB(m){return m<2.5?'rgba(192,132,252,.15)':m<4?'rgba(224,64,251,.15)':m<6?'rgba(240,0,255,.15)':'rgba(255,0,204,.15)';}
  function sT(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
  function tAgo(ms){var s=Math.floor((Date.now()-ms)/1000);return s<60?s+'s ago':s<3600?Math.floor(s/60)+'m ago':s<86400?Math.floor(s/3600)+'h ago':Math.floor(s/86400)+'d ago';}
  function fireRegion(f){
    var lon = ((f.lon + 540) % 360) - 180;
    if (lon >= -170 && lon < -30 && f.lat >= 0) return 'na';
    if (lon >= -90 && lon < -30 && f.lat < 0) return 'sa';
    if (lon >= -20 && lon <= 55 && f.lat >= -35 && f.lat <= 38) return 'af';
    return 'asia';
  }

  var canvas = document.getElementById('globe-canvas-inner');
  var wrap   = canvas.parentElement;
  var globeHooks = window._globeHooks = window._globeHooks || { emerge: 0 };
  var renderer = new THREE.WebGLRenderer({canvas:canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
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
  var earthTex  = texLoader.load('earth-texture.jpg',
    function(){ document.getElementById('g-loading').classList.add('hidden'); },
    undefined,
    function(){ document.getElementById('g-loading').classList.add('hidden'); }
  );
  earthTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  var earthMat  = new THREE.MeshPhongMaterial({map:earthTex,specular:new THREE.Color(0x1a2233),shininess:4});
  var earthMesh = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R,64,64),earthMat);
  scene.add(earthMesh);
  var atmMesh = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_R*1.025,32,32),new THREE.MeshBasicMaterial({color:0x6fa8ff,transparent:true,opacity:.15,side:THREE.FrontSide,depthWrite:false}));
  scene.add(atmMesh);
  scene.add(new THREE.AmbientLight(0xffffff,.62));
  var sunLight = new THREE.DirectionalLight(0xfff8f0,0.95); sunLight.position.set(12,6,-8); scene.add(sunLight);

  // Earthquake dots
  var MAX_EQ=300, _d=new THREE.Object3D();
  var eqMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.012,6,6),new THREE.MeshBasicMaterial({color:0xE040FB,transparent:true,opacity:.95}),MAX_EQ);
  eqMesh.count=0; scene.add(eqMesh);

  // Fire dots
  var fireMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.007,4,4),new THREE.MeshBasicMaterial({color:0xE8763A,transparent:true,opacity:.78}),500);
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
    fireMesh.count=Math.min(GS.fire.length,500);
    GS.fire.slice(0,500).forEach(function(f,i){
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
  globeLeft.addEventListener('mousedown',function(e){isDrag=true;autoRot=false;prevM={x:e.clientX,y:e.clientY};});
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
    var ray=new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(mx,my),camera);
    var hits=ray.intersectObject(eqMesh);
    if(hits.length&&GS.eq[hits[0].instanceId]){
      var q=GS.eq[hits[0].instanceId];
      document.getElementById('g-tt-title').textContent='M'+q.mag.toFixed(1)+' — '+q.place;
      document.getElementById('g-tt-sub').textContent='Depth: '+q.depth+'km · '+tAgo(q.time);
      var tt=document.getElementById('g-tooltip');
      tt.style.left=(e.clientX-rect.left+12)+'px'; tt.style.top=(e.clientY-rect.top-10)+'px'; tt.style.display='block';
    } else { document.getElementById('g-tooltip').style.display='none'; }
  });
  globeLeft.addEventListener('mouseup',function(){isDrag=false;setTimeout(function(){autoRot=true;},3000);});
  globeLeft.addEventListener('mouseleave',function(){isDrag=false;document.getElementById('g-tooltip').style.display='none';});
  globeLeft.addEventListener('wheel',function(e){camera.position.z=Math.max(1.6,Math.min(5,camera.position.z+e.deltaY*.002));},{passive:true});

  // Render loop
  var issT=0, isVis=true;
  document.addEventListener('visibilitychange',function(){isVis=!document.hidden;});
  function loop(){
    if(!isVis){requestAnimationFrame(loop);return;}
    requestAnimationFrame(loop);
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
    renderer.render(scene,camera);
  }
  loop();

  // Data
  function fetchEQ(){
    var cached=localStorage.getItem('geq');
    if(cached){var d=JSON.parse(cached);if(Date.now()-d.ts<60000){GS.eq=d.data;renderEQUI();updateEQ();return;}}
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
    var cached=localStorage.getItem(FIRE_CACHE_KEY);
    if(cached){var d=JSON.parse(cached);if(Date.now()-d.ts<86400000){GS.fire=d.data;renderFireUI();updateFire();return;}}
    // NASA FIRMS VIIRS global 24h hotspot CSV — no auth, truly global
  var firmsUrl = 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_Global_24h.csv';
  fetch(firmsUrl)
    .then(function(r){return r.text();})
    .then(function(csv){
      var lines=csv.trim().split('\n');
      var hdr=lines[0].split(',');
      var latI=hdr.indexOf('latitude'), lonI=hdr.indexOf('longitude'), brightI=hdr.indexOf('bright_ti4');
      if(latI<0){latI=0;lonI=1;brightI=2;}
      var pts=[];
      for(var i=1;i<lines.length;i++){
        var c=lines[i].split(',');
        var la=parseFloat(c[latI]),lo=parseFloat(c[lonI]),br=parseFloat(c[brightI])||300;
        if(!isNaN(la)&&!isNaN(lo))pts.push({lat:la,lon:lo,bright:br});
      }
      // Sort by brightness, keep top 600 (global spread)
      pts.sort(function(a,b){return b.bright-a.bright;});
      GS.fire=pts.slice(0,600);
      localStorage.setItem(FIRE_CACHE_KEY,JSON.stringify({ts:Date.now(),data:GS.fire}));
      renderFireUI(); updateFire();
    }).catch(function(e){
      console.warn('FIRMS fail, falling back to EONET',e);
      fetch('https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open&limit=500&days=60')
        .then(function(r){return r.json();})
        .then(function(j){
          GS.fire=j.events.flatMap(function(e){return e.geometry.map(function(g){return{lat:g.coordinates[1],lon:g.coordinates[0]};});})
            .filter(function(f){return f.lat&&f.lon&&Math.abs(f.lat)<=90&&Math.abs(f.lon)<=180;});
          localStorage.setItem(FIRE_CACHE_KEY,JSON.stringify({ts:Date.now(),data:GS.fire}));
          renderFireUI(); updateFire();
        }).catch(function(e2){console.warn('EONET also failed',e2);});
    });
  }
  function renderFireUI(){
    sT('gc-fire-count',GS.fire.length); sT('gb-fire',GS.fire.length); sT('gc-ftotal',GS.fire.length);
    var counts={na:0,sa:0,af:0,asia:0};
    GS.fire.forEach(function(f){ counts[fireRegion(f)]++; });
    sT('gc-fna',counts.na);
    sT('gc-fsa',counts.sa);
    sT('gc-faf',counts.af);
    sT('gc-fasia',counts.asia);
    sT('gc-frow',GS.fire.length-(counts.na+counts.sa+counts.af+counts.asia));
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

  fetchEQ(); fetchFire(); fetchISS();
  setInterval(fetchISS,2000); setInterval(fetchEQ,60000); setInterval(fetchFire,300000);
})();
}
