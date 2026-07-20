# 3D Desk Portfolio — Design Spec

**Date:** 2026-07-05
**Owner:** Ritvik Gupta
**Source wireframes:** claude.ai/design project `f4329965-91fd-429c-9be8-f960a39b11ad`, `Wireframes.dc.html` (selected option 2a: first-person seated desk view; intro from 1a; interaction flow 1d)

## Purpose

Personal portfolio as an immersive first-person 3D desk scene. Visitors explore desk objects; each object opens a content area (projects, art, blog, music, experience). Dark, rainy-London study mood.

## Stack

- Vite, vanilla JavaScript (ES modules)
- three.js — scene, camera, lighting, raycasting
- GSAP — camera moves, hover lifts, page transitions, page-flip animations
- No UI framework. Content pages are DOM overlays.

## Scene Composition

Single persistent `THREE.Scene`. First-person seated perspective at a desk.

| Object | Position | Role |
|--------|----------|------|
| Corkboard | wall, center | experience/notes board, detective red strings |
| Vinyl player + record shelf | desk back-left | music page |
| Lamp | desk back-center | light toggle (no page), SpotLight pool onto sketchbook |
| Sketchbook | desk center, in lamp light | art/photography gallery |
| Journal | desk front-left, largest (closest) | blog |
| Laptop | desk right, ¾ visible, angled inward | projects |

Environment: dark brick wall, foggy window with animated rain streaks, wood desk surface. Atmosphere: `THREE.Fog`, floating dust-mote particles (Points), palette #1a1810 → #3d3028, warm lamp key light (~#d4a868) + cool window fill.

All objects are procedural three.js primitive groups (placeholder geometry). Each object lives in its own module and exposes a root `Group`, so a GLTF model can replace internals later without touching interaction code.

## Camera & Interaction

- **Parallax:** mouse X/Y lerps camera yaw/pitch a few degrees. Cursor left reveals journal side; right reveals laptop side.
- **Hover:** raycaster per frame against interactable groups. Hovered object: emissive warm glow + slight GSAP lift + floating label. Cursor becomes pointer.
- **Click:** GSAP timeline flies camera to per-object anchor (position + lookAt), then DOM overlay crossfades in. Parallax disabled while zoomed.
- **Back:** ESC key or back button reverses: overlay fades out, camera returns to seated pose, parallax resumes.
- **Lamp:** click toggles SpotLight intensity (GSAP tween) and overall scene warmth. Switch mesh on lamp base.

### Intro sequence

1. DOM screen: floppy disk graphic, "insert to boot" prompt.
2. Click floppy → CRT-style boot text animation (typed lines).
3. Camera fly-in (GSAP) from boot screen into seated desk pose.
4. Skippable via button; `localStorage` flag skips automatically on repeat visits.

## Content Pages (DOM overlays)

- **Projects (laptop):** OS-desktop styling. Each project is a "window" card: preview image, title, description, tech tags, GitHub/live links.
- **Gallery (sketchbook):** horizontal-scroll page (wheel mapped to horizontal). Sketches and photography. Click image → lightbox.
- **Blog (journal):** rusty old binder aesthetic, yellowed pages. Opens on index of post titles. GSAP 3D page-flip (rotateY) navigates to posts. Posts authored as markdown.
- **Music (vinyl):** spinning vinyl graphic (GSAP rotation), Spotify playlist iframe embed, link to Spotify profile.
- **Corkboard:** camera zooms to board. Notes rendered as DOM overlay matching board layout: sticky notes, ruled sheets, polaroids, red string connections (SVG lines). Click note → modal with full details (experience, education, misc).

## Content Data

All content in `src/content/`, placeholder entries throughout:

- `projects.json` — title, description, tech[], image, repoUrl, liveUrl
- `experience.json` — corkboard notes: type (sticky|ruled|polaroid), title, body, connections[] (note ids for red strings)
- `blog/*.md` — frontmatter (title, date) + body
- `gallery.json` — image manifest: src, caption, type (sketch|photo)
- `site.json` — name, Spotify playlist/profile URLs, social links

Swapping placeholders for real content requires no code changes.

## File Structure

```
portfolio/
  index.html
  src/
    main.js            # boot: intro → scene
    core/              # renderer, camera rig, raycaster, render loop, state machine
    scene/             # one module per object + environment (wall, window, desk, atmosphere)
    ui/                # intro, overlay pages, modal, shared overlay chrome
    content/           # json + markdown data
    styles/            # css per overlay page
```

State machine: `intro → idle (parallax) → zoomed(target)`. Single source of truth for input handling and render pausing.

## Performance & Accessibility

- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`
- Pause 3D rendering while an overlay fully covers the canvas
- `prefers-reduced-motion`: skip intro fly-in, reduce parallax and particles
- Mobile fallback: touch-drag parallax, reduced particle counts, overlays fully responsive; desktop is the primary target

## Testing

- Manual run-through of every interaction path via Vite dev server (hover, zoom, back, lamp, intro skip, mobile viewport)
- Smoke checks for content loading (JSON parse, markdown render)
- Visual project; no heavy unit-test suite

## Out of Scope (v1)

- Real content (placeholders only)
- Custom GLTF models (procedural placeholders)
- CMS/backend — static site only
- Full mobile 3D parity
