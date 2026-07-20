import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCorkboard } from '../src/scene/corkboard.js';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

let loadedSprite;
let loadedSpriteUrl;
let textDraws;
let fills;

function stubCanvasDocument() {
  textDraws = [];
  fills = [];

  vi.stubGlobal('document', {
    createElement: vi.fn(() => {
      const canvas = { width: 0, height: 0 };
      const context = {
        fillStyle: '',
        font: '',
        textAlign: '',
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        drawImage: vi.fn(),
        fillRect: vi.fn((...args) => fills.push({ color: context.fillStyle, args })),
        fillText: vi.fn((text, x, y) => {
          textDraws.push({ text, x, y, font: context.font, color: context.fillStyle });
        }),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray([
            255, 255, 255, 255, 255, 255, 255, 255,
            255, 255, 255, 255, 255, 255, 255, 255,
          ]),
        })),
      };
      canvas.getContext = vi.fn(() => context);
      return canvas;
    }),
  });
}

beforeEach(() => {
  stubCanvasDocument();
  loadedSprite = undefined;
  loadedSpriteUrl = undefined;
  vi.spyOn(THREE.ImageLoader.prototype, 'load').mockImplementation((url, onLoad) => {
    loadedSpriteUrl = url;
    loadedSprite = onLoad;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Monsoon Postroom 3D correspondence ledger', () => {
  it('uses the approved cork, oak, paper, thread, and brass palette', () => {
    const { group, id } = createCorkboard();
    const boxMeshes = group.children.filter(
      (child) => child.isMesh && child.geometry.type === 'BoxGeometry',
    );
    const board = boxMeshes.find(
      ({ geometry }) => geometry.parameters.width === 2.7,
    );
    const frames = boxMeshes.filter(({ geometry }) => geometry.parameters.depth === 0.07);
    const noteDimensions = new Set([
      '0.28x0.2', '0.24x0.3', '0.26x0.3',
      '0.3x0.18', '0.24x0.16', '0.26x0.17',
    ]);
    const notes = group.children.filter(({ geometry }) => (
      geometry?.type === 'PlaneGeometry'
      && noteDimensions.has(`${geometry.parameters.width}x${geometry.parameters.height}`)
    ));
    const pins = group.children.filter(
      (child) => child.isMesh && child.geometry.type === 'SphereGeometry',
    );
    const lines = group.children.filter((child) => child.isLine);

    expect(id).toBe('experience');
    expect(board.material.color.getHex()).toBe(0x8a6948);
    expect(frames).toHaveLength(4);
    expect(frames.every(({ material }) => material.color.getHex() === 0x604127)).toBe(true);
    expect(notes.map(({ material }) => material.color.getHex())).toEqual([
      0xe7dec9, 0x9eb7c3, 0x8fa49c, 0x9eb7c3, 0x8fa49c, 0xe7dec9,
    ]);
    expect(pins).toHaveLength(10);
    expect(pins.every(({ material }) => material.color.getHex() === 0xa77a3f)).toBe(true);
    expect(lines).toHaveLength(3);
    expect(lines.every(({ material }) => (
      material.color.getHex() === 0x688178
      && material.transparent
      && material.opacity === 0.72
    ))).toBe(true);
  });

  it('draws only the exact three sparse note connections', () => {
    const { group } = createCorkboard();
    const endpoints = group.children
      .filter((child) => child.isLine)
      .map(({ geometry }) => {
        const positions = geometry.getAttribute('position');
        const point = (index) => [
          Number(positions.getX(index).toFixed(3)),
          Number(positions.getY(index).toFixed(3)),
        ];
        return [
          point(0),
          point(positions.count - 1),
        ];
      });

    expect(endpoints).toEqual([
      [[-0.98, 0.368], [-1, -0.042]],
      [[0.98, 0.438], [1.02, -0.122]],
      [[-0.62, -0.352], [0.6, -0.367]],
    ]);
  });

  it('renders the route ledger typography and stable centered ephemera sprite', () => {
    const { group } = createCorkboard();
    const ephemera = group.children.find(
      (child) => child.userData.assetStatus === 'loading',
    );

    expect(fills[0]).toMatchObject({ color: '#e7dec9', args: [0, 0, 1024, 640] });
    expect(textDraws).toEqual(expect.arrayContaining([
      expect.objectContaining({
        text: 'MONSOON / POSTROOM',
        font: expect.stringContaining('Space Mono'),
      }),
      expect.objectContaining({
        text: 'Ritvik Gupta',
        font: expect.stringContaining('Caveat'),
      }),
    ]));
    expect(loadedSpriteUrl).toBe('/assets/postroom/ephemera.png');
    expect(ephemera.position.z).toBe(0.02);

    loadedSprite({ width: 2, height: 2 });
    const spriteMesh = ephemera.children.find((child) => child.isMesh);
    expect(spriteMesh.visible).toBe(true);
    expect(spriteMesh.scale.x).toBeLessThanOrEqual(2.7);
    expect(spriteMesh.scale.y).toBeLessThanOrEqual(1.3);
    expect(ephemera.position.y + spriteMesh.position.y).toBeCloseTo(0);
  });

  it('repaints the existing route-ledger texture when document fonts become ready', async () => {
    let resolveFonts;
    const fontsReady = new Promise((resolve) => { resolveFonts = resolve; });
    document.fonts = { ready: fontsReady };

    const { group } = createCorkboard();
    const title = group.children.find(({ geometry }) => (
      geometry?.type === 'PlaneGeometry'
      && geometry.parameters.width === 1.24
      && geometry.parameters.height === 0.78
    ));
    const texture = title.material.map;
    const initialVersion = texture.version;

    expect(textDraws).toHaveLength(2);
    resolveFonts();
    await fontsReady;
    await Promise.resolve();

    expect(textDraws).toHaveLength(4);
    expect(texture.version).toBeGreaterThan(initialVersion);
    expect(title.material.map).toBe(texture);
  });
});

describe('Monsoon Postroom DOM correspondence ledger contract', () => {
  it('adds route metadata and visible route labels before each title', async () => {
    const source = await readSource('../src/ui/pages/corkboard.js');
    const routeLabel = source.indexOf('<span class="note-route">ROUTE ${route}</span>');
    const noteTitle = source.indexOf('<span class="note-title">${note.title}</span>');

    // Source assertions are intentional here: the module uses imperative browser DOM
    // APIs and Vitest runs in Node without a DOM implementation.
    expect(source).toContain("noteEl.dataset.route = String(i + 1).padStart(2, '0');");
    expect(routeLabel).toBeGreaterThan(-1);
    expect(noteTitle).toBeGreaterThan(routeLabel);
  });

  it('keeps the modal and resize APIs while naming the nested close control', async () => {
    const source = await readSource('../src/ui/pages/corkboard.js');

    expect(source).toContain('aria-label="Close note"');
    expect(source).toContain("window.addEventListener('resize', drawStrings);");
    expect(source).toContain('el.redrawStrings = drawStrings;');
    expect(source).toContain('e.stopPropagation();');
  });

  it('uses the approved layered board and note palette', async () => {
    const css = await readSource('../src/styles/pages.css');

    // CSS source checks are the stable regression seam because Node has no
    // computed-style engine; browser verification covers the rendered result.
    expect(css).toMatch(/\.corkboard-page\s*\{[^}]*background:\s*#171b22/i);
    expect(css).toMatch(/\.corkboard-board\s*\{[\s\S]*?border:\s*14px solid #604127/i);
    expect(css).toContain("url('/assets/postroom/ephemera.png')");
    expect(css).toMatch(/background-position:[^;]*center/i);
    expect(css).toMatch(/background-repeat:[^;]*no-repeat/i);
    expect(css).toMatch(/\.corkboard-strings path\s*\{[^}]*stroke:\s*#688178/i);
    expect(css).toMatch(/\.note-pin\s*\{[\s\S]*?#a77a3f/i);
    expect(css).toMatch(/\.board-note--sticky\s*\{[^}]*#e7dec9/i);
    expect(css).toMatch(/\.board-note--ruled\s*\{[\s\S]*?#9eb7c3/i);
    expect(css).toMatch(/\.board-note--polaroid\s*\{[^}]*#8fa49c/i);
  });
});
