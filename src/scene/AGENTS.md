# Scene Object Guide

## Object Contract

- Keep one factory module per desk object or environment concern.
- Interactive factories return `{ group, id, label }` and may add `update(dt)` or a purpose-specific method such as `toggle()`.
- Keep stable IDs aligned with overlays: `projects`, `gallery`, `blog`, `music`, and `experience`; the lamp toggles mood and has no overlay.
- Add objects, register interactions, register unlit groups, and attach tick updates in `src/main.js`.

## Rendering and Layout

- Props use unlit `MeshBasicMaterial`, sprite art, or the baked-material helpers from `src/render/`; never add scene lights.
- Store sprite images in `../../public/` and reference them as root-relative URLs such as `/assets/lamp.png`, never `/public/assets/lamp.png`.
- The desk surface is around `y = 0.42` and the wall around `z = -1.2`; inspect `environment.js` and camera anchors before changing placement.
- Keep each root `Group` replaceable so procedural internals can later become a baked GLB without changing interaction IDs.
- Atmosphere stays localized to the window and exposes an `update(dt)` hook. Respect the reduced-motion flag and avoid room-wide particle or fog regressions.

## Verification

Run `npm test` and `npm run build`. In the dev server, verify object hover/click targets, camera framing, lamp mood, and both normal and reduced-motion modes.
