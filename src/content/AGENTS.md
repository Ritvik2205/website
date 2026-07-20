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
