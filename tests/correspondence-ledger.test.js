import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCorkboard } from '../src/scene/corkboard.js';
import {
  BOARD,
  FEATURED_SLOTS,
  SET_PIECES,
  THREADS,
  buildDecor,
  pinPoint,
} from '../src/scene/corkboardLayout.js';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

// Any 2D-context call is a no-op; measureText approximates width for wrapping.
function stubCanvasDocument() {
  vi.stubGlobal('document', {
    createElement: vi.fn(() => {
      const canvas = { width: 0, height: 0 };
      const context = new Proxy({ measureText: (t) => ({ width: String(t).length * 10 }) }, {
        get: (target, key) => (key in target ? target[key] : () => ({ addColorStop() {} })),
        set: (target, key, value) => { target[key] = value; return true; },
      });
      canvas.getContext = () => context;
      return canvas;
    }),
  });
}

const overlaps = (a, b) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;

const ENTRIES = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
  id, title: `Role ${id}`, org: `Org ${id}`, start: '2025-01', end: 'present', summary: 's', body: 'b', tags: [],
}));

beforeEach(() => stubCanvasDocument());
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Investigation board layout', () => {
  it('is deterministic and dense', () => {
    const a = buildDecor();
    expect(buildDecor()).toEqual(a);
    expect(a.length).toBeGreaterThanOrEqual(60);
    expect(new Set(a.map((s) => s.kind)).size).toBeGreaterThanOrEqual(5);
  });

  it('keeps every decorative sheet on the board and off the featured sheets and poster', () => {
    const protectedRects = [...FEATURED_SLOTS, SET_PIECES.find((s) => s.id === 'poster')];
    for (const sheet of buildDecor()) {
      expect(Math.abs(sheet.x) + sheet.w / 2).toBeLessThan(BOARD.width / 2);
      expect(Math.abs(sheet.y) + sheet.h / 2).toBeLessThan(BOARD.height / 2);
      for (const rect of protectedRects) expect(overlaps(sheet, rect)).toBe(false);
    }
  });

  it('uses only a handful of threads between real pins', () => {
    expect(THREADS.length).toBeLessThanOrEqual(6);
    for (const [a, b] of THREADS) {
      expect(pinPoint(a)).toBeTruthy();
      expect(pinPoint(b)).toBeTruthy();
    }
  });
});

describe('Investigation board (3D)', () => {
  it('builds a framed board with four featured sheets and sparse threads', () => {
    const board = createCorkboard();
    const frames = board.group.children.filter((c) => c.name === 'boardFrame');
    const threads = board.group.children.filter((c) => c.isLine);

    expect(board.id).toBe('experience');
    expect(board.skipHoverVisual).toBe(true);
    expect(frames).toHaveLength(4);
    expect(board.featured).toHaveLength(FEATURED_SLOTS.length);
    expect(threads).toHaveLength(THREADS.length);
    expect(board.sheets.length).toBeGreaterThan(60);
  });

  it('pins the most recent entries onto the featured sheets in order', () => {
    const board = createCorkboard();
    board.setFeatured(ENTRIES);
    expect(board.featured.map((m) => m.userData.experienceId)).toEqual(['a', 'b', 'c', 'd']);
    expect(board.sheetWorldPosition('b')).toBeTruthy();
    expect(board.sheetWorldPosition('e')).toBeNull();
  });

  it('lifts only the hovered featured sheet', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    const board = createCorkboard();
    board.setFeatured(ENTRIES);
    const [first, second] = board.featured;
    board.setHovered('a');
    expect(first.position.z).toBeGreaterThan(first.userData.baseZ);
    expect(second.position.z).toBe(second.userData.baseZ);
    board.setHovered(null);
    expect(first.position.z).toBe(first.userData.baseZ);
  });
});

describe('Hover skip flags', () => {
  it('documents skipHoverVisual on the corkboard factory', async () => {
    const source = await readSource('../src/scene/corkboard.js');
    expect(source).toContain('skipHoverVisual: true');
    expect(source).not.toContain('skipHoverLift');
    const interactions = await readSource('../src/core/interactions.js');
    expect(interactions).toContain('skipHoverVisual');
    expect(interactions).not.toContain('skipHoverLift');
  });
});
