import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const assets = [
  { id: 'lamp', path: '/assets/postroom/lamp.png' },
  { id: 'turntable', path: '/assets/postroom/turntable.png' },
  { id: 'teacup', path: '/assets/postroom/teacup.png' },
  { id: 'ephemera', path: '/assets/postroom/ephemera.png' },
  { id: 'floppy', path: '/assets/postroom/floppy.png' },
];

describe('Monsoon Postroom placeholder assets', () => {
  it('records the local placeholder source and ordered asset paths', async () => {
    const manifestUrl = new URL('../public/assets/postroom/manifest.json', import.meta.url);
    const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));

    expect(manifest).toEqual({
      direction: 'monsoon-postroom',
      source: 'local-placeholder',
      generationCredits: 0,
      replaceable: true,
      assets,
    });
  });

  it.each(assets)('$id is a 512px transparent RGBA PNG', async ({ path }) => {
    const assetUrl = new URL(`../public${path}`, import.meta.url);
    const png = await readFile(assetUrl);

    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.byteLength).toBeGreaterThan(1_000);
    expect(png.subarray(12, 16).toString('ascii')).toBe('IHDR');
    expect(png.readUInt32BE(16)).toBe(512);
    expect(png.readUInt32BE(20)).toBe(512);
    expect(png[25]).toBe(6);
  });
});
