# Rollercoaster Journal — Design Spec

**Date:** 2026-07-25  
**Status:** Approved for planning  
**Approach:** Accessible DOM station cards over an SVG top-down spiral

## Purpose

Replace the current binder-style Journal overlay with a warm editorial rollercoaster map. The map looks down into a bottomless spiral of rails, turning the loaded blog posts into stations along the descent.

## Experience

- Opening the desk journal preserves the existing `blog` overlay and its shared “back to desk” control.
- The page contains a full-screen, top-down SVG illustration of two rails spiraling toward a deep central void. The width and contrast of the rings reduce toward the center to create depth without adding a second WebGL scene.
- Each loaded post becomes a numbered HTML station card placed on a corresponding spiral turn. It exposes its title and date and is a normal button for pointer, touch, and keyboard use.
- Selecting a station opens the post’s existing Markdown-rendered content in a focused modal above the map.
- Closing the modal returns focus to the station that opened it. Escape closes the modal only; the subsequent Escape follows the existing overlay-close behavior.
- If no posts are loaded, the map displays a clear empty-state card.

## Visual language

- Remove the wood binder, rings, ruled notebook page, and page-flip animation.
- Use the existing warm paper, tobacco, ink, slate, and honey palette for an illustrated editorial look.
- Rails, ties, the center void, and a small coaster car are decorative SVG elements. The car may make one restrained descent only while motion is allowed.
- Station cards use paper-like surfaces and legible ink text, with an obvious focus treatment and a sufficient contrast hover/active state.

## Architecture

- Keep `src/main.js` registration (`overlays.register('blog', createBlogPage(content.posts))`) and the `src/content/loader.js` post schema unchanged.
- Rebuild `src/ui/pages/blog.js` as the journal page factory. It derives station positions from post order, creates SVG rails/car, opens and closes the article modal, and owns modal keyboard/focus cleanup.
- Replace only the blog section of `src/styles/pages.css`, including responsive geometry and the reduced-motion override.
- Do not introduce Canvas, a second Three.js renderer, or dependencies. The regular overlay continues to pause/resume the desk renderer through `src/main.js`.

## Accessibility and motion

- Station cards remain semantic buttons with visible `:focus-visible` states.
- The modal has a labelled title, close button, focus handoff, and Escape handling that stops propagation before the parent overlay can close.
- Under `prefers-reduced-motion`, skip the car descent and rail/station entrance transitions; opening a post remains instantaneous.
- On narrow screens, retain the spiral hierarchy while repositioning cards to prevent overlap and keep targets usable.

## Error handling

- Empty post collections render an explanatory station card.
- Missing optional post fields fall back to a stable station label/date presentation rather than failing map construction.

## Verification

- Run `npm test` and `npm run build`.
- Manually verify desk journal click/hover and camera handoff; station selection by mouse and keyboard; modal close and Escape focus return; shared back-to-desk behavior; narrow viewport; normal and reduced-motion behavior.

## Expected files

- `src/ui/pages/blog.js`
- `src/styles/pages.css`
- `docs/superpowers/specs/2026-07-25-rollercoaster-journal-design.md`
