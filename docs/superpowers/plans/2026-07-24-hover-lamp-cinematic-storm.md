# Hover Labels, Lamp Attachment & Cinematic Window Storm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove hover text labels, attach lamp glow/spot inside the shade, and upgrade the window to a cinematic storm with layered rain and occasional lightning tied to mood.

**Architecture:** Keep lights in `lighting.js` (add transient `pulseWindowFlash`). Keep window FX in `atmosphere.js` (storm plane + three rain layers + lightning timer). Environment exposes a wet `windowPane` mesh for atmosphere to drive. Hover labels are deleted from interactions/CSS; lift/tint/cursor stay.

**Tech Stack:** Vite 8, vanilla ES modules, three.js 0.185, GSAP 3.15, Vitest 4.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-24-hover-lamp-cinematic-storm-design.md`.
- Follow `docs/design/2026-07-21-realtime-pbr-rendering.md`.
- Scene lights only via `src/render/lighting.js`.
- Preserve IDs `projects`, `gallery`, `blog`, `music`, `experience`, and `lamp`.
- Preserve `intro → idle → zoomed(target) → closing → idle`.
- `lampMood` ∈ `[0.15, 1]` remains the only persistent mood axis; lightning is transient.
- Atmosphere stays localized to the window (no room-wide fog/particles).
- Respect `prefers-reduced-motion` (no rain, no lightning).
- Keep `.js` extensions on local imports.
- Do not commit generated `dist/` or `node_modules/`.

## File Structure

Create:

- `tests/interactions-hover.test.js` — asserts no hover-label DOM.
- `tests/lighting-window-flash.test.js` — asserts `pulseWindowFlash` restores mood.
- `tests/atmosphere-storm.test.js` — asserts reduced-motion silence and layered rain when motion allowed.

Modify:

- `src/core/interactions.js` — remove hover label element and updates.
- `src/styles/main.css` — remove `.hover-label` rules.
- `src/core/AGENTS.md` — drop hover-label mention.
- `src/render/lighting.js` — tighter shade attach + `pulseWindowFlash`.
- `src/scene/lamp.js` — shade-local glow; re-attach after GLB load.
- `src/scene/environment.js` — wetter pane; return `windowPane`.
- `src/scene/atmosphere.js` — storm plane, rain layers, lightning.
- `src/main.js` — wire atmosphere hooks + pane.
- `src/scene/AGENTS.md` — multi-layer atmosphere + pane contract.
- `src/render/AGENTS.md` — `pulseWindowFlash` contract.

---

### Task 1: Remove Hover Labels

**Files:**
- Modify: `src/core/interactions.js`
- Modify: `src/styles/main.css`
- Modify: `src/core/AGENTS.md`
- Create: `tests/interactions-hover.test.js`

**Interfaces:**
- Consumes: existing `createInteractions(camera, domElement)` API.
- Produces: same `{ register, update, setEnabled }` return shape; no DOM label side effects.

- [ ] **Step 1: Write the failing test**

Create `tests/interactions-hover.test.js`:

```js
import { afterEach, describe, expect, it, vi } from 'vitest';

const gsap = vi.hoisted(() => ({ to: vi.fn() }));
vi.mock('gsap', () => ({ default: gsap }));

import { createInteractions } from '../src/core/interactions.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('createInteractions hover UI', () => {
  it('does not create a hover-label element', () => {
    const created = [];
    vi.stubGlobal('document', {
      body: { appendChild: vi.fn((el) => created.push(el)), style: {} },
      createElement: vi.fn((tag) => {
        const el = {
          tagName: tag.toUpperCase(),
          className: '',
          style: {},
          textContent: '',
        };
        return el;
      }),
    });

    const camera = { /* unused by construction */ };
    const dom = { addEventListener: vi.fn() };
    createInteractions(camera, dom);

    expect(document.createElement).not.toHaveBeenCalled();
    expect(document.body.appendChild).not.toHaveBeenCalled();
    expect(created.every((el) => el.className !== 'hover-label')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/interactions-hover.test.js`

Expected: FAIL because `createInteractions` still calls `document.createElement('div')` and appends `.hover-label`.

- [ ] **Step 3: Remove label DOM from interactions**

In `src/core/interactions.js`, delete the `labelEl` creation/append, the `labelEl.style.transform` update in `pointermove`, and the `labelEl.textContent` / `labelEl.style.opacity` lines in `setHover`. Keep cursor + `applyHover` behavior.

- [ ] **Step 4: Remove CSS and update core AGENTS**

Delete the `.hover-label { ... }` block from `src/styles/main.css`.

In `src/core/AGENTS.md`, change the interactions bullet from mentioning hover labels to:

```md
- `interactions.js` owns raycast registration, hover color/lift effects, and click dispatch.
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/interactions-hover.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/interactions-hover.test.js src/core/interactions.js src/styles/main.css src/core/AGENTS.md
git commit -m "$(cat <<'EOF'
Remove floating hover labels from desk interactions.

Keep cursor, tint, and lift feedback so objects stay discoverable without text overlays.
EOF
)"
```

---

### Task 2: Window Flash API + Shade-Local Lamp Attach

**Files:**
- Modify: `src/render/lighting.js`
- Modify: `src/scene/lamp.js`
- Modify: `src/render/AGENTS.md`
- Create: `tests/lighting-window-flash.test.js`

**Interfaces:**
- Consumes: existing `createLighting(scene)`, `attachLampLight(lampGroup)`, `setLampMood`, `getLampMood`.
- Produces:
  - `pulseWindowFlash(amount: number): void` — `amount` in `[0, 1]`; boosts window light then restores via `applyMood(lampMood)`.
  - `attachLampLight(lampGroup, shadeLocalOffset?: THREE.Vector3)` — positions spot from lamp world position + shade offset (default `( -0.03, 0.48, 0.02 )` in lamp local space converted to world).

- [ ] **Step 1: Write the failing flash test**

Create `tests/lighting-window-flash.test.js`:

```js
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  createLighting,
  setLampMood,
  getLampMood,
  pulseWindowFlash,
  applyWindowFlashLevel,
} from '../src/render/lighting.js';

describe('window flash API', () => {
  it('scales window intensity above mood baseline and can clear back', () => {
    const scene = new THREE.Scene();
    const { windowLight } = createLighting(scene);
    setLampMood(0.15);
    const dimBaseline = windowLight.intensity;

    applyWindowFlashLevel(1);
    expect(windowLight.intensity).toBeGreaterThan(dimBaseline);
    expect(getLampMood()).toBeCloseTo(0.15);

    applyWindowFlashLevel(0);
    expect(windowLight.intensity).toBeCloseTo(dimBaseline, 3);
  });

  it('pulseWindowFlash aliases applyWindowFlashLevel', () => {
    const scene = new THREE.Scene();
    const { windowLight } = createLighting(scene);
    setLampMood(0.15);
    const dimBaseline = windowLight.intensity;
    pulseWindowFlash(0.8);
    expect(windowLight.intensity).toBeGreaterThan(dimBaseline);
    applyWindowFlashLevel(0);
  });
});
```

API to implement in `lighting.js`:

```js
let flashLevel = 0; // 0..1

export function applyWindowFlashLevel(amount) {
  flashLevel = THREE.MathUtils.clamp(amount, 0, 1);
  applyMood(lampMood);
}

export function pulseWindowFlash(amount) {
  applyWindowFlashLevel(amount);
}
```

Inside `applyMood`, after computing base `windowLight.intensity` from mood, add:

```js
windowLight.intensity += flashLevel * THREE.MathUtils.lerp(1.8, 0.7, (warm - 0.15) / 0.85);
```

Nudge color cooler when `flashLevel > 0`. Atmosphere drives the double-flash envelope by calling `applyWindowFlashLevel` each frame (Task 4).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lighting-window-flash.test.js`

Expected: FAIL — `applyWindowFlashLevel` / `pulseWindowFlash` not exported.

- [ ] **Step 3: Implement flash + improved attach in lighting.js**

Update `src/render/lighting.js`:

1. Add `flashLevel` module state and `applyWindowFlashLevel` / `pulseWindowFlash` as above.
2. In `applyMood`, multiply/add flash contribution into `windowLight.intensity` and cool the color slightly when `flashLevel > 0`. Flash contribution must be larger when `lampMood` is low.
3. Replace `attachLampLight` with shade-aware placement:

```js
export function attachLampLight(lampGroup, shadeLocal = new THREE.Vector3(-0.03, 0.48, 0.02)) {
  if (!lampSpot || !lampGroup) return;
  const shadeWorld = shadeLocal.clone();
  lampGroup.localToWorld(shadeWorld);
  lampSpot.position.copy(shadeWorld);
  lampSpot.angle = Math.PI / 6;
  lampSpot.penumbra = 0.55;
  if (lampTarget) {
    lampTarget.position.set(shadeWorld.x - 0.35, 0.42, shadeWorld.z + 0.45);
  }
}
```

Keep initial `createLighting` spot values as fallback before attach.

- [ ] **Step 4: Fix lamp.js glow + re-attach after load**

In `src/scene/lamp.js`:

1. Set glow initial position to shade-local inside cavity, e.g. `glow.position.set(-0.03, 0.48, 0.02)` for fallback; `glow.scale.setScalar(0.85)`.
2. On GLB loaded: compute a shade local offset (use `new THREE.Vector3(0, 0.42, 0.02)` as documented target for this asset) and set `glow.position.copy(offset)`; then `attachLampLight(group, offset)`.
3. Keep `queueMicrotask(() => attachLampLight(group))` for the fallback path before load finishes.

- [ ] **Step 5: Update render AGENTS.md**

Add to File Contracts for `lighting.js`:

```md
- `lighting.js`: `createLighting(scene)`, `setLampMood`, `getLampMood`, `attachLampLight(target, shadeLocal?)`, `applyWindowFlashLevel(amount)`, `pulseWindowFlash(amount)`. Flash is transient and must re-enter through `applyMood`; it is not a second mood axis.
```

- [ ] **Step 6: Run tests**

Run: `npm test -- tests/lighting-window-flash.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/render/lighting.js src/scene/lamp.js src/render/AGENTS.md tests/lighting-window-flash.test.js
git commit -m "$(cat <<'EOF'
Attach lamp spot/glow inside the shade and add window flash API.

Lets atmosphere drive transient lightning without owning scene lights.
EOF
)"
```

---

### Task 3: Wet Window Pane Export

**Files:**
- Modify: `src/scene/environment.js`
- Modify: `src/scene/AGENTS.md`

**Interfaces:**
- Consumes: existing `createEnvironment()`.
- Produces: `{ group, windowPane }` where `windowPane` is the glass `THREE.Mesh`.

- [ ] **Step 1: Write failing assertion in atmosphere test stub (source contract)**

Add to the upcoming `tests/atmosphere-storm.test.js` (create file now with just this test, or wait until Task 4 — prefer creating a minimal file):

```js
import { describe, expect, it, vi } from 'vitest';
import { createEnvironment } from '../src/scene/environment.js';

vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return actual;
});

describe('createEnvironment window pane', () => {
  it('returns a wet-glass windowPane mesh', () => {
    const env = createEnvironment();
    expect(env.windowPane).toBeTruthy();
    expect(env.windowPane.isMesh).toBe(true);
    expect(env.windowPane.material.roughness).toBeLessThan(0.12);
    expect(env.windowPane.material.metalness).toBeGreaterThan(0.08);
    expect(env.windowPane.material.emissiveIntensity).toBeGreaterThan(0.5);
  });
});
```

Note: `TextureLoader` may async-load maps for wood/plaster; pane uses solid Standard materials so this test should not depend on textures finishing.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/atmosphere-storm.test.js`

Expected: FAIL — `windowPane` undefined / roughness too high.

- [ ] **Step 3: Update environment pane**

In `src/scene/environment.js`, change pane material toward wet glass:

```js
const windowPane = new THREE.Mesh(
  new THREE.PlaneGeometry(0.6, 0.8),
  new THREE.MeshStandardMaterial({
    color: 0x8aa8b8,
    emissive: 0xa8c8dc,
    emissiveIntensity: 1.15,
    roughness: 0.06,
    metalness: 0.18,
    transparent: true,
    opacity: 0.92,
  }),
);
windowPane.name = 'windowPane';
```

Return `{ group, windowPane }`.

- [ ] **Step 4: Document in scene AGENTS**

Add:

```md
- `environment.js` returns `{ group, windowPane }`. Atmosphere may drive `windowPane.material.emissiveIntensity` for lightning; do not create lights in environment.
```

- [ ] **Step 5: Run test**

Run: `npm test -- tests/atmosphere-storm.test.js`

Expected: PASS for the environment pane test (atmosphere tests may still be absent/failing until Task 4).

- [ ] **Step 6: Commit**

```bash
git add src/scene/environment.js src/scene/AGENTS.md tests/atmosphere-storm.test.js
git commit -m "$(cat <<'EOF'
Expose a wetter window pane for cinematic storm atmosphere.

Atmosphere can pulse pane emissive without searching the scene graph.
EOF
)"
```

---

### Task 4: Cinematic Atmosphere (Storm + Rain Layers + Lightning)

**Files:**
- Modify: `src/scene/atmosphere.js`
- Modify: `tests/atmosphere-storm.test.js`
- Modify: `src/scene/AGENTS.md`

**Interfaces:**
- Consumes: `getLampMood()`, `applyWindowFlashLevel(amount)`, `windowPane` mesh.
- Produces:

```js
createAtmosphere({
  reduced = false,
  getLampMood = () => 1,
  applyWindowFlashLevel = () => {},
  windowPane = null,
} = {}) => ({ group, update })
```

- [ ] **Step 1: Extend failing tests**

Append to `tests/atmosphere-storm.test.js`:

```js
import { createAtmosphere } from '../src/scene/atmosphere.js';

describe('createAtmosphere cinematic storm', () => {
  it('creates no rain layers when reduced motion is set', () => {
    const { group } = createAtmosphere({ reduced: true });
    const lines = [];
    group.traverse((o) => { if (o.isLineSegments) lines.push(o); });
    expect(lines).toHaveLength(0);
  });

  it('creates multiple rain layers and a storm plane when motion is allowed', () => {
    const { group } = createAtmosphere({ reduced: false });
    const lines = [];
    let shaders = 0;
    group.traverse((o) => {
      if (o.isLineSegments) lines.push(o);
      if (o.isMesh && o.material?.isShaderMaterial) shaders += 1;
    });
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(shaders).toBeGreaterThanOrEqual(1);
  });

  it('drives applyWindowFlashLevel during a forced lightning update', () => {
    const levels = [];
    const pane = {
      material: { emissiveIntensity: 1.15 },
    };
    const { update } = createAtmosphere({
      reduced: false,
      getLampMood: () => 0.15,
      applyWindowFlashLevel: (v) => levels.push(v),
      windowPane: pane,
      // test-only override — implement as optional opts.__lightningIn = 0 to fire immediately
      lightningIn: 0,
    });

    // Advance enough frames for a double-flash envelope (~0.35s)
    for (let i = 0; i < 40; i++) update(1 / 60);
    expect(levels.some((v) => v > 0)).toBe(true);
    expect(levels[levels.length - 1]).toBe(0);
  });
});
```

Implement `lightningIn` as an optional number (seconds until next flash). Default: `5 + Math.random() * 5`.

- [ ] **Step 2: Run tests to verify new cases fail**

Run: `npm test -- tests/atmosphere-storm.test.js`

Expected: FAIL — only one line layer today; no shader storm; no flash driver.

- [ ] **Step 3: Implement atmosphere**

Rewrite `src/scene/atmosphere.js` with:

1. **Storm plane** — `PlaneGeometry(0.62, 0.82)` at `(2.2, 1.8, -1.28)`, `ShaderMaterial` with slow cloud noise / cool gradient (uniforms `uTime`, `uFlash`). `depthWrite: false`.
2. **Rain helper** — function `makeRainLayer({ count, z, speedScale, opacity, lengthScale })` returning `{ mesh, speeds, update(dt) }` using `LineSegments` + `LineBasicMaterial`.
3. **Three layers** when `!reduced`:
   - far: `count: 140`, `z: -1.22`, slower, lower opacity
   - mid: `count: 90`, `z: -1.18`
   - near: `count: 40`, `z: -1.155`, brighter, slightly longer
   X range ≈ `[1.92, 2.48]`, Y recycle ≈ `[1.4, 2.2]`, angled delta x ≈ `-0.01` to `-0.025`.
4. **Lightning state machine** in `update(dt)`:
   - Countdown `lightningIn`.
   - When due, run envelope over ~0.35s: peak → dip → second peak → 0 (double flash).
   - Each frame: `applyWindowFlashLevel(envelope)`; if `windowPane`, set `emissiveIntensity = baseEmissive + envelope * lerp(1.6, 0.5, moodT)`.
   - On finish: `applyWindowFlashLevel(0)`, restore pane emissive, schedule next `5 + random()*5`.
   - If `reduced`, skip entirely.
5. Store `baseEmissive` from `windowPane.material.emissiveIntensity` at create time (default `1.15`).

Keep export `{ group, update }`.

- [ ] **Step 4: Update scene AGENTS atmosphere bullet**

```md
- Atmosphere owns the window storm plane, three rain layers, and lightning timing. It calls `applyWindowFlashLevel` from lighting and may pulse `windowPane` emissive. Respect reduced-motion (no rain, no lightning).
```

- [ ] **Step 5: Run tests**

Run: `npm test -- tests/atmosphere-storm.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/scene/atmosphere.js src/scene/AGENTS.md tests/atmosphere-storm.test.js
git commit -m "$(cat <<'EOF'
Add cinematic window storm with layered rain and lightning pulses.

Keep weather local to the window and drive flashes through lighting API.
EOF
)"
```

---

### Task 5: Wire Composition Root + Full Verification

**Files:**
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `createEnvironment()` → `windowPane`; `applyWindowFlashLevel`, `getLampMood` from lighting; `createAtmosphere(...)`.
- Produces: running scene with wired storm.

- [ ] **Step 1: Update main.js imports and wiring**

```js
import { createLighting, attachLampLight, getLampMood, applyWindowFlashLevel } from './render/lighting.js';
// ...
const environment = createEnvironment();
scene.add(environment.group);
// ...
const atmosphere = createAtmosphere({
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  getLampMood,
  applyWindowFlashLevel,
  windowPane: environment.windowPane,
});
scene.add(atmosphere.group);
engine.onTick((dt) => atmosphere.update(dt));
```

Keep existing `attachLampLight(lamp.group)` after lamp creation (lamp.js also re-attaches on load).

- [ ] **Step 2: Run full test suite and build**

Run:

```bash
npm test
npm run build
```

Expected: all tests PASS; build succeeds with no errors.

- [ ] **Step 3: Manual Vite checklist**

Run: `npm run dev`

Verify:

1. No hover text on any desk object.
2. Hover still shows pointer + lift/tint.
3. Lamp glow/spot sit inside the shade (on and off).
4. Window shows storm plane + layered rain parallax.
5. Lightning double-flash roughly every 5–10s; room mood returns after.
6. With reduced motion enabled in OS/browser: no rain, no lightning.

- [ ] **Step 4: Commit**

```bash
git add src/main.js
git commit -m "$(cat <<'EOF'
Wire cinematic atmosphere to environment pane and lighting flash API.

Completes hover, lamp, and storm visual pass at the composition root.
EOF
)"
```

---

## Spec Coverage Checklist

| Spec requirement | Task |
|------------------|------|
| Remove hover label DOM/CSS | Task 1 |
| Keep hover lift/tint/cursor | Task 1 |
| Shade-local glow + spot attach after GLB | Task 2 |
| Tighten spot angle/penumbra | Task 2 |
| `pulseWindowFlash` / flash via lighting | Task 2 |
| Wet pane + expose mesh | Task 3 |
| Storm plane behind window | Task 4 |
| Far/mid/near rain layers | Task 4 |
| Lightning ~5–10s double-flash, mood-scaled | Task 4 |
| Reduced motion kills rain + lightning | Task 4 |
| main.js wiring | Task 5 |
| AGENTS updates | Tasks 1–4 |
| `npm test` + `npm run build` + manual | Task 5 |
