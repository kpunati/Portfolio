import './styles/main.css';
import { initUI } from './sections/ui.js';
import { initMomentum } from './sections/momentum.js';
import { initGlobe } from './scene/globe.js';

// Mount markup
import markup from './markup.js';
document.getElementById('app').innerHTML = markup;

// Boot all systems after DOM is ready
initUI();
initMomentum();
initGlobe();
