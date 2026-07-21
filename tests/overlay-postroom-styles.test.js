import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

describe('Monsoon Postroom shared typography', () => {
  it('loads the exact Newsreader optical-size weights with the existing families', async () => {
    const html = await readSource('../index.html');

    expect(html).toContain(
      'family=Caveat:wght@400;600&family=Newsreader:opsz,wght@6..72,400;6..72,600&family=Space+Mono:wght@400;700&display=swap',
    );
  });

  it('defines the exact shared palette and type-role tokens', async () => {
    const css = await readSource('../src/styles/main.css');

    // Source assertions are intentional for exact design tokens: Vitest runs in
    // Node without a computed-style engine, while browser checks cover rendering.
    expect(css).toContain(`:root {
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
}`);
  });

  it('assigns display, route, and annotation typography to their intended roles', async () => {
    const css = await readSource('../src/styles/pages.css');

    expect(css).toMatch(/\.page-heading\s*\{[^}]*var\(--font-display\)/s);
    expect(css).toMatch(/\.window-title\s*\{[^}]*var\(--font-display\)/s);
    expect(css).toMatch(/\.route-mark\s*\{[^}]*var\(--font-mono\)/s);
    expect(css).toMatch(/\.gallery-caption\s*\{[^}]*var\(--font-hand\)/s);
    expect(css).toMatch(/\.post-body\s*\{[^}]*var\(--font-display\)/s);
  });
});

describe('Monsoon Postroom project routing desk', () => {
  it('renders file routing metadata before each project title', async () => {
    const source = await readSource('../src/ui/pages/projects.js');
    const routeMark = source.indexOf(
      '<span class="route-mark">FILE ${String(i + 1).padStart(2, \'0\')}</span>',
    );
    const title = source.indexOf('<span class="window-title">${p.title}</span>');

    // This imperative DOM factory depends on a browser document. Source order is
    // the stable Node regression seam; the generated markup is checked in Chrome.
    expect(source).toContain("heading.textContent = 'PROJECT ROUTING DESK';");
    expect(routeMark).toBeGreaterThan(-1);
    expect(title).toBeGreaterThan(routeMark);
  });

  it('removes the old terminal heading and traffic-light semantics', async () => {
    const [source, css] = await Promise.all([
      readSource('../src/ui/pages/projects.js'),
      readSource('../src/styles/pages.css'),
    ]);

    expect(source).not.toContain('~/projects');
    expect(source).not.toMatch(/dot--[ryg]/);
    expect(css).not.toMatch(/\.dot(?:--[ryg])?\b/);
    expect(css).not.toMatch(/#5a8aff|#7a9aff|#e0605e|#e0b64e|#6ac06a/i);
  });
});

describe('Monsoon Postroom page and overlay color contracts', () => {
  it('styles project files as paper correspondence on a storm surround', async () => {
    const css = await readSource('../src/styles/pages.css');

    expect(css).toMatch(/\.projects-desktop\s*\{[^}]*background:\s*var\(--storm-ink\)/s);
    expect(css).toMatch(/\.project-window\s*\{[^}]*background:\s*var\(--rag-paper\)/s);
    expect(css).toMatch(/\.window-titlebar\s*\{[^}]*background:\s*var\(--tobacco-oak\)/s);
    expect(css).toMatch(/\.route-mark\s*\{[^}]*color:\s*var\(--verdigris\)/s);
    expect(css).toMatch(/\.project-window:hover\s*\{[^}]*var\(--honey-lamp\)/s);
    expect(css).toMatch(/\.window-body\s*\{[^}]*color:\s*var\(--ink\)/s);
    expect(css).toMatch(/\.tech-tag\s*\{[^}]*border-radius:\s*[234]px/s);
  });

  it('uses drawer, contact-sheet, binder, record, and listening-card colors', async () => {
    const css = await readSource('../src/styles/pages.css');

    expect(css).toMatch(/\.gallery-page\s*\{[^}]*background:\s*var\(--storm-ink\)/s);
    expect(css).toMatch(/\.gallery-item--sketch\s*\{[^}]*background:\s*var\(--rag-paper\)/s);
    expect(css).toMatch(/\.gallery-item--photo\s*\{[^}]*background:\s*var\(--tobacco-oak\)/s);
    expect(css).toMatch(/\.binder\s*\{[^}]*var\(--tobacco-oak\)/s);
    expect(css).toMatch(/\.ring\s*\{[^}]*border:[^;]*var\(--honey-lamp\)/s);
    expect(css).toMatch(/\.binder-page\s*\{[^}]*var\(--rag-paper\)/s);
    expect(css).toMatch(/\.vinyl-label\s*\{[^}]*var\(--verdigris\)[^}]*var\(--honey-lamp\)/s);
    expect(css).toMatch(/\.music-panel\s*\{[^}]*background:\s*var\(--rag-paper\)/s);
  });

  it('uses translucent rain-slate chrome with paper and honey controls', async () => {
    const css = await readSource('../src/styles/overlay.css');

    expect(css).toMatch(/\.overlay-page\s*\{[^}]*background:\s*rgba\(51,\s*75,\s*95,[^)]+\)/s);
    expect(css).toMatch(/\.overlay-back\s*\{[^}]*background:\s*var\(--rag-paper\)/s);
    expect(css).toMatch(/\.overlay-back:hover[\s\S]*?var\(--honey-lamp\)/);
    expect(css).toMatch(/\.overlay-back:focus-visible[\s\S]*?var\(--honey-lamp\)/);
  });
});
