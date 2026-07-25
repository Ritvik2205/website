# Monsoon Postroom Ambient Environment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing baked-light 3D desk portfolio into the approved Monsoon Postroom experience using deterministic room bakes, Higgsfield-generated prop sprites, a correspondence-ledger corkboard, a postroom intro, and cohesive overlays.

**Architecture:** Preserve the current Three.js scene graph, directed camera, interaction IDs, state machine, single `nightMix` mood axis, and imperative DOM overlays. Higgsfield supplies five neutral-lit visual asset groups; deterministic JavaScript canvas bakes and CSS establish the warm/cool room moods without runtime lights.

**Tech Stack:** Vite 8, vanilla ES modules, three.js 0.185, GSAP 3.15, marked 18, Vitest 4, Higgsfield `marketing_studio_image`, Higgsfield background removal, CSS.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-20-monsoon-postroom-ambient-design.md`.
- Follow `docs/design/2026-07-06-baked-rendering-philosophy.md`.
- Add no scene lights, shadow maps, PBR-lit prop materials, orbit controls, UI framework, backend, or second mood axis.
- Preserve IDs `projects`, `gallery`, `blog`, `music`, `experience`, and `lamp`.
- Preserve `intro → idle → zoomed(target) → closing → idle`.
- Keep `nightMix` as the only room mood axis; lamp-on is `1`, lamp-off remains `0.15`.
- Store generated source assets under `public/assets/postroom/` and reference them as `/assets/postroom/...`.
- Do not upload the user’s references to Higgsfield; use text-only original prompts.
- Obtain explicit user confirmation before spending the preflighted 16 generation credits. Background-removal credits are additional and must be surfaced if Higgsfield reports them.
- Preserve skip, Escape propagation, overlay render pausing, narrow-viewport behavior, semantic controls, and `prefers-reduced-motion`.
- Keep generated `dist/` untracked.

## File Structure

Create:

- `public/assets/postroom/lamp.png` — selected transparent task-lamp sprite.
- `public/assets/postroom/turntable.png` — selected transparent turntable sprite.
- `public/assets/postroom/teacup.png` — selected transparent cup sprite.
- `public/assets/postroom/ephemera.png` — selected transparent correspondence collage.
- `public/assets/postroom/floppy.png` — selected transparent boot floppy.
- `public/assets/postroom/manifest.json` — prompts, generation IDs, removal IDs, local paths, model, and credit cost.
- `src/scene/teaCup.js` — non-interactive set-dressing factory.
- `tests/postroom-assets.test.js` — manifest and local-file integrity tests.

Modify:

- `index.html` — load `Newsreader`.
- `src/main.js` — add the tea cup and register it with the mood system.
- `src/core/engine.js` — Storm Ink scene background.
- `src/render/composer.js` — final bloom tuning after visual review.
- `src/scene/spriteAsset.js` — resilient sprite loading with fallback objects.
- `src/scene/environment.js` — deterministic Monsoon Postroom wall, desk, floor, and window bakes.
- `src/scene/lamp.js` — generated lamp sprite and fallback.
- `src/scene/vinyl.js` — generated turntable sprite and fallback.
- `src/scene/corkboard.js` — correspondence-ledger geometry, ephemera, brass pins, blue cotton.
- `src/scene/laptop.js`, `src/scene/journal.js`, `src/scene/sketchbook.js` — palette-aligned procedural textures.
- `src/ui/intro.js`, `src/styles/intro.css` — generated floppy and postroom boot sequence.
- `src/ui/pages/projects.js`, `src/ui/pages/corkboard.js`, `src/ui/pages/music.js`, `src/ui/pages/blog.js` — postroom semantics and reduced motion.
- `src/styles/main.css`, `src/styles/pages.css`, `src/styles/overlay.css` — shared palette and overlay treatment.

---

### Task 1: Generate, Select, and Record Higgsfield Assets

**Files:**
- Create: `public/assets/postroom/lamp.png`
- Create: `public/assets/postroom/turntable.png`
- Create: `public/assets/postroom/teacup.png`
- Create: `public/assets/postroom/ephemera.png`
- Create: `public/assets/postroom/floppy.png`
- Create: `public/assets/postroom/manifest.json`
- Create: `tests/postroom-assets.test.js`

**Interfaces:**
- Consumes: Higgsfield model `marketing_studio_image`, approved text-only art direction, 16-credit generation preflight.
- Produces: five transparent local PNGs and a reproducible manifest used by all scene/UI tasks.

- [ ] **Step 1: Confirm credit spend**

Present the exact preflight:

```text
Higgsfield preflight: 8 images × 2 credits = 16 generation credits.
Background removal for the five selected images may use additional credits.
```

Do not call generation until the user confirms.

- [ ] **Step 2: Generate the two lamp candidates**

Call `generate_image` with model `marketing_studio_image`, `count: 2`, `aspect_ratio: "1:1"`, and:

```text
Original stylized editorial product cutout of a compact 1980s green enamel correspondence-desk task lamp, aged brass articulated arm and weighted brass base, three-quarter front view facing left, complete object fully inside frame, neutral light-grey seamless studio background, soft baked-in contact shading, tactile hand-painted 3D illustration, dark walnut and rainy blue-grey art direction, no people, no text, no logo, no watermark, no dramatic cast shadow, not based on an existing product
```

- [ ] **Step 3: Generate the two turntable candidates**

Call the same model with `count: 2`, `aspect_ratio: "1:1"`, and:

```text
Original stylized editorial product cutout of a compact walnut correspondence-room turntable, low rectangular dark-walnut plinth, charcoal platter, restrained aged-brass controls, small smoky acrylic dust cover raised slightly, three-quarter front view facing right, complete object fully inside frame, neutral light-grey seamless studio background, soft baked-in contact shading, tactile hand-painted 3D illustration, no people, no text, no brand, no logo, no watermark
```

- [ ] **Step 4: Generate the tea-cup candidate**

Call with `count: 1`, `aspect_ratio: "1:1"`, and:

```text
Original stylized editorial product cutout of one small glazed ceramic tea cup on a matching saucer for a rainy correspondence desk, muted Rain Slate blue-grey glaze with a thin warm cream rim, three-quarter front view, complete object fully inside frame, no steam, neutral light-grey seamless studio background, soft baked-in contact shading, tactile hand-painted 3D illustration, no people, no text, no logo, no watermark
```

- [ ] **Step 5: Generate the ephemera candidate**

Call with `count: 1`, `aspect_ratio: "1:1"`, and:

```text
Original flat-lay transparent-ready collage sheet of correspondence-room ephemera: three deckled envelopes, two routing slips, two transit tickets, one receipt, four abstract postage stamps, cancellation arcs, and five small aged-brass drawing pins, asymmetrical composition with generous empty gaps, Rag Paper cream, Rain Slate, Verdigris, Tobacco Oak, and Honey Lamp palette, neutral light-grey seamless background, no readable words, no numbers, no brands, no logos, no watermark, no red string
```

- [ ] **Step 6: Generate the two floppy candidates**

Call with `count: 2`, `aspect_ratio: "1:1"`, and:

```text
Original stylized product cutout of a charcoal 3.5-inch boot floppy for a fictional rainy correspondence room, conventional square disk proportions, brushed silver shutter, one rust-orange paper label with abstract postmark rings and a small handwritten owner mark that is not readable text, subtle worn plastic texture, straight-on view, complete object fully inside frame, neutral light-grey seamless studio background, tactile hand-painted 3D illustration, no people, no brand, no logo, no watermark, do not imitate any supplied reference silhouette or label layout
```

- [ ] **Step 7: Poll and select**

For every returned job ID, call `job_status` with `sync: true`. Stop on `failed`, `canceled`, `nsfw`, or `ip_detected`; do not attempt to reveal or bypass rights detection. Select one lamp, turntable, and floppy candidate by:

- complete silhouette with no crop,
- coherent three-quarter perspective,
- no accidental readable text or branding,
- palette fit,
- minimal cast shadow.

- [ ] **Step 8: Remove backgrounds**

Call `remove_background` once for each selected generation ID with `media_type: "image"`. Poll each returned job to completion. Use each completed remover job’s `rawUrl`.

- [ ] **Step 9: Download the five selected files**

Create `public/assets/postroom/`, then download with exact names:

```bash
curl -L "$LAMP_RAW_URL" -o public/assets/postroom/lamp.png
curl -L "$TURNTABLE_RAW_URL" -o public/assets/postroom/turntable.png
curl -L "$TEACUP_RAW_URL" -o public/assets/postroom/teacup.png
curl -L "$EPHEMERA_RAW_URL" -o public/assets/postroom/ephemera.png
curl -L "$FLOPPY_RAW_URL" -o public/assets/postroom/floppy.png
```

Expected: five non-empty PNG files.

- [ ] **Step 10: Write the manifest**

Write `public/assets/postroom/manifest.json` with actual returned values matching this type:

```typescript
type PostroomManifest = {
  direction: 'monsoon-postroom';
  model: 'marketing_studio_image';
  generationCredits: 16;
  assets: Array<{
    id: 'lamp' | 'turntable' | 'teacup' | 'ephemera' | 'floppy';
    path: `/assets/postroom/${string}.png`;
    prompt: string;
    candidateGenerationIds: string[];
    selectedGenerationId: string;
    backgroundRemovalId: string;
  }>;
};
```

Include all five IDs. Lamp, turntable, and floppy have two candidate IDs; tea cup and ephemera have one.

- [ ] **Step 11: Write the failing asset-integrity test first**

Create `tests/postroom-assets.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { readFile, stat } from 'node:fs/promises';
const manifestPath = new URL('../public/assets/postroom/manifest.json', import.meta.url);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('Monsoon Postroom assets', () => {
  it('records five generated local assets', async () => {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    expect(manifest.direction).toBe('monsoon-postroom');
    expect(manifest.model).toBe('marketing_studio_image');
    expect(manifest.generationCredits).toBe(16);
    expect(manifest.assets.map((asset) => asset.id)).toEqual([
      'lamp', 'turntable', 'teacup', 'ephemera', 'floppy',
    ]);

    for (const asset of manifest.assets) {
      expect(asset.prompt.length).toBeGreaterThan(80);
      expect(asset.selectedGenerationId).toMatch(uuid);
      expect(asset.backgroundRemovalId).toMatch(uuid);
      expect(asset.candidateGenerationIds.every((id) => uuid.test(id))).toBe(true);
      const localPath = new URL(`../public${asset.path}`, import.meta.url);
      expect((await stat(localPath)).size).toBeGreaterThan(1000);
    }
  });
});
```

- [ ] **Step 12: Run the focused test**

Run:

```bash
npx vitest run tests/postroom-assets.test.js
```

Expected: one passing test.

- [ ] **Step 13: Commit**

```bash
git add public/assets/postroom tests/postroom-assets.test.js
git commit -m "feat: add Monsoon Postroom generated assets"
```

---

### Task 2: Add Resilient Sprite Loading and Desk Props

**Files:**
- Modify: `src/scene/spriteAsset.js`
- Modify: `src/scene/lamp.js`
- Modify: `src/scene/vinyl.js`
- Create: `src/scene/teaCup.js`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `/assets/postroom/lamp.png`, `turntable.png`, and `teacup.png`.
- Produces: `createSprite(url, { height, fallback })`, stable lamp/music interactables, and non-interactive `createTeaCup()`.

- [ ] **Step 1: Refactor `createSprite` around a visible fallback**

Change the options to:

```js
export function createSprite(url, { height = 1, fallback = null } = {}) {
```

Return a `THREE.Group` containing the fallback immediately and the loaded plane when ready. On successful image load, hide `fallback`, add the trimmed sprite mesh, and set `group.userData.assetStatus = 'loaded'`. On loader error, keep the fallback visible and set status to `error`. Initialize status as `loading`.

Keep the existing alpha-bound scan, SRGB texture, bottom anchoring, and `alphaTest: 0.08`.

- [ ] **Step 2: Add a deterministic lamp fallback**

In `lamp.js`, create a small group from `MeshBasicMaterial` box/cylinder primitives in Verdigris `0x688178` and brass `0xa77a3f`. Pass it to:

```js
createSprite('/assets/postroom/lamp.png', { height: 0.66, fallback })
```

Retain the additive glow, position, `nightMix` values, ID, label, and `toggle()`.

- [ ] **Step 3: Add a deterministic turntable fallback**

In `vinyl.js`, build a walnut box plinth, charcoal cylinder platter, and brass control. Pass the group to:

```js
createSprite('/assets/postroom/turntable.png', { height: 0.44, fallback })
```

Retain `id: 'music'`, label, and no-op update contract.

- [ ] **Step 4: Create the tea cup**

Create `src/scene/teaCup.js`:

```js
import * as THREE from 'three';
import { createSprite } from './spriteAsset.js';

function createFallback() {
  const group = new THREE.Group();
  const ceramic = new THREE.MeshBasicMaterial({ color: 0x7b8f98 });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.1, 20), ceramic);
  cup.position.y = 0.055;
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 24), ceramic);
  saucer.position.y = 0.006;
  group.add(saucer, cup);
  return group;
}

export function createTeaCup() {
  const group = new THREE.Group();
  group.add(createSprite('/assets/postroom/teacup.png', {
    height: 0.24,
    fallback: createFallback(),
  }));
  group.position.set(0.58, 0.42, -0.62);
  group.rotation.y = -0.08;
  return { group };
}
```

- [ ] **Step 5: Register the tea cup in `main.js`**

Import `createTeaCup`, add it after the environment, and call `registerUnlitGroup(teaCup.group)`. Do not register it with interactions or add a tick.

- [ ] **Step 6: Verify**

Run:

```bash
npm test
npm run build
```

Expected: all tests and build pass. Manually rename one sprite temporarily and verify fallback geometry appears without blocking startup, then restore the file.

- [ ] **Step 7: Commit**

```bash
git add src/scene/spriteAsset.js src/scene/lamp.js src/scene/vinyl.js src/scene/teaCup.js src/main.js
git commit -m "feat: integrate resilient postroom props"
```

---

### Task 3: Repaint the Deterministic Room Bakes

**Files:**
- Modify: `src/core/engine.js`
- Modify: `src/scene/environment.js`
- Modify after screenshot review: `src/render/composer.js`

**Interfaces:**
- Consumes: approved six-color palette and existing bake helpers.
- Produces: aligned warm day and cool dusk bakes with unchanged geometry and composer order.

- [ ] **Step 1: Set the scene surround**

Change `scene.background` in `engine.js` to:

```js
scene.background = new THREE.Color(0x171b22);
```

- [ ] **Step 2: Repaint `paintWall`**

Use day gradient `#3B3B35 → #565044 → #675744` and night gradient `#202A34 → #2C3C49 → #334B5F`. Replace diagonal orange beams with two broad, lower-opacity window-frame bands using cool `190, 210, 220` by dusk and warm `225, 190, 135` by day. Keep the board pool centered at `(512, 367)` with warm `225, 164, 75` by day and cool `105, 130, 145` by night.

- [ ] **Step 3: Repaint `paintDesk` deterministically**

Use `#765137` by day and `#493B35` by night. Replace every `Math.random()` grain coordinate with a deterministic loop:

```js
for (let i = 0; i < 48; i++) {
  const y = (i * 73) % DESK_H;
  const x = (i * 137) % DESK_W;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + 90, y - 3, x + 180, y + 4, x + 280, y);
  ctx.stroke();
}
```

Move the principal Honey Lamp pool toward the journal/sketchbook region at `(620, 350)` radius `360`, add the lamp-origin pool at `(930, 150)`, preserve all existing AO footprints, and add tea-cup AO at `(647, 174)` with radii `44 × 24`.

- [ ] **Step 4: Repaint window and flat geometry**

Use `#dce8ed → #9eb7c3` by day and `#526f82 → #2f4658` by night. Change desk body to `0x765137`, desk edge to `0x563822`, floor to `0x171b22`, and window frame to `0x493522`.

- [ ] **Step 5: Tune bloom only after review**

Start with current bloom unchanged. After viewing both lamp moods, change only if highlights are too hard:

```js
0.35, // strength
0.65, // radius
0.9   // threshold
```

Preserve `RenderPass → UnrealBloomPass → OutputPass`.

- [ ] **Step 6: Verify**

Run tests/build and inspect lamp-on/off screenshots. Confirm there are no `AmbientLight`, `DirectionalLight`, `SpotLight`, or shadow-map additions:

```bash
npm test
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/core/engine.js src/scene/environment.js src/render/composer.js
git commit -m "feat: repaint room as Monsoon Postroom"
```

---

### Task 4: Convert the 3D and DOM Corkboards into a Correspondence Ledger

**Files:**
- Modify: `src/scene/corkboard.js`
- Modify: `src/ui/pages/corkboard.js`
- Modify: `src/styles/pages.css`

**Interfaces:**
- Consumes: `/assets/postroom/ephemera.png` and existing `experience.json` IDs/connections.
- Produces: matching 3D/DOM correspondence boards with preserved modal and resize APIs.

- [ ] **Step 1: Rework the 3D board**

Change board/frame colors to cork `0x8a6948` and Tobacco Oak `0x604127`. Replace note colors with Rag Paper, pale Rain Slate, and muted Verdigris. Set every pin to aged brass `0xa77a3f`. Change the string material to:

```js
new THREE.LineBasicMaterial({
  color: 0x688178,
  transparent: true,
  opacity: 0.72,
});
```

Replace the central name card with a Rag Paper route ledger titled `MONSOON / POSTROOM` in `Space Mono`, with `Ritvik Gupta` handwritten below in `Caveat`. Add the transparent ephemera sprite behind the individual notes at `z = 0.02`, scaled to fit within the frame.

- [ ] **Step 2: Preserve sparse connections**

Keep only `[[0, 1], [2, 3], [4, 5]]` in 3D. Do not add crossings or a dense web.

- [ ] **Step 3: Add semantic board types in the DOM**

In `createCorkboardPage`, add:

```js
noteEl.dataset.route = String(i + 1).padStart(2, '0');
```

Render a `<span class="note-route">ROUTE ${route}</span>` before `.note-title`. Add `aria-label="Close note"` to the modal close button.

- [ ] **Step 4: Restyle the DOM board**

Change string stroke to `#688178`, pins to brass, board surround to Storm Ink, frame to Tobacco Oak, and notes to Rag Paper/Rain Slate/Verdigris variants. Use `/assets/postroom/ephemera.png` as a centered, non-repeating low-opacity board background layer beneath the cork texture.

- [ ] **Step 5: Verify**

Run tests/build. Manually open every note, close via button, backdrop, and Escape, resize the window, and confirm `redrawStrings()` still aligns.

- [ ] **Step 6: Commit**

```bash
git add src/scene/corkboard.js src/ui/pages/corkboard.js src/styles/pages.css
git commit -m "feat: build correspondence ledger corkboard"
```

---

### Task 5: Replace the Cyber Intro with the Postroom Floppy

**Files:**
- Modify: `src/ui/intro.js`
- Modify: `src/styles/intro.css`

**Interfaces:**
- Consumes: `/assets/postroom/floppy.png`.
- Produces: same `runIntro(camera, rig): Promise<void>` contract and a warmer accessible boot sequence.

- [ ] **Step 1: Replace boot copy**

Use:

```js
const BOOT_LINES = [
  'OPENING MONSOON POSTROOM...',
  'INDEXING LETTERS...',
  'ROUTING PROJECT ARCHIVE...',
  'PINNING FIELD NOTES...',
  'WARMING DESK LAMP...',
  'POSTROOM READY.',
];
```

- [ ] **Step 2: Use the generated image with CSS fallback**

Keep `.floppy` as a semantic button. Add:

```html
<img class="floppy-art" src="/assets/postroom/floppy.png" alt="" />
<span class="floppy-fallback" aria-hidden="true">
  <span class="floppy-shutter"></span>
  <span class="floppy-label">POSTROOM / 01</span>
</span>
```

On image `error`, add `.asset-missing` to the button so CSS hides the image and shows the fallback. Change the button label to `Open the Monsoon Postroom` and prompt to `insert correspondence disk`.

- [ ] **Step 3: Restyle**

Use a Storm Ink-to-Rain Slate radial background, a subtle Honey Lamp floor glow, `Newsreader` prompt text, Space Mono boot text in Rag Paper, and a muted Honey Lamp cursor glow. Preserve hover restraint, skip position, `[hidden]`, and reduced/revisit short-circuit.

- [ ] **Step 4: Verify**

Clear `localStorage.visited`, test click boot and skip, reload for revisit, enable reduced motion, and temporarily break the floppy URL to confirm the CSS fallback.

- [ ] **Step 5: Commit**

```bash
git add src/ui/intro.js src/styles/intro.css
git commit -m "feat: add Monsoon Postroom boot intro"
```

---

### Task 6: Apply Shared Typography and Postroom Overlay Styling

**Files:**
- Modify: `index.html`
- Modify: `src/styles/main.css`
- Modify: `src/styles/overlay.css`
- Modify: `src/styles/pages.css`
- Modify: `src/ui/pages/projects.js`

**Interfaces:**
- Consumes: six-color palette, `Newsreader`, existing page DOM.
- Produces: one coherent visual system without changing overlay IDs or lifecycle.

- [ ] **Step 1: Load Newsreader**

Update the Google Fonts URL to include `Newsreader:opsz,wght@6..72,400;6..72,600`.

- [ ] **Step 2: Define exact tokens**

Replace the root tokens with:

```css
:root {
  --storm-ink: #171b22;
  --rain-slate: #334b5f;
  --verdigris: #688178;
  --tobacco-oak: #765137;
  --honey-lamp: #e1a44b;
  --rag-paper: #e7dec9;
  --bg: var(--storm-ink);
  --warm: var(--honey-lamp);
  --paper: var(--rag-paper);
  --ink: #252723;
  --font-display: 'Newsreader', Georgia, serif;
  --font-hand: 'Caveat', cursive;
  --font-mono: 'Space Mono', monospace;
}
```

Use `--font-display` for page headings and project titles, `--font-mono` for route metadata, and `--font-hand` only for annotations.

- [ ] **Step 3: Replace project desktop semantics**

Set the heading to `PROJECT ROUTING DESK`. Replace traffic-light dots with:

```html
<span class="route-mark">FILE ${String(i + 1).padStart(2, '0')}</span>
<span class="window-title">${p.title}</span>
```

Keep preview alt text, links, tech list, scatter variables, and article structure.

- [ ] **Step 4: Restyle projects**

Use a Storm Ink surround, Rag Paper cards, Tobacco Oak title bars, Verdigris route marks, Honey Lamp hover edge, dark readable body text, rectangular postal tags, and restrained 2–4px corner radii. Remove cyber blue and traffic-light colors.

- [ ] **Step 5: Restyle gallery, blog, and music**

- Gallery: Storm Ink drawer, Rag Paper contact sheets, Tobacco Oak photo mounts.
- Blog: Tobacco Oak binder, aged-brass rings, Rag Paper pages, Newsreader headings.
- Music: dark walnut crate panel, Verdigris/Honey record label, Rag Paper listening card around the embed.
- Overlay chrome: Rain Slate translucent surround, Rag Paper back button, Honey focus/hover.

Do not alter page IDs, lightbox behavior, marked rendering, Spotify attributes, or overlay hooks.

- [ ] **Step 6: Verify**

Run tests/build. Check every overlay at desktop and `max-width: 700px`; keyboard-tab through back buttons, project links, post links, lightbox, and note modals.

- [ ] **Step 7: Commit**

```bash
git add index.html src/styles/main.css src/styles/overlay.css src/styles/pages.css src/ui/pages/projects.js
git commit -m "feat: restyle overlays as correspondence archive"
```

---

### Task 7: Align Procedural Props and Reduced Motion

**Files:**
- Modify: `src/scene/laptop.js`
- Modify: `src/scene/journal.js`
- Modify: `src/scene/sketchbook.js`
- Modify: `src/ui/pages/music.js`
- Modify: `src/ui/pages/blog.js`

**Interfaces:**
- Consumes: shared palette and current page factories.
- Produces: palette-aligned remaining props and complete reduced-motion behavior.

- [ ] **Step 1: Repaint procedural textures**

Use Storm Ink/charcoal for laptop chassis and replace bright cyber terminal colors with Rag Paper text, Verdigris status marks, and Honey Lamp cursor highlights. Repaint journal cover Tobacco Oak with a small postal mark. Repaint sketchbook paper Rag Paper and pencil accents Verdigris/brass. Preserve geometry, object IDs, screen shader, and `uTime`.

- [ ] **Step 2: Gate music rotation**

In `createMusicPage`, capture:

```js
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

Only create the infinite GSAP tween when `!reduced`.

- [ ] **Step 3: Gate blog page flips**

In `flipTo`, if reduced motion matches, replace the current page synchronously:

```js
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  current.replaceWith(nextPage);
  flipping = false;
  return;
}
```

Keep the existing GSAP path otherwise.

- [ ] **Step 4: Verify**

Run tests/build. Enable reduced motion and verify intro skip, no music rotation, instant blog navigation, no parallax, and zero rain lines.

- [ ] **Step 5: Commit**

```bash
git add src/scene/laptop.js src/scene/journal.js src/scene/sketchbook.js src/ui/pages/music.js src/ui/pages/blog.js
git commit -m "feat: align props and reduced motion"
```

---

### Task 8: Final Integration and Visual Review

**Files:**
- Verify all files changed above.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: a tested, buildable, visually coherent full experience.

- [ ] **Step 1: Run automated verification**

```bash
npm test
npm run build
```

Expected: all content and asset tests pass; Vite exits 0.

- [ ] **Step 2: Check architectural constraints**

Search `src/` for `AmbientLight`, `DirectionalLight`, `SpotLight`, `castShadow`, `receiveShadow`, and `OrbitControls`. Expected: no new runtime-lighting or free-camera code.

- [ ] **Step 3: Check asset integrity**

Confirm five manifest paths exist, are non-empty PNGs, and are present in the production `dist/assets/postroom/` copy after build.

- [ ] **Step 4: Run the interaction matrix**

In the dev server verify:

- first-visit intro, skip, revisit, and reduced motion;
- hover/click for projects, gallery, blog, music, experience, and lamp;
- lamp-on and lamp-off readability;
- overlay close button and Escape;
- gallery lightbox Escape;
- corkboard modal close, backdrop, Escape, and resize;
- project links and image alt text;
- blog index/back in normal and reduced motion;
- music rotation in normal mode and no rotation in reduced motion;
- narrow viewport at 390px width.

- [ ] **Step 5: Review visual screenshots**

Capture home scene screenshots for lamp-on, lamp-off, and 390px viewport. Compare them to the approved spec:

- warm/cool separation is visible but not orange-washed or black;
- generated props share perspective and palette;
- board reads as correspondence, not investigation;
- paper remains readable without bloom wash;
- the references are not copied literally.

- [ ] **Step 6: Inspect final Git scope**

```bash
git status --short -- .
git diff --check -- .
```

Expected: only approved source, style, tests, manifest, and generated assets are changed; `dist/` remains ignored.

- [ ] **Step 7: Commit final review adjustments**

If screenshot review required only approved palette/bloom/framing adjustments:

```bash
git add src/scene/environment.js src/render/composer.js src/styles/pages.css
git commit -m "fix: polish Monsoon Postroom ambience"
```
