# Baked Rendering Guide

Read `../../docs/design/2026-07-06-baked-rendering-philosophy.md` before editing this directory. It is authoritative when older specs disagree with the implementation.

## Non-Negotiable Rules

- Do not add `AmbientLight`, `DirectionalLight`, `SpotLight`, runtime shadow maps, or physically lit prop materials. Light, shadow, and ambient occlusion are authored into textures or canvas bakes.
- Use `MeshBasicMaterial` for unlit props and `createBakedMaterial()` for surfaces that participate in the global mood.
- Keep one mood axis: `nightMix` is in `[0, 1]`; `1` is warm/lamp-on and `0` is cool dusk. Update registered materials through `setNightMix()`.
- Glow comes from bright pixels crossing `UnrealBloomPass` thresholds, never from a light source.
- Screens may use `ShaderMaterial` and `uTime` effects for scanlines or flicker.

## File Contracts

- `bakeCanvas.js`: `createBakePair(width, height, paintFn)` paints paired day/night canvases; `paintFn(ctx, mode)` receives `mode` as `day` or `night`.
- `bakedMaterial.js`: creates day/night shader materials and registers unlit groups for global mood dimming.
- `composer.js`: preserve the `RenderPass → UnrealBloomPass → OutputPass` chain unless a documented visual change requires otherwise.
- `bakedModel.js`: GLB textures use `flipY = false`, SRGB color space, and a shared baked material per group; loaded groups join the mood registry.

## Assets and Verification

Do not copy unlicensed assets from the reference portfolio. Put future source models in `public/models/` and day/night atlases in `public/textures/` using the contract in the design doc.

Run `npm test` and `npm run build`; visually check both lamp moods, bloom readability, and reduced-motion behavior after rendering changes.
