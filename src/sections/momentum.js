// Scroll momentum systems — journey rail, aurora bleed, transition zone, globe parallax
export function initMomentum() {
  let SY = 0;
  window.addEventListener('scroll', () => { SY = window.scrollY; }, { passive: true });

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  const rail = document.getElementById('journey-rail');
  const sections = ['hero','projects','dashboards','about'];
  const railDots = {
    hero:       document.getElementById('rail-hero'),
    projects:   document.getElementById('rail-projects'),
    dashboards: document.getElementById('rail-dashboards'),
    about:      document.getElementById('rail-about')
  };
  const railLines = [
    document.getElementById('rail-line-1'),
    document.getElementById('rail-line-2'),
    document.getElementById('rail-line-3')
  ];

  document.querySelectorAll('.rail-node').forEach(node => {
    node.addEventListener('click', () => {
      const el = document.getElementById(node.getAttribute('data-target'));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  function updateRail() {
    if (!rail) return;
    if (SY > 80) rail.classList.add('visible');
    else rail.classList.remove('visible');
    const VH = window.innerHeight;
    let activeIdx = 0;
    sections.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el && SY + VH * 0.4 >= el.getBoundingClientRect().top + SY) activeIdx = i;
    });
    sections.forEach((id, i) => {
      const dot = railDots[id];
      if (dot) { if (i === activeIdx) dot.classList.add('active'); else dot.classList.remove('active'); }
    });
    railLines.forEach((line, i) => {
      if (line) { if (i < activeIdx) line.classList.add('active'); else line.classList.remove('active'); }
    });
  }

  const globeWrap = document.getElementById('globe-parallax-wrap');
  function updateGlobeParallax() {
    if (!globeWrap) return;
    const rect = globeWrap.getBoundingClientRect();
    const progress = clamp((window.innerHeight - rect.top) / window.innerHeight, 0, 1);
    globeWrap.style.transform = 'translateY(' + ((1 - progress) * 80) + 'px)';
  }

  function loop() {
    requestAnimationFrame(loop);
    updateRail();
    updateGlobeParallax();
  }
  requestAnimationFrame(loop);
}
