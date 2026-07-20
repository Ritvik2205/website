# Repository Agent Guidance and Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add concise hierarchical `AGENTS.md` guidance for the portfolio and remove only verified local clutter.

**Architecture:** A root instruction file defines project-wide constraints; five child files add subsystem-specific contracts and override or refine root guidance by directory. Cleanup is conservative: empty duplicate directories are removed with `rmdir`, and `.gitignore` gains portable local-artifact coverage.

**Tech Stack:** Markdown, Git ignore patterns, Vite 8, vanilla ES modules, three.js, GSAP, marked, Vitest.

## Global Constraints

- Keep all changes inside `/Users/ritvikgupta/Documents/Code/portfolio`.
- Do not change application source code or dependencies.
- Do not delete `dist/`, `node_modules/`, `.claude/`, `public/`, or `docs/`.
- Do not touch sibling projects or parent-repository cleanup candidates.
- Use plain Markdown for `AGENTS.md`; Cursor `.mdc` frontmatter does not apply.
- Keep child instructions local and avoid repeating root guidance.
- Do not create a Git commit unless the user separately grants write access to the parent repository metadata.

---

### Task 1: Remove Confirmed Clutter and Harden Ignores

**Files:**
- Modify: `.gitignore`
- Remove if empty: `src/content 2/`
- Remove if empty: `src/core 2/`
- Remove if empty: `src/scene 2/`
- Remove if empty: `src/styles 2/`
- Remove if empty: `src/ui 2/`

**Interfaces:**
- Consumes: the audit finding that all five `* 2/` directories are empty and untracked.
- Produces: a clean source tree and portable ignore coverage.

- [ ] **Step 1: Reconfirm every cleanup target is empty**

Run:

```bash
for dir in "src/content 2" "src/core 2" "src/scene 2" "src/styles 2" "src/ui 2"; do
  test -d "$dir" && test -z "$(ls -A "$dir")" || exit 1
done
```

Expected: exit code 0 and no output. Stop if any directory contains a file.

- [ ] **Step 2: Remove only the empty duplicate directories**

Run:

```bash
rmdir "src/content 2" "src/core 2" "src/scene 2" "src/styles 2" "src/ui 2"
```

Expected: exit code 0.

- [ ] **Step 3: Replace `.gitignore` with portable project coverage**

Final content:

```gitignore
node_modules/
dist/
coverage/

.DS_Store
*.log

.env*
!.env.example
```

- [ ] **Step 4: Verify ignore behavior**

Run:

```bash
git check-ignore -v node_modules dist coverage .DS_Store debug.log .env.local
```

Expected: every sample path is matched by `portfolio/.gitignore`.

---

### Task 2: Add Root Agent Guidance

**Files:**
- Create: `AGENTS.md`

**Interfaces:**
- Consumes: `README.md`, `package.json`, `src/main.js`, and the approved design spec.
- Produces: project-wide guidance inherited by all child directories.

- [ ] **Step 1: Create `AGENTS.md`**

Use this content:

```markdown
# Portfolio Agent Guide

## Project

This is a static, first-person 3D desk portfolio built with Vite, vanilla ES modules, three.js, GSAP, and DOM overlays. Do not introduce a UI framework or backend without an explicit architecture change.

## Commands

- `npm run dev` — start Vite locally.
- `npm run build` — create the production bundle in `dist/`.
- `npm run preview` — serve the production bundle.
- `npm test` — run Vitest content smoke tests.

Run commands from this directory. The Git root is the parent `Code/` repository, so scope Git inspection to `portfolio/` and do not modify sibling projects.

## Architecture

- `src/main.js` is the composition root: create the engine and camera, add scene objects, register interactions, load content, register overlays, run the intro, then enter `idle`.
- `src/core/` owns the render loop, camera rig, interaction raycasting, and mode state.
- `src/render/` owns the baked-lighting materials, bake canvases, bloom composer, and future baked-model loader.
- `src/scene/` owns one procedural module per desk object and the environment.
- `src/ui/` owns the intro, overlay manager, and content-page DOM factories; associated CSS lives in `src/styles/`.
- `src/content/` owns JSON and Markdown data plus loading and frontmatter parsing.

Read the nearest child `AGENTS.md` before changing a subsystem. Rendering work must also follow `docs/design/2026-07-06-baked-rendering-philosophy.md`.

## Cross-Project Rules

- Preserve the mode flow `intro → idle → zoomed(target) → closing → idle`; use `setMode()` as the source of truth.
- Content pages are DOM overlays. Pause 3D rendering only after an overlay opens and resume before it closes.
- Keep user-visible portfolio content in `src/content/`; pass loaded data into UI factories instead of hardcoding copy.
- Keep `.js` extensions on local ES-module imports.
- Preserve `prefers-reduced-motion` behavior for camera movement, parallax, and atmosphere.
- Use GSAP for coordinated transitions and the engine tick for per-frame scene updates; do not create competing animation loops.
- Avoid unrelated refactors. The procedural scene is intentionally replaceable by future baked GLB assets.

## Verification

- Content-only changes: run `npm test`.
- JavaScript, CSS, render, or scene changes: run `npm test` and `npm run build`.
- Interaction or visual changes also need a manual Vite run-through of hover, click, overlay close/Escape, lamp mood, intro skip, and reduced motion as applicable.
- Do not commit generated `dist/` or `node_modules/`.
```

- [ ] **Step 2: Check that every referenced path exists**

Run:

```bash
for path in package.json src/main.js src/core src/render src/scene src/ui src/styles src/content docs/design/2026-07-06-baked-rendering-philosophy.md; do
  test -e "$path" || exit 1
done
```

Expected: exit code 0.

---

### Task 3: Document Core and Render Contracts

**Files:**
- Create: `src/core/AGENTS.md`
- Create: `src/render/AGENTS.md`

**Interfaces:**
- Consumes: project-wide guidance from root `AGENTS.md`.
- Produces: runtime and rendering constraints for the two most coupled subsystems.

- [ ] **Step 1: Create `src/core/AGENTS.md`**

Use this content:

```markdown
# Core Runtime Guide

## Responsibilities

- `engine.js` owns the renderer, composer-backed tick loop, resize handling, `onTick(fn)`, and `setRenderPaused(bool)`.
- `state.js` owns the current mode and mode-change subscriptions. Use `setMode(mode, target?)`; do not mutate state directly.
- `cameraRig.js` owns the home pose, cursor parallax, and GSAP `flyTo()`/`flyHome()` movement.
- `interactions.js` owns raycast registration, hover labels, hover color/lift effects, and click dispatch.

## Contracts

- Keep one engine loop. Register updates through `engine.onTick()` and accept its `dt` argument when time-based.
- The camera is directed: field of view 50, bounded cursor parallax, and named fly-to anchors. Do not add orbit or free-fly controls.
- Input is active only in the appropriate state. Disable interactions before a camera fly-to and re-enable them after returning home.
- Register interactables in `src/main.js` with `{ group, id, label, onClick }`; descendants are raycast recursively.
- Keep content-target camera anchors in the composition root unless a broader camera API is intentionally designed.
- Hover feedback uses unlit-material color changes and a small Y lift, not emissive lighting.

## Verification

Run `npm test` and `npm run build`. Manually verify intro-to-idle, hover, click-to-zoom, Escape/back, and return-to-idle behavior for runtime changes.
```

- [ ] **Step 2: Create `src/render/AGENTS.md`**

Use this content:

```markdown
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
```

- [ ] **Step 3: Scan for accidental light guidance**

Run:

```bash
rg -n "AmbientLight|DirectionalLight|SpotLight|orbit|free-fly" AGENTS.md src/core/AGENTS.md src/render/AGENTS.md
```

Expected: matches occur only in explicit prohibitions.

---

### Task 4: Document Scene, UI, and Content Contracts

**Files:**
- Create: `src/scene/AGENTS.md`
- Create: `src/ui/AGENTS.md`
- Create: `src/content/AGENTS.md`

**Interfaces:**
- Consumes: root guidance and the runtime/render contracts.
- Produces: local guidance for object factories, overlay pages and styles, and editable portfolio data.

- [ ] **Step 1: Create `src/scene/AGENTS.md`**

Use this content:

```markdown
# Scene Object Guide

## Object Contract

- Keep one factory module per desk object or environment concern.
- Interactive factories return `{ group, id, label }` and may add `update(dt)` or a purpose-specific method such as `toggle()`.
- Keep stable IDs aligned with overlays: `projects`, `gallery`, `blog`, `music`, and `experience`; the lamp toggles mood and has no overlay.
- Add objects, register interactions, register unlit groups, and attach tick updates in `src/main.js`.

## Rendering and Layout

- Props use unlit `MeshBasicMaterial`, sprite art, or the baked-material helpers from `src/render/`; never add scene lights.
- Sprite images are served from root-relative `public/` URLs and carry their own painted shading.
- The desk surface is around `y = 0.42` and the wall around `z = -1.2`; inspect `environment.js` and camera anchors before changing placement.
- Keep each root `Group` replaceable so procedural internals can later become a baked GLB without changing interaction IDs.
- Atmosphere stays localized to the window and exposes an `update(dt)` hook. Respect the reduced-motion flag and avoid room-wide particle or fog regressions.

## Verification

Run `npm test` and `npm run build`. In the dev server, verify object hover/click targets, camera framing, lamp mood, and both normal and reduced-motion modes.
```

- [ ] **Step 2: Create `src/ui/AGENTS.md`**

Use this content:

```markdown
# UI and Overlay Guide

This guide also governs `pages/`. Associated presentation styles live in `../styles/`.

## Page and Overlay Contracts

- Page factories receive loaded content and return a DOM element. A page needing lifecycle behavior may return `{ el, hooks: { onOpen, onClose } }`.
- Register pages through `createOverlayManager().register(id, el, hooks?)`; keep IDs aligned with scene object IDs.
- Use the overlay manager for shared back-button and GSAP opacity transitions. Do not create a second overlay root.
- Keep 3D pause/resume orchestration in `src/main.js`, not inside page modules.
- The corkboard element exposes `redrawStrings()` and redraws after opening so SVG connections use final layout dimensions.

## DOM, Events, and Styles

- Use imperative DOM APIs and `marked.parse()` for blog Markdown; do not add JSX or a template framework.
- Do not hardcode portfolio entries in page modules. Add content to `src/content/` and pass it through `loadContent()`.
- When a nested modal or lightbox handles Escape, call `stopPropagation()` so the same key does not close the parent overlay.
- Clean up page-specific listeners or animation state in lifecycle hooks when needed.
- Reuse the variables and warm paper/ink palette in `../styles/main.css`; keep layout-specific rules in the existing CSS files.
- Preserve keyboard access, meaningful links/buttons, responsive overlays, and reduced-motion behavior.

## Verification

Run `npm test` and `npm run build`. Manually test every affected page, back button, nested Escape behavior, resize-dependent drawing, and narrow viewport.
```

- [ ] **Step 3: Create `src/content/AGENTS.md`**

Use this content:

```markdown
# Portfolio Content Guide

Prefer content edits here over code changes. Static assets belong in `../../public/` and are referenced with root-relative URLs such as `/placeholders/project-1.svg`.

## Schemas

- `projects.json`: entries use `id`, `title`, `description`, `tech` array, `image`, `repoUrl`, and `liveUrl`.
- `experience.json`: entries use `id`, `type` (`sticky`, `ruled`, or `polaroid`), `title`, `body`, and a `connections` array of note IDs.
- `gallery.json`: entries use `src`, `caption`, and `type` (`sketch` or `photo`).
- `site.json`: contains the display name, Spotify `playlistId` and `profileUrl`, and social links.
- `blog/*.md`: begin with `---` frontmatter containing `title:` and ISO `date: YYYY-MM-DD`, followed by Markdown body.

## Loading Rules

- `loader.js` eagerly imports `./blog/*.md`, parses frontmatter, and sorts posts newest-first by the ISO date string.
- Keep referenced IDs unique and keep experience connection IDs valid.
- Do not add executable HTML or untrusted content; blog bodies are rendered through `marked.parse()`.
- Add source images to `public/`, not `dist/`; Vite copies public assets into builds.

## Verification

Run `npm test` after every content or loader change. Run `npm run build` when adding or changing public asset references, then verify links and images in the relevant overlay.
```

- [ ] **Step 4: Check hierarchy and file count**

Run:

```bash
printf '%s\n' AGENTS.md src/core/AGENTS.md src/render/AGENTS.md src/scene/AGENTS.md src/ui/AGENTS.md src/content/AGENTS.md | while read -r file; do
  test -s "$file" || exit 1
done
test "$(rg --files -g 'AGENTS.md' | wc -l | tr -d ' ')" = "6"
```

Expected: exit code 0 and exactly six non-empty `AGENTS.md` files.

---

### Task 5: Verify the Repository-Scoped Result

**Files:**
- Verify: `.gitignore`
- Verify: `AGENTS.md`
- Verify: `src/core/AGENTS.md`
- Verify: `src/render/AGENTS.md`
- Verify: `src/scene/AGENTS.md`
- Verify: `src/ui/AGENTS.md`
- Verify: `src/content/AGENTS.md`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: evidence that documentation, cleanup, tests, and production build are valid.

- [ ] **Step 1: Run automated tests**

Run:

```bash
npm test
```

Expected: Vitest exits 0 with all four content tests passing.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: Vite exits 0 and writes the ignored `dist/` bundle.

- [ ] **Step 3: Scan guidance for placeholders and stale paths**

Run:

```bash
if rg -n "TBD|TODO|FIXME|implement later" AGENTS.md src/{core,render,scene,ui,content}/AGENTS.md; then
  exit 1
fi
```

Expected: exit code 0 and no matches.

- [ ] **Step 4: Confirm cleanup boundaries**

Run:

```bash
for dir in "src/content 2" "src/core 2" "src/scene 2" "src/styles 2" "src/ui 2"; do
  test ! -e "$dir" || exit 1
done
test -d public && test -d docs && test -d node_modules
```

Expected: duplicate directories are absent; preserved directories remain.

- [ ] **Step 5: Inspect the final scoped status and diff**

Run from `portfolio/`:

```bash
git status --short -- .
git diff -- .gitignore
git diff --check -- .
```

Expected: only the approved specification/plan, six `AGENTS.md` files, and `.gitignore` appear; `git diff --check` reports no whitespace errors. Empty untracked directories do not appear in Git status.
