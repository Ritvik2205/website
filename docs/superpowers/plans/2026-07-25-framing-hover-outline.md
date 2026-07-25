# Framing, Desk Density, Lamp Intensity & Hover Outline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix idle framing (no parallax, closer camera), densify the desk layout, lower and re-anchor the lamp light, and replace hover lift/tint with soft silhouette outlines.

**Architecture:** Keep the existing composition root and mode flow. Camera rig drops idle parallax and uses a closer `HOME`. Desk geometry and `LAYOUT` poses compress toward center. Lamp spot max intensity drops; shade-local attach moves the source behind the shade. Interactions build inverted-hull outline meshes and toggle visibility on hover.

**Tech Stack:** Vite, vanilla ES modules, three.js, GSAP, Vitest

## Global Constraints

- Do not change interaction IDs or the `intro → idle → zoomed → closing → idle` mode flow.
- Desk surface stays near `y = 0.42`; wall near `z = -1.2`.
- Soft silhouette outlines only (inverted hull / BackSide); no OutlinePass or EdgesGeometry.
- Keep `.js` extensions on local ES-module imports.
- Do not commit `dist/` or `node_modules/`.

## File map

| File | Responsibility |
|------|----------------|
| `src/core/cameraRig.js` | Fixed closer HOME; no parallax update |
| `src/core/interactions.js` | Outline meshes; no Y-lift / tint |
| `src/scene/environment.js` | Shallower desk boxes + edge |
| `src/scene/layout.js` | Denser poses + camera anchors |
| `src/render/lighting.js` | Lower spot intensity; attach behind shade |
| `src/scene/lamp.js` | Glow / shadeLocal sync with attach |
| `src/scene/corkboard.js` | Drop `skipHoverLift` |
| `src/core/AGENTS.md`, `AGENTS.md`, `docs/design/2026-07-21-realtime-pbr-rendering.md` | Parallax / hover contract docs |
| `tests/interactions-hover.test.js` | Outline-on-hover assertions |
| `tests/correspondence-ledger.test.js` | Remove skipHoverLift expectations |
| `tests/camera-rig.test.js` | No parallax offset; closer HOME |
| `tests/layout-density.test.js` | Desk depth + denser poses |
| `tests/lighting-window-flash.test.js` | Max lamp intensity ceiling |

---

### Task 1: Fixed closer camera (no idle parallax)

**Files:**
- Modify: `src/core/cameraRig.js`
- Modify: `src/core/AGENTS.md`, `AGENTS.md`, `docs/design/2026-07-21-realtime-pbr-rendering.md`
- Create: `tests/camera-rig.test.js`

**Interfaces:**
- Produces: `HOME.position.z === 1.85`; `setParallaxEnabled` no-op; `update()` does not move camera from pointer

- [ ] **Step 1: Write failing test** in `tests/camera-rig.test.js` asserting closer HOME and no pointer motion on `update`
- [ ] **Step 2: Run** `npm test -- tests/camera-rig.test.js` — expect FAIL
- [ ] **Step 3: Implement** `cameraRig.js`: HOME z=1.85; remove parallax listeners/update; keep flyTo/flyHome; setParallaxEnabled/setPointer no-ops; update docs
- [ ] **Step 4: Run test** — expect PASS
- [ ] **Step 5: Commit** `fix: lock idle camera closer without mouse parallax`

### Task 2: Shallower desk and denser LAYOUT

**Files:** `src/scene/environment.js`, `src/scene/layout.js`, `tests/layout-density.test.js`

- [ ] **Step 1: Write** `tests/layout-density.test.js` — desk BoxGeometry depth 1.35; laptop/lamp X gap < 0.5
- [ ] **Step 2: Run** — expect FAIL
- [ ] **Step 3: Desk** depth 1.35 at z=-0.525; edge at z=0.15
- [ ] **Step 4: Compress LAYOUT + CAMERA_ANCHORS (laptop x=0.55, lamp x=0.95, vinyl x=-0.72, etc.)
- [ ] **Step 5: Run** — PASS; **Commit** `feat: shallow desk depth and denser object layout`

### Task 3: Lower lamp intensity; light behind shade

**Files:** `src/render/lighting.js`, `src/scene/lamp.js`, `tests/lighting-window-flash.test.js`

- [ ] **Step 1: Add test** warm mood intensity between 5 and 7.5
- [ ] **Step 2: Run** — FAIL
- [ ] **Step 3: Max intensity 7; default shadeLocal z negative; sync glow in lamp.js
- [ ] **Step 4: Run** — PASS; **Commit** `fix: dim lamp spot and anchor glow behind shade`

### Task 4: Soft silhouette hover outlines

**Files:** `src/core/interactions.js`, `src/scene/corkboard.js`, `src/core/AGENTS.md`, hover/ledger tests

- [ ] **Step 1: Rewrite hover test** for outline meshes; remove skipHoverLift from ledger tests
- [ ] **Step 2: Run** — FAIL
- [ ] **Step 3: Implement** inverted-hull outlines; remove lift/tint; drop skipHoverLift; ensureOutlines for late GLBs
- [ ] **Step 4:** `npm test && npm run build`; **Commit** `feat: replace hover lift with soft silhouette outlines`

### Task 5: Manual visual pass

- [ ] Vite: fixed camera, denser desk, dimmer lamp behind shade, outline-only hover, corkboard no outline, Escape/fly-home

## Spec coverage

Camera → T1; desk/layout → T2; lamp → T3; hover outline → T4; manual → T5; docs → T1/T4
