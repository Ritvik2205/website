# 3D Desk Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Context

Ritvik's portfolio site as an immersive first-person 3D desk scene (spec: `portfolio/docs/superpowers/specs/2026-07-05-3d-desk-portfolio-design.md`, approved 2026-07-05). Visitors sit at a rainy-London study desk; hovering objects glows them, clicking flies the camera in and crossfades to a DOM content page (projects / gallery / blog / music / experience). Greenfield — `portfolio/` dir is empty. Wireframe source: claude.ai/design option 2a + intro 1a + interaction flow 1d.

**Goal:** Working Vite + three.js + GSAP portfolio implementing the approved spec end-to-end with placeholder content.

**Architecture:** One persistent `THREE.Scene`; small state machine (`intro → idle → zoomed`); camera rig owns parallax + GSAP fly-to; raycaster-based interaction layer; content pages are DOM overlays fed from JSON/markdown data files.

**Tech Stack:** Vite (vanilla JS), three.js, GSAP, marked (markdown), vitest (smoke tests only).

## Global Constraints

- Vanilla JS ES modules. No UI framework.
- Libraries: `three`, `gsap`, `marked` only (+ `vitest` dev).
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
- Palette: bg #1a1810 → #3d3028; warm lamp #d4a868; desk wood #3d3028/#4a3d30; brick #4a3828/#3d3020.
- Pause 3D rendering while overlay fully covers canvas.
- Respect `prefers-reduced-motion`: skip intro fly-in, no parallax, fewer particles.
- All user-visible content from `src/content/` data files — no hardcoded content in components.
- Commit after every task. Repo root is `/Users/ritvikgupta/Documents/Code` (branch `feature1`); all paths below relative to `portfolio/`.

## World Coordinates (shared by all scene tasks)

Desk surface = plane at y=0.42, extends x∈[−1.3,1.3], z∈[−1.0,0.9]. Wall at z=−1.2. Floor y=0.
Camera HOME: position (0, 1.05, 1.7), lookAt (0, 0.65, −0.6).

| Object | group.position | zoom anchor position → lookAt |
|---|---|---|
| corkboard | (0, 1.35, −1.18) | (0, 1.35, −0.25) → (0, 1.35, −1.18) |
| vinyl+shelf | (−0.78, 0.42, −0.68) | (−0.78, 0.75, −0.15) → (−0.78, 0.48, −0.68) |
| lamp | (0.12, 0.42, −0.8) | — (toggle only, no zoom) |
| sketchbook | (0, 0.42, −0.3) | (0, 1.0, 0.05) → (0, 0.43, −0.3) |
| journal | (−0.55, 0.42, 0.3) | (−0.55, 0.95, 0.75) → (−0.55, 0.44, 0.3) |
| laptop | (0.72, 0.42, −0.05), rotY −0.45 | (0.55, 0.75, 0.45) → (0.72, 0.6, −0.05) |

## File Structure

```
portfolio/
  index.html                    # canvas + #ui root + font links
  package.json / vite.config.js
  src/
    main.js                     # wiring: engine + rig + interactions + overlays + intro
    core/engine.js              # renderer/scene/camera/loop/resize/pause
    core/state.js               # mode state machine
    core/cameraRig.js           # HOME, parallax, flyTo/flyHome
    core/interactions.js        # raycast hover/click, glow, lift, label
    scene/environment.js        # wall, window, desk, floor, lights
    scene/atmosphere.js         # dust motes, window rain
    scene/laptop.js  scene/sketchbook.js  scene/journal.js
    scene/vinyl.js   scene/lamp.js        scene/corkboard.js
    ui/overlay.js               # overlay manager (register/open/close)
    ui/intro.js                 # floppy → boot → fly-in
    ui/pages/projects.js  gallery.js  blog.js  music.js  corkboard.js
    content/loader.js  frontmatter.js
    content/projects.json  experience.json  gallery.json  site.json  blog/*.md
    styles/main.css  overlay.css  pages.css  intro.css
  tests/content.test.js
```

Every `scene/*.js` object module exports `create<Name>() → { group: THREE.Group, id: string, label: string }`. Interaction/zoom code only touches that interface — GLTF swap later means changing module internals only.

---

### Task 1: Scaffold Vite app

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/styles/main.css`, `.gitignore`

**Interfaces:**
- Produces: `index.html` with `<canvas id="scene">` and `<div id="ui">`; dev server on :5173.

- [ ] **Step 1: Init project + deps**

```bash
cd /Users/ritvikgupta/Documents/Code/portfolio
npm init -y
npm i three gsap marked
npm i -D vite vitest
```

Set in `package.json`: `"type": "module"`, scripts `{"dev": "vite", "build": "vite build", "preview": "vite preview", "test": "vitest run"}`.

- [ ] **Step 2: Write `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ritvik Gupta</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/src/styles/main.css" />
</head>
<body>
  <canvas id="scene"></canvas>
  <div id="ui"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Write `src/styles/main.css`**

```css
:root {
  --bg: #1a1810; --warm: #d4a868; --paper: #f0ebe0; --ink: #2a2a2a;
  --font-hand: 'Caveat', cursive; --font-mono: 'Space Mono', monospace;
}
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; background: var(--bg); overflow: hidden; }
#scene { position: fixed; inset: 0; width: 100%; height: 100%; display: block; }
#ui { position: fixed; inset: 0; pointer-events: none; }
#ui > * { pointer-events: auto; }
```

`src/main.js` for now: `console.log('boot')`. `vite.config.js`: `export default {}` (defaults). `.gitignore`: `node_modules`, `dist`.

- [ ] **Step 4: Verify dev server**

Run: `npm run dev` → open http://localhost:5173, expect dark page, console "boot", no errors.

- [ ] **Step 5: Commit** — `git add portfolio && git commit -m "feat: scaffold vite app for 3d portfolio"`

---

### Task 2: Engine core (`core/engine.js`)

**Files:**
- Create: `src/core/engine.js`, `src/core/state.js`; Modify: `src/main.js`

**Interfaces:**
- Produces: `createEngine(canvas) → { scene, camera, renderer, start(), onTick(fn(dt)), setRenderPaused(bool) }`
- Produces: `state = { mode, target }`, `setMode(mode, target?)`, `onModeChange(fn(state))`. Modes: `'intro' | 'idle' | 'zoomed'`.

- [ ] **Step 1: Write `src/core/engine.js`**

```js
import * as THREE from 'three';

export function createEngine(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1810);
  scene.fog = new THREE.Fog(0x1a1810, 2.5, 7);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 20);

  const tickFns = [];
  let paused = false;
  const clock = new THREE.Clock();

  function loop() {
    const dt = clock.getDelta();
    if (paused) return;
    for (const fn of tickFns) fn(dt);
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    scene, camera, renderer,
    start: () => renderer.setAnimationLoop(loop),
    onTick: (fn) => tickFns.push(fn),
    setRenderPaused: (v) => { paused = v; },
  };
}
```

- [ ] **Step 2: Write `src/core/state.js`**

```js
const listeners = [];
export const state = { mode: 'intro', target: null };

export function setMode(mode, target = null) {
  state.mode = mode;
  state.target = target;
  for (const fn of listeners) fn(state);
}

export function onModeChange(fn) { listeners.push(fn); }
```

- [ ] **Step 3: Wire `src/main.js`** — create engine, position camera at HOME values from World Coordinates table, add temporary `new THREE.Mesh(new THREE.BoxGeometry(0.3,0.3,0.3), new THREE.MeshStandardMaterial({color:0x4a3d30}))` at (0,0.5,−0.3) plus a `THREE.PointLight(0xd4a868, 2, 5)` at (0,1.5,0), `engine.start()`.

- [ ] **Step 4: Verify** — dev server: warm-lit box on dark bg, resizes cleanly.

- [ ] **Step 5: Commit** — `git commit -m "feat: three.js engine core and state machine"`

---

### Task 3: Environment + lighting (`scene/environment.js`)

**Files:**
- Create: `src/scene/environment.js`; Modify: `src/main.js` (replace temp box)

**Interfaces:**
- Produces: `createEnvironment() → { group, lampLight }` — `lampLight` is the `THREE.SpotLight` the lamp toggle (Task 7) controls.

- [ ] **Step 1: Write `src/scene/environment.js`**

Build in one `THREE.Group`:
- **Desk**: `BoxGeometry(2.6, 0.06, 1.9)` at (0, 0.39, −0.05), `MeshStandardMaterial({ color: 0x4a3d30, roughness: 0.85 })`; 4 legs `BoxGeometry(0.06, 0.39, 0.06)`, color 0x3d3028. `receiveShadow = true` on top.
- **Floor**: `PlaneGeometry(8, 8)` rotX −π/2 at y=0, color 0x14120c.
- **Brick wall**: `PlaneGeometry(8, 4)` at (0, 2, −1.2). Brick via `CanvasTexture`: 512×256 canvas, fill #3d3020, draw staggered 60×22 brick rects #4a3828 with 4px #2a2018 mortar gaps, `texture.repeat.set(3, 2)`, `wrapS = wrapT = THREE.RepeatWrapping`.
- **Window**: on wall right side at (1.5, 1.7, −1.19): frame `BoxGeometry(0.7, 0.9, 0.04)` color 0x2a2420; pane `PlaneGeometry(0.6, 0.8)` `MeshStandardMaterial({ color: 0x1e2630, emissive: 0x16202e, emissiveIntensity: 0.6 })` (cool foggy night glow). Rain animates in Task 9.
- **Lights**: `AmbientLight(0x2a2420, 0.5)`; cool window `RectAreaLight`-substitute `PointLight(0x4a6a8a, 0.8, 4)` at (1.5, 1.7, −0.9); **lampLight** `SpotLight(0xd4a868, 0, 3, Math.PI/5, 0.5, 1.2)` at (0.12, 1.05, −0.8) targeting (0, 0.42, −0.3) — intensity 0 until lamp built (lamp task sets 2.2), `castShadow = true`.

- [ ] **Step 2: Wire into `main.js`**, remove temp box, keep a temporary `SpotLight` intensity of 2.2 so scene is visible pre-lamp.

- [ ] **Step 3: Verify** — dark study: brick wall, glowing cool window, wood desk, warm pool of light on desk center.

- [ ] **Step 4: Commit** — `git commit -m "feat: room environment with brick wall, window, desk, lighting"`

---

### Task 4: Camera rig with parallax (`core/cameraRig.js`)

**Files:**
- Create: `src/core/cameraRig.js`; Modify: `src/main.js`

**Interfaces:**
- Consumes: `engine.camera`, `engine.onTick`.
- Produces: `createCameraRig(camera) → { update(dt), setParallaxEnabled(bool), flyTo(anchor) → Promise, flyHome() → Promise }`. Anchor shape: `{ position: {x,y,z}, lookAt: {x,y,z} }`.

- [ ] **Step 1: Write `src/core/cameraRig.js`**

```js
import * as THREE from 'three';
import gsap from 'gsap';

const HOME = {
  position: new THREE.Vector3(0, 1.05, 1.7),
  lookAt: new THREE.Vector3(0, 0.65, -0.6),
};
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createCameraRig(camera) {
  let parallaxOn = true;
  const pointer = { x: 0, y: 0 };
  const lookTarget = HOME.lookAt.clone();

  camera.position.copy(HOME.position);
  camera.lookAt(lookTarget);

  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  function update() {
    if (!parallaxOn || REDUCED) return;
    const tx = HOME.position.x + pointer.x * 0.25;
    const ty = HOME.position.y - pointer.y * 0.08;
    camera.position.x += (tx - camera.position.x) * 0.05;
    camera.position.y += (ty - camera.position.y) * 0.05;
    lookTarget.x += (HOME.lookAt.x + pointer.x * 0.4 - lookTarget.x) * 0.05;
    camera.lookAt(lookTarget);
  }

  function tween(pos, look) {
    const tl = gsap.timeline({ defaults: { duration: 1.2, ease: 'power2.inOut' } });
    tl.to(camera.position, { x: pos.x, y: pos.y, z: pos.z }, 0);
    tl.to(lookTarget, {
      x: look.x, y: look.y, z: look.z,
      onUpdate: () => camera.lookAt(lookTarget),
    }, 0);
    return tl.then();
  }

  return {
    update,
    setParallaxEnabled: (v) => { parallaxOn = v; },
    flyTo: (a) => { parallaxOn = false; return tween(a.position, a.lookAt); },
    flyHome: async () => { await tween(HOME.position, HOME.lookAt); parallaxOn = true; },
    HOME,
  };
}
```

- [ ] **Step 2: Wire** — `engine.onTick(() => rig.update())` in `main.js`.

- [ ] **Step 3: Verify** — cursor left/right pans view revealing desk edges; smooth lag.

- [ ] **Step 4: Commit** — `git commit -m "feat: camera rig with cursor parallax and gsap fly-to"`

---

### Task 5: Interaction system (`core/interactions.js`)

**Files:**
- Create: `src/core/interactions.js`; Modify: `src/main.js`, `src/styles/main.css`

**Interfaces:**
- Produces: `createInteractions(camera, domElement) → { register(item), update(), setEnabled(bool) }` where `item = { group, id, label, onClick(item) }`.
- Contract: registered group lifts +0.04y and glows emissive 0x8a5a20 on hover; hand-written label follows cursor.

- [ ] **Step 1: Write `src/core/interactions.js`**

```js
import * as THREE from 'three';
import gsap from 'gsap';

export function createInteractions(camera, domElement) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(-2, -2);
  const items = [];
  let enabled = true;
  let hovered = null;

  const labelEl = document.createElement('div');
  labelEl.className = 'hover-label';
  document.getElementById('ui').appendChild(labelEl);

  domElement.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    labelEl.style.transform = `translate(${e.clientX + 16}px, ${e.clientY - 8}px)`;
  });
  domElement.addEventListener('click', () => {
    if (enabled && hovered) hovered.onClick(hovered);
  });

  function register(item) {
    item.baseY = item.group.position.y;
    item.group.traverse((o) => {
      if (o.isMesh && o.material?.emissive) {
        o.userData.baseEmissive = o.material.emissive.getHex();
      }
    });
    items.push(item);
  }

  function setHover(item) {
    if (hovered === item) return;
    if (hovered) applyHover(hovered, false);
    hovered = item;
    if (hovered) applyHover(hovered, true);
    document.body.style.cursor = hovered ? 'pointer' : 'default';
    labelEl.textContent = hovered ? hovered.label : '';
    labelEl.style.opacity = hovered ? 1 : 0;
  }

  function applyHover(item, on) {
    item.group.traverse((o) => {
      if (o.isMesh && o.material?.emissive) {
        o.material.emissive.setHex(on ? 0x8a5a20 : o.userData.baseEmissive);
      }
    });
    gsap.to(item.group.position, {
      y: item.baseY + (on ? 0.04 : 0), duration: 0.35, ease: 'power2.out',
    });
  }

  function update() {
    if (!enabled) { setHover(null); return; }
    raycaster.setFromCamera(pointer, camera);
    let found = null;
    for (const item of items) {
      if (raycaster.intersectObject(item.group, true).length) { found = item; break; }
    }
    setHover(found);
  }

  return { register, update, setEnabled: (v) => { enabled = v; if (!v) setHover(null); } };
}
```

- [ ] **Step 2: Add label CSS to `main.css`**

```css
.hover-label {
  position: fixed; top: 0; left: 0; opacity: 0; pointer-events: none;
  font: 600 22px var(--font-hand); color: var(--warm);
  text-shadow: 0 2px 8px rgba(0,0,0,.8); transition: opacity .2s;
}
```

- [ ] **Step 3: Wire + verify** — `engine.onTick(() => interactions.update())`; register temp box with label "test", confirm glow/lift/label/cursor, click logs id.

- [ ] **Step 4: Commit** — `git commit -m "feat: raycast hover and click interaction system"`

---

### Task 6: Desk objects — laptop, sketchbook, journal

**Files:**
- Create: `src/scene/laptop.js`, `src/scene/sketchbook.js`, `src/scene/journal.js`; Modify: `src/main.js`

**Interfaces:**
- Produces: `createLaptop() / createSketchbook() / createJournal() → { group, id, label }` — ids `'projects'`, `'gallery'`, `'blog'`; labels `'projects'`, `'sketches & photos'`, `'journal'`. Positions/rotations per World Coordinates table, set inside each module.

- [ ] **Step 1: Write `src/scene/laptop.js`**

```js
import * as THREE from 'three';

export function createLaptop() {
  const group = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.3), dark);
  base.position.y = 0.01;

  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.015), dark.clone());
  lid.position.set(0, 0.15, -0.14);
  lid.rotation.x = -0.22;

  // screen: canvas texture with mono "terminal" text
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 320;
  const g = cv.getContext('2d');
  g.fillStyle = '#0a0a18'; g.fillRect(0, 0, 512, 320);
  g.font = '24px monospace';
  g.fillStyle = '#5a8aff'; g.fillText('$ ~/projects', 24, 48);
  g.fillStyle = '#4a8a4a';
  ['├── portfolio', '├── ml-engine', '└── api-server'].forEach((t, i) => g.fillText(t, 24, 92 + i * 40));
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.38, 0.24),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cv), emissive: 0x223344, emissiveIntensity: 0.7 })
  );
  screen.position.set(0, 0.15, -0.131);
  screen.rotation.x = -0.22;

  group.add(base, lid, screen);
  group.position.set(0.72, 0.42, -0.05);
  group.rotation.y = -0.45;
  return { group, id: 'projects', label: 'projects' };
}
```

- [ ] **Step 2: Write `src/scene/sketchbook.js`** — same pattern: open book = two `BoxGeometry(0.24, 0.015, 0.3)` page slabs color 0xf0ebe0 (`roughness: 0.9`) angled ±0.06 rad about z meeting at spine; center spine `BoxGeometry(0.015, 0.02, 0.3)` color 0xbbb3a0; canvas-texture top face on left page with pencil-gray sketch doodle lines (`#999` strokes on `#f0ebe0`); 3 pencils beside: `CylinderGeometry(0.006, 0.006, 0.14)` colors 0xd4a030 / 0x666666 / 0xc44444, laid flat (rotZ π/2, rotY ~0.5), at x+0.18. `group.position.set(0, 0.42, -0.3)`, rotY 0.04. id `'gallery'`.

- [ ] **Step 3: Write `src/scene/journal.js`** — closed leather book: cover `BoxGeometry(0.22, 0.05, 0.3)` color 0x6b4423 roughness 0.9; spine `BoxGeometry(0.03, 0.055, 0.3)` color 0x4a2f15 on left edge; page block `BoxGeometry(0.2, 0.035, 0.28)` color 0xf0e8d8 inset; strap `BoxGeometry(0.24, 0.012, 0.03)` color 0x4a2f15 across top. Canvas texture "JOURNAL" in Caveat 48px #d4b896 on cover top face. `group.position.set(-0.55, 0.42, 0.3)`, rotY 0.35. id `'blog'`.

- [ ] **Step 4: Wire all three in `main.js`** — create, `scene.add(o.group)`, `interactions.register({ ...o, onClick: (i) => console.log('open', i.id) })`. Remove temp box.

- [ ] **Step 5: Verify** — three objects placed per wireframe (journal front-left large, sketchbook center-lit, laptop right angled); each hovers with glow + label; clicks log ids.

- [ ] **Step 6: Commit** — `git commit -m "feat: laptop, sketchbook, journal desk objects"`

---

### Task 7: Desk objects — vinyl, lamp (toggle), corkboard

**Files:**
- Create: `src/scene/vinyl.js`, `src/scene/lamp.js`, `src/scene/corkboard.js`; Modify: `src/main.js`

**Interfaces:**
- Consumes: `environment.lampLight` (Task 3).
- Produces: `createVinyl() → { group, id: 'music', label: 'now spinning', setSpinning(bool), update(dt) }` — platter rotates when spinning.
- Produces: `createLamp(lampLight) → { group, id: 'lamp', label: 'lights', toggle() }` — toggle tweens `lampLight.intensity` 2.2 ↔ 0.15 and shade emissive.
- Produces: `createCorkboard() → { group, id: 'experience', label: 'the board' }`.

- [ ] **Step 1: Write `src/scene/vinyl.js`** — plinth `BoxGeometry(0.34, 0.05, 0.28)` color 0x1a1a1a; platter `CylinderGeometry(0.11, 0.11, 0.012, 32)` color 0x111111 with center label `CylinderGeometry(0.035, 0.035, 0.013, 24)` color 0xc44444, both in a `platterGroup` at (0.02, 0.035, 0); tonearm `CylinderGeometry(0.004, 0.004, 0.13)` color 0x888888 angled from back-right corner; record shelf: 5 thin `BoxGeometry(0.008, 0.16..0.19, 0.16)` sleeves colors 0x1a1a1a–0x2a2a2a leaning at x−0.24. `update(dt)`: if spinning, `platterGroup.rotation.y += dt * 2.4`. `group.position.set(-0.78, 0.42, -0.68)`. Spinning defaults true (ambient motion).

- [ ] **Step 2: Write `src/scene/lamp.js`** — base `CylinderGeometry(0.06, 0.08, 0.02, 24)` color 0x5a4a30; stem `CylinderGeometry(0.008, 0.008, 0.45)`; shade `SphereGeometry(0.09, 24, 12, 0, Math.PI*2, 0, Math.PI/2)` (dome) color 0x8a6a3a, `emissive 0xd4a868, emissiveIntensity 0.9` when on; **switch**: small `BoxGeometry(0.02, 0.015, 0.02)` color 0xc44444 on base front. `toggle()`: gsap tween `lampLight.intensity` → 0.15 (off) / 2.2 (on), shade `emissiveIntensity` → 0.05 / 0.9, 0.3s. `group.position.set(0.12, 0.42, -0.8)`. In `main.js` register with `onClick: () => lamp.toggle()` (no zoom).

- [ ] **Step 3: Write `src/scene/corkboard.js`** — board `BoxGeometry(1.1, 0.55, 0.03)` color 0x7a5f3a + frame strips `BoxGeometry` color 0x5a4a30; 6 pinned note planes `PlaneGeometry(0.14..0.2, 0.1..0.16)` at z 0.02, colors: sticky 0xf5e6a0, ruled 0xffffff, polaroid 0xe8e4e0, pink 0xfad4d4, blue 0xd4eaf5 — each rotZ ±0.03..0.07; pin spheres `SphereGeometry(0.008)` colors 0xc44444/0x4488aa/0x44aa88 at note tops; red strings: `THREE.Line` with `LineBasicMaterial({ color: 0xc44444, transparent: true, opacity: 0.7 })` connecting 3 pin pairs, each line sagging via 3-point `CatmullRomCurve3`. `group.position.set(0, 1.35, -1.18)`. id `'experience'`.

- [ ] **Step 4: Wire, add `engine.onTick((dt) => vinyl.update(dt))`.**

- [ ] **Step 5: Verify** — vinyl platter spins; lamp switch click dims/relights scene warmly; corkboard on wall with notes + sagging red strings; hovers work on all three (lamp label "lights").

- [ ] **Step 6: Commit** — `git commit -m "feat: vinyl, toggleable lamp, corkboard objects"`

---

### Task 8: Zoom flow + overlay manager

**Files:**
- Create: `src/ui/overlay.js`, `src/styles/overlay.css`; Modify: `src/main.js`, `index.html` (link overlay.css)

**Interfaces:**
- Consumes: `rig.flyTo/flyHome`, `interactions.setEnabled`, `engine.setRenderPaused`, `setMode`.
- Produces: `createOverlayManager(root) → { register(id, el), open(id) → Promise, close() → Promise, isOpen() }`. Pages get wrapped with back button (`.overlay-back`) automatically.
- Produces in `main.js`: `ANCHORS` map `{ projects, gallery, blog, music, experience }` from World Coordinates table; `openItem(id)` / `closeItem()` used by all pages + ESC.

- [ ] **Step 1: Write `src/ui/overlay.js`**

```js
import gsap from 'gsap';

export function createOverlayManager(root) {
  const pages = new Map();
  let current = null;
  let onCloseRequest = null;

  function register(id, el) {
    const wrap = document.createElement('div');
    wrap.className = 'overlay-page';
    const back = document.createElement('button');
    back.className = 'overlay-back';
    back.textContent = '← back to desk';
    back.addEventListener('click', () => onCloseRequest?.());
    wrap.append(back, el);
    root.appendChild(wrap);
    pages.set(id, wrap);
  }

  async function open(id) {
    current = pages.get(id);
    current.classList.add('visible');
    await gsap.fromTo(current, { opacity: 0 }, { opacity: 1, duration: 0.45 }).then();
  }

  async function close() {
    if (!current) return;
    await gsap.to(current, { opacity: 0, duration: 0.35 }).then();
    current.classList.remove('visible');
    current = null;
  }

  return { register, open, close, isOpen: () => !!current,
           setCloseHandler: (fn) => { onCloseRequest = fn; } };
}
```

- [ ] **Step 2: Write `src/styles/overlay.css`**

```css
.overlay-page {
  position: fixed; inset: 0; display: none; overflow-y: auto;
  background: rgba(16, 14, 10, 0.97); color: var(--paper);
}
.overlay-page.visible { display: block; }
.overlay-back {
  position: fixed; top: 20px; left: 24px; z-index: 10; cursor: pointer;
  background: none; border: 1px solid var(--warm); border-radius: 6px;
  color: var(--warm); font: 600 20px var(--font-hand); padding: 6px 14px;
}
.overlay-back:hover { background: rgba(212, 168, 104, 0.15); }
```

- [ ] **Step 3: Wire zoom flow in `main.js`**

```js
const ANCHORS = {
  projects:   { position: { x: 0.55, y: 0.75, z: 0.45 },  lookAt: { x: 0.72, y: 0.6,  z: -0.05 } },
  gallery:    { position: { x: 0,    y: 1.0,  z: 0.05 },  lookAt: { x: 0,    y: 0.43, z: -0.3 } },
  blog:       { position: { x: -0.55, y: 0.95, z: 0.75 }, lookAt: { x: -0.55, y: 0.44, z: 0.3 } },
  music:      { position: { x: -0.78, y: 0.75, z: -0.15 }, lookAt: { x: -0.78, y: 0.48, z: -0.68 } },
  experience: { position: { x: 0,    y: 1.35, z: -0.25 }, lookAt: { x: 0,    y: 1.35, z: -1.18 } },
};

async function openItem(id) {
  if (state.mode !== 'idle') return;
  setMode('zoomed', id);
  interactions.setEnabled(false);
  await rig.flyTo(ANCHORS[id]);
  await overlays.open(id);
  engine.setRenderPaused(true);
}

async function closeItem() {
  if (state.mode !== 'zoomed') return;
  engine.setRenderPaused(false);
  await overlays.close();
  await rig.flyHome();
  interactions.setEnabled(true);
  setMode('idle');
}

overlays.setCloseHandler(closeItem);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeItem(); });
```

Register 5 placeholder pages (`<h1>` + id) so flow is testable now. Object `onClick` → `openItem(item.id)` (lamp keeps `toggle()`).

- [ ] **Step 4: Verify** — click each object: camera flies in, page fades over, render pauses (check via `spinning` vinyl frozen behind overlay is fine — it's hidden); back button + ESC reverse fully; parallax resumes; double-click spam does not break state.

- [ ] **Step 5: Commit** — `git commit -m "feat: camera zoom flow with dom overlay manager"`

---

### Task 9: Atmosphere (`scene/atmosphere.js`)

**Files:**
- Create: `src/scene/atmosphere.js`; Modify: `src/main.js`, `src/scene/environment.js` (export window pane position)

**Interfaces:**
- Produces: `createAtmosphere({ reduced }) → { group, update(dt) }`.

- [ ] **Step 1: Dust motes** — `THREE.Points`: 120 positions (40 if `reduced` or `navigator.maxTouchPoints > 0`) random in box x±1.3, y 0.5–2, z −1.1–0.8; `PointsMaterial({ color: 0xd4a868, size: 0.008, transparent: true, opacity: 0.35 })`. `update`: drift each y by `sin(t + i)` small amplitude, slow x drift, wrap around.

- [ ] **Step 2: Window rain** — 60 short `LineSegments` in window pane bounds (x 1.2–1.8, y 1.3–2.1, z −1.185), material `LineBasicMaterial({ color: 0x6a8aaa, transparent: true, opacity: 0.4 })`; `update`: translate y downward, wrap to top. Skip entirely when `reduced`.

- [ ] **Step 3: Wire + verify** — subtle motes in lamp light, rain streaks in window. FPS stays ~60 (check devtools performance overlay).

- [ ] **Step 4: Commit** — `git commit -m "feat: dust motes and window rain atmosphere"`

---

### Task 10: Content data + loader + smoke tests

**Files:**
- Create: `src/content/projects.json`, `experience.json`, `gallery.json`, `site.json`, `blog/first-post.md`, `blog/second-post.md`, `src/content/frontmatter.js`, `src/content/loader.js`
- Test: `tests/content.test.js`

**Interfaces:**
- Produces: `loadContent() → { projects, experience, gallery, site, posts }` (synchronous imports, exported async for future fetch swap). `posts: [{ slug, title, date, body }]` sorted by date desc.
- Produces: `parseFrontmatter(raw) → { data, body }`.

- [ ] **Step 1: Write failing test `tests/content.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { loadContent } from '../src/content/loader.js';
import { parseFrontmatter } from '../src/content/frontmatter.js';

describe('content', () => {
  it('parses frontmatter', () => {
    const { data, body } = parseFrontmatter('---\ntitle: Hi\ndate: 2026-01-02\n---\nBody here');
    expect(data.title).toBe('Hi');
    expect(body.trim()).toBe('Body here');
  });

  it('loads all content with required shapes', async () => {
    const c = await loadContent();
    expect(c.projects.length).toBeGreaterThan(0);
    for (const p of c.projects) {
      expect(p).toMatchObject({ title: expect.any(String), description: expect.any(String) });
      expect(Array.isArray(p.tech)).toBe(true);
    }
    for (const n of c.experience) {
      expect(['sticky', 'ruled', 'polaroid']).toContain(n.type);
      expect(Array.isArray(n.connections)).toBe(true);
    }
    expect(c.gallery.every((g) => ['sketch', 'photo'].includes(g.type))).toBe(true);
    expect(c.site.spotify.playlistId).toBeTruthy();
    expect(c.posts[0].title).toBeTruthy();
    expect(c.posts[0].body).toContain('#'); // markdown body
  });
});
```

- [ ] **Step 2: Run to verify fail** — `npm test` → FAIL (modules missing).

- [ ] **Step 3: Write data files** (placeholders):
- `projects.json`: 4 entries `{ id, title, description, tech: [..], image: "/placeholders/project-N.png", repoUrl: "https://github.com/ritvikgupta", liveUrl: null }` — titles "Portfolio Engine", "ML Experiments", "Pair Trading Research", "Rust Interpreter".
- `experience.json`: 6 notes `{ id, type: sticky|ruled|polaroid, title, body, connections: [ids] }` (e.g. "Internship @ ...", "CMU", "Hackathon win", photo note) with 3 connection pairs.
- `gallery.json`: 8 entries `{ src: "/placeholders/art-N.svg", caption, type }` alternating sketch/photo.
- `site.json`: `{ name: "Ritvik Gupta", spotify: { playlistId: "37i9dQZF1DXcBWIGoYBM5M", profileUrl: "https://open.spotify.com/" }, socials: { github: "https://github.com/ritvikgupta", email: "ai.ritvik@gmail.com" } }`.
- `blog/*.md`: frontmatter `title`, `date` + 2–3 paragraphs with `#` headings.
- Generate `public/placeholders/` images as simple SVGs (rect + label text), one per project/art entry.

- [ ] **Step 4: Write `frontmatter.js` + `loader.js`**

```js
// frontmatter.js
export function parseFrontmatter(raw) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { data, body: m[2] };
}
```

```js
// loader.js
import projects from './projects.json';
import experience from './experience.json';
import gallery from './gallery.json';
import site from './site.json';
import { parseFrontmatter } from './frontmatter.js';

const mdFiles = import.meta.glob('./blog/*.md', { query: '?raw', import: 'default', eager: true });

export async function loadContent() {
  const posts = Object.entries(mdFiles)
    .map(([path, raw]) => {
      const { data, body } = parseFrontmatter(raw);
      return { slug: path.replace('./blog/', '').replace('.md', ''), title: data.title, date: data.date, body };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  return { projects, experience, gallery, site, posts };
}
```

Note: `import.meta.glob` needs vitest config — in `vite.config.js` add `test: { environment: 'node' }`; glob works under vitest natively.

- [ ] **Step 5: Run tests** — `npm test` → PASS (2 tests).

- [ ] **Step 6: Commit** — `git commit -m "feat: placeholder content data and loader with smoke tests"`

---

### Task 11: Projects page (`ui/pages/projects.js`)

**Files:**
- Create: `src/ui/pages/projects.js`, `src/styles/pages.css` (shared page styles started here); Modify: `src/main.js` (register real page), `index.html` (link pages.css)

**Interfaces:**
- Produces: `createProjectsPage(projects) → HTMLElement`. Pattern all pages follow: pure function data → element, no globals.

- [ ] **Step 1: Implement** — OS-desktop look: `.projects-desktop` full-page area (subtle #0a0a18 bg, mono font), each project a `.project-window` card: title bar (traffic-light dots + title, mono), preview `<img>` (from `p.image`), description, `.tech-tag` chips, footer links (repo/live, skip null liveUrl). Cards laid out in loose overlapping grid (CSS grid + per-card `transform: rotate/translate` offsets for scattered-windows feel), hover raises `z-index` + slight scale (CSS only).

- [ ] **Step 2: Wire** — `main.js`: `const content = await loadContent()` at boot; `overlays.register('projects', createProjectsPage(content.projects))` replacing placeholder.

- [ ] **Step 3: Verify** — laptop click → windowed project cards render with placeholder images + links.

- [ ] **Step 4: Commit** — `git commit -m "feat: projects page with os-window cards"`

---

### Task 12: Gallery page (`ui/pages/gallery.js`)

**Interfaces:**
- Produces: `createGalleryPage(gallery) → HTMLElement` — horizontal scroll strip + lightbox.

- [ ] **Step 1: Implement** — `.gallery-strip`: `display: flex; overflow-x: auto; scroll-snap-type: x mandatory;` full-height items (`scroll-snap-align: center`), each `<figure>` with image + Caveat caption; sketches on paper-white mat, photos on black mat. Wheel handler on strip: `el.scrollLeft += e.deltaY` (preventDefault) → vertical wheel drives horizontal scroll. Click figure → `.lightbox` (fixed, dark, centered large img, click/ESC closes — local ESC handler must `stopPropagation` so overlay ESC doesn't also fire).

- [ ] **Step 2: Wire + verify** — sketchbook click → horizontal gallery, wheel scrolls sideways, lightbox opens/closes, ESC in lightbox closes lightbox only (second ESC leaves page).

- [ ] **Step 3: Commit** — `git commit -m "feat: horizontal scroll gallery with lightbox"`

---

### Task 13: Blog page (`ui/pages/blog.js`)

**Interfaces:**
- Consumes: `posts` from loader, `marked` for body render.
- Produces: `createBlogPage(posts) → HTMLElement` — binder with index + page-flip.

- [ ] **Step 1: Implement binder** — `.binder`: centered ~720px "old binder" (dark leather border-radius frame, inner `.binder-page` yellowed paper `#f0e6c8` with `repeating-linear-gradient` ruled lines + red margin line, Caveat body font, 3 CSS ring circles on left edge). Two stacked `.binder-page` elements (current + next) inside `perspective: 1600px` container for flips.

- [ ] **Step 2: Index + navigation** — first page = index: post titles as list items with dates; click title → flip to post. Post page: title, date, `marked.parse(body)` into `.post-body`, "← index" link. Flip: GSAP `rotationY: -180` on current page (transform-origin left, `backface-visibility: hidden`), next page revealed beneath, 0.8s `power2.inOut`; reverse flip for back-to-index.

- [ ] **Step 3: Verify** — journal click → binder opens on index, flips animate to posts and back, markdown renders.

- [ ] **Step 4: Commit** — `git commit -m "feat: binder blog with page-flip animation"`

---

### Task 14: Music page (`ui/pages/music.js`)

**Interfaces:**
- Consumes: `site.spotify` from loader, `vinyl.setSpinning`.
- Produces: `createMusicPage(site, { onOpen, onClose }) → HTMLElement`.

- [ ] **Step 1: Implement** — left: large CSS vinyl disc (radial-gradient grooves, red center label with "Ritvik's rotation" in Caveat) spun by GSAP `rotation: 360, repeat: -1, ease: 'none', duration: 3`; right: Spotify embed `<iframe src="https://open.spotify.com/embed/playlist/${site.spotify.playlistId}?theme=0" allow="autoplay; encrypted-media" loading="lazy">` (~380×500) + link to `site.spotify.profileUrl`. Pause disc GSAP tween when page closed (overlay manager already hides; kill/restart tween via open/close hooks — add optional `onOpen/onClose` callbacks to `overlays.register(id, el, hooks)`).

- [ ] **Step 2: Verify** — vinyl click → disc spins, Spotify playlist loads and plays in embed, profile link works.

- [ ] **Step 3: Commit** — `git commit -m "feat: music page with spinning vinyl and spotify embed"`

---

### Task 15: Corkboard overlay (`ui/pages/corkboard.js`)

**Interfaces:**
- Consumes: `experience` notes from loader.
- Produces: `createCorkboardPage(experience) → HTMLElement` — zoomed board with notes, SVG red strings, detail modal.

- [ ] **Step 1: Implement board** — full-page cork texture (CSS: #7a5f3a with `radial-gradient` speckle) + dark frame border. Notes absolutely positioned (position map by note index — 2 rows scattered, rotations ±4°): `.note--sticky` (yellow, slight fold shadow), `.note--ruled` (white, ruled lines), `.note--polaroid` (white frame, gray photo area, caption). Pin dot on each. Full-size SVG layer under notes draws `path` red strings (slight sag via quadratic bezier) between centers of `connections` pairs after layout (`requestAnimationFrame` then measure with `getBoundingClientRect`, recompute on resize).

- [ ] **Step 2: Modal** — note click → `.note-modal` (centered enlarged note in same paper style, full `body` text, close ×, ESC closes modal first — same stopPropagation pattern as gallery lightbox).

- [ ] **Step 3: Verify** — corkboard click → zoom to wall, overlay board matches 3D board vibe, strings connect correct notes, modals open/close.

- [ ] **Step 4: Commit** — `git commit -m "feat: corkboard experience overlay with red strings and modals"`

---

### Task 16: Intro sequence (`ui/intro.js`)

**Files:**
- Create: `src/ui/intro.js`, `src/styles/intro.css`; Modify: `src/main.js`

**Interfaces:**
- Consumes: `rig.HOME`, camera; `setMode`.
- Produces: `runIntro(camera, rig) → Promise` — resolves when camera is seated at HOME; handles skip + localStorage internally.

- [ ] **Step 1: Implement screens** — `.intro` fullscreen #0a0a0a. Screen 1: CSS floppy disk (rounded rect, metal shutter, label "RITVIK.SYS") + Caveat prompt "click the floppy to boot". Screen 2 (on click): mono green-on-black boot log typed line-by-line (~1.6s total, lines: `LOADING RITVIK.SYS...`, `MOUNTING /desk...`, `LAMP... OK`, `VINYL... OK`, `MEMORIES... OK`, `WELCOME.`). Then intro div fades out and camera flies: start camera at (0, 1.6, 3.4) lookAt HOME.lookAt, GSAP 2s `power3.inOut` to `HOME.position`; resolve; caller does `setMode('idle')`.

- [ ] **Step 2: Skip logic** — "skip ›" button top-right always visible; if `localStorage.getItem('visited')` or `prefers-reduced-motion`: skip screens, snap camera to HOME, resolve immediately. Set `localStorage.setItem('visited', '1')` after first completion.

- [ ] **Step 3: Verify** — fresh profile (incognito): floppy → boot text → fly-in → interactive. Reload: straight to desk. Skip button works mid-boot.

- [ ] **Step 4: Commit** — `git commit -m "feat: floppy boot intro with skip and revisit memory"`

---

### Task 17: Mobile/perf/final pass

**Files:**
- Modify: `src/main.js`, `src/styles/*.css`, `README.md` (create)

- [ ] **Step 1: Mobile fallback** — pointer parallax already inert on touch (no pointermove); add touch-drag: on `touchmove`, feed normalized delta into rig pointer (same lerp path). Media queries: overlay pages single-column ≤700px; gallery strip items full-width; projects windows stack; Spotify iframe width 100%.

- [ ] **Step 2: Perf audit** — devtools: confirm render pauses when overlay open (no rAF work), pixelRatio cap active, no per-frame allocations in `update` loops (reuse vectors), textures ≤1024px. Fix what fails.

- [ ] **Step 3: Full manual run-through** (the spec's test plan):
  - intro fresh + revisit + skip + reduced-motion
  - hover/label/glow on all 6 objects; lamp toggle both directions
  - zoom in/out ×5 targets via click, back button, ESC; rapid-click state safety
  - each page's content renders from data files; lightbox; page-flips; Spotify playback; note modals; external links open
  - 375px-wide viewport walkthrough
  - `npm test` passes; `npm run build && npm run preview` works

- [ ] **Step 4: Write `README.md`** — run/build/test commands + "how to replace placeholder content" (data file shapes, image drop-in paths).

- [ ] **Step 5: Commit** — `git commit -m "feat: mobile fallback, perf pass, readme"`

---

## Verification (end-to-end)

1. `cd portfolio && npm test` → all smoke tests pass.
2. `npm run dev` → full manual checklist in Task 17 Step 3.
3. `npm run build && npm run preview` → production build behaves identically.

## Execution notes

- First execution step: copy this plan to `portfolio/docs/superpowers/plans/2026-07-05-3d-desk-portfolio.md` and commit (couldn't write there during plan mode).
- Placeholder content only — Ritvik swaps real projects/sketches/posts/Spotify playlist ID in `src/content/` afterward.
