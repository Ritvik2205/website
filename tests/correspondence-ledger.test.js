import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCorkboard } from '../src/scene/corkboard.js';
import {
  CORK_FILLERS,
  CORK_INTERACTIVE,
  CORK_STRINGS,
} from '../src/scene/corkboardLayout.js';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

let textDraws;
let fills;

function stubCanvasDocument() {
  textDraws = [];
  fills = [];

  vi.stubGlobal('document', {
    createElement: vi.fn(() => {
      const canvas = { width: 0, height: 0 };
      const pixels = new Uint8ClampedArray(128 * 160 * 4);
      const context = {
        fillStyle: '',
        font: '',
        textAlign: '',
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        drawImage: vi.fn(),
        fillRect: vi.fn((...args) => fills.push({ color: context.fillStyle, args })),
        fillText: vi.fn((text, x, y) => {
          textDraws.push({ text, x, y, font: context.font, color: context.fillStyle });
        }),
        getImageData: vi.fn(() => ({ data: pixels, width: 128, height: 160 })),
        putImageData: vi.fn(),
      };
      canvas.getContext = vi.fn(() => context);
      return canvas;
    }),
  });
}

beforeEach(() => {
  stubCanvasDocument();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Investigation corkboard (3D)', () => {
  it('builds a dense board with cork frame, many fillers, and red string web', () => {
    const { group, id, skipHoverVisual, skipHoverLift } = createCorkboard();
    const boxMeshes = group.children.filter(
      (child) => child.isMesh && child.geometry.type === 'BoxGeometry',
    );
    const board = boxMeshes.find(
      ({ geometry }) => geometry.parameters.width === 2.7,
    );
    const frames = boxMeshes.filter(({ geometry }) => geometry.parameters.depth === 0.07);
    const lines = group.children.filter((child) => child.isLine);
    const fillerGroups = group.children.filter(
      (child) => child.isGroup && child.children.length >= 2 && !child.userData.interactiveNote,
    );
    const interactive = group.children.filter(
      (child) => child.isGroup && child.userData.interactiveNote,
    );

    expect(id).toBe('experience');
    expect(skipHoverVisual).toBe(true);
    expect(skipHoverLift).toBe(true);
    expect(board.material.color.getHex()).toBe(0x8a6948);
    expect(frames).toHaveLength(4);
    expect(fillerGroups.length).toBeGreaterThanOrEqual(CORK_FILLERS.length);
    expect(interactive).toHaveLength(CORK_INTERACTIVE.length);
    expect(lines.length).toBe(CORK_STRINGS.length);
    expect(lines.every(({ material }) => material.color.getHex() === 0xc41e2a)).toBe(true);
  });

  it('keeps interactive note ids aligned with experience slots', () => {
    const { group } = createCorkboard();
    const ids = group.children
      .filter((child) => child.userData?.interactiveNote)
      .map((child) => child.userData.interactiveNote)
      .sort();
    expect(ids).toEqual([...CORK_INTERACTIVE.map((n) => n.id)].sort());
  });
});

describe('Investigation corkboard (DOM overlay contract)', () => {
  it('reuses the shared layout and marks fillers non-interactive', async () => {
    const source = await readSource('../src/ui/pages/corkboard.js');
    expect(source).toContain("from '../../scene/corkboardLayout.js'");
    expect(source).toContain('CORK_FILLERS');
    expect(source).toContain('CORK_INTERACTIVE');
    expect(source).toContain('CORK_STRINGS');
    expect(source).toContain("aria-hidden', 'true'");
    expect(source).toContain("noteEl.dataset.route = String(i + 1).padStart(2, '0');");
    expect(source).toContain('<span class="note-route">ROUTE ${route}</span>');
    expect(source).toContain('<span class="note-title">${note.title}</span>');
  });

  it('keeps the modal and resize APIs while naming the nested close control', async () => {
    const source = await readSource('../src/ui/pages/corkboard.js');
    expect(source).toContain('aria-label="Close note"');
    expect(source).toContain("window.addEventListener('resize', drawStrings);");
    expect(source).toContain('el.redrawStrings = drawStrings;');
    expect(source).toContain('e.stopPropagation();');
  });

  it('uses cork palette with red investigation strings and filler styles', async () => {
    const css = await readSource('../src/styles/pages.css');
    expect(css).toMatch(/\.corkboard-page\s*\{[^}]*background:\s*#171b22/i);
    expect(css).toMatch(/\.corkboard-board\s*\{[\s\S]*?border:\s*14px solid #604127/i);
    expect(css).toMatch(/\.corkboard-strings path\s*\{[^}]*stroke:\s*#c41e2a/i);
    expect(css).toContain('.board-filler');
    expect(css).toMatch(/\.board-note--sticky\s*\{[^}]*#e7dec9/i);
    expect(css).toMatch(/\.board-note--ruled\s*\{[\s\S]*?#9eb7c3/i);
    expect(css).toMatch(/\.board-note--polaroid\s*\{[^}]*#8fa49c/i);
  });
});

describe('Hover skip flags', () => {
  it('documents skipHoverVisual on the corkboard factory', async () => {
    const source = await readSource('../src/scene/corkboard.js');
    expect(source).toContain('skipHoverVisual: true');
    expect(source).toContain('skipHoverLift: true');
    const interactions = await readSource('../src/core/interactions.js');
    expect(interactions).toContain('skipHoverVisual');
    expect(interactions).toContain('skipHoverLift');
  });
});
