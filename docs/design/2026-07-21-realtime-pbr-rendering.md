# Realtime PBR Rendering

**Date:** 2026-07-21  
**Status:** Current rendering philosophy for the desk scene  
**Supersedes:** [2026-07-06-baked-rendering-philosophy.md](./2026-07-06-baked-rendering-philosophy.md) for runtime lighting (that doc remains historical reference for bake technique)

## Core principle

Light the scene at runtime. Window light is a shadowed `DirectionalLight`; the lamp is a warm `SpotLight`; soft `HemisphereLight` fills. Surfaces use `MeshStandardMaterial` so metalness/roughness respond to real illumination.

## Rules

1. **Scene lights are allowed** — create them only through `src/render/lighting.js`.
2. **Props and environment use Standard (or emissive screens)** — not `MeshBasicMaterial` for lit surfaces.
3. **One mood axis** — `lampMood` ∈ `[0.15, 1]` via `setLampMood` / `getLampMood`. Lamp click GSAP-tweens it.
4. **Shadows** — `renderer.shadowMap.enabled` with `PCFSoftShadowMap`; directional map 2048; desk receives; props cast.
5. **Glow** — bright emissive pixels (window pane, laptop screen) + retuned `UnrealBloomPass`.
6. **Directed camera** — fov 50, parallax, GSAP fly-to; no orbit.
7. **GLB drop-in** — `loadModel()` from `public/models/`; procedural Standard fallbacks if load fails.

## Asset licensing

Prefer CC0/CC-BY from ambientCG, Kenney, poly.pizza. Record sources in `public/models/ATTRIBUTION.md`. Do not copy unlicensed reference portfolio assets.
