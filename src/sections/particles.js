// src/sections/particles.js
// Dashboard tab wiring plus the scheduler-owned Three.js helix.

import * as THREE from 'three';
import { visualScheduler } from '../performance/visualScheduler.js';

export function initParticles(options = {}) {
  document.querySelectorAll('.embed-shell').forEach(shell => {
    shell.querySelectorAll('.embed-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        shell.querySelectorAll('.embed-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  });

  if (options.prefersReducedMotion) return;

  const canvas = document.getElementById('helix-canvas');
  if (!canvas) return;

  const isMobile = window.innerWidth < 760;
  const quality = options.visualQuality || window.__portfolioVisualQuality || 'balanced';
  const isLite = quality === 'lite';
  const isBalanced = quality === 'balanced';
  const maxDpr = isLite ? 1 : isBalanced ? 1.25 : 1.55;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isLite });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : maxDpr));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace || renderer.outputColorSpace;

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffdf9a, 0.62));
  const keyLight = new THREE.DirectionalLight(0xfff0c2, 1.8);
  keyLight.position.set(2.4, 3.2, 4.6);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x5eead4, 0.92);
  rimLight.position.set(-3.2, -1.6, 2.2);
  scene.add(rimLight);
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5.5);

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 160);
  });
  resize();

  const turns = isLite ? 3 : 5;
  const pointsPerTurn = isLite ? 26 : isBalanced ? 34 : 42;
  const total = turns * pointsPerTurn;
  const height = 8;
  const radius = 1.35;
  function makeHelixPoints(phase) {
    const points = [];
    for (let i = 0; i <= total; i += 1) {
      const t = i / total;
      const angle = t * turns * Math.PI * 2 + phase;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, (t - .5) * height, Math.sin(angle) * radius));
    }
    return points;
  }

  const mat1 = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    emissive: 0x664400,
    emissiveIntensity: 0.5,
    metalness: 1.0,
    roughness: 0.12,
    transparent: true,
    opacity: .95
  });
  const mat2 = new THREE.MeshStandardMaterial({
    color: 0xFFC125,
    emissive: 0x553300,
    emissiveIntensity: 0.4,
    metalness: 1.0,
    roughness: 0.10,
    transparent: true,
    opacity: .85
  });
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xFFD700,
    transparent: true,
    opacity: .20,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const radialSegments = isLite ? 8 : 12;
  const helix1 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(makeHelixPoints(0)), total, 0.13, radialSegments, false), mat1);
  const helix2 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(makeHelixPoints(Math.PI)), total, 0.095, radialSegments, false), mat2);
  const helixGlow = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(makeHelixPoints(0.18)), total, 0.19, isLite ? 6 : 10, false), glowMat);

  const rungGroup = new THREE.Group();
  const rungCount = turns * (isLite ? 4 : 6);
  const rungMat = new THREE.MeshStandardMaterial({
    color: 0xFFE066,
    emissive: 0x442200,
    emissiveIntensity: 0.3,
    metalness: 1.0,
    roughness: 0.15,
    transparent: true,
    opacity: .5
  });
  for (let i = 0; i <= rungCount; i += 1) {
    const t = i / rungCount;
    const angle = t * turns * Math.PI * 2;
    const y = (t - .5) * height;
    const p1 = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    const p2 = new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius);
    rungGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(p1, p2), 1, 0.022, isLite ? 4 : 6, false), rungMat));
  }

  const helixGroup = new THREE.Group();
  helixGroup.add(helixGlow, helix1, helix2, rungGroup);
  scene.add(helixGroup);

  let currentRotY = 0;
  let currentX = 0;
  let currentY = 0;
  let isVisible = true;

  const observer = new IntersectionObserver((entries) => {
    isVisible = entries[0].isIntersecting;
  }, { threshold: 0.01 });
  observer.observe(canvas);

  visualScheduler.register('helix', {
    frameInterval: isLite ? 34 : isBalanced ? 24 : 16,
    shouldRun(schedulerState) {
      return isVisible && schedulerState.activeZone !== 'dashboards' && schedulerState.activeZone !== 'about';
    },
    update(_delta, schedulerState) {
      const time = schedulerState.now * .001;
      const progress = schedulerState.scrollProgress;

      let targetCamX;
      let targetCamY;
      let targetScale;
      let targetOpacity;

      if (progress < 0.15) {
        targetCamX = 0; targetCamY = 0; targetScale = 1; targetOpacity = 1;
      } else if (progress < 0.45) {
        const p = (progress - 0.15) / 0.30;
        targetCamX = p * 2.8; targetCamY = -p * 0.4;
        targetScale = 1 - p * 0.35; targetOpacity = 1 - p * 0.25;
      } else if (progress < 0.75) {
        const p = (progress - 0.45) / 0.30;
        targetCamX = 2.8 + p * 0.4; targetCamY = -0.4 - p * 0.3;
        targetScale = 0.65 - p * 0.05; targetOpacity = 0.75 - p * 0.1;
      } else {
        const p = (progress - 0.75) / 0.25;
        targetCamX = 3.2 - p * 3.5; targetCamY = -0.7 + p * 0.4;
        targetScale = 0.60 + p * 0.1; targetOpacity = 0.65 - p * 0.5;
      }

      currentRotY += (0 - currentRotY) * .04;
      currentX += (targetCamX - currentX) * 0.06;
      currentY += (targetCamY - currentY) * 0.06;

      helixGroup.position.x = currentX;
      helixGroup.position.y = currentY;
      helixGroup.scale.setScalar(helixGroup.scale.x + (targetScale - helixGroup.scale.x) * 0.06);

      const helixBoost = (window._particleHooks && window._particleHooks.helixBoost) || 0;
      helixGroup.rotation.y = time * (0.28 + helixBoost) + currentRotY;

      const breathe = 1 + Math.sin(time * 0.5) * 0.015;
      helix1.scale.setScalar(breathe);
      helix2.scale.setScalar(breathe);

      const opacity = mat1.opacity + (targetOpacity * 0.55 - mat1.opacity) * 0.06;
      mat1.opacity = Math.min(0.94, opacity * 1.26);
      mat2.opacity = Math.min(0.82, opacity * 0.96);
      glowMat.opacity = Math.min(0.22, opacity * 0.22);
      rungMat.opacity = Math.min(0.48, opacity * 0.58);
    },
    render() {
      renderer.render(scene, camera);
    },
    destroy() {
      observer.disconnect();
      renderer.dispose();
    }
  });
}
