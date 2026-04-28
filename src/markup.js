// src/markup.js — Full portfolio HTML structure
export const markup = `
<!-- ─── LIQUID GLASS LOADER ────────────────────────────────────────── -->
<div id="liquid-loader">
  <div class="loader-liquid-wrap">
    <div class="loader-blob"></div>
    <div class="loader-blob"></div>
    <div class="loader-blob"></div>
  </div>
  <div class="loader-text">Initializing Systems</div>
  <svg class="loader-svg">
    <defs>
      <filter id="goo">
        <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
    </defs>
  </svg>
</div>

<!-- ─── GLOBAL BACKGROUND CANVASES (fixed, full-page) ─────── -->
<!-- ─── JOURNEY RAIL ────────────────────────────────────────── -->
<nav class="journey-rail" id="journey-rail" aria-label="Page sections">
  <div class="rail-node" data-target="hero">
    <div class="rail-dot active" id="rail-hero"></div>
    <span class="rail-tooltip">Hero</span>
    <div class="rail-line active" id="rail-line-1"></div>
  </div>
  <div class="rail-node" data-target="projects">
    <div class="rail-dot" id="rail-projects"></div>
    <span class="rail-tooltip">Projects</span>
    <div class="rail-line" id="rail-line-2"></div>
  </div>
  <div class="rail-node" data-target="dashboards">
    <div class="rail-dot globe-node" id="rail-dashboards"></div>
    <span class="rail-tooltip">Live Globe</span>
    <div class="rail-line" id="rail-line-3"></div>
  </div>
  <div class="rail-node" data-target="about">
    <div class="rail-dot" id="rail-about"></div>
    <span class="rail-tooltip">About</span>
  </div>
</nav>

<div class="command-strip" id="command-strip" aria-label="Portfolio quick actions">
  <div class="command-status" aria-hidden="true">
    <span class="command-dot"></span>
    <span id="command-section">Hero</span>
  </div>
  <div class="command-progress" aria-hidden="true"><span id="command-progress-bar"></span></div>
  <div class="command-actions">
    <a href="#projects" aria-label="Jump to projects">Projects</a>
    <a href="#dashboards" aria-label="Jump to live dashboards">Dashboards</a>
    <button type="button" data-contact-open aria-label="Open contact form">Contact</button>
  </div>
</div>

<canvas id="terrain-canvas" aria-hidden="true" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;"></canvas>
<canvas id="hero-canvas"  aria-hidden="true" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;"></canvas>
<canvas id="helix-canvas" aria-hidden="true" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;"></canvas>

<!-- SKIP LINK -->
<a href="#main-content" class="sr-only" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0">Skip to content</a>

<!-- NAV -->
<nav class="nav" role="navigation" aria-label="Primary">
  <a href="#hero" class="nav-logo" aria-label="Karthik Punati Home">
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
    <li><a href="#projects">Projects</a></li>
    <li><a href="#dashboards">Dashboards</a></li>
    <li><a href="#about">About</a></li>
  </ul>
  <button type="button" class="btn nav-cta nav-cta-desktop" data-contact-open aria-label="Open contact form">Get in Touch</button>
  <button class="nav-mobile-toggle" aria-label="Open menu" aria-expanded="false">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  </button>
</nav>

<!-- HERO -->
<section class="hero" id="hero" aria-label="Hero">
  <div class="hero-grain" aria-hidden="true"></div>
  <div class="hero-vignette" aria-hidden="true"></div>
  <div class="hero-signal-lines" aria-hidden="true">
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <polyline points="800,80 870,72 940,88 1010,62 1080,68 1150,52 1220,58 1290,44 1360,50 1440,46" fill="none" stroke="#D4A652" stroke-width="1.2" opacity="0.7"/>
      <polyline points="800,160 870,152 940,168 1010,142 1080,148 1150,132 1220,140 1290,122 1360,130 1440,126" fill="none" stroke="#D4A652" stroke-width="0.8" opacity="0.45"/>
      <line x1="1000" y1="0" x2="1000" y2="900" stroke="#D4A652" stroke-width="0.5" opacity="0.15"/>
      <line x1="1200" y1="0" x2="1200" y2="900" stroke="#D4A652" stroke-width="0.4" opacity="0.1"/>
      <line x1="0" y1="450" x2="1440" y2="450" stroke="#D4A652" stroke-width="0.5" opacity="0.1"/>
    </svg>
  </div>
  <div class="hero-content" id="main-content">
    <div class="hero-left">
      <div class="hero-eyebrow" aria-label="Role: Data Analyst &amp; AI Builder"></div>
      <h1 class="hero-name">Karthik<br><span>Punati</span></h1>
      <p class="hero-tagline">Turning raw signals into real products — from financial sentiment models to AI-powered tools people actually use.</p>
      <div class="hero-cta-row">
        <a href="#projects" class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          View Projects
        </a>
        <a href="#dashboards" class="btn btn-ghost">Open Dashboards</a>
      </div>
    </div>
    <div class="hero-right" aria-hidden="true">
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-val"><span class="accent" data-count="3">3</span></div>
          <div class="hero-stat-label">Live Projects</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-val"><span data-count="50">50</span><span class="accent">K</span></div>
          <div class="hero-stat-label">Data Points</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-val"><span data-count="100">100</span><span class="accent">%</span></div>
          <div class="hero-stat-label">Automated</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-val" style="font-size:clamp(1.1rem,2vw,1.6rem);font-weight:600;letter-spacing:0">
            <span style="color:var(--color-primary)">Real-time</span>
          </div>
          <div class="hero-stat-label">Sentiment Feed</div>
        </div>
      </div>
    </div>
  </div>
  <div class="hero-scroll-hint" aria-hidden="true">
    <span>Scroll</span>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 5v14M5 12l7 7 7-7"/>
    </svg>
  </div>
</section>

<!-- PROJECTS -->
<section class="section" id="projects" aria-labelledby="projects-heading">
  <div class="container">
    <p class="section-eyebrow reveal">What I&apos;ve Built</p>
    <h2 class="section-heading reveal reveal-delay-1" id="projects-heading">Projects</h2>
    <p class="section-sub reveal reveal-delay-2">Each project bridges data and product — built end-to-end, from raw pipeline to polished interface.</p>
    <div class="project-scroll-stage">
      <div class="project-stage-copy reveal reveal-delay-3" aria-hidden="true">
        <div class="project-stage-kicker">Project Systems</div>
        <div class="project-stage-title">Three working builds, each tied to a live data or automation problem.</div>
        <div class="project-stage-steps">
          <span><b>01</b> Signal ingestion</span>
          <span><b>02</b> Model reasoning</span>
          <span><b>03</b> Automated distribution</span>
        </div>
      </div>
    <div class="projects-grid">

      <!-- Stock Sentiment -->
      <a href="#dashboards" class="project-card glow-card reveal reveal-delay-1" data-project-index="0" data-glow data-color="gold" aria-label="Stock Sentiment Analysis — view dashboard">
        <div class="glow-inner" data-glow></div>
        <div class="project-card-header">
          <div class="project-card-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <div class="project-card-arrow" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </div>
        </div>
        <p class="project-card-eyebrow">BI Dashboard</p>
        <h3 class="project-card-title">Stock Sentiment Analysis</h3>
        <p class="project-card-desc">Real-time NLP pipeline that aggregates financial news and social signals to produce sentiment scores for equities. Visualised in an interactive dashboard with trend overlays.</p>
        <div class="project-card-status" aria-hidden="true">
          <span>Market signal</span><b>Dashboard-linked</b>
        </div>
        <div class="project-telemetry telemetry-market" aria-hidden="true">
          <div class="telemetry-topline"><span>Signal Feed</span><span>+18.4%</span></div>
          <div class="market-line"></div>
          <div class="market-bars">
            <span style="--h:34%"></span><span style="--h:58%"></span><span style="--h:42%"></span><span style="--h:76%"></span><span style="--h:61%"></span><span style="--h:88%"></span><span style="--h:54%"></span>
          </div>
        </div>
        <div class="project-card-chips">
          <span class="chip chip-gold">Python</span>
          <span class="chip chip-gold">NLP</span>
          <span class="chip chip-neutral">Pandas</span>
          <span class="chip chip-neutral">Power BI</span>
        </div>
      </a>

      <!-- Neural Kitchen -->
      <a href="https://neuralkitchen.vercel.app" class="project-card glow-card reveal reveal-delay-2" data-project-index="1" data-glow data-color="purple" target="_blank" rel="noopener noreferrer" aria-label="Neural Kitchen">
        <div class="glow-inner" data-glow></div>
        <div class="project-card-header">
          <div class="project-card-icon" style="background:var(--color-secondary-hl);border-color:rgba(122,90,143,0.2);color:#B8A0CC" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
          </div>
          <div class="project-card-arrow" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </div>
        </div>
        <p class="project-card-eyebrow" style="color:#B8A0CC">AI App</p>
        <h3 class="project-card-title">Neural Kitchen</h3>
        <p class="project-card-desc">AI-powered web app that generates recipes from whatever ingredients you have on hand. Combines a language model with a curated ingredient graph for relevant, practical results.</p>
        <div class="project-card-status" aria-hidden="true">
          <span>Model workflow</span><b>External live app</b>
        </div>
        <div class="project-telemetry telemetry-network" aria-hidden="true">
          <div class="telemetry-topline"><span>Ingredient Graph</span><span>LLM</span></div>
          <div class="network-node n1"></div><div class="network-node n2"></div><div class="network-node n3"></div><div class="network-node n4"></div>
          <div class="network-line l1"></div><div class="network-line l2"></div><div class="network-line l3"></div>
        </div>
        <div class="project-card-chips">
          <span class="chip chip-plum">LLM</span>
          <span class="chip chip-plum">AI</span>
          <span class="chip chip-neutral">Python</span>
          <span class="chip chip-neutral">API</span>
        </div>
      </a>

      <!-- AI Newsletter -->
      <a href="https://aiaware.beehiiv.com" class="project-card glow-card reveal reveal-delay-3" data-project-index="2" data-glow data-color="green" target="_blank" rel="noopener noreferrer" aria-label="AI Aware Newsletter">
        <div class="glow-inner" data-glow></div>
        <div class="project-card-header">
          <div class="project-card-icon" style="background:rgba(77,170,116,0.1);border-color:rgba(77,170,116,0.2);color:var(--color-success)" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div class="project-card-arrow" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </div>
        </div>
        <p class="project-card-eyebrow" style="color:var(--color-success)">Automation</p>
        <h3 class="project-card-title">AI Aware Newsletter</h3>
        <p class="project-card-desc">Fully automated newsletter pipeline — scrapes, summarises, and formats daily AI research digests using LLMs, then distributes on schedule with zero manual intervention.</p>
        <div class="project-card-status" aria-hidden="true">
          <span>Distribution loop</span><b>Scheduled system</b>
        </div>
        <div class="project-telemetry telemetry-feed" aria-hidden="true">
          <div class="telemetry-topline"><span>Daily Pipeline</span><span>06:00</span></div>
          <div class="feed-row"><span></span><i style="--w:74%"></i></div>
          <div class="feed-row"><span></span><i style="--w:52%"></i></div>
          <div class="feed-row"><span></span><i style="--w:86%"></i></div>
        </div>
        <div class="project-card-chips">
          <span class="chip chip-success">Automation</span>
          <span class="chip chip-plum">LLM</span>
          <span class="chip chip-neutral">Python</span>
          <span class="chip chip-neutral">Scheduling</span>
        </div>
      </a>

    </div>
    </div>
    <div class="aurora-bleed" id="aurora-bleed"></div>
  </div>
</section>

<!-- DASHBOARDS -->
<section class="section dashboards-section" id="dashboards" aria-labelledby="dashboards-heading">
  <div class="container">
    <p class="section-eyebrow reveal">Live Work</p>
    <h2 class="section-heading reveal reveal-delay-1" id="dashboards-heading">BI Dashboards</h2>
    <p class="section-sub reveal reveal-delay-2">Live dashboards pulling real-time data from public APIs. Earthquakes, wildfires, and ISS tracking — built with Three.js WebGL, zero paid services.</p>
    <div class="dashboards-orbit reveal reveal-delay-3" aria-hidden="true">
      <span>Terrain signal</span><span>Global telemetry</span><span>Live dashboard</span>
    </div>
    <div class="globe-reveal-strip reveal reveal-delay-4" aria-hidden="true">
      <span><b>Live</b> Public APIs</span>
      <span><b>3D</b> Earth Layer</span>
      <span><b>4</b> Signal Types</span>
    </div>
    <div class="dashboards-grid">

      <!-- Globe Dashboard -->
      <div class="globe-parallax-wrap" id="globe-parallax-wrap">
      <div class="embed-shell glow-card reveal" id="globe-embed-shell" data-glow data-color="blue">
        <div class="glow-inner" data-glow></div>
        <div class="embed-shell-header">
          <div class="embed-shell-dots" aria-hidden="true">
            <div class="embed-shell-dot"></div><div class="embed-shell-dot"></div><div class="embed-shell-dot"></div>
          </div>
          <span class="embed-shell-title">Live Earth Intelligence</span>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <span class="chip chip-gold" style="display:inline-flex;align-items:center;gap:0.35rem">
              <span style="width:6px;height:6px;border-radius:50%;background:#4DAA74;animation:pulse-dot 1.8s infinite;display:inline-block"></span>Live
            </span>
          </div>
        </div>
        <div class="globe-wrap">
          <div class="globe-left">
            <canvas id="globe-canvas-inner"></canvas>
            <div class="globe-overlay-pills">
              <div class="g-pill" id="gp-eq"><span class="gd" style="background:#E040FB"></span><span id="gc-eq-count">--</span> earthquakes 24h</div>
              <div class="g-pill" id="gp-fire"><span class="gd" style="background:#E8763A"></span><span id="gc-fire-count">--</span> active fires</div>
              <div class="g-pill" id="gp-iss"><span class="gd" style="background:#FF2244;animation:pulse-dot 1.8s infinite"></span>ISS <span id="gc-iss-pos" style="margin-left:.2rem">--</span></div>
            </div>
            <div class="g-tooltip" id="g-tooltip"><b id="g-tt-title"></b><span id="g-tt-sub"></span></div>
            <div class="g-bar">
              <div class="g-bar-stats">
                <div class="g-bs"><span class="g-bs-v" id="gb-eq">--</span><span class="g-bs-l">Quakes 24h</span></div>
                <div class="g-bs"><span class="g-bs-v" id="gb-mag">--</span><span class="g-bs-l">Max Mag</span></div>
                <div class="g-bs"><span class="g-bs-v" id="gb-fire">--</span><span class="g-bs-l">Active Fires</span></div>
                <div class="g-bs"><span class="g-bs-v" id="gb-alt">--</span><span class="g-bs-l">ISS Altitude</span></div>
              </div>
              <div class="g-ts">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Updated <span id="gc-updated">--</span>
              </div>
            </div>
            <div class="g-loading" id="g-loading"><div class="g-spinner"></div><p>Loading globe&hellip;</p></div>
          </div>
          <div class="globe-right">
            <div class="gc">
              <div class="gc-eye">&#128760; ISS Live Position</div>
              <div class="gc-grid2">
                <div class="gc-kv"><span class="gc-label">Latitude</span><span class="gc-val" id="gc-lat">--<span class="acc">&deg;</span></span></div>
                <div class="gc-kv"><span class="gc-label">Longitude</span><span class="gc-val" id="gc-lon">--<span class="acc">&deg;</span></span></div>
              </div>
              <div class="gc-meta">
                <div class="gc-chip"><span class="gc-chip-l">Altitude</span><span class="gc-chip-v" id="gc-alt2">--</span></div>
                <div class="gc-chip"><span class="gc-chip-l">Speed</span><span class="gc-chip-v" id="gc-spd">--</span></div>
                <div class="gc-chip"><span class="gc-chip-l">Visibility</span><span class="gc-chip-v" id="gc-vis">--</span></div>
              </div>
            </div>
            <div class="gc">
              <div class="gc-eye">&#127757; Recent Earthquakes <span style="display:inline-flex;align-items:center;padding:.12rem .45rem;background:rgba(212,166,82,.12);color:#D4A652;border:1px solid rgba(212,166,82,.25);border-radius:9999px;font-size:.58rem;font-weight:600;margin-left:.35rem" id="gc-eq-badge">--</span></div>
              <p style="font-size:.6rem;color:#6B6257;margin-bottom:.4rem;font-family:var(--font-body)">Scroll to browse latest events</p>
              <div class="eq-scroll" id="gc-eq-list"><div style="font-size:.68rem;color:#6B6257;font-family:var(--font-body)">Loading&hellip;</div></div>
            </div>
            <div class="gc">
              <div class="gc-eye">&#128293; Active Wildfires <span style="font-size:.6rem;color:#6B6257;font-weight:400;margin-left:.3rem">Global</span></div>
              <div class="fire-g">
                <div class="fire-kv"><div class="fire-val" id="gc-ftotal">--</div><div class="fire-lbl">Total Active</div></div>
                <div class="fire-kv"><div class="fire-val" id="gc-fbright" style="color:#D4A652">--</div><div class="fire-lbl">Avg Brightness</div></div>
                <div class="fire-kv"><div class="fire-val" id="gc-fna" style="color:#E8763A">--</div><div class="fire-lbl">N. America</div></div>
                <div class="fire-kv"><div class="fire-val" id="gc-fsa" style="color:#E8763A">--</div><div class="fire-lbl">S. America</div></div>
                <div class="fire-kv"><div class="fire-val" id="gc-faf" style="color:#E8763A">--</div><div class="fire-lbl">Africa</div></div>
                <div class="fire-kv"><div class="fire-val" id="gc-fasia" style="color:#E8763A">--</div><div class="fire-lbl">Asia &amp; Oceania</div></div>
              </div>
              <p style="font-size:.6rem;color:#6B6257;margin-top:.5rem;font-family:var(--font-body)">Source: NASA FIRMS VIIRS Global 24h &middot; Top 600 hotspots by brightness</p>
            </div>
          </div>
        </div>
      </div>
      </div>

    </div>
  </div>
</section>

<!-- ABOUT -->
<section class="section about-cooldown" id="about" aria-labelledby="about-heading">
  <div class="container-default">
    <p class="section-eyebrow reveal">Background</p>
    <h2 class="section-heading reveal reveal-delay-1" id="about-heading">About Me</h2>
    <div class="about-grid">
      <div>
        <p class="about-bio reveal reveal-delay-2">
          <strong>Data analyst and AI builder</strong> based in the Bay Area. I work across the full stack of data — from designing pipelines and writing models to shipping the interfaces that make insights usable.
        </p>
        <p class="about-bio reveal reveal-delay-3">
          My background spans financial data analysis, NLP, and applied AI. I build tools that are genuinely useful — not just technically impressive. Currently focused on real-time data products and AI-augmented workflows.
        </p>
        <div class="skills-grid reveal reveal-delay-4">
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
      <div class="about-kpis">
        <div class="about-kpi glow-card reveal reveal-delay-1" data-glow data-color="gold">
          <div class="glow-inner" data-glow></div>
          <div class="about-kpi-val">3<span class="accent">+</span></div>
          <div class="about-kpi-label">Years Analysing Data</div>
        </div>
        <div class="about-kpi glow-card reveal reveal-delay-2" data-glow data-color="gold">
          <div class="glow-inner" data-glow></div>
          <div class="about-kpi-val">10<span class="accent">+</span></div>
          <div class="about-kpi-label">Projects Shipped</div>
        </div>
        <div class="about-kpi glow-card reveal reveal-delay-3" data-glow data-color="gold">
          <div class="glow-inner" data-glow></div>
          <div class="about-kpi-val"><span class="accent">&#8734;</span></div>
          <div class="about-kpi-label">Curiosity</div>
        </div>
        <div class="about-kpi glow-card reveal reveal-delay-4" data-glow data-color="gold">
          <div class="glow-inner" data-glow></div>
          <div class="about-kpi-val">0<span class="accent">ms</span></div>
          <div class="about-kpi-label">Time to Start Building</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div>
      <div class="footer-name">Karthik Punati</div>
      <div class="footer-tagline">Data Analyst &amp; AI Builder &mdash; Bay Area</div>
      <ul class="footer-links">
        <li><button type="button" data-contact-open>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Contact
        </button></li>
        <li><a href="https://github.com/kpunati" target="_blank" rel="noopener">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          GitHub
        </a></li>
        <li><a href="https://linkedin.com/in/karthikpunati" target="_blank" rel="noopener">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          LinkedIn
        </a></li>
      </ul>
    </div>
    <div style="text-align:right">
      <button type="button" class="btn btn-primary" data-contact-open>Get in Touch</button>
    </div>
  </div>
  <div class="footer-copy">&copy; 2025 Karthik Punati. Built with precision.</div>
</footer>

<div class="contact-modal" id="contact-modal" aria-hidden="true">
  <div class="contact-backdrop" data-contact-close></div>
  <section class="contact-card" role="dialog" aria-modal="true" aria-labelledby="contact-title">
    <button type="button" class="contact-close" data-contact-close aria-label="Close contact form">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
    <p class="contact-kicker">Contact Terminal</p>
    <h2 id="contact-title">Start a project conversation</h2>
    <form class="contact-form" id="contact-form">
      <label>
        <span>Name</span>
        <input name="name" autocomplete="name" required placeholder="Your name">
      </label>
      <label>
        <span>Email</span>
        <input name="email" type="email" autocomplete="email" required placeholder="you@example.com">
      </label>
      <label>
        <span>What are you building?</span>
        <textarea name="message" rows="5" required placeholder="A few lines about the project, dashboard, or role."></textarea>
      </label>
      <div class="contact-actions">
        <button type="button" class="btn btn-ghost" data-contact-close>Cancel</button>
        <button type="submit" class="btn btn-primary">Prepare Signal</button>
      </div>
      <p class="contact-status" id="contact-status" role="status" aria-live="polite"></p>
    </form>
  </section>
</div>
`;
