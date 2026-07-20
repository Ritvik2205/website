# Monsoon Postroom Ambient Environment — Design Spec

**Date:** 2026-07-20
**Owner:** Ritvik Gupta

## Purpose

Transform the existing first-person 3D desk portfolio into a cozy rainy correspondence room called **Monsoon Postroom**. The redesign should feel tactile, warm, and personal while preserving the current scene architecture, interaction model, performance profile, and baked-light rendering philosophy.

The supplied corkboard, investigation-board, and floppy-disk references inform theatrical framing, narrative ephemera, and graphic confidence. The implementation must not reproduce their layouts, signature props, artwork, or branded shapes.

## Experience

The visitor sits at a dark walnut correspondence desk during a rainy blue-grey evening. A green enamel task lamp creates a painted honey-colored pool across paper, brass, and wood. The corkboard reads as a working archive of postcards and routing slips rather than a conspiracy board. Projects, writing, art, music, and experience feel like related pieces of correspondence collected over time.

The scene remains first-person and directed. Existing desk objects retain their interaction IDs and roles:

- Laptop opens projects.
- Sketchbook opens the gallery.
- Journal opens the blog.
- Turntable opens music.
- Corkboard opens experience.
- Lamp toggles the global room mood.

## Visual System

### Palette

- Storm Ink `#171B22` — deepest background and overlay chrome.
- Rain Slate `#334B5F` — lamp-off room, window, and cool shadows.
- Verdigris `#688178` — enamel lamp, cotton thread, and secondary accents.
- Tobacco Oak `#765137` — desk, frame, and turntable wood.
- Honey Lamp `#E1A44B` — lamp pool, warm bloom, and active highlights.
- Rag Paper `#E7DEC9` — letters, cards, journals, and primary reading surfaces.

The lamp-on state is warm but not orange-washed. The lamp-off state remains legible and blue-grey rather than black.

### Typography

- Keep `Space Mono` for routing numbers, dates, stamps, utility labels, and boot status.
- Keep `Caveat` for personal annotations and handwritten note accents.
- Add `Newsreader` as the restrained editorial serif for correspondence headings and project titles.
- Use typography structurally: postal codes, dates, and filing labels identify content rather than decorate it.

### Materials

The room uses dark walnut, aged brass, green enamel, smoky glass, deckled paper, cotton thread, postal stamps, and rain-marked glass. Generated props must include neutral, baked-in shading so they remain convincing with `MeshBasicMaterial` and the global mood dimming registry.

### Signature Element

The corkboard becomes a **correspondence ledger**. Postcards, routing slips, tickets, and envelopes are arranged asymmetrically with breathing room. Sparse desaturated-blue cotton connects only meaningful relationships. Brass pins, cancellation marks, and date stamps replace the red detective-web language.

## Technical Approach

Use a hybrid implementation:

1. Preserve the Three.js geometry, directed camera, raycast targets, state machine, and DOM overlay architecture.
2. Repaint deterministic day/night canvas bakes for the wall, desk, and window.
3. Use Higgsfield to generate original, neutral-background 2D prop illustrations and ephemera.
4. Remove generated backgrounds and integrate the results as transparent PNG sprites under `public/assets/`.
5. Restyle the intro and content overlays with shared Monsoon Postroom tokens.

Do not replace the room with a panoramic background and do not introduce generated 3D assets in this pass. Those approaches either flatten the interaction depth or add disproportionate geometry and material cleanup.

## Rendering Constraints

`docs/design/2026-07-06-baked-rendering-philosophy.md` remains authoritative.

- Add no `AmbientLight`, `DirectionalLight`, `SpotLight`, runtime shadows, or PBR-lit prop materials.
- Paint illumination, shadows, ambient occlusion, and window-frame silhouettes into day/night textures.
- Keep `nightMix` as the single room mood axis.
- Use bright painted pixels and the existing bloom composer for glow.
- Keep the directed camera and current fly-to anchors unless framing changes require small measured adjustments.
- Register every generated sprite group with the existing unlit mood system.
- Do not independently generate day/night bake pairs because generative outputs will not be pixel-aligned.

## Higgsfield Asset Set

Generate five original asset groups:

1. **Task lamp:** compact green enamel shade, aged brass arm and base, three-quarter front view, baked neutral shading.
2. **Turntable:** compact walnut body, dark platter, small brass details, three-quarter front view.
3. **Tea cup:** glazed ceramic cup and saucer with a restrained steam-free silhouette.
4. **Postal ephemera sheet:** original envelopes, route labels, tickets, receipts, stamps, cancellation marks, and brass pins with no readable brand names.
5. **Boot floppy:** original charcoal floppy with a rust-orange postroom label and handwritten owner mark, distinct from the supplied silhouette and graphics.

Generation workflow:

1. Ask Higgsfield for the best image model for stylized product cutouts and ephemera.
2. Inspect the recommended model contract.
3. Preflight generation cost.
4. Obtain explicit user confirmation before spending credits.
5. Generate two candidates each for the lamp, turntable, and floppy, plus one candidate each for the tea cup and ephemera sheet: eight images total.
6. Use Higgsfield background removal for selected assets.
7. Download optimized outputs into `public/assets/postroom/`.
8. Preserve generation IDs and prompts in an asset manifest for reproducibility.

The supplied references will not be uploaded as direct generation conditioning. Prompts will describe the selected material and mood system to avoid copying protected composition or artwork.

## Scene Changes

### Environment

Update the wall, desk, floor, window, and scene background:

- Darken the room surround to Storm Ink.
- Repaint the desk as Tobacco Oak with subtle grain and softer AO.
- Repaint the wall as warm-grey plaster with cool rainy falloff.
- Strengthen broad window-frame shadows across the wall and desk.
- Paint one focused Honey Lamp pool around the journal/sketchbook area.
- Keep window highlights bright enough for controlled bloom.
- Tune bloom only after the new bakes and sprites are visible to avoid washing out paper.

### Props

- Replace the current lamp and turntable art with generated transparent sprites.
- Add the tea cup as non-interactive set dressing in an uncluttered desk area.
- Use generated ephemera to enrich the 3D corkboard and selected desk surfaces.
- Keep the laptop, sketchbook, and journal procedural geometry, but repaint their canvas textures and colors to match the material system.
- Preserve stable object IDs and click targets.

### Atmosphere and Motion

- Keep rain localized to the window.
- Preserve lamp crossfade, camera movement, hover lift, and turntable rotation.
- Add at most one subtle paper-tag drift through the existing engine tick.
- Do not add room-wide fog or particle effects.
- Disable nonessential drift, page motion, and decorative animation under `prefers-reduced-motion`.

## Corkboard

Update both the 3D board and DOM experience overlay:

- Replace red strings with sparse Verdigris/blue cotton.
- Replace flat detective notes with postcards, routing slips, envelopes, and two polaroid-like portfolio images.
- Keep existing `experience.json` relationships, but render only meaningful connections.
- Use brass pin details and postal date labels.
- Preserve `redrawStrings()` and resize behavior.
- Keep nested note modals and Escape propagation behavior.

## Intro

The generated boot floppy becomes the central interactive object.

The intro sequence remains:

1. Visitor activates the floppy.
2. A short utility-style boot log appears.
3. The camera flies into the desk scene.

The copy shifts from cyber-terminal language to correspondence language, such as opening the postroom, indexing letters, and routing the desk archive. Skip, local-storage revisit behavior, keyboard semantics, and reduced-motion behavior remain intact.

## Overlay System

Use shared CSS tokens so every overlay belongs to the same room:

- Projects: filed correspondence windows with paper cards, routing labels, and restrained status marks instead of a cyber desktop.
- Gallery: a print contact-sheet drawer with paper captions and dark walnut surround.
- Blog: retain the journal/binder concept and align its paper, ink, and brass details with the new palette.
- Music: use a record-crate and listening-card treatment around the existing Spotify embed.
- Experience: mirror the correspondence ledger from the 3D board.

Retain imperative DOM factories, existing IDs, overlay lifecycle hooks, global close behavior, nested Escape handling, and 3D render pausing.

## Accessibility and Responsiveness

- Preserve visible focus states and semantic buttons/links.
- Keep text contrast readable in both room moods and all overlays.
- Preserve current narrow-viewport overlay behavior.
- Respect `prefers-reduced-motion` in the intro, camera, parallax, rain density, page flips, record movement, and new decorative motion.
- Generated interactive artwork must retain text labels or `aria-label` equivalents; visual text embedded in images must not be required for navigation.

## Error Handling

- Generated sprites must have deterministic local fallback geometry or existing procedural art if an image fails to load.
- Missing optional set-dressing assets must not block scene startup.
- Asset paths must use root-relative URLs from `public/`, never `/public/...`.
- Higgsfield generation failures or insufficient credits stop only the asset step; deterministic bakes and CSS work remain implementable.

## Verification

- Run `npm test`.
- Run `npm run build`.
- Add focused tests for any new asset manifest or content transformations.
- Verify every generated asset path exists and loads.
- Manually review intro, all six scene interactions, lamp-on/off moods, overlay close/Escape, nested modals, resize behavior, narrow viewport, and reduced motion.
- Check for scene lights and preserve the composer pipeline.
- Compare final screenshots in lamp-on and lamp-off states against this spec rather than against the supplied references.

## Out of Scope

- Copying the reference sites, artwork, branded text, exact prop silhouettes, or compositions.
- Runtime scene lighting, shadow maps, or a second mood axis.
- Generated day/night bake pairs.
- Full GLB replacement of the room or hero props.
- Orbit/free-fly camera controls.
- UI frameworks, backend services, or CMS work.
- New portfolio content beyond the visual treatment and minimal copy needed for the postroom framing.
