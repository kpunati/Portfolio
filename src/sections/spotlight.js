// src/sections/spotlight.js — glow-card spotlight effect
// Fixes: cache card list at init, cache rects, refresh only on resize/scroll,
// throttle pointer updates with a rAF flag to prevent per-event layout thrash.

export function initSpotlight() {
  let cards = [];
  let rects = [];
  let rafPending = false;
  let pendingX = 0;
  let pendingY = 0;

  function cacheCards() {
    cards = Array.from(document.querySelectorAll('.glow-card'));
    cacheRects();
  }

  function cacheRects() {
    rects = cards.map(card => card.getBoundingClientRect());
    if (pendingX || pendingY) applySpotlight();
  }

  function applySpotlight() {
    rafPending = false;
    const x = pendingX;
    const y = pendingY;
    cards.forEach((card, i) => {
      const rect = rects[i];
      if (!rect) return;
      card.style.setProperty('--x', (x - rect.left).toFixed(1));
      card.style.setProperty('--xp', ((x - rect.left) / rect.width).toFixed(3));
      card.style.setProperty('--y', (y - rect.top).toFixed(1));
      card.style.setProperty('--yp', ((y - rect.top) / rect.height).toFixed(3));
    });
  }

  const onPointerMove = (e) => {
    pendingX = e.clientX;
    pendingY = e.clientY;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(applySpotlight);
    }
  };

  let rectRefreshPending = false;
  const requestRectRefresh = () => {
    if (rectRefreshPending) return;
    rectRefreshPending = true;
    requestAnimationFrame(() => {
      rectRefreshPending = false;
      cacheRects();
    });
  };

  document.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('resize', requestRectRefresh, { passive: true });
  window.addEventListener('scroll', requestRectRefresh, { passive: true });

  cacheCards();

  return () => {
    document.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', requestRectRefresh);
    window.removeEventListener('scroll', requestRectRefresh);
  };
}
