# Hover Labels, Lamp Attachment & Cinematic Window Storm — Design Spec

**Date:** 2026-07-24  
**Status:** Approved for planning  
**Approach:** Atmosphere-owned cinematic stack (window-local)  
**Related:** [Realtime PBR Rendering](../../design/2026-07-21-realtime-pbr-rendering.md), [3D Desk Portfolio](./2026-07-05-3d-desk-portfolio-design.md)

## Purpose

Three focused visual fixes for the desk scene:

1. Remove floating hover text on interactable objects.
2. Correct lamp illumination so the glow and spot read as coming from inside the shade.
3. Upgrade the window to a heavier cinematic storm: outdoor storm plane, volumetric-looking rain layers, and occasional lightning tied to mood.

## Non-goals

- Room-wide fog, dust, or full-screen rain post-processing.
- New UI frameworks or content-page changes.
- Changing interaction IDs, overlays, or the `intro → idle → zoomed → closing → idle` mode flow.
- Replacing the lamp mood axis with a separate weather system.

## Hover labels

### Current behavior

`src/core/interactions.js` creates a DOM `.hover-label`, positions it with the pointer, and sets `textContent` from each item’s `label`. CSS lives in `src/styles/main.css`.

### Target behavior

- Remove label element creation, pointer tracking for the label, and opacity/`textContent` updates.
- Keep pointer cursor, emissive warm tint, and GSAP Y-lift hover feedback.
- Remove unused `.hover-label` rules from `main.css`.
- Factory `label` strings may remain on object return values (harmless; useful later for a11y) but are not displayed.

## Lamp light attachment

### Root cause

The additive glow plane uses hardcoded local offsets that sit visually outside the shade after layout pose / GLB swap. `attachLampLight` also places the `SpotLight` with fixed world offsets from the lamp group origin, so the cone can read as floating beside the fixture rather than under the shade.

### Target behavior

1. Keep the glow mesh parented to the lamp group; place it in shade-local space (inside the shade cavity, slightly forward of the stem).
2. After the lamp GLB reaches `assetStatus === 'loaded'`, recompute glow position from the loaded shade bounds (or a documented local target), then call `attachLampLight` again.
3. `attachLampLight` positions the spot just below / inside the shade rim and aims at the desk; tighten `angle` / `penumbra` so the pool reads as shade-sourced.
4. Fallback procedural lamp uses the same attach path so both assets stay consistent.

Lights remain created only in `src/render/lighting.js`. Lamp mood still tweens via `setLampMood` / `getLampMood`.

## Cinematic window storm

### Ownership

| Concern | Module |
|---------|--------|
| Storm plane, rain layers, lightning timer, pane emissive pulses | `src/scene/atmosphere.js` |
| Frame, wet pane, mullion meshes / base materials | `src/scene/environment.js` |
| Persistent lights + transient window flash API | `src/render/lighting.js` |
| Composition / wiring | `src/main.js` |

Atmosphere must not create `DirectionalLight` / `SpotLight` / `HemisphereLight`. It receives hooks from `main.js`.

### Storm plane

- Plane placed just outside the room behind the window pane (negative Z relative to the wall hole).
- Cool storm gradient / soft cloud noise via `ShaderMaterial` (or equivalent canvas-backed material).
- Depth-sorted so mullions and frame stay in front; effect stays clipped to the window region by geometry size, not a full-room backdrop.

### Rain layers

Disabled entirely when `prefers-reduced-motion: reduce`.

| Layer | Role |
|-------|------|
| Far volume | Dense angled `LineSegments` slightly outside the glass |
| Mid volume | Second sheet with different speeds / lengths for parallax depth |
| Near glass | Fewer brighter streaks on the pane face with slight drip bias |

All layers update in `atmosphere.update(dt)` on the existing engine tick — no secondary animation loops.

### Pane materials

Upgrade the window pane in `environment.js` toward wet glass: lower roughness, slight metalness, cool tint. Keep emissive as a bloom catcher. Expose the pane mesh (return value or `userData` name) so atmosphere can drive base glow and lightning spikes without searching the whole scene.

### Lightning (occasional drama)

- Timer in atmosphere with jittered interval roughly every 5–10 seconds.
- Pattern: brief double-flash, then settle.
- New lighting API: `pulseWindowFlash(amount)` temporarily boosts `windowLight` intensity/color, then restores by re-applying the current `lampMood` (`applyMood`).
- Atmosphere also spikes pane emissive so `UnrealBloomPass` reads the flash.
- Flash strength scales down when lamp mood is high (lamp still wins the room); when lamp is dim, flashes read cooler and stronger.
- `lampMood` remains the only persistent mood axis. Lightning is always a transient override.
- Reduced motion: no lightning pulses.

### Suggested atmosphere factory signature

```js
createAtmosphere({
  reduced,
  getLampMood,
  pulseWindowFlash,
  windowPane,
})
```

## Architecture constraints (preserved)

- Mode flow and `setMode()` unchanged.
- Content stays in `src/content/`; no hardcoded page copy.
- Local ES-module imports keep `.js` extensions.
- GSAP for lamp mood / hover lifts; engine tick for rain / lightning timing.
- Rendering philosophy: realtime PBR; scene lights only via `lighting.js`.

## Verification

- `npm test`
- `npm run build`
- Manual Vite pass:
  - No hover text on any interactable
  - Hover lift / tint / pointer cursor still work
  - Lamp on/off: glow and spot read inside the shade
  - Rain layers visible and parallax-separated at the window
  - Lightning double-flash ~5–10s; mood restores after flash
  - Lamp bright vs dim: flash does not permanently override mood
  - `prefers-reduced-motion`: no rain, no lightning

## Implementation notes

- Prefer extending existing modules over new packages.
- Do not commit `dist/` or `node_modules/`.
- Update `src/scene/AGENTS.md` and `src/render/AGENTS.md` with the flash API and multi-layer atmosphere contract.
