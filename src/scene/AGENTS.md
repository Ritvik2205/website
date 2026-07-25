# Scene Object Guide

## Object Contract

- Keep one factory module per desk object or environment concern.
- Interactive factories return `{ group, id, label }` and may add `update(dt)` or a purpose-specific method such as `toggle()`.
- Keep stable IDs aligned with overlays: `projects`, `gallery`, `blog`, `music`, and `experience`; the lamp toggles mood and has no overlay.
- Non-interactive fillers live in `fillers.js` and are not registered with interactions.
- Add objects, register interactions, attach tick updates, and apply poses from `layout.js` in `src/main.js`.

## Rendering and Layout

- Props and environment use `MeshStandardMaterial` (or screen shaders). Prefer GLBs via `loadModel` with procedural Standard fallbacks.
- Do not create lights inside factories; lamp mood goes through `setLampMood` from `src/render/lighting.js`.
- `environment.js` returns `{ group, windowPane }`. Atmosphere may drive `windowPane.material.emissiveIntensity` for lightning; do not create lights in environment.
- The desk surface is around `y = 0.42` and the wall around `z = -1.2`; inspect `layout.js`, `environment.js`, and camera anchors before changing placement.
- Keep each root `Group` replaceable so internals can swap to another GLB without changing interaction IDs.
- Atmosphere owns the window storm plane, three rain layers, and lightning timing. It calls `applyWindowFlashLevel` from lighting and may pulse `windowPane` emissive. Respect reduced-motion (no rain, no lightning).

## Verification

Run `npm test` and `npm run build`. In the dev server, verify object hover/click targets, camera framing, lamp mood, window shadows, and both normal and reduced-motion modes.
