# Realtime PBR Desk Densify — Design Spec

**Date:** 2026-07-21  
**Owner:** Ritvik Gupta  
**Status:** Active — supersedes baked-only lighting for the desk scene

## Purpose

Make the first-person desk feel fuller and more cohesive (reference: warm frontal corkboard/desk density) while upgrading rendering to realtime PBR: window directional light with soft shadows, warm lamp key light, licensed GLB props, and non-interactive filler clutter.

## Decisions

| Axis | Choice |
|------|--------|
| Lighting | Full realtime PBR (`DirectionalLight` + `HemisphereLight` + lamp `SpotLight`, shadow maps) |
| Props | Keep interactive IDs; add non-interactive fillers |
| Meshes | CC0/CC-BY GLBs (Kenney / poly.pizza / ambientCG) with procedural Standard fallbacks |
| Lamp UX | Click GSAP-tweens mood `t ∈ [0.15, 1]`: warm lamp-dominant ↔ cool window-dominant |

## Architecture

- `src/render/lighting.js` — scene lights + `setLampMood` / `getLampMood`
- `src/render/loadModel.js` — GLTF load, normalize height, shadow flags, Standard materials
- `src/scene/layout.js` — densified poses/scales shared with camera anchors
- `src/scene/fillers.js` — books, papers, plant, pen cup (no interactions)
- Environment and props use `MeshStandardMaterial`; bloom retuned for lit highlights
- Mode flow, overlays, and interaction IDs unchanged

## Mood axis

Replaces `setNightMix` (baked day/night texture mix):

- `t = 1`: lamp spot strong, warm hemisphere bias, softer window fill
- `t ≈ 0.15`: lamp dim, cooler hemisphere, stronger window directional

## Layout targets (desk y ≈ 0.42)

Vinyl back-left, journal front-left (larger), sketchbook center-front (larger), laptop right angled in, lamp back-right (key origin), tea cup in lamp/laptop gap, corkboard wall-centered slightly larger, fillers in remaining gaps.

## Out of scope

Frontal reference camera restage, new content pages, Blender lightmap bakes.

## Verification

`npm test`, `npm run build`, manual hover/click/Escape/lamp mood/shadows/reduced-motion.
