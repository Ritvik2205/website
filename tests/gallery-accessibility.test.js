import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGalleryPage } from '../src/ui/pages/gallery.js';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

function fakeElement(tagName) {
  const listeners = new Map();
  const selectors = new Map();
  const classes = new Set();

  return {
    tagName: tagName.toUpperCase(),
    type: '',
    className: '',
    children: [],
    tabIndex: 0,
    innerHTML: '',
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
    },
    appendChild(child) { this.children.push(child); },
    setAttribute() {},
    addEventListener(type, listener) {
      const handlers = listeners.get(type) ?? [];
      handlers.push(listener);
      listeners.set(type, handlers);
    },
    listenerCount(type) { return listeners.get(type)?.length ?? 0; },
    querySelector(selector) {
      if (!selectors.has(selector)) selectors.set(selector, fakeElement(selector));
      return selectors.get(selector);
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('gallery keyboard access', () => {
  it('creates one native button activator for each gallery item', () => {
    vi.stubGlobal('document', { createElement: vi.fn(fakeElement) });

    const page = createGalleryPage([
      { type: 'sketch', src: '/sketch.png', caption: 'Profile study' },
    ]);
    const strip = page.children[0];
    const item = strip.children[0];

    // This exercises the real page factory. A native button supplies Tab,
    // Enter, and Space behavior without custom keyboard-event emulation.
    expect(item.tagName).toBe('BUTTON');
    expect(item.type).toBe('button');
    expect(item.listenerCount('click')).toBe(1);
  });

  it('gives gallery activators a visible Honey focus treatment', async () => {
    const css = await readSource('../src/styles/pages.css');

    expect(css).toMatch(
      /\.gallery-item:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--honey-lamp\)/s,
    );
  });
});
