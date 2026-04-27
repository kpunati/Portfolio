export function initSpotlight() {
  const syncPointer = (e) => {
    const { clientX: x, clientY: y } = e;
    const cards = document.querySelectorAll('.glow-card');
    
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cardX = x - rect.left;
      const cardY = y - rect.top;
      
      card.style.setProperty('--x', cardX.toFixed(2));
      card.style.setProperty('--xp', (cardX / rect.width).toFixed(2));
      card.style.setProperty('--y', cardY.toFixed(2));
      card.style.setProperty('--yp', (cardY / rect.height).toFixed(2));
    });
  };

  document.addEventListener('pointermove', syncPointer);
  
  // Expose a way to cleanup if needed (though not strictly necessary for this SPA)
  return () => {
    document.removeEventListener('pointermove', syncPointer);
  };
}
