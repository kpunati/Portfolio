// src/scene/globe.js — Three.js Live Earth Dashboard
// Requires THREE loaded globally via CDN before this module runs.
// Includes: ISS live position, earthquake feed, wildfire data, WebGL globe.

export function initGlobe() {
  if (typeof THREE === 'undefined') {
    console.warn('globe.js: THREE not loaded, retrying in 300ms');
    setTimeout(initGlobe, 300);
    return;
  }
