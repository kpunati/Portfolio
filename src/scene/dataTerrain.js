// src/scene/dataTerrain.js - persistent procedural portfolio background

export function initDataTerrain() {
  if (typeof THREE === 'undefined') {
    setTimeout(initDataTerrain, 250);
    return;
  }

  const canvas = document.getElementById('terrain-canvas');
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 760;
  const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.35 : 1.8);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070608, 0.055);

  const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 6.4, 16);
  camera.lookAt(0, 0, -8);

  const state = {
    scroll: 0,
    targetScroll: 0,
    mouseX: 0,
    mouseY: 0,
    focusProject: -1,
    targetFocusProject: -1,
    hero: 0,
    projects: 0,
    transition: 0,
    globe: 0,
    about: 0,
    activeProject: 0
  };

  const clock = new THREE.Clock();
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;

  function sectionProgress(id, start = 0.92, end = 0.08) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    return clamp((vh * start - rect.top) / (vh * (start - end) + rect.height * 0.35));
  }

  function updateScroll() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    state.targetScroll = window.scrollY / maxScroll;
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('mousemove', (event) => {
    state.mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
    state.mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  document.querySelectorAll('.project-card').forEach((card, index) => {
    card.addEventListener('mouseenter', () => { state.targetFocusProject = index; });
    card.addEventListener('mouseleave', () => { state.targetFocusProject = -1; });
    card.addEventListener('focus', () => { state.targetFocusProject = index; });
    card.addEventListener('blur', () => { state.targetFocusProject = -1; });
  });
  window.addEventListener('portfolio:project-focus', (event) => {
    const index = Number(event.detail?.index);
    state.targetFocusProject = Number.isFinite(index) ? index : -1;
  });

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();
  updateScroll();

  const terrainUniforms = {
    uTime: { value: 0 },
    uPointSize: { value: isMobile ? 1.75 : 2.25 },
    uIntensity: { value: 1 },
    uProjects: { value: 0 },
    uGlobe: { value: 0 },
    uAbout: { value: 0 }
  };

  const cols = isMobile ? 82 : 132;
  const rows = isMobile ? 48 : 78;
  const width = isMobile ? 28 : 38;
  const depth = isMobile ? 28 : 38;
  const positions = new Float32Array(cols * rows * 3);
  const colors = new Float32Array(cols * rows * 3);

  let ptr = 0;
  let cptr = 0;
  for (let z = 0; z < rows; z++) {
    for (let x = 0; x < cols; x++) {
      const nx = x / (cols - 1);
      const nz = z / (rows - 1);
      const px = (nx - 0.5) * width;
      const pz = -nz * depth + 8;
      const ridge = Math.sin(nx * Math.PI * 7.0) * Math.cos(nz * Math.PI * 4.0);
      const lane = Math.sin((nx + nz) * Math.PI * 9.0);
      positions[ptr++] = px;
      positions[ptr++] = ridge * 0.32 + lane * 0.12;
      positions[ptr++] = pz;

      const cyan = Math.max(0, Math.sin(nx * Math.PI * 2.6 + nz * 5.8));
      colors[cptr++] = 0.92;
      colors[cptr++] = 0.56 + cyan * 0.24;
      colors[cptr++] = 0.12 + cyan * 0.64;
    }
  }

  const terrainGeometry = new THREE.BufferGeometry();
  terrainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  terrainGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const terrainMaterial = new THREE.ShaderMaterial({
    uniforms: terrainUniforms,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime;
      uniform float uPointSize;
      uniform float uIntensity;
      uniform float uProjects;
      uniform float uGlobe;
      uniform float uAbout;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec3 p = position;
        float waveA = sin(p.x * 0.72 + uTime * 0.62);
        float waveB = cos(p.z * 0.56 - uTime * 0.46);
        float waveC = sin((p.x + p.z) * 0.34 + uTime * 0.28);
        float projectLift = uProjects * sin(p.x * 0.42) * 0.55;
        p.y += waveA * 0.34 + waveB * 0.26 + waveC * 0.18 + projectLift;
        p.z += uGlobe * 1.8;
        p.y *= 1.0 - uAbout * 0.55;

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        float depthFade = smoothstep(-42.0, -2.0, mvPosition.z);
        float horizon = smoothstep(10.0, -18.0, p.z);
        gl_PointSize = uPointSize * (36.0 / -mvPosition.z) * (1.0 + uProjects * 0.18);
        gl_Position = projectionMatrix * mvPosition;

        vColor = color;
        vAlpha = (0.28 + horizon * 0.72) * depthFade * uIntensity * (1.0 - uAbout * 0.42);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        float core = smoothstep(0.5, 0.06, d);
        float halo = smoothstep(0.5, 0.18, d) * 0.34;
        gl_FragColor = vec4(vColor, (core + halo) * vAlpha);
      }
    `
  });

  const terrain = new THREE.Points(terrainGeometry, terrainMaterial);
  terrain.position.y = -2.3;
  scene.add(terrain);

  const contourGroup = new THREE.Group();
  const contourMaterial = new THREE.LineBasicMaterial({
    color: 0xffd56a,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  function terrainHeight(x, z, offset = 0) {
    return (
      Math.sin(x * 0.72 + offset) * 0.34 +
      Math.cos(z * 0.56 - offset * 0.74) * 0.26 +
      Math.sin((x + z) * 0.34 + offset * 0.45) * 0.18
    );
  }

  function makeContourLine(zBase, widthValue, phase, material) {
    const points = [];
    const segments = 120;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (t - 0.5) * widthValue;
      const z = zBase + Math.sin(t * Math.PI * 4 + phase) * 0.9 + Math.sin(t * Math.PI * 9 + phase) * 0.22;
      const y = -2.02 + terrainHeight(x, z, phase) * 0.72;
      points.push(x, y, z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const line = new THREE.Line(geometry, material);
    line.userData = { zBase, widthValue, phase };
    return line;
  }

  const contours = [];
  for (let i = 0; i < (isMobile ? 9 : 15); i++) {
    const zBase = 7 - i * 2.1;
    const line = makeContourLine(zBase, width, i * 0.7, contourMaterial);
    contours.push(line);
    contourGroup.add(line);
  }
  scene.add(contourGroup);

  const gridGroup = new THREE.Group();
  const gridMaterial = new THREE.LineBasicMaterial({
    color: 0xd4a652,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const gridPositions = [];
  const gridSize = isMobile ? 30 : 42;
  const gridStep = isMobile ? 3 : 2.6;
  for (let i = -gridSize / 2; i <= gridSize / 2; i += gridStep) {
    gridPositions.push(-gridSize / 2, -2.45, i, gridSize / 2, -2.45, i);
    gridPositions.push(i, -2.45, 9, i, -2.45, -gridSize + 9);
  }
  const gridGeometry = new THREE.BufferGeometry();
  gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPositions, 3));
  gridGroup.add(new THREE.LineSegments(gridGeometry, gridMaterial));
  scene.add(gridGroup);

  const starCount = isMobile ? 420 : 900;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    starPositions[i3] = (Math.random() - 0.5) * 56;
    starPositions[i3 + 1] = (Math.random() - 0.15) * 22;
    starPositions[i3 + 2] = -Math.random() * 58 + 12;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffd56a,
    size: isMobile ? 0.035 : 0.045,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  const chamberGroup = new THREE.Group();
  const chamberMaterial = new THREE.MeshBasicMaterial({
    color: 0xd4a652,
    transparent: true,
    opacity: 0.0,
    wireframe: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const chamberAccentMaterial = new THREE.MeshBasicMaterial({
    color: 0x7a5a8f,
    transparent: true,
    opacity: 0.0,
    wireframe: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  for (let i = 0; i < (isMobile ? 5 : 8); i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.8 + i * 1.22, 0.01, 6, 96),
      i % 2 ? chamberAccentMaterial : chamberMaterial
    );
    ring.position.set((i - 3.5) * 0.22, 0.45 + Math.sin(i) * 0.28, -4.5 - i * 1.18);
    ring.rotation.x = Math.PI * 0.5 + i * 0.035;
    ring.rotation.y = i * 0.16;
    ring.userData.phase = i * 0.54;
    chamberGroup.add(ring);
  }
  scene.add(chamberGroup);

  const signalGroup = new THREE.Group();
  const signalNodeGeometry = new THREE.SphereGeometry(0.055, 10, 10);
  const signalNodeMaterial = new THREE.MeshBasicMaterial({
    color: 0x5eead4,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const signalGoldMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd56a,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const signalLineMaterial = new THREE.LineBasicMaterial({
    color: 0x5eead4,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const signalNodes = [];
  const signalLinePoints = [];
  const signalCount = isMobile ? 12 : 22;
  for (let i = 0; i < signalCount; i++) {
    const angle = (i / signalCount) * Math.PI * 2;
    const radius = 2.4 + (i % 5) * 0.46;
    const node = new THREE.Mesh(signalNodeGeometry, i % 3 === 0 ? signalGoldMaterial : signalNodeMaterial);
    node.userData = {
      angle,
      radius,
      height: -0.25 + Math.sin(i * 1.7) * 1.25,
      phase: i * 0.48
    };
    signalNodes.push(node);
    signalGroup.add(node);
    if (i > 0 && i % 2 === 0) {
      signalLinePoints.push(0, 0, 0, 0, 0, 0);
    }
  }
  const signalLineGeometry = new THREE.BufferGeometry();
  signalLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(signalLinePoints, 3));
  const signalLines = new THREE.LineSegments(signalLineGeometry, signalLineMaterial);
  signalGroup.add(signalLines);
  signalGroup.position.set(2.8, 0.15, -5.4);
  scene.add(signalGroup);

  const panelGroup = new THREE.Group();
  const panelMaterials = [
    new THREE.LineBasicMaterial({ color: 0xd4a652, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false }),
    new THREE.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
  ];

  function makePanel(widthValue, heightValue, depthValue, material) {
    const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(widthValue, heightValue, depthValue));
    return new THREE.LineSegments(geometry, material);
  }

  const panels = [];
  const panelData = [
    [-9, 0.4, -4, 3.8, 1.6, 0.08, -0.12, 0.34],
    [8, 0.2, -6, 4.4, 1.8, 0.08, 0.16, -0.28],
    [-4, 1.8, -11, 3.2, 1.2, 0.08, 0.04, 0.12],
    [5.5, 2.3, -14, 4.8, 1.5, 0.08, -0.08, -0.2],
    [-11, -1.5, -15, 4.2, 0.08, 2.2, 0.0, 0.2],
    [10.5, -1.6, -18, 5.4, 0.08, 2.6, 0.0, -0.18],
    [0, -1.4, -22, 6.2, 0.08, 3.0, 0.0, 0.0],
    [-2.5, 3.4, -24, 5.0, 1.4, 0.08, 0.09, 0.26],
    [9.5, 3.0, -26, 4.0, 1.2, 0.08, -0.1, -0.32]
  ];

  panelData.forEach((data, index) => {
    const panel = makePanel(data[3], data[4], data[5], panelMaterials[index % panelMaterials.length]);
    panel.position.set(data[0], data[1], data[2]);
    panel.rotation.x = data[6];
    panel.rotation.y = data[7];
    panel.userData.base = {
      x: data[0],
      y: data[1],
      z: data[2],
      rx: data[6],
      ry: data[7],
      phase: index * 0.75
    };
    panels.push(panel);
    panelGroup.add(panel);
  });
  scene.add(panelGroup);

  const artifactGroup = new THREE.Group();
  const artifactGold = new THREE.LineBasicMaterial({ color: 0xffd56a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const artifactPlum = new THREE.LineBasicMaterial({ color: 0xb8a0cc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const artifactGreen = new THREE.LineBasicMaterial({ color: 0x4daa74, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const artifactDotMaterials = [
    new THREE.MeshBasicMaterial({ color: 0xffd56a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: 0xb8a0cc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: 0x4daa74, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  ];
  const artifactMaterials = [artifactGold, artifactPlum, artifactGreen, ...artifactDotMaterials];

  function makeArtifactFrame(material) {
    return new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.4, 1.55, 0.16)), material);
  }

  function makeWaveform(material) {
    const points = [];
    for (let i = 0; i < 46; i++) {
      const t = i / 45;
      points.push(
        -1.35 + t * 2.7,
        Math.sin(t * Math.PI * 5.2) * 0.22 + Math.sin(t * Math.PI * 13) * 0.06,
        0.12
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return new THREE.Line(geometry, material);
  }

  function makeArtifact(type, material, dotMaterial) {
    const group = new THREE.Group();
    group.add(makeArtifactFrame(material));

    if (type === 'market') {
      group.add(makeWaveform(material));
      for (let i = 0; i < 7; i++) {
        const heightValue = 0.32 + (i % 4) * 0.18;
        const bar = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.18, heightValue, 0.08)), material);
        bar.position.set(-1.15 + i * 0.38, -0.58 + heightValue * 0.5, 0.1);
        group.add(bar);
      }
    } else if (type === 'network') {
      const nodePositions = [[-1.05, -0.25, 0.1], [-0.2, 0.32, 0.1], [0.74, -0.02, 0.1], [1.12, 0.45, 0.1]];
      const linePoints = [
        ...nodePositions[0], ...nodePositions[1],
        ...nodePositions[1], ...nodePositions[2],
        ...nodePositions[2], ...nodePositions[3],
        ...nodePositions[0], ...nodePositions[2]
      ];
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
      group.add(new THREE.LineSegments(geometry, material));
      const dotGeo = new THREE.SphereGeometry(0.06, 10, 10);
      nodePositions.forEach((position) => {
        const node = new THREE.Mesh(dotGeo, dotMaterial);
        node.position.set(position[0], position[1], position[2]);
        group.add(node);
      });
    } else {
      for (let i = 0; i < 4; i++) {
        const tile = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.55 - i * 0.28, 0.18, 0.06)), material);
        tile.position.set(0, 0.42 - i * 0.27, 0.1);
        group.add(tile);
      }
      const dotGeo = new THREE.SphereGeometry(0.045, 8, 8);
      for (let i = 0; i < 5; i++) {
        const dot = new THREE.Mesh(dotGeo, dotMaterial);
        dot.position.set(-1.18 + i * 0.58, -0.58, 0.11);
        group.add(dot);
      }
    }
    return group;
  }

  const artifactData = [
    { type: 'market', x: -6.0, y: 0.2, z: -6.4, material: artifactGold, dot: artifactDotMaterials[0], ry: 0.24 },
    { type: 'network', x: 0.0, y: 0.45, z: -7.6, material: artifactPlum, dot: artifactDotMaterials[1], ry: 0.0 },
    { type: 'feed', x: 6.0, y: 0.18, z: -6.2, material: artifactGreen, dot: artifactDotMaterials[2], ry: -0.24 }
  ];
  const artifacts = artifactData.map((data, index) => {
    const artifact = makeArtifact(data.type, data.material, data.dot);
    artifact.position.set(data.x, data.y, data.z);
    artifact.rotation.y = data.ry;
    artifact.userData = { base: data, index };
    artifactGroup.add(artifact);
    return artifact;
  });
  scene.add(artifactGroup);

  const scanMaterial = new THREE.LineBasicMaterial({
    color: 0x5eead4,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const scanGroup = new THREE.Group();
  const scanPlanes = [];
  for (let i = 0; i < 3; i++) {
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(5.4, 2.2, 0.04)),
      scanMaterial
    );
    frame.userData = { index: i, phase: i * 0.7 };
    scanPlanes.push(frame);
    scanGroup.add(frame);
  }
  scene.add(scanGroup);

  const tunnelGroup = new THREE.Group();
  const tunnelMaterial = new THREE.MeshBasicMaterial({
    color: 0xff2244,
    transparent: true,
    opacity: 0,
    wireframe: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const tunnelGoldMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd56a,
    transparent: true,
    opacity: 0,
    wireframe: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  for (let i = 0; i < (isMobile ? 7 : 12); i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6 + i * 0.28, 0.012, 5, 72), i % 3 === 0 ? tunnelMaterial : tunnelGoldMaterial);
    ring.position.set(0, 0.15, -8.5 - i * 1.25);
    ring.rotation.x = Math.PI * 0.5;
    ring.userData.phase = i * 0.42;
    tunnelGroup.add(ring);
  }
  scene.add(tunnelGroup);

  const projectBeacons = [];
  const beaconGeometry = new THREE.SphereGeometry(0.11, 14, 14);
  const beaconMaterials = [
    new THREE.MeshBasicMaterial({ color: 0xd4a652, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: 0xb8a0cc, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: 0x4daa74, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false })
  ];
  const beaconPositions = [
    [-7.5, -1.0, -4.5],
    [0.0, -0.8, -7.2],
    [7.5, -1.0, -4.8]
  ];
  beaconPositions.forEach((position, index) => {
    const beacon = new THREE.Mesh(beaconGeometry, beaconMaterials[index]);
    beacon.position.set(position[0], position[1], position[2]);
    beacon.userData.base = { x: position[0], y: position[1], z: position[2], index };
    projectBeacons.push(beacon);
    scene.add(beacon);
  });

  const routeGroup = new THREE.Group();
  const routeMaterial = new THREE.LineBasicMaterial({
    color: 0xffc857,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  function makeRoute(offset, amp, zStart) {
    const points = [];
    for (let i = 0; i < 80; i++) {
      const t = i / 79;
      points.push(
        -17 + t * 34,
        -1.85 + Math.sin(t * Math.PI * 5 + offset) * amp,
        zStart - t * 16
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return new THREE.Line(geometry, routeMaterial);
  }

  routeGroup.add(makeRoute(0.0, 0.2, 3));
  routeGroup.add(makeRoute(1.7, 0.28, -2));
  routeGroup.add(makeRoute(3.4, 0.16, -8));
  scene.add(routeGroup);

  const packetGeometry = new THREE.SphereGeometry(0.06, 10, 10);
  const packetMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe8a3,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const packets = [];
  for (let i = 0; i < (isMobile ? 7 : 13); i++) {
    const packet = new THREE.Mesh(packetGeometry, packetMaterial);
    packet.userData.phase = i / (isMobile ? 7 : 13);
    packets.push(packet);
    scene.add(packet);
  }

  const glowGeometry = new THREE.PlaneGeometry(36, 20, 1, 1);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xd4a652,
    transparent: true,
    opacity: 0.045,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const glowPlane = new THREE.Mesh(glowGeometry, glowMaterial);
  glowPlane.position.set(0, -2.52, -8);
  glowPlane.rotation.x = -Math.PI / 2;
  scene.add(glowPlane);

  let visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;

    const elapsed = clock.getElapsedTime();
    const time = prefersReducedMotion ? 0 : elapsed;
    state.scroll = lerp(state.scroll, state.targetScroll, 0.06);
    state.focusProject = lerp(state.focusProject, state.targetFocusProject, 0.12);
    state.hero = lerp(state.hero, 1 - sectionProgress('projects', 0.98, 0.76), 0.05);
    state.projects = lerp(state.projects, sectionProgress('projects', 0.9, 0.1), 0.05);
    state.transition = lerp(state.transition, sectionProgress('transition-zone', 0.96, 0.12), 0.06);
    state.globe = lerp(state.globe, sectionProgress('dashboards', 0.9, 0.18), 0.06);
    state.about = lerp(state.about, sectionProgress('about', 0.9, 0.18), 0.06);
    const fallbackProject = clamp(Math.floor(state.projects * 3.15), 0, 2);
    const targetActiveProject = state.targetFocusProject >= 0 ? state.targetFocusProject : fallbackProject;
    state.activeProject = lerp(state.activeProject, targetActiveProject, 0.08);
    const activeProjectIndex = Math.round(clamp(state.activeProject, 0, 2));

    const intensity = 0.82 + state.hero * 0.18 + state.projects * 0.16 - state.about * 0.38;
    terrainUniforms.uTime.value = time;
    terrainUniforms.uIntensity.value = intensity;
    terrainUniforms.uProjects.value = state.projects;
    terrainUniforms.uGlobe.value = state.globe;
    terrainUniforms.uAbout.value = state.about;

    stars.rotation.y = time * 0.012 + state.mouseX * 0.012;
    stars.position.z = state.scroll * 4.0;
    starMaterial.opacity = 0.18 + state.hero * 0.32 + state.transition * 0.14 - state.about * 0.14;

    chamberMaterial.opacity = 0.08 + state.hero * 0.34 - state.projects * 0.16 - state.about * 0.12;
    chamberAccentMaterial.opacity = 0.05 + state.hero * 0.22 + state.projects * 0.05 - state.about * 0.1;
    chamberGroup.position.x = lerp(chamberGroup.position.x, state.mouseX * -0.25, 0.04);
    chamberGroup.position.y = lerp(chamberGroup.position.y, state.mouseY * -0.12 + state.projects * -0.42, 0.04);
    chamberGroup.position.z = lerp(chamberGroup.position.z, state.scroll * 5.8 - state.projects * 2.0, 0.04);
    chamberGroup.children.forEach((ring, index) => {
      ring.rotation.z = time * (0.018 + index * 0.002) + ring.userData.phase;
      ring.scale.setScalar(1 + Math.sin(time * 0.42 + index) * 0.018 + state.hero * 0.035);
    });

    signalGroup.position.x = lerp(signalGroup.position.x, 2.8 + state.mouseX * -0.42 - state.projects * 1.4, 0.04);
    signalGroup.position.y = lerp(signalGroup.position.y, 0.15 + state.mouseY * -0.24 + state.hero * 0.24 - state.projects * 0.7, 0.04);
    signalGroup.position.z = lerp(signalGroup.position.z, -5.4 + state.scroll * 4.4 - state.projects * 1.6, 0.04);
    signalNodeMaterial.opacity = 0.08 + state.hero * 0.58 - state.projects * 0.34 - state.about * 0.12;
    signalGoldMaterial.opacity = 0.08 + state.hero * 0.46 + state.projects * 0.08 - state.about * 0.12;
    signalLineMaterial.opacity = 0.03 + state.hero * 0.24 - state.projects * 0.1;
    const signalAttr = signalLines.geometry.getAttribute('position');
    let signalPtr = 0;
    signalNodes.forEach((node, index) => {
      const data = node.userData;
      const drift = time * (0.16 + index * 0.001);
      node.position.set(
        Math.cos(data.angle + drift) * data.radius,
        data.height + Math.sin(time * 0.8 + data.phase) * 0.16,
        Math.sin(data.angle + drift) * (data.radius * 0.42)
      );
      node.scale.setScalar(1 + Math.sin(time * 2.2 + data.phase) * 0.32 + state.hero * 0.5);
      if (index > 0 && index % 2 === 0 && signalPtr + 5 < signalAttr.array.length) {
        const prev = signalNodes[index - 1].position;
        signalAttr.setXYZ(signalPtr / 3, prev.x, prev.y, prev.z);
        signalAttr.setXYZ(signalPtr / 3 + 1, node.position.x, node.position.y, node.position.z);
        signalPtr += 6;
      }
    });
    signalAttr.needsUpdate = true;

    terrain.rotation.y = lerp(terrain.rotation.y, state.mouseX * 0.018 + state.transition * 0.04, 0.04);
    terrain.position.x = lerp(terrain.position.x, state.mouseX * -0.35, 0.04);
    terrain.position.z = lerp(terrain.position.z, state.scroll * 6 - state.globe * 2.8, 0.04);
    contourGroup.position.x = terrain.position.x;
    contourGroup.position.z = terrain.position.z;
    contourGroup.rotation.y = terrain.rotation.y;
    contourMaterial.opacity = 0.18 + state.hero * 0.18 + state.projects * 0.26 + state.transition * 0.10 - state.about * 0.18;
    contours.forEach((line, lineIndex) => {
      const attr = line.geometry.getAttribute('position');
      const phase = line.userData.phase + time * 0.34;
      for (let i = 0; i < attr.count; i++) {
        const t = i / (attr.count - 1);
        const x = (t - 0.5) * line.userData.widthValue;
        const z = line.userData.zBase + Math.sin(t * Math.PI * 4 + phase) * 0.9 + Math.sin(t * Math.PI * 9 + phase) * 0.22;
        const lift = state.projects * Math.sin(x * 0.4 + lineIndex) * 0.32;
        attr.setXYZ(i, x, -2.0 + terrainHeight(x, z, phase) * 0.78 + lift, z);
      }
      attr.needsUpdate = true;
    });
    gridGroup.position.z = terrain.position.z * 0.74;
    gridMaterial.opacity = 0.1 + state.projects * 0.08 + state.transition * 0.1 - state.about * 0.07;

    panelGroup.position.y = lerp(panelGroup.position.y, state.projects * 0.75 - state.about * 0.4, 0.04);
    panelMaterials.forEach((mat, index) => {
      mat.opacity = (index === 0 ? 0.22 : 0.14) + state.projects * 0.2 + state.transition * 0.14 - state.about * 0.16;
    });
    panels.forEach((panel) => {
      const base = panel.userData.base;
      panel.position.y = base.y + Math.sin(time * 0.7 + base.phase) * 0.16 + state.projects * 0.35;
      panel.position.z = base.z + Math.sin(time * 0.42 + base.phase) * 0.18 + state.globe * 2.0;
      panel.rotation.x = base.rx + Math.sin(time * 0.36 + base.phase) * 0.025;
      panel.rotation.y = base.ry + state.mouseX * 0.025;
    });

    const artifactOpacity = Math.max(0, state.projects * 0.95 - state.globe * 0.44 - state.about * 0.3);
    artifactMaterials.forEach((material, index) => {
      const dotBoost = index > 2 ? 0.18 : 0;
      material.opacity = artifactOpacity * (0.34 + dotBoost);
    });
    artifactGroup.position.y = lerp(artifactGroup.position.y, state.projects * 0.7 - state.transition * 0.34, 0.045);
    artifactGroup.position.z = lerp(artifactGroup.position.z, -state.projects * 0.8 + state.transition * -1.4, 0.045);
    artifacts.forEach((artifact, index) => {
      const base = artifact.userData.base;
      const active = Math.max(0, 1 - Math.abs(state.activeProject - index));
      const laneOffset = (index - state.activeProject) * 4.9;
      artifact.position.x = lerp(artifact.position.x, laneOffset + state.mouseX * (0.22 + index * 0.06), 0.055);
      artifact.position.y = base.y + Math.sin(time * 0.62 + index) * 0.12 + active * 0.58;
      artifact.position.z = base.z + Math.sin(time * 0.38 + index) * 0.16 - active * 1.35 + Math.abs(index - state.activeProject) * -0.72;
      artifact.rotation.x = Math.sin(time * 0.28 + index) * 0.035 + state.mouseY * -0.025;
      artifact.rotation.y = base.ry + state.mouseX * 0.065 + active * 0.14 - (index - state.activeProject) * 0.12;
      artifact.scale.setScalar(0.72 + state.projects * 0.22 + active * 0.34);
    });

    scanMaterial.opacity = Math.max(0, state.projects * 0.38 - state.transition * 0.2 - state.about * 0.2);
    scanGroup.position.set(
      lerp(scanGroup.position.x, (activeProjectIndex - 1) * 2.2 + state.mouseX * 0.2, 0.055),
      lerp(scanGroup.position.y, 0.92 + state.projects * 0.62, 0.055),
      lerp(scanGroup.position.z, -7.9 - state.transition * 2.2, 0.055)
    );
    scanPlanes.forEach((plane, index) => {
      const offset = index - 1;
      plane.position.x = offset * 0.22;
      plane.position.z = offset * -0.22 + Math.sin(time * 0.72 + plane.userData.phase) * 0.08;
      plane.rotation.x = Math.sin(time * 0.28 + index) * 0.035;
      plane.rotation.y = state.mouseX * 0.04 + offset * 0.03;
      plane.scale.setScalar(0.88 + state.projects * 0.2 + Math.sin(time * 1.4 + index) * 0.025);
    });

    const tunnelOpacity = Math.max(0, state.transition * 0.78 - state.about * 0.3);
    tunnelMaterial.opacity = tunnelOpacity * 0.5;
    tunnelGoldMaterial.opacity = tunnelOpacity * 0.34;
    tunnelGroup.position.z = lerp(tunnelGroup.position.z, state.transition * 3.2 + state.globe * 3.6, 0.055);
    tunnelGroup.position.y = lerp(tunnelGroup.position.y, state.transition * 0.55 - state.globe * 0.45, 0.055);
    tunnelGroup.rotation.z = time * 0.08 + state.mouseX * 0.08;
    tunnelGroup.children.forEach((ring, index) => {
      const pulse = 1 + Math.sin(time * 2.0 + ring.userData.phase) * 0.08;
      ring.scale.setScalar(pulse * (1 + state.transition * 0.35));
      ring.rotation.z = time * (0.14 + index * 0.01);
    });

    projectBeacons.forEach((beacon, index) => {
      const distance = Math.abs(state.focusProject - index);
      const active = state.targetFocusProject === index ? 1 : Math.max(0, 1 - distance);
      const pulse = 1 + Math.sin(time * 3.0 + index) * 0.28;
      beacon.position.y = beacon.userData.base.y + Math.sin(time * 0.8 + index) * 0.18;
      beacon.position.z = beacon.userData.base.z + terrain.position.z * 0.25;
      beacon.scale.setScalar((1.2 + active * 3.8) * pulse);
      beacon.material.opacity = (0.08 + active * 0.62) * (state.projects + 0.2) * (1 - state.about * 0.6);
    });

    routeGroup.position.z = terrain.position.z * 0.45;
    routeMaterial.opacity = 0.16 + state.projects * 0.22 + state.transition * 0.22 - state.about * 0.2;
    packets.forEach((packet, index) => {
      const t = (time * (0.055 + index * 0.002) + packet.userData.phase) % 1;
      const lane = index % 3;
      packet.position.x = -17 + t * 34;
      packet.position.y = -1.72 + Math.sin(t * Math.PI * 5 + lane * 1.6) * (0.18 + lane * 0.05);
      packet.position.z = (3 - lane * 5) - t * 16 + routeGroup.position.z;
      const scale = 0.7 + Math.sin(t * Math.PI) * 1.6;
      packet.scale.setScalar(scale);
      packet.material.opacity = (0.22 + state.projects * 0.34 + state.transition * 0.28) * (1 - state.about * 0.6);
    });

    glowMaterial.opacity = 0.035 + state.projects * 0.035 + state.transition * 0.04 - state.about * 0.03;

    const projectX = (state.activeProject - 1) * 1.35;
    const heroWeight = Math.max(0, 1 - state.projects * 0.9);
    const projectWeight = state.projects * (1 - state.transition * 0.7);
    const transitionWeight = state.transition * (1 - state.globe * 0.42);
    const globeWeight = state.globe * (1 - state.about * 0.55);
    const aboutWeight = state.about;
    const weightTotal = Math.max(0.001, heroWeight + projectWeight + transitionWeight + globeWeight + aboutWeight);

    const targetCamX = (
      heroWeight * 0.0 +
      projectWeight * projectX +
      transitionWeight * 0.1 +
      globeWeight * 0.74 +
      aboutWeight * 0.0
    ) / weightTotal + state.mouseX * (0.42 - state.about * 0.22);
    const targetCamY = (
      heroWeight * 6.3 +
      projectWeight * 4.25 +
      transitionWeight * 3.8 +
      globeWeight * 4.9 +
      aboutWeight * 5.9
    ) / weightTotal + state.mouseY * -0.22;
    const targetCamZ = (
      heroWeight * 15.4 +
      projectWeight * 8.7 +
      transitionWeight * 6.6 +
      globeWeight * 9.6 +
      aboutWeight * 14.2
    ) / weightTotal;
    const lookX = (
      heroWeight * 0.0 +
      projectWeight * projectX * 0.68 +
      transitionWeight * 0.0 +
      globeWeight * 0.62
    ) / weightTotal + state.mouseX * 0.45;
    const lookY = (
      heroWeight * -0.45 +
      projectWeight * -0.75 +
      transitionWeight * 0.06 +
      globeWeight * -0.35 +
      aboutWeight * -0.8
    ) / weightTotal;
    const lookZ = (
      heroWeight * -7.5 +
      projectWeight * -8.9 +
      transitionWeight * -14.2 +
      globeWeight * -10.0 +
      aboutWeight * -8.5
    ) / weightTotal;
    camera.position.x = lerp(camera.position.x, targetCamX, 0.035);
    camera.position.y = lerp(camera.position.y, targetCamY, 0.035);
    camera.position.z = lerp(camera.position.z, targetCamZ, 0.035);
    camera.lookAt(lookX, lookY, lookZ);

    renderer.render(scene, camera);
  }

  animate();
}
