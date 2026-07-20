# Ritvik Gupta — 3D Desk Portfolio

First-person 3D desk scene built with three.js + GSAP. Every object on the desk opens a section: laptop → projects, sketchbook → art gallery, journal → blog, vinyl → music, corkboard → experience. The lamp actually turns off.

## Commands

```bash
npm run dev       # dev server at http://localhost:5173
npm run build     # production build to dist/
npm run preview   # serve the production build
npm test          # content smoke tests (vitest)
```

## Replacing placeholder content

All content lives in `src/content/` — no code changes needed:

| File | Shape |
|---|---|
| `projects.json` | `{ id, title, description, tech[], image, repoUrl, liveUrl }` |
| `experience.json` | `{ id, type: "sticky"\|"ruled"\|"polaroid", title, body, connections: [note ids] }` — `connections` draws the red strings |
| `gallery.json` | `{ src, caption, type: "sketch"\|"photo" }` |
| `site.json` | name, Spotify `playlistId` + `profileUrl`, socials |
| `blog/*.md` | frontmatter `title:` + `date:` (YYYY-MM-DD), then markdown body |

Images: drop files into `public/` (e.g. `public/art/…`) and point the JSON `src`/`image` fields at them. Current placeholders are in `public/placeholders/`.

## Architecture

- `src/core/` — renderer/loop (`engine.js`), mode state machine (`state.js`), camera parallax + fly-to (`cameraRig.js`), raycast hover/click (`interactions.js`)
- `src/render/` — **baked rendering pipeline** (see `docs/design/2026-07-06-baked-rendering-philosophy.md`): no scene lights; light/shadow/AO painted into canvas "bakes" (`bakeCanvas.js`) shown through a day/night mix shader (`bakedMaterial.js`); glow = bright pixels + UnrealBloom (`composer.js`); `bakedModel.js` is the drop-in loader for future Blender-baked GLB + lightmap pairs
- `src/scene/` — one module per desk object, each exporting `{ group, id, label }`; all materials unlit (`MeshBasicMaterial` / shaders)
- `src/ui/` — overlay manager, intro sequence, one module per content page
- Content pages are DOM overlays; 3D rendering pauses while one is open
- Lamp click tweens the global `nightMix` — the entire room crossfades between warm-day and cool-dusk bakes

Design docs: `docs/design/` + `docs/superpowers/specs/`, plans: `docs/superpowers/plans/`.
