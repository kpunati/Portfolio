const defaultState = {
  now: 0,
  delta: 0,
  visible: typeof document === 'undefined' ? true : !document.hidden,
  prefersReducedMotion: false,
  visualQuality: 'balanced',
  scrollY: 0,
  scrollProgress: 0,
  pointer: { x: 0, y: 0 },
  sections: {
    hero: 1,
    projects: 0,
    dashboards: 0,
    scan: 0,
    globe: 0,
    about: 0
  },
  activeZone: 'hero'
};

const systems = new Map();
const state = { ...defaultState, sections: { ...defaultState.sections }, pointer: { ...defaultState.pointer } };
let rafId = 0;
let lastNow = 0;
let running = false;

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function qualityFrameInterval(system) {
  if (state.prefersReducedMotion) return Math.max(system.frameInterval || 1000, 1000);
  if (typeof system.frameInterval === 'number') return system.frameInterval;
  if (state.visualQuality === 'lite') return 34;
  if (state.visualQuality === 'balanced') return 24;
  return 16;
}

function computeActiveZone() {
  const { projects, globe, about } = state.sections;
  if (about > 0.22) return 'about';
  if (globe > 0.18) return 'dashboards';
  if (projects > 0.12) return 'projects';
  return 'hero';
}

function shouldRun(system) {
  if (system.paused || system.destroyed) return false;
  if (system.requiresVisible !== false && !state.visible) return false;
  if (typeof system.shouldRun === 'function') return system.shouldRun(state) !== false;
  return true;
}

function frame(now) {
  rafId = window.requestAnimationFrame(frame);
  if (!running) return;

  const delta = lastNow ? Math.min(80, now - lastNow) : 16.67;
  lastNow = now;
  state.now = now;
  state.delta = delta;
  state.activeZone = computeActiveZone();
  document.documentElement.dataset.activeZone = state.activeZone;

  systems.forEach((system) => {
    if (!shouldRun(system)) return;
    const interval = qualityFrameInterval(system);
    if (now - system.lastFrame < interval) return;
    const systemDelta = system.lastFrame ? now - system.lastFrame : delta;
    system.lastFrame = now;
    if (typeof system.update === 'function') system.update(systemDelta, state);
    if (typeof system.render === 'function') system.render(state);
  });
}

function ensureRunning() {
  if (running || typeof window === 'undefined') return;
  running = true;
  lastNow = 0;
  rafId = window.requestAnimationFrame(frame);
}

export const visualScheduler = {
  state,
  register(name, definition) {
    const existing = systems.get(name);
    if (existing && typeof existing.destroy === 'function') existing.destroy();
    const system = {
      name,
      priority: 0,
      frameInterval: undefined,
      requiresVisible: true,
      lastFrame: 0,
      paused: false,
      destroyed: false,
      ...definition
    };
    systems.set(name, system);
    ensureRunning();
    return {
      pause() { system.paused = true; },
      resume() { system.paused = false; },
      destroy() {
        system.destroyed = true;
        systems.delete(name);
        if (typeof system.destroy === 'function') system.destroy();
      }
    };
  },
  unregister(name) {
    const system = systems.get(name);
    if (!system) return;
    systems.delete(name);
    if (typeof system.destroy === 'function') system.destroy();
  },
  configure({ prefersReducedMotion, visualQuality } = {}) {
    if (typeof prefersReducedMotion === 'boolean') state.prefersReducedMotion = prefersReducedMotion;
    if (visualQuality) state.visualQuality = visualQuality;
  },
  setScroll(scrollY, scrollProgress) {
    state.scrollY = scrollY;
    if (Number.isFinite(scrollProgress)) state.scrollProgress = clamp(scrollProgress);
  },
  setPointer(x, y) {
    state.pointer.x = clamp(x, -1, 1);
    state.pointer.y = clamp(y, -1, 1);
  },
  setSectionProgress(name, value) {
    if (!name) return;
    state.sections[name] = clamp(value);
    state.activeZone = computeActiveZone();
  },
  pause(name) {
    const system = systems.get(name);
    if (system) system.paused = true;
  },
  resume(name) {
    const system = systems.get(name);
    if (system) system.paused = false;
  },
  snapshot() {
    return {
      ...state,
      sections: { ...state.sections },
      pointer: { ...state.pointer },
      systems: Array.from(systems.keys())
    };
  }
};

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    state.visible = !document.hidden;
  });
}

if (typeof window !== 'undefined') {
  window.__portfolioVisualScheduler = visualScheduler;
}
