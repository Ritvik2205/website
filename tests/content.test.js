import { describe, it, expect } from 'vitest';
import { loadContent } from '../src/content/loader.js';
import { parseFrontmatter } from '../src/content/frontmatter.js';

describe('content', () => {
  it('parses frontmatter', () => {
    const { data, body } = parseFrontmatter('---\ntitle: Hi\ndate: 2026-01-02\n---\nBody here');
    expect(data.title).toBe('Hi');
    expect(data.date).toBe('2026-01-02');
    expect(body.trim()).toBe('Body here');
  });

  it('returns raw body when no frontmatter', () => {
    const { data, body } = parseFrontmatter('just text');
    expect(data).toEqual({});
    expect(body).toBe('just text');
  });

  it('loads all content with required shapes', async () => {
    const c = await loadContent();
    expect(c.projects.length).toBeGreaterThan(0);
    for (const p of c.projects) {
      expect(p).toMatchObject({ title: expect.any(String), description: expect.any(String) });
      expect(Array.isArray(p.tech)).toBe(true);
    }
    for (const n of c.experience) {
      expect(n).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        org: expect.any(String),
        summary: expect.any(String),
        body: expect.any(String),
      });
      expect(n.start).toMatch(/^\d{4}-\d{2}$/);
      expect(n.end).toMatch(/^(\d{4}-\d{2}|present)$/);
      expect(Array.isArray(n.tags)).toBe(true);
    }
    expect(c.gallery.length).toBeGreaterThan(0);
    expect(c.gallery.every((g) => ['sketch', 'photo'].includes(g.type))).toBe(true);
    expect(c.site.spotify.playlistId).toBeTruthy();
    expect(c.posts.length).toBeGreaterThan(0);
    expect(c.posts[0].title).toBeTruthy();
    expect(c.posts[0].body).toContain('#');
  });

  it('sorts experience most recent first, ongoing work on top', async () => {
    const c = await loadContent();
    expect(c.experience[0].end).toBe('present');
    const ends = c.experience.map((n) => n.end);
    expect(ends).toEqual([...ends].sort().reverse());
  });

  it('sorts posts newest first', async () => {
    const c = await loadContent();
    const dates = c.posts.map((p) => p.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});
