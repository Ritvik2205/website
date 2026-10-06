# UI and Overlay Guide

This guide also governs `pages/`. Associated presentation styles live in `../styles/`.

## Page and Overlay Contracts

- Page factories receive loaded content and return a DOM element. A page needing lifecycle behavior may return `{ el, hooks: { onOpen, onClose } }`.
- Register pages through `createOverlayManager().register(id, el, hooks?)`; keep IDs aligned with scene object IDs.
- Use the overlay manager for shared back-button and GSAP opacity transitions. Do not create a second overlay root.
- Keep 3D pause/resume orchestration in `src/main.js`, not inside page modules.
- `musicUi.js` (vinyl) and `sketchUi.js` (sketchbook) follow the same rule as `boardUi.js`: report intents, let `main.js` drive camera and scene.
- `boardUi.js` is chrome for corkboard mode (no overlay, render running); it only reports intents (`onBack`, `onTimeline`, `onCloseCard`) and `main.js` decides navigation.
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
