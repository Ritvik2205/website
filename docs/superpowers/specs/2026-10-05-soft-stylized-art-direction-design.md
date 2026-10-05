# Soft Stylized Art Direction — Design Spec

**Date:** 2026-10-05
**Status:** Approved direction (soft stylized), implementation in progress
**Audience:** general SWE recruiters first, creative showcase second

## Problem

The desk scene mixes four art styles: Kenney low-poly flat-color props, photoreal ambientCG wood/plaster textures, a Poly-by-Google vinyl player, and procedural boxes/PNG sprites. Overlays are flat 96% slate sheets that hard-cut from the 3D scene. Nothing reads as one world, and a recruiter gets no wayfinding beyond hover outlines.

## Inspiration distilled

From the Designeer directory (Landing.love, Hover States, Browse.cool, 60fps.design, Sombra, Detail.design): one coherent material language, tactile micro-interactions, motion that explains spatial relationships, dark editorial typography, and an always-visible escape hatch for impatient visitors.

## Rules

### 1. One asset source

Every desk prop is authored by `tools/blender/desk_kit.py` (Blender 4.5, headless) and exported to `public/models/kit/*.glb`. No third-party mesh packs mixed in. Re-running the script regenerates the whole kit.

- Real-world meters, authored at final scale; loaded with `loadModel(url, { height: null })` (no renormalization).
- Every hard edge gets a bevel (2–3 segments) so the warm lamp catches rims. Smooth shading with auto-smooth.
- Low detail, readable silhouettes. No image textures; color comes from materials.
- Named hook meshes: `Screen` (laptop, UV 0–1), `Shade` (lamp), `Platter` (vinyl, origin at spindle), `PageLeft` (sketchbook, UV 0–1).

### 2. Palette

| Token | Hex | Use |
|---|---|---|
| night | `#12161e` | background, deepest shadows |
| slate | `#33435a` | painted wall, glass tint |
| oak | `#b9805a` | desk top |
| oak-deep | `#7c5236` | desk apron, wood trims |
| paper | `#f1e6d0` | pages, panels text on dark |
| honey | `#f2aa4c` | lamp, primary accent, focus |
| sage | `#86a392` | secondary accent, plants, tags |
| clay | `#cf6f4e` | tertiary accent (record label, journal) |
| ink | `#1f232a` | text on paper, dark plastics |

Materials: `MeshStandardMaterial` only, roughness 0.5–0.85, metalness 0 except small metal parts (≤0.5). Emissive only for the laptop screen, lamp bulb/shade, and window.

### 3. Light

Keep the existing realtime rig and `lampMood` axis. Stylized tuning: stronger hemisphere fill so shadows read soft blue rather than black, bloom threshold tuned so only emissives glow.

### 4. UI language

- Frosted glass panels (`backdrop-filter: blur`) over the paused 3D frame, 16px radius, 1px hairline borders in paper at low alpha.
- Type: Newsreader for display, Space Mono for labels/metadata, Caveat only for handwritten accents.
- Every overlay page uses the shared panel/heading tokens; page-specific layouts stay.

### 5. Motion

- Easing: `expo.out` for entrances, `power2.inOut` for camera, springs avoided for text.
- Overlay opens with a circular clip-path reveal from the clicked object's screen position, then children stagger in (40ms). Close reverses quickly (≤0.35s).
- Reduced motion: no clip-path or stagger; instant opacity swap. Camera fly-ins already respect it via existing behavior.

### 6. Wayfinding and fast path

- Persistent bottom navigation pill in idle: Projects, Experience, Journal, Gallery, Music, plus a lamp toggle. Each item calls the same `openItem(id)` used by 3D clicks, so recruiters reach any section in one click without discovering objects.
- Hovering a desk object shows a floating label near the cursor and highlights its nav item.
- Top-left identity tag: name + role, always visible in idle.

## Out of scope

Intro rewrite, per-page layout redesigns, corkboard geometry (only its materials follow the palette). Those follow in their own specs and must obey these rules.

## Verification

`npm test`, `npm run build`, Blender preview render of the kit, and a browser run-through: idle, hover label, nav click, 3D click, overlay close/Escape, lamp mood, reduced motion, narrow viewport.
