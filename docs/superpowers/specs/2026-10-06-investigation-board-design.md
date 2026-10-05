# Investigation Board — Design Spec

**Date:** 2026-10-06
**Status:** Approved direction (user reference image), implementing
**Builds on:** `2026-10-05-soft-stylized-art-direction-design.md`

## Reference

A real investigation wall lit by one top-down metal pendant: a dense collage of different-sized sheets (typed pages, sticky clusters, photos, a calendar, a map, one "master plan" poster), only a handful of threads, a warm sepia pool of light with hard falloff into darkness.

## Board (3D)

- `src/scene/corkboardLayout.js` produces a deterministic collage in board-local meters: one poster, one map, one calendar, four featured experience sheets, and ~45 seeded decorative sheets (pages, sticky clusters, photos, index cards, clippings). Featured sheets are never covered by decoration.
- At most six threads, connecting the poster and featured sheets.
- Every sheet is its own plane with a canvas texture (aged paper tones, sepia photos), slight rotation, stacked z offsets so sheets cast small shadows on the cork.
- Featured sheets print the experience's org, role and dates from content and carry a numbered pin.

## Pendant lamp and rough light

- New kit prop `pendant` (dark metal cone, cord, emissive bulb) hangs above the board, partly visible at the top of the idle frame.
- `lighting.js` adds a narrow warm pendant `SpotLight` aimed at the board (attached via `attachPendantLight`). Hemisphere fill drops so the room falls into shadow outside the lamp pools.
- A final grade pass (after `OutputPass`) adds film grain, vignette and a slight sepia split. Grain is static under reduced motion.

## Interaction

- Clicking the board (or the Experience nav item) enters `zoomed('experience')` without an overlay: the camera frames the whole board (distance computed from the viewport aspect), rendering keeps running, and the four featured sheets become hoverable/clickable (lift + warm glow).
- Board chrome: back pill (`esc`) and a bottom pill "Pick a pinned sheet · Full timeline →".
- Clicking a featured sheet nudges the camera toward it and shows a glass card: role, org, dates, summary, "Read full entry →".
- "Full timeline" / "Read full entry" open the `experience` overlay: a readable glass timeline of every entry, newest first, scrolled to the chosen one.
- Back/Escape unwinds one layer at a time: timeline → board → (card) → desk.
- Reduced motion: camera moves are instant; no lift animation.

## Content

`experience.json` entries: `id`, `title` (role), `org`, `start` (`YYYY-MM`), `end` (`YYYY-MM` or `present`), `summary`, `body`, `tags[]`. `loadContent()` returns experience newest first; the first four are featured.

## Removed

The DOM corkboard clone (`src/ui/pages/corkboard.js` and its CSS) — replaced by the 3D board plus the timeline page.

## Verification

`npm test`, `npm run build`, browser run-through: idle framing with pendant, board zoom, sheet hover/click, card, timeline open/back, Escape unwinding, lamp toggle, reduced motion, narrow viewport.
