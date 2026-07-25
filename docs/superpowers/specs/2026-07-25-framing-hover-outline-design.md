# Framing, Desk Density, Lamp Intensity & Hover Outline — Design Spec

**Date:** 2026-07-25  
**Status:** Approved for planning  
**Approach:** Targeted pose + inverted-hull silhouette outlines (Approach 1)  
**Related:** [Realtime PBR Rendering](../../design/2026-07-21-realtime-pbr-rendering.md), [3D Desk Portfolio](./2026-07-05-3d-desk-portfolio-design.md), [Hover / Lamp / Storm](./2026-07-24-hover-lamp-cinematic-storm-design.md)

## Purpose

Tighten idle framing and desk composition, reduce lamp washout, and replace lift-based hover with a soft silhouette outline:

1. Remove mouse/touch camera parallax; keep a fixed centered home pose, slightly closer to the desk.
2. Shrink desk depth (wall → camera) and pull objects into a tighter cluster.
3. Lower lamp spot intensity and keep the light source behind/inside the shade.
4. Remove hover Y-lift (and warm tint); show only a soft outline on hover.

## Non-goals

- Orbit / free-fly camera controls.
- Post-processing `OutlinePass` or EffectComposer outline integration.
- Hard edge/`EdgesGeometry` wire outlines.
- New interaction IDs, overlays, or changes to `intro → idle → zoomed → closing → idle`.
- Redesigning content pages or atmosphere/storm behavior.

## Camera & framing

### Current behavior

`src/core/cameraRig.js` lerps `camera.position` and look-at from normalized pointer offsets while `parallaxOn` is true. Idle framing drifts off-center as the cursor moves. `HOME` is `{ position: (0, 1.15, 2.1), lookAt: (0, 0.95, -1.2) }`.

### Target behavior

- Disable idle cursor/touch parallax: remove pointer/touch offset logic from `update()` and drop unused pointer listeners.
- Keep `HOME` look-at centered on the scene; move camera slightly closer (`z: 2.1 → 1.85`; allow ±0.1 only if framing clips objects).
- Preserve GSAP `flyTo` / `flyHome`. Keep `setParallaxEnabled` as a no-op stub so `main.js` intro call sites need not change.
- `prefers-reduced-motion` continues to gate intro and other motion; parallax is off for everyone.

### Docs impact

Update `src/core/AGENTS.md`, root `AGENTS.md` parallax wording, and realtime PBR “directed camera” bullet so they no longer require cursor parallax.

## Desk depth & object spacing

### Current behavior

Desk top/body use `BoxGeometry(..., 1.7)` depth, centered at `z = -0.35`, with front edge near `z = 0.53`. `LAYOUT` poses spread interactables and fillers across a wide X/Z range (e.g. laptop at `x: 0.95`, lamp at `x: 1.45`).

### Target behavior

- Reduce desk depth to ~`1.35` and re-center `deskBody` / `deskTop` / `deskEdge` so the wall at `z ≈ -1.2` still meets the back of the desk and the front edge moves closer to the wall.
- Compress `LAYOUT` positions toward a denser cluster (especially laptop ↔ lamp). Keep relative reading order (vinyl/journal left, sketchbook center, laptop/lamp right, corkboard on wall).
- Lightly adjust `CAMERA_ANCHORS` so zoom-ins still target the new poses.
- Fillers move with the denser layout; no new filler objects.

### Constraints

- Desk surface stays near `y = 0.42`.
- Wall remains near `z = -1.2`.
- Do not change interaction IDs.

## Lamp light

### Current behavior

Warm mood lerps spot intensity up to `18`. Glow plane and `attachLampLight` shade-local offsets can read as a bright ball in front of / beside the shade. Bloom then washes laptop and desk.

### Target behavior

- Lower warm-mood max intensity from `18` to ~`7` (cool/off floor can stay near `0.4`). Initial `SpotLight` constructor intensity matches the new ceiling.
- Keep shade-local attachment: spot position from `lampGroup.localToWorld(shadeLocal)`; aim target on the desk in front of the lamp.
- Push shade-local offset **behind** the shade opening (negative local Z relative to shade facing, or equivalent for GLB cavity) so the source is not visible in front of the shade. Sync additive glow plane to the same offset.
- Retune fallback vs GLB shade offsets independently if needed after visual check.
- Mood toggle GSAP path unchanged.

## Hover outline

### Current behavior

`applyHover` warm-tints emissive/color and GSAP-lifts `group.position.y` by `0.04` unless `skipHoverLift` / `skipHoverVisual`.

### Target behavior

- Remove Y-lift and warm emissive/color tint.
- Soft silhouette outline: for each mesh under an interactable (unless `skipHoverVisual`), create a slightly scaled clone (~1.04–1.08) with warm unlit material (`MeshBasicMaterial`), `side: BackSide` (inverted hull), no depth write issues that break the scene, not raycastable (`raycast = () => {}`).
- Outline meshes parented under a dedicated child of the item group, `visible = false` by default; instant show/hide on hover (no fade required).
- Corkboard keeps `skipHoverVisual: true` (cursor only). Remove `skipHoverLift` from corkboard, interactions, and tests that assert it.
- Pointer cursor behavior unchanged.
- GLB meshes that stream in after `register()` must still get outlines: rebuild or defer outline creation until meshes exist (same “first touch / poll” pattern already used for material base capture), so late-loaded assets are covered.

### Non-goals for hover

- OutlinePass / selection bloom.
- Floating DOM labels (already removed).

## Testing

- `npm test` and `npm run build`.
- Manual: idle camera stays fixed while moving the mouse; framing is centered and slightly closer; desk reads shallower; objects sit closer; lamp is dimmer and glow sits in/behind shade; hover shows outline only (no Y bob); corkboard has no outline; click/Escape/fly-home still work; reduced-motion intro/atmosphere unaffected.

## File touch list (expected)

| Area | Files |
|------|--------|
| Camera | `src/core/cameraRig.js`, `src/core/AGENTS.md`, optionally `src/main.js` |
| Desk / poses | `src/scene/environment.js`, `src/scene/layout.js` |
| Lamp | `src/render/lighting.js`, `src/scene/lamp.js` |
| Hover | `src/core/interactions.js`, `src/scene/corkboard.js`, `tests/correspondence-ledger.test.js` |
| Docs | this spec; light updates to `AGENTS.md` / PBR design bullet if needed during implementation |
