# Realtime PBR Rendering Guide

Read `../../docs/design/2026-07-21-realtime-pbr-rendering.md` before editing this directory. It is authoritative when older bake docs disagree.

## Rules

- Create lights only via `lighting.js` (`DirectionalLight` window, `HemisphereLight` fill, lamp `SpotLight`). Do not scatter lights inside scene factories.
- Prefer `MeshStandardMaterial` for environment and props. Screens may use `ShaderMaterial` + `uTime`.
- Mood axis: `lampMood` in `[0.15, 1]`; update through `setLampMood()`. Lamp on ≈ `1`, lamp off ≈ `0.15`.
- Enable shadows on the engine renderer; props `castShadow`, desk/floor/wall `receiveShadow`.
- Glow comes from emissive pixels crossing `UnrealBloomPass` thresholds plus the lamp spot.
- `loadModel.js`: GLB textures use SRGB where appropriate; normalize height; convert non-standard materials when needed.
- Legacy `bakedMaterial.js` / `bakeCanvas.js` may remain for tests or transitional sprites; do not use them for new room lighting.

## File Contracts

- `lighting.js`: `createLighting(scene)`, `setLampMood`, `getLampMood`, `attachLampLight(target, shadeLocal?)`, `applyWindowFlashLevel(amount)`, `pulseWindowFlash(amount)`. Flash is transient and must re-enter through `applyMood`; it is not a second mood axis.
- `loadModel.js`: `loadModel(url, { height })` → `{ group, status }`.
- `composer.js`: keep `RenderPass → UnrealBloomPass → OutputPass` unless a documented visual change requires otherwise.

## Assets and Verification

Put models in `public/models/` and PBR textures in `public/textures/`. Update `ATTRIBUTION.md` for every third-party file.

Run `npm test` and `npm run build`; visually check lamp moods, window shadows, bloom readability, and reduced-motion behavior.
