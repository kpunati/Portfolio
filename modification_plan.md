# Portfolio Performance Modification Plan

The goal is not to remove the portfolio's visual identity. The goal is to make the site behave like one coordinated visual system instead of several expensive systems running beside each other.

## Target Architecture

Keep the current stack: Vite, vanilla JS, GSAP/ScrollTrigger, Three.js, and the existing CSS. Do not add React, Next, or another large framework.

The new model should be:

```text
ScrollTrigger / one scroll state
        ↓
central visual scheduler
        ↓
terrain / helix / globe / UI effects
        ↓
only visible + necessary systems render
```

Right now the site is closer to:

```text
GSAP scroll loop
momentum scroll loop
terrain RAF loop
helix RAF loop
globe RAF loop
CSS filter/compositor work
```

That is the main reason performance collapses.

## Phase 1: Remove Waste First

1. Eliminate duplicate Three.js loading.
   - Current issue: `index.html` loads CDN Three.js, while `globe.js` imports `three` through Vite.
   - Fix: use npm/Vite imports everywhere.
   - Remove CDN scripts from `index.html`.
   - Update terrain and helix modules to import `three` directly instead of checking `window.THREE`.
   - Expected result: smaller runtime confusion, better bundling, cleaner dependency ownership.

2. Split heavy visual modules intentionally.
   - Keep `globe.js` lazy-loaded.
   - Keep `dataTerrain.js` lazy-loaded.
   - Make `particles.js` / helix lazy or conditional instead of booting immediately with everything else.
   - Add a simple visual registry in `main.js` that knows what is mounted, visible, paused, or destroyed.

3. Audit the build output after each change.
   - Run `npm run build`.
   - Track JS chunks, especially `globe`, `dataTerrain`, and the main bundle.
   - The goal is not only smaller size, but fewer active systems on first load.

## Phase 2: Centralize Frame Control

Create a new module:

```text
src/performance/visualScheduler.js
```

It should own:

- `requestAnimationFrame`
- global visual quality
- tab visibility
- reduced motion
- current scroll progress
- device frame budget
- active scene priority

Each visual system should register itself:

```js
visualScheduler.register('terrain', {
  priority: 1,
  update(delta, state) {},
  render() {},
  pause() {},
  resume() {},
  destroy() {}
});
```

Then remove independent forever-loops from:

- `src/scene/dataTerrain.js`
- `src/scene/globe.js`
- `src/sections/particles.js`

Instead of each file calling its own `requestAnimationFrame`, the scheduler calls them only when they should run.

## Phase 3: One Scroll Authority

Keep GSAP ScrollTrigger as the main scroll system.

Refactor:

- `src/sections/gsap-scroll.js`
- `src/sections/momentum.js`
- `src/scene/dataTerrain.js`
- `src/sections/particles.js`

Rules:

1. ScrollTrigger computes section progress.
2. Section progress is written once into shared state.
3. Terrain, globe, helix, and UI read that state.
4. They should not each calculate page height, section bounds, and scroll percentages separately.

This removes duplicated scroll work and prevents layout reads during animation.

## Phase 4: Scene Priority Rules

This is the most important performance behavior.

Define visual priority by viewport section:

```text
Hero:
terrain active
helix active/light
globe unloaded

Projects:
terrain active
helix active
globe unloaded

Dashboards approaching:
terrain reduced
helix paused/faded
globe loads

Dashboards active:
globe active
terrain low FPS or frozen
helix paused

About/footer:
globe paused
terrain minimal or paused
```

This is how the portfolio can reach Lando-style complexity without every layer fighting for FPS.

For example:

- Terrain should keep smooth perceived motion in hero/projects.
- Terrain should reduce CPU work, not visible smoothness.
- Terrain can freeze or become nearly static only when the globe or a future dashboard is visually dominant.
- Globe gets priority while interacted with.
- Helix should not render while it is offscreen or visually hidden.

## Phase 5: Terrain Refactor

The terrain is probably the biggest runtime cost.

The terrain direction should be GPU-first, not low-FPS-first. The goal is to preserve the cinematic data-terrain / atmospheric depth feeling while moving expensive work out of JavaScript and into shader uniforms. Do not intentionally make the hero/projects background visibly low-FPS; that would solve cost by reducing polish, which is not the desired tradeoff.

Preferred terrain model:

1. Keep perceived motion smooth at normal viewport focus.
2. Animate large background forms through shader time uniforms, transform, and opacity.
3. Avoid CPU-side geometry mutation for continuous motion.
4. Use frozen or reduced terrain only when another dashboard is the primary visual target.

Specific changes:

1. Stop updating contour geometry every few frames unless visible and important.
2. Reduce live object mutation inside `animate`.
3. Move more animation into shader uniforms instead of CPU-side geometry updates.
4. Use fewer separate material opacity updates per frame.
5. Add hard quality tiers:
   - `full`: current visual density, capped DPR 1.5, smooth shader-driven motion.
   - `balanced`: fewer contours and lower point count, but still smooth shader-driven motion.
   - `lite`: no CPU contour mutation, low point count, reduced detail but not intentionally choppy.
6. Freeze terrain during globe focus.

The terrain should become a background atmosphere, not a competing dashboard renderer.

Terrain alternatives considered:

- Shader-only atmospheric field: best long-term direction if the current depth can be matched closely enough.
- Pre-rendered terrain loop plus interactive overlay: biggest FPS win, but less live and less flexible.
- Canvas 2D data field: efficient, but less spatial unless heavily styled.
- SVG/CSS topographic layers: sharp and cheap, but less fluid.
- Hybrid current-scene plus shader-driven motion: safest first step because it preserves the current look while removing the worst CPU work.

Recommended approach: use the hybrid path first, then progressively replace CPU-mutated terrain details with shader-driven equivalents. This avoids flattening the design while still moving toward the Lando-style model of visually complex but strategically scheduled motion.

## Phase 6: Globe Refactor

The globe is already better optimized than the terrain because it uses instancing, DPR caps, visibility checks, and lazy loading.

Improve it further:

1. Keep it lazy-loaded, but load only when dashboards are near viewport.
2. Pause all non-globe visuals when globe interaction begins.
3. Render globe continuously only while:
   - visible
   - being dragged
   - auto-rotating in dashboard viewport
   - data markers are animating
4. Otherwise render on demand.
5. Avoid loading future dashboard scenes until the user approaches them.

For two future dashboards, do not create three simultaneous dashboard canvases. Use one dashboard viewport that swaps active scene modules.

## Phase 7: CSS Paint Cost Reduction

Keep the look, reduce expensive paint.

Audit these patterns:

- `backdrop-filter`
- large `filter: blur(...)`
- `filter: brightness(...)`
- animated radial gradients
- giant fixed overlays
- `mix-blend-mode`
- many glowing pseudo-elements

Rules:

1. Use `backdrop-filter` only on small nav/modal surfaces.
2. Avoid blur/filter on full-screen or large scrolling layers.
3. Replace some glow effects with static gradients or opacity-only overlays.
4. Add `contain: paint` / `content-visibility: auto` to below-fold sections.
5. Keep hover glow effects local to the card, not page-wide.

## Phase 8: Loading Strategy

Current loading feels heavy because too many systems initialize near startup.

New boot order:

```text
1. Inject markup
2. Show basic static page immediately
3. Start GSAP scroll state
4. Start lightweight UI interactions
5. Start terrain after first paint / idle
6. Start helix only near its visual range
7. Start globe only near dashboards
8. Future dashboards mount only one at a time
```

The site should never block first interaction waiting for cinematic systems.

## Phase 9: Future Dashboard Rule

Before adding two more dashboards, create a dashboard runtime contract:

```js
{
  mount(container),
  preload(),
  activate(),
  deactivate(),
  pause(),
  resume(),
  destroy()
}
```

Only one dashboard should be fully active at once.

Do not let each dashboard own a permanent RAF loop. They must all go through the scheduler.

## Phase 10: Measurement

Every phase should be verified, not guessed.

Minimum checks:

1. `npm run build`
2. Chrome Performance recording
3. FPS while scrolling hero to projects
4. FPS while entering dashboards
5. FPS while interacting with globe
6. JS heap after scrolling through page once
7. CPU usage after page is idle
8. mobile/lite quality mode check

Success target:

- 55-60 FPS on normal laptop during scroll
- 30+ FPS on old laptop during heavy dashboard section
- no continuous high CPU when idle
- no more than one major WebGL scene actively rendering at a time
- future dashboards can be added without multiplying RAF loops

## Recommended Implementation Order

1. Remove duplicate CDN Three/GSAP usage and move to Vite imports.
2. Add `visualScheduler.js`.
3. Convert helix to scheduler-controlled rendering.
4. Convert terrain to scheduler-controlled rendering.
5. Convert globe to scheduler-controlled rendering.
6. Centralize scroll progress from GSAP.
7. Add section-based scene priority rules.
8. Reduce terrain CPU geometry mutation.
9. Trim expensive CSS filters/backdrops.
10. Add dashboard module contract before building the next dashboards.

The biggest win will come from steps 2-7. Asset and CSS cleanup will help, but the real improvement comes from making the page spend one frame budget, not five separate ones.
