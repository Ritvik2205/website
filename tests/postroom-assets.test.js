import { access, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const models = [
  'desk.glb',
  'laptop.glb',
  'lamp.glb',
  'vinyl.glb',
  'sketchbook.glb',
  'journal.glb',
  'teacup.glb',
  'books.glb',
  'plant.glb',
  'pencup.glb',
  'keyboard.glb',
];

const textures = ['storm-sky.jpg'];

describe('Soft stylized desk assets', () => {
  it('documents the generated kit and Poly Haven sky', async () => {
    const attribution = await readFile(
      new URL('../public/models/ATTRIBUTION.md', import.meta.url),
      'utf8',
    );
    expect(attribution).toContain('tools/blender/desk_kit.py');
    expect(attribution).toContain('Poly Haven');
    expect(attribution).toContain('CC0');
  });

  it.each(models)('%s exists under public/models/kit', async (name) => {
    const url = new URL(`../public/models/kit/${name}`, import.meta.url);
    await access(url);
    const bytes = await readFile(url);
    expect(bytes.byteLength).toBeGreaterThan(500);
  });

  it.each(textures)('%s exists under public/textures', async (name) => {
    const url = new URL(`../public/textures/${name}`, import.meta.url);
    await access(url);
    const bytes = await readFile(url);
    expect(bytes.byteLength).toBeGreaterThan(1_000);
  });
});
