# Portfolio Agent Guide

## Project

This is a static, first-person 3D desk portfolio built with Vite, vanilla ES modules, three.js, GSAP, and DOM overlays. Do not introduce a UI framework or backend without an explicit architecture change.

## Commands

- `npm run dev` — start Vite locally.
- `npm run build` — create the production bundle in `dist/`.
- `npm run preview` — serve the production bundle.
- `npm test` — run Vitest content smoke tests.

Run commands from this directory. The Git root is the parent `Code/` repository, so scope Git inspection to `portfolio/` and do not modify sibling projects.

## Architecture

- `src/main.js` is the composition root: create the engine and camera, add scene objects, register interactions, load content, register overlays, run the intro, then enter `idle`.
- `src/core/` owns the render loop, camera rig, interaction raycasting, and mode state.
- `src/render/` owns realtime lighting, GLB loading, bloom composer, and legacy bake helpers.
- `src/scene/` owns one procedural/GLB module per desk object, fillers, layout poses, and the environment.
- `src/ui/` owns the intro, overlay manager, and content-page DOM factories; associated CSS lives in `src/styles/`.
- `src/content/` owns JSON and Markdown data plus loading and frontmatter parsing.

Read the nearest child `AGENTS.md` before changing a subsystem. For changes under `src/styles/`, also follow `src/ui/AGENTS.md`. Rendering work must follow `docs/design/2026-07-21-realtime-pbr-rendering.md`.

## Cross-Project Rules

- Preserve the mode flow `intro → idle → zoomed(target) → closing → idle`; use `setMode()` as the source of truth.
- Content pages are DOM overlays. Pause 3D rendering only after an overlay opens and resume before it closes.
- Keep user-visible portfolio content in `src/content/`; pass loaded data into UI factories instead of hardcoding copy.
- Keep `.js` extensions on local ES-module imports.
- Preserve `prefers-reduced-motion` behavior for camera fly-ins, intro, and atmosphere. Idle camera framing is fixed (no cursor parallax).
- Use GSAP for coordinated transitions and the engine tick for per-frame scene updates; do not create competing animation loops.
- Avoid unrelated refactors. The procedural scene is intentionally replaceable by future baked GLB assets.

## Verification

- Content-only changes: run `npm test`.
- JavaScript, CSS, render, or scene changes: run `npm test` and `npm run build`.
- Interaction or visual changes also need a manual Vite run-through of hover, click, overlay close/Escape, lamp mood, intro skip, and reduced motion as applicable.
- Do not commit generated `dist/` or `node_modules/`.
