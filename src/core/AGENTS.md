# Core Runtime Guide

## Responsibilities

- `engine.js` owns the renderer, composer-backed tick loop, resize handling, `onTick(fn)`, and `setRenderPaused(bool)`.
- `state.js` owns the current mode and mode-change subscriptions. Use `setMode(mode, target?)`; do not mutate state directly.
- `cameraRig.js` owns the home pose, cursor parallax, and GSAP `flyTo()`/`flyHome()` movement.
- `interactions.js` owns raycast registration, hover color/lift effects, and click dispatch.

## Contracts

- Keep one engine loop. Register updates through `engine.onTick()` and accept its `dt` argument when time-based.
- The camera is directed: field of view 50, bounded cursor parallax, and named fly-to anchors. Do not add orbit or free-fly controls.
- Input is active only in the appropriate state. Disable interactions before a camera fly-to and re-enable them after returning home.
- Register interactables in `src/main.js` with `{ group, id, label, onClick }`; descendants are raycast recursively.
- Keep content-target camera anchors in the composition root unless a broader camera API is intentionally designed.
- Hover feedback uses a warm emissive tint on Standard materials and a small Y lift.
- Interactables may set `skipHoverVisual` / `skipHoverLift` (e.g. wall corkboard) to keep cursor without tint or lift.

## Verification

Run `npm test` and `npm run build`. Manually verify intro-to-idle, hover, click-to-zoom, Escape/back, and return-to-idle behavior for runtime changes.
