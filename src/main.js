// src/main.js — Portfolio orchestrator
import { markup } from './markup.js';
import './styles/main.css';
import { initGlobe } from './scene/globe.js';
import { initParticles } from './sections/particles.js';
import { initMomentum } from './sections/momentum.js';
import { initLayers } from './sections/layers.js';

document.getElementById('app').innerHTML = markup;

function boot() {
  initGlobe();
  initParticles();
  initMomentum();
  initLayers();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
