// UI systems — scroll reveal, dashboard tabs, particle canvas, helix
export function initUI() {
  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal, .reveal-opacity');
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => revealObs.observe(el));

  // Dashboard tabs
  document.querySelectorAll('.embed-shell').forEach(shell => {
    const tabs = shell.querySelectorAll('.embed-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
        tab.classList.add('active');
        tab.setAttribute('aria-selected','true');
      });
    });
  });
}
