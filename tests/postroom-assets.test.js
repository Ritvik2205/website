import { access, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const models = [
  'laptop.glb',
  'lamp.glb',
  'books.glb',
  'plant.glb',
  'potted-plant.glb',
  'radio.glb',
  'speaker.glb',
  'keyboard.glb',
];

const textures = [
  'wood-color.jpg',
  'wood-roughness.jpg',
  'wood-normal.jpg',
  'wood-ao.jpg',
  'plaster-color.jpg',
  'plaster-roughness.jpg',
  'plaster-normal.jpg',
  'storm-sky.jpg',
];

describe('Realtime PBR desk assets', () => {
  it('documents Kenney and ambientCG attribution', async () => {
    const attribution = await readFile(
      new URL('../public/models/ATTRIBUTION.md', import.meta.url),
      'utf8',
    );
    expect(attribution).toContain('Kenney');
    expect(attribution).toContain('ambientCG');
    expect(attribution).toContain('Poly Haven');
    expect(attribution).toContain('CC0');
  });

  it.each(models)('%s exists under public/models', async (name) => {
    const url = new URL(`../public/models/${name}`, import.meta.url);
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
