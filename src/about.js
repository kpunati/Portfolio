import './styles/main.css';
import './styles/about.css';

const navMarkup = `
<nav class="nav" role="navigation" aria-label="Primary">
  <a href="/" class="nav-logo" aria-label="Karthik Punati Home">
    <svg class="nav-logo-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="rgba(212,166,82,0.1)" stroke="rgba(212,166,82,0.3)" stroke-width="1"/>
      <line x1="10" y1="8" x2="10" y2="24" stroke="#D4A652" stroke-width="2" stroke-linecap="round"/>
      <polyline points="10,16 18,8" stroke="#D4A652" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="10,16 20,24" stroke="#D4A652" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="24" cy="10" r="2" fill="#D4A652" opacity="0.7"/>
    </svg>
    <span class="nav-logo-text">KP</span>
  </a>
  <ul class="nav-links" role="list">
    <li><a href="/#projects">Projects</a></li>
    <li><a href="/#dashboards">Dashboards</a></li>
    <li><a href="/about.html" style="color:var(--color-primary)">About</a></li>
  </ul>
</nav>
`;

const aboutMarkup = `
<section class="about-hero">
  <div class="about-page-container">
    
    <!-- LEFT COLUMN: Information Cards -->
    <div class="about-content-left">
      <h1 class="hero-name" style="margin-bottom: 0.5rem;">Behind the<br><span>Signals</span></h1>
      
      <!-- Bio Card -->
      <div class="glow-card about-detail-card" data-glow data-color="gold">
        <div class="glow-inner" data-glow></div>
        <p class="about-bio">
          <strong>Data analyst and AI builder</strong> based in the Bay Area. I work across the full stack of data — from designing pipelines and writing models to shipping the interfaces that make insights usable.
        </p>
        <p class="about-bio">
          My background spans financial data analysis, NLP, and applied AI. I build tools that are genuinely useful — not just technically impressive. Currently focused on real-time data products and AI-augmented workflows.
        </p>
      </div>

      <!-- Skills Card -->
      <div class="glow-card about-detail-card" data-glow data-color="blue">
        <div class="glow-inner" data-glow></div>
        <h3 class="card-title">Technical Arsenal</h3>
        <div class="skills-grid">
          <span class="chip chip-gold">Python</span>
          <span class="chip chip-gold">SQL</span>
          <span class="chip chip-gold">Power BI</span>
          <span class="chip chip-neutral">Pandas</span>
          <span class="chip chip-neutral">scikit-learn</span>
          <span class="chip chip-neutral">FastAPI</span>
          <span class="chip chip-plum">LLMs</span>
          <span class="chip chip-plum">NLP</span>
          <span class="chip chip-neutral">Three.js</span>
          <span class="chip chip-neutral">React</span>
          <span class="chip chip-neutral">Vercel</span>
        </div>
      </div>

      <!-- KPIs Grid -->
      <div class="about-kpi-grid">
        <div class="about-kpi glow-card" data-glow data-color="gold">
          <div class="glow-inner" data-glow></div>
          <div class="about-kpi-val">3<span class="accent">+</span></div>
          <div class="about-kpi-label">Years Analysing Data</div>
        </div>
        <div class="about-kpi glow-card" data-glow data-color="purple">
          <div class="glow-inner" data-glow></div>
          <div class="about-kpi-val">10<span class="accent">+</span></div>
          <div class="about-kpi-label">Projects Shipped</div>
        </div>
        <div class="about-kpi glow-card" data-glow data-color="green">
          <div class="glow-inner" data-glow></div>
          <div class="about-kpi-val"><span class="accent">&#8734;</span></div>
          <div class="about-kpi-label">Curiosity</div>
        </div>
        <div class="about-kpi glow-card" data-glow data-color="gold">
          <div class="glow-inner" data-glow></div>
          <div class="about-kpi-val">0<span class="accent">ms</span></div>
          <div class="about-kpi-label">Time to Start Building</div>
        </div>
      </div>
    </div>

    <!-- RIGHT COLUMN: Interactive Portrait -->
    <div class="about-portrait-right">
      <div class="reveal-wrapper" id="lando-reveal">
        <!-- Casual Image (Base) -->
        <img src="/casual.png" alt="Karthik Casual" class="reveal-image image-casual" onerror="this.src='https://via.placeholder.com/600x800/1a1a1a/D4A652?text=casual.png+Missing'" />
        
        <!-- Racing Suit Image (Overlay) -->
        <img src="/racing.png" alt="Karthik Racing" class="reveal-image image-racing" onerror="this.src='https://via.placeholder.com/600x800/1a1a1a/5EEAD4?text=racing.png+Missing'" />
        
        <!-- Slider Divider Line -->
        <div class="reveal-divider"></div>
        
        <div class="reveal-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px; vertical-align: -2px;">
            <path d="M5 12h14M12 5l-7 7 7 7"/>
            <path d="M19 12l-7-7v14z" stroke="none" fill="currentColor"/>
          </svg>
          Slide to Reveal
        </div>
      </div>
    </div>

  </div>
</section>
`;

// Inject into the DOM
document.getElementById('app').innerHTML = navMarkup + aboutMarkup;

// Initialize the Lando Norris Hover Reveal
const wrapper = document.getElementById('lando-reveal');
if (wrapper) {
  wrapper.addEventListener('mousemove', (e) => {
    const rect = wrapper.getBoundingClientRect();
    const xPos = e.clientX - rect.left;
    const xPercent = (xPos / rect.width) * 100;
    
    wrapper.style.setProperty('--x', \`\${xPercent}%\`);
  });

  // Snap back to center when cursor leaves
  wrapper.addEventListener('mouseleave', () => {
    wrapper.style.setProperty('--x', '50%');
  });
}

// Initialize Glow Cards (Spotlight Mouse Tracking)
document.querySelectorAll('.glow-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--x', \`\${x}px\`);
    card.style.setProperty('--y', \`\${y}px\`);
  });
});
