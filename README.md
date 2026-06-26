# Portfolio

built with Vite, Three.js, and GSAP.

## Local dev

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
npm run preview
```

## Deploy

Connected to Vercel — push to `main` to deploy automatically.

## Structure

```
├── index.html              # Vite entry shell
├── public/
│   └── earth.jpg           # Globe texture (served as static asset)
├── vercel.json             # SPA rewrite rules
└── src/
    ├── main.js             # Entry — mounts markup, boots all systems
    ├── markup.js           # Portfolio HTML as JS string
    ├── styles/
    │   └── main.css        # All styles
    ├── scene/
    │   └── globe.js        # Three.js globe dashboard
    └── sections/
        ├── ui.js           # Scroll reveal, tabs, particle canvas, helix
        └── momentum.js     # Journey rail, aurora, transition zone, parallax
```
