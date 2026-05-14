# Portfolio Agent Guide

This repo is a cinematic personal portfolio for Karthik Punati. Start here, then read only the file that matches the change you are making.

## Fast Path

1. Read this guide.
2. Read the nearest source file.
3. Keep the edit scoped to the requested surface.
4. Verify with `npm run build`.
5. Use the browser only if you need to confirm real UI behavior.

## Project Snapshot

- Single-page Vite portfolio with a fixed navigation shell, scroll-driven motion, and layered Three.js scenes.
- Primary content is a data and AI portfolio, not a course platform or product-design academy.
- The current experience is intentionally cinematic and editorial, with real contact behavior and live data dashboards.
- There is no router. Most visible content lives in one injected HTML string.

## Repo Map

- [`index.html`](./index.html): Vite shell, head metadata, font links, and external script tags.
- [`src/main.js`](./src/main.js): boot sequence, markup injection, lazy loading, and loader teardown.
- [`src/markup.js`](./src/markup.js): the entire page structure and copy.
- [`src/styles/main.css`](./src/styles/main.css): all layout, tokens, motion, and responsive styling.
- [`src/sections/gsap-scroll.js`](./src/sections/gsap-scroll.js): ScrollTrigger integration, project scrub, and hero typewriter.
- [`src/sections/momentum.js`](./src/sections/momentum.js): scroll rail, command strip, project focus, contact modal, and mobile nav.
- [`src/sections/ui.js`](./src/sections/ui.js): reveal observers and dashboard tab interaction.
- [`src/scene/globe.js`](./src/scene/globe.js): Three.js globe dashboard that is actually imported by the app.
- [`src/scene/dataTerrain.js`](./src/scene/dataTerrain.js): background point-field and contour terrain.
- [`src/scene/`](./src/scene/): all heavy visual canvas systems.
- [`api/contact.js`](./api/contact.js): serverless contact handler.
- [`public/earth-texture.jpg`](./public/earth-texture.jpg): globe texture asset.
- [`globe.js`](./globe.js): legacy duplicate globe file. Do not assume it is the source of truth.
- [`dist/`](./dist/): build output. Do not edit directly.

## Visual Direction

Art direction: `Signal Gilded Depth`.

- Palette: warm charcoal backgrounds, aged-gold accents, muted plum secondary tones, and occasional teal signal highlights.
- Typography: `Clash Display` for display text, `Satoshi` for body copy.
- Tone: polished, technical, editorial, and premium.
- Motion language: layered parallax, glow cards, shimmer borders, scroll reveals, section-progress variables, hero typewriter, and delayed scene loading.
- Surface treatment: glassy nav, command strip, orbiting dashboard labels, and high-contrast cards with soft atmospheric glows.

## Content Rules

- Preserve the current positioning as a data and AI portfolio unless the user explicitly changes it.
- If you change copy, keep it aligned with data analysis, ML, LLMs, dashboards, and applied AI.
- Do not drift back into product-design, UX-academy, or generic agency language.
- If you add or revise claims, keep them credible for a portfolio and avoid placeholder hype.
- Replace broken or placeholder links before calling a page complete.

## Page Structure

- Hero with name, positioning, CTAs, and animated signal lines.
- Projects section with three featured case studies:
  - Stock Sentiment Analysis
  - Neural Kitchen
  - AI Aware Newsletter
- Dashboards section with a live Earth Intelligence globe and public API telemetry.
- About section with skills chips and KPI cards.
- Footer with social links and contact trigger.
- Contact modal that sends a message to the owner.

## Interaction Systems

- `main.js` mounts the markup, then boots visuals after the DOM is in place.
- `main.js` lazy-loads the globe and background terrain after idle time or when needed.
- `gsap-scroll.js` owns the section-progress variables and hero typing animation.
- `momentum.js` owns the journey rail, command strip, project focus states, drawer, and contact modal.
- `ui.js` owns reveal animations and any tabbed dashboard shells.
- `dataTerrain.js` and `globe.js` are intentionally expensive. Preserve the lazy-load and reduced-motion behavior.

## Contact Flow

- The contact form posts to `/api/contact`.
- Required env vars live in [`.env.example`](./.env.example).
- `RESEND_API_KEY` enables delivery.
- `CONTACT_TO_EMAIL` is the destination inbox.
- `CONTACT_FROM_EMAIL` is optional and defaults to the Resend onboarding sender.
- The email subject is `[Portfolio Contact] <name>`.
- The visitor email is used as `reply_to`.
- The body includes name, email, submitted time, and message.

## Working Rules For Changes

- Keep edits scoped to the requested surface.
- Do not overwrite uncommitted user changes.
- Do not edit `dist/` manually.
- Keep `antigravity-bundle-web-designer/` ignored and treat it as reference material only.
- Use ASCII by default.
- Prefer incremental edits over rewrites.
- If you touch copy and layout together, keep the content and motion coherent.

## File Ownership Guide

Use these as the first stop for common tasks:

- Content or section copy -> [`src/markup.js`](./src/markup.js)
- Motion or scroll behavior -> [`src/sections/gsap-scroll.js`](./src/sections/gsap-scroll.js) and [`src/sections/momentum.js`](./src/sections/momentum.js)
- Reveal / tabs -> [`src/sections/ui.js`](./src/sections/ui.js)
- Theme, spacing, responsiveness -> [`src/styles/main.css`](./src/styles/main.css)
- Globe or terrain rendering -> [`src/scene/globe.js`](./src/scene/globe.js) and [`src/scene/dataTerrain.js`](./src/scene/dataTerrain.js)
- Contact delivery -> [`api/contact.js`](./api/contact.js)
- Shell metadata or external script loading -> [`index.html`](./index.html)

## Repo-Specific Gotchas

- `vite.config.js` is the actual dev-server source of truth. It currently runs Vite on port `5173` with host enabled.
- `README.md` may lag behind the real config if it mentions a different port.
- `check.js` is a local browser probe and may also be stale. Confirm what it targets before using it.
- The app uses both `gsap-scroll.js` and `momentum.js` to drive scroll state. If you change one, check for duplicated state assumptions in the other.
- The root `globe.js` file exists alongside `src/scene/globe.js`. The app imports the `src/scene` version.
- Several visuals are gated by `prefers-reduced-motion`. Do not remove those fallbacks.

## Verification

Minimum verification for meaningful edits:

- `npm run build`

Useful extra checks when you change layout, motion, or contact flow:

- `npm run dev`
- Open the local site in the browser and confirm the affected section
- Validate the contact form if you touched `api/contact.js` or the modal markup

## When To Be Careful

- If the user asks for a visual polish pass, preserve the existing content unless they explicitly ask for copy changes.
- If the user asks for performance work, keep the art direction intact and optimize the expensive paths first.
- If the user asks for a production-ready addition, consider whether it belongs in this single-page structure or should remain a roadmap item.

## In-Flight Work

- **Background UI change coming.** The full-viewport 3D helix at [`src/sections/particles.js`](./src/sections/particles.js) (mounted as `#helix-canvas` at z-index 2) is queued for removal and replacement with a scroll-scrubbed assembly/disassembly backdrop. Custom graphics are being prepared by the owner. The replacement consumes existing scroll CSS variables (`--hero-pressure`, `--projects-depth`, `--scan-progress`, `--globe-emerge`, `--about-calm`) and adds zero rAF cost. Until those assets arrive, the helix stays. **Do not refactor or extend `particles.js`** — it is scheduled for deletion. Full plan: `/Users/karti/.claude/plans/can-you-take-a-breezy-ocean.md` (Track A).

## Current Roadmap Boundary

Not currently implemented unless requested:

- Router-based multi-page architecture
- FAQ, privacy, terms, and accessibility pages
- Authentication
- Payments
- Student dashboard
- CMS or course management backend

## Source-of-Truth Reminder

When in doubt:

- `src/markup.js` is the page copy and structure source of truth.
- `src/styles/main.css` is the visual system source of truth.
- `src/sections/*.js` are the interaction source of truth.
- `src/scene/*.js` are the rendering source of truth.
- `api/contact.js` is the email delivery source of truth.
