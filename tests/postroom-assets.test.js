import { access, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const models = [
  'pendant.glb',
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

// Scene code finds these meshes by name; Blender renames duplicates (Bulb → Bulb.001),
// so a collision anywhere in the kit silently breaks a hook.
const HOOKS = {
  'laptop.glb': ['Screen'],
  'lamp.glb': ['Shade', 'Bulb'],
  'vinyl.glb': ['Platter'],
  'sketchbook.glb': ['PageLeft'],
};

describe('Desk kit hook meshes', () => {
  it.each(Object.entries(HOOKS))('%s exposes its named hooks', async (name, hooks) => {
    const bytes = await readFile(new URL(`../public/models/kit/${name}`, import.meta.url));
    const jsonLength = bytes.readUInt32LE(12);
    const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
    const nodes = gltf.nodes.map((n) => n.name);
    for (const hook of hooks) expect(nodes).toContain(hook);
  });
});
