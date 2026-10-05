import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const gsap = vi.hoisted(() => ({
  set: vi.fn(),
  to: vi.fn(),
}));

vi.mock('gsap', () => ({ default: gsap }));

import { createJournal } from '../src/scene/journal.js';
import { createLaptop } from '../src/scene/laptop.js';
import { createSketchbook } from '../src/scene/sketchbook.js';
import { createBlogPage } from '../src/ui/pages/blog.js';
import { createMusicPage } from '../src/ui/pages/music.js';

function stubCanvasDocument() {
  const canvases = [];

  vi.stubGlobal('document', {
    createElement: vi.fn((tagName) => {
      expect(tagName).toBe('canvas');
      const draws = [];
      const context = {
        fillStyle: '',
        strokeStyle: '',
        font: '',
        lineWidth: 1,
        textAlign: 'start',
        fillRect: vi.fn((...args) => draws.push({
          type: 'fillRect',
          color: context.fillStyle,
          args,
        })),
        fillText: vi.fn((text, x, y) => draws.push({
          type: 'fillText',
          color: context.fillStyle,
          text,
          x,
          y,
        })),
        strokeRect: vi.fn((...args) => draws.push({
          type: 'strokeRect',
          color: context.strokeStyle,
          args,
        })),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        bezierCurveTo: vi.fn(),
        arc: vi.fn(),
        stroke: vi.fn(() => draws.push({
          type: 'stroke',
          color: context.strokeStyle,
        })),
      };
      const canvas = {
        width: 0,
        height: 0,
        draws,
        getContext: vi.fn(() => context),
      };
      canvases.push(canvas);
      return canvas;
    }),
  });

  return canvases;
}

function fakeElement(tagName) {
  const listeners = new Map();
  const selectors = new Map();
  let html = '';

  const element = {
    tagName: tagName.toUpperCase(),
    className: '',
    children: [],
    dataset: {},
    parentNode: null,
    hidden: false,
    textContent: '',
    style: {},
    attributes: new Map(),
    set innerHTML(value) { html = value; },
    get innerHTML() { return html; },
    get firstElementChild() { return this.children[0] ?? null; },
    setAttribute(name, value) { this.attributes.set(name, String(value)); },
    getAttribute(name) { return this.attributes.get(name) ?? null; },
    removeAttribute(name) { this.attributes.delete(name); },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    insertBefore(child, reference) {
      const index = this.children.indexOf(reference);
      child.parentNode = this;
      this.children.splice(index < 0 ? this.children.length : index, 0, child);
      return child;
    },
    replaceWith(next) {
      const parent = this.parentNode;
      const index = parent?.children.indexOf(this) ?? -1;
      if (index < 0) return;
      parent.children[index] = next;
      next.parentNode = parent;
      this.parentNode = null;
    },
    remove() {
      const parent = this.parentNode;
      const index = parent?.children.indexOf(this) ?? -1;
      if (index >= 0) parent.children.splice(index, 1);
      this.parentNode = null;
    },
    addEventListener(type, listener) {
      const handlers = listeners.get(type) ?? [];
      handlers.push(listener);
      listeners.set(type, handlers);
    },
    dispatchEvent(event) {
      for (const listener of listeners.get(event.type) ?? []) listener(event);
    },
    click() {
      this.dispatchEvent({ type: 'click', preventDefault: vi.fn(), stopPropagation: vi.fn() });
    },
    focus: vi.fn(),
    showModal() { this.open = true; },
    close() { this.open = false; },
    querySelector(selector) {
      const match = this.querySelectorAll(selector)[0];
      if (match) return match;
      if (selector === '.vinyl-disc') {
        if (!selectors.has(selector)) selectors.set(selector, fakeElement('div'));
        return selectors.get(selector);
      }
      return null;
    },
    querySelectorAll(selector) {
      const matches = [];
      const selectorClass = selector.startsWith('.') ? selector.slice(1) : null;
      const selectorRole = selector.match(/^\[role="(.+)"\]$/)?.[1];
      const visit = (node) => {
        if (
          (selectorClass && node.className.split(' ').includes(selectorClass))
          || (selectorRole && node.getAttribute('role') === selectorRole)
        ) matches.push(node);
        node.children.forEach(visit);
      };
      this.children.forEach(visit);
      return matches;
    },
  };

  return element;
}

function stubPageDocument() {
  vi.stubGlobal('document', {
    createElement: vi.fn((tagName) => fakeElement(tagName)),
    createElementNS: vi.fn((_namespace, tagName) => fakeElement(tagName)),
  });
}

function stubMotionPreference(reduced) {
  vi.stubGlobal('window', {
    matchMedia: vi.fn((query) => {
      expect(query).toBe('(prefers-reduced-motion: reduce)');
      return { matches: reduced };
    }),
  });
}

beforeEach(() => {
  gsap.set.mockReset();
  gsap.to.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Monsoon Postroom remaining procedural props', () => {
  it('uses the approved laptop palette and preserves its screen shader contract', () => {
    const canvases = stubCanvasDocument();
    const laptop = createLaptop();
    const fallback = laptop.group.children.find((child) => child.children?.length >= 3);
    const [base, lid, screen] = fallback.children;
    const draws = canvases[0].draws;

    expect(laptop.id).toBe('projects');
    expect(laptop.label).toBe('projects');
    expect(base.geometry.parameters).toMatchObject({ width: 0.42, height: 0.02, depth: 0.3 });
    expect(lid.geometry.parameters).toMatchObject({ width: 0.42, height: 0.28, depth: 0.015 });
    expect(screen.geometry.parameters).toMatchObject({ width: 0.38, height: 0.24 });
    expect(laptop.group.position).toMatchObject({ x: 0.72, y: 0.44, z: -0.38 });
    expect(laptop.group.rotation.y).toBeCloseTo(-0.18);
    expect(base.material.color.getHex()).toBe(0x171b22);
    expect(lid.material.color.getHex()).toBe(0x171b22);
    expect(draws).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'fillRect', color: '#171b22' }),
      expect.objectContaining({ type: 'fillText', color: '#e7dec9' }),
      expect.objectContaining({ type: 'fillText', color: '#688178' }),
      expect.objectContaining({ type: 'fillRect', color: '#e1a44b' }),
    ]));

    expect(screen.material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(screen.material.uniforms).toEqual(expect.objectContaining({
      uTexture: expect.objectContaining({ value: expect.any(THREE.CanvasTexture) }),
      uTime: { value: 0 },
    }));
    expect(screen.material.fragmentShader).toContain('uniform float uTime;');
    expect(screen.material.fragmentShader).toContain(
      'float scan = 0.9 + 0.1 * sin(vUv.y * 400.0 + uTime * 8.0);',
    );
    expect(screen.material.fragmentShader).toContain(
      'float flicker = 0.97 + 0.03 * sin(uTime * 47.0);',
    );

    laptop.update(0.25);
    expect(screen.material.uniforms.uTime.value).toBe(0.25);
  });

  it('uses Tobacco Oak, Rag Paper, and a restrained brass postal mark on the journal', () => {
    const canvases = stubCanvasDocument();
    const { group, id, label } = createJournal();
    const [cover, top, spine, pages, strap] = group.children;

    expect(id).toBe('blog');
    expect(label).toBe('journal');
    expect(group.children).toHaveLength(5);
    expect(cover.geometry.parameters).toMatchObject({ width: 0.22, height: 0.05, depth: 0.3 });
    expect(top.geometry.parameters).toMatchObject({ width: 0.22, height: 0.3 });
    expect(spine.geometry.parameters).toMatchObject({ width: 0.03, height: 0.055, depth: 0.3 });
    expect(pages.geometry.parameters).toMatchObject({ width: 0.2, height: 0.035, depth: 0.28 });
    expect(strap.geometry.parameters).toMatchObject({ width: 0.24, height: 0.012, depth: 0.03 });
    expect(group.position).toMatchObject({ x: -0.05, y: 0.44, z: -0.28 });
    expect(group.rotation.y).toBeCloseTo(0.12);
    expect(cover.material.color.getHex()).toBe(0x765137);
    expect(pages.material.color.getHex()).toBe(0xe7dec9);
    expect(canvases[0].draws).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'fillRect', color: '#765137' }),
      expect.objectContaining({ type: 'strokeRect', color: '#a77a3f' }),
      expect.objectContaining({ type: 'stroke', color: '#a77a3f' }),
    ]));
    expect(top.material.map).toBeInstanceOf(THREE.CanvasTexture);
  });

  it('uses Rag Paper with Verdigris drawing and Verdigris/brass pencils', () => {
    const canvases = stubCanvasDocument();
    const { group, id, label } = createSketchbook();
    const pages = group.children.filter(
      ({ geometry }) => geometry?.type === 'BoxGeometry'
        && geometry.parameters.width === 0.24,
    );
    const pencils = group.children.filter(
      ({ geometry }) => geometry?.type === 'CylinderGeometry',
    );

    expect(id).toBe('gallery');
    expect(label).toBe('sketches & photos');
    expect(group.children).toHaveLength(6);
    expect(pages).toHaveLength(2);
    expect(pages.every(({ geometry }) => (
      geometry.parameters.height === 0.015 && geometry.parameters.depth === 0.3
    ))).toBe(true);
    expect(pencils).toHaveLength(3);
    expect(pencils.every(({ geometry }) => (
      geometry.parameters.radiusTop === 0.006
        && geometry.parameters.radiusBottom === 0.006
        && geometry.parameters.height === 0.14
        && geometry.parameters.radialSegments === 10
    ))).toBe(true);
    expect(group.position).toMatchObject({ x: 0.28, y: 0.44, z: -0.22 });
    expect(group.rotation.y).toBeCloseTo(0.02);
    expect(pages.every(({ material }) => material.color.getHex() === 0xe7dec9)).toBe(true);
    expect(canvases[0].draws).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'fillRect', color: '#e7dec9' }),
      expect.objectContaining({ type: 'stroke', color: '#688178' }),
    ]));
    expect(new Set(pencils.map(({ material }) => material.color.getHex()))).toEqual(
      new Set([0x688178, 0xa77a3f]),
    );
  });
});

describe('reduced-motion page behavior', () => {
  it('does not create the music spin tween when reduced motion is requested', () => {
    stubPageDocument();
    stubMotionPreference(true);

    const { hooks } = createMusicPage({
      spotify: { playlistId: 'playlist', profileUrl: 'https://example.com' },
    });
    hooks.onOpen();
    hooks.onClose();

    expect(gsap.to).not.toHaveBeenCalled();
  });

  it('preserves the infinite music spin and close cleanup in normal motion', () => {
    stubPageDocument();
    stubMotionPreference(false);
    const kill = vi.fn();
    gsap.to.mockReturnValue({ kill });

    const { hooks } = createMusicPage({
      spotify: { playlistId: 'playlist', profileUrl: 'https://example.com' },
    });
    hooks.onOpen();

    expect(gsap.to).toHaveBeenCalledWith(expect.anything(), {
      rotation: 360,
      repeat: -1,
      ease: 'none',
      duration: 3,
    });
    hooks.onClose();
    expect(kill).toHaveBeenCalledOnce();
  });

  it('renders journal stations and opens an article modal without animation under reduced motion', () => {
    stubPageDocument();
    stubMotionPreference(true);
    const { el, hooks } = createBlogPage([
      { title: 'Rain notes', date: '2026-07-21', body: 'Post body.' },
    ]);
    const station = el.querySelector('.journal-station');
    const modal = el.querySelector('.journal-article-modal');

    expect(el.querySelector('.journal-map')).toBeTruthy();
    expect(station.querySelector('.journal-station-title').textContent).toContain('Rain notes');
    expect(modal.hidden).toBe(true);

    station.click();
    expect(modal.hidden).toBe(false);
    expect(modal.open).toBe(true);
    expect(modal.querySelector('.journal-article-body').innerHTML).toContain('Post body.');
    expect(modal.querySelector('.journal-article-close').focus).toHaveBeenCalledOnce();
    const escape = { type: 'keydown', key: 'Escape', preventDefault: vi.fn(), stopPropagation: vi.fn() };
    modal.dispatchEvent(escape);
    expect(station.focus).toHaveBeenCalledOnce();
    expect(escape.stopPropagation).toHaveBeenCalledOnce();

    hooks.onOpen();
    expect(gsap.to).not.toHaveBeenCalled();
  });

  it('animates the coaster car only while the journal is open in normal motion', () => {
    stubPageDocument();
    stubMotionPreference(false);
    const kill = vi.fn();
    gsap.to.mockReturnValue({ kill });
    const { el, hooks } = createBlogPage([
      { title: 'Rain notes', date: '2026-07-21', body: 'Post body.' },
    ]);

    hooks.onOpen();

    expect(gsap.to).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      onUpdate: expect.any(Function),
      duration: 3.2,
      ease: 'power1.inOut',
    }));
    hooks.onClose();
    expect(kill).toHaveBeenCalledOnce();
  });

  it('shows a journal empty state when no posts are loaded', () => {
    stubPageDocument();
    stubMotionPreference(true);

    const { el } = createBlogPage([]);

    expect(el.querySelector('.journal-empty')).toBeTruthy();
  });
});
