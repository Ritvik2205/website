import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runIntro } from '../src/ui/intro.js';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Monsoon Postroom intro', () => {
  it('uses the exact approved boot copy', async () => {
    const source = await readSource('../src/ui/intro.js');
    const bootLines = source.match(/const BOOT_LINES = \[[\s\S]*?\n\];/)?.[0];

    expect(bootLines).toBe(`const BOOT_LINES = [
  'OPENING MONSOON POSTROOM...',
  'INDEXING LETTERS...',
  'ROUTING PROJECT ARCHIVE...',
  'PINNING FIELD NOTES...',
  'WARMING DESK LAMP...',
  'POSTROOM READY.',
];`);
  });

  it('renders the local floppy art, CSS fallback, and accessible copy', async () => {
    const source = await readSource('../src/ui/intro.js');

    expect(source).toContain(
      '<button class="floppy" aria-label="Open the Monsoon Postroom">',
    );
    expect(source).toContain(
      '<img class="floppy-art" src="/assets/postroom/floppy.png" alt="" />',
    );
    expect(source).toMatch(
      /<span class="floppy-fallback" aria-hidden="true">\s*<span class="floppy-shutter"><\/span>\s*<span class="floppy-label">POSTROOM \/ 01<\/span>\s*<\/span>/,
    );
    expect(source).toContain(
      '<p class="intro-prompt">insert correspondence disk</p>',
    );
  });

  it('switches to the CSS fallback when the floppy image errors', () => {
    let onImageError;
    const fallbackButton = {
      classList: { add: vi.fn() },
      addEventListener: vi.fn(),
    };
    const nodes = {
      '.intro-skip': { addEventListener: vi.fn() },
      '.floppy': fallbackButton,
      '.floppy-art': {
        addEventListener: vi.fn((type, listener) => {
          if (type === 'error') onImageError = listener;
        }),
      },
    };
    const intro = {
      className: '',
      innerHTML: '',
      querySelector: vi.fn((selector) => nodes[selector]),
    };

    vi.stubGlobal('window', {
      matchMedia: vi.fn(() => ({ matches: false })),
    });
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });
    vi.stubGlobal('document', {
      createElement: vi.fn(() => intro),
      body: { appendChild: vi.fn() },
    });

    runIntro({}, {});
    expect(nodes['.floppy-art'].addEventListener).toHaveBeenCalledWith(
      'error',
      expect.any(Function),
    );

    onImageError();
    expect(fallbackButton.classList.add).toHaveBeenCalledWith('asset-missing');
  });

  it.each([
    { reduced: true, revisit: null },
    { reduced: false, revisit: '1' },
  ])('short-circuits the DOM intro for reduced motion or a revisit', async ({
    reduced,
    revisit,
  }) => {
    const camera = {
      position: { copy: vi.fn() },
      lookAt: vi.fn(),
    };
    const rig = {
      HOME: {
        position: { x: 1, y: 2, z: 3 },
        lookAt: { x: 0, y: 0, z: 0 },
      },
    };
    const createElement = vi.fn();

    vi.stubGlobal('window', {
      matchMedia: vi.fn(() => ({ matches: reduced })),
    });
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => revisit),
    });
    vi.stubGlobal('document', { createElement });

    await runIntro(camera, rig);

    expect(createElement).not.toHaveBeenCalled();
    expect(camera.position.copy).toHaveBeenCalledWith(rig.HOME.position);
    expect(camera.lookAt).toHaveBeenCalledWith(rig.HOME.lookAt);
  });

  it('defines the required palette, fallback, hidden, and reduced-motion CSS contracts', async () => {
    const css = await readSource('../src/styles/intro.css');
    const bootRule = css.match(/\.intro-boot\s*\{[^}]*\}/)?.[0];

    expect(css).toMatch(
      /\.intro\s*\{[\s\S]*radial-gradient\([\s\S]*#334B5F[\s\S]*#171B22/,
    );
    expect(css).toMatch(
      /\.intro::after\s*\{[\s\S]*rgba\(225,\s*164,\s*75,[\s\S]*\}/,
    );
    expect(css).toMatch(
      /\.intro-prompt\s*\{[\s\S]*font-family:\s*'Newsreader'[\s\S]*\}/,
    );
    expect(bootRule).toContain("font-family: 'Space Mono'");
    expect(bootRule).toContain('color: #E7DEC9');
    expect(css).toMatch(
      /\.intro-boot::after\s*\{[\s\S]*rgba\(225,\s*164,\s*75,[\s\S]*\}/,
    );
    expect(css).toMatch(/\.floppy-fallback\s*\{[\s\S]*display:\s*none/);
    expect(css).toMatch(
      /\.floppy\.asset-missing \.floppy-art\s*\{[^}]*display:\s*none/,
    );
    expect(css).toMatch(
      /\.floppy\.asset-missing \.floppy-fallback\s*\{[^}]*display:\s*block/,
    );
    expect(css).toContain('.intro [hidden] { display: none !important; }');
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*animation:\s*none[\s\S]*transition:\s*none/,
    );
  });
});
