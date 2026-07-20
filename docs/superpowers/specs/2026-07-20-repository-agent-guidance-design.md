# Repository Agent Guidance and Cleanup — Design Spec

**Date:** 2026-07-20
**Owner:** Ritvik Gupta

## Purpose

Give coding agents concise, local guidance for the 3D desk portfolio while removing confirmed repository clutter. The guidance must describe the code that exists today, preserve the baked-rendering architecture, and avoid repeating the same instructions in every directory.

## Scope

- Add a root `AGENTS.md` for project-wide commands, architecture, constraints, and verification.
- Add subsystem `AGENTS.md` files in `src/core/`, `src/render/`, `src/scene/`, `src/ui/`, and `src/content/`.
- Remove five empty Finder-style duplicate directories under `src/`: `content 2/`, `core 2/`, `scene 2/`, `styles 2/`, and `ui 2/`.
- Extend the project `.gitignore` with common local, environment, coverage, and log artifacts.
- Keep all cleanup inside `portfolio/`.

## Documentation Hierarchy

The nearest `AGENTS.md` applies to work in its directory tree. Root guidance contains only cross-project rules; subsystem files add local contracts and link back to authoritative source or design files.

### Root

`AGENTS.md` will document:

- Vite, vanilla JavaScript, three.js, GSAP, marked, and Vitest.
- `npm run dev`, `npm run build`, `npm run preview`, and `npm test`.
- The boot flow in `src/main.js` and the `intro → idle → zoomed → closing` state flow.
- Global constraints: no UI framework, content belongs in `src/content/`, overlays pause 3D rendering, and reduced-motion behavior must be preserved.
- The six instruction boundaries and the baked-rendering philosophy document.
- Verification expectations for code, content, and visual interaction changes.

### Core Runtime

`src/core/AGENTS.md` will describe the shared engine tick, mode state, camera rig, raycast registration contract, and directed-camera constraints. It will tell agents to route new interactables through `src/main.js` rather than creating independent loops or controls.

### Render Pipeline

`src/render/AGENTS.md` will treat `docs/design/2026-07-06-baked-rendering-philosophy.md` as authoritative. It will prohibit scene lights, explain baked materials and the `nightMix` registry, document the composer chain and bloom behavior, and preserve the future GLB/lightmap loader contract.

### Scene Objects

`src/scene/AGENTS.md` will define the `{ group, id, label }` object contract, optional update/toggle hooks, unlit material rules, registration through `src/main.js`, and current world-space conventions.

### UI and Styles

`src/ui/AGENTS.md` will cover overlay registration, page factory return shapes, GSAP transitions, nested Escape handling, content injection, and styling conventions. It will also govern `src/ui/pages/` and point to `src/styles/` as the associated style layer.

### Content

`src/content/AGENTS.md` will document JSON and Markdown schemas, public asset paths, eager blog loading and sort order, and the content smoke-test requirement.

No separate files will be added to `tests/`, `docs/`, `public/`, `src/styles/`, or `src/ui/pages/`; their guidance fits in the root, UI, or content boundary and separate files would be repetitive.

## Cleanup Policy

Only artifacts with direct evidence of being disposable will be removed. The five `src/* 2/` directories are empty, untracked, unreferenced, and match an established macOS duplicate naming pattern.

The following remain untouched:

- `dist/` and `node_modules/`, because they are correctly ignored and may be useful locally.
- `.claude/settings.local.json`, because it is an intentional machine-local configuration.
- `public/` source assets and placeholders.
- `docs/` design and implementation history.
- Sibling projects and parent-repository duplicate files or gitlinks.

The project `.gitignore` will add `.DS_Store`, `.env*` with an example-file exception, `coverage/`, and `*.log` so the project remains safe if extracted from the parent repository.

## Content and Maintenance Rules

- Keep each agent file concise and scoped; avoid copying root text into child files.
- Use exact paths, function names, commands, and contracts verified in source.
- Prefer durable architectural guidance over file inventories likely to drift.
- Include concrete examples only where they clarify a contract.
- Do not introduce Cursor-specific `.mdc` rules because the requested hierarchical `AGENTS.md` files already provide path-scoped context.

## Verification

After implementation:

1. Confirm the five duplicate directories no longer exist and no other empty source directories were removed.
2. Run `npm test`.
3. Run `npm run build`.
4. Inspect portfolio-scoped git status and diff to ensure only the six agent files, `.gitignore`, and approved cleanup are present.
5. Check edited files for diagnostics and scan all agent guidance for stale paths or contradictory rules.

## Out of Scope

- Refactoring application code.
- Deleting generated dependencies or build output.
- Cleaning the parent `Code` repository.
- Repairing sibling gitlinks or submodules.
- Adding CI, deployment, or new testing infrastructure.
