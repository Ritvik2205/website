import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { LAYOUT } from '../src/scene/layout.js';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

describe('desk density', () => {
  it('uses a shallower desk depth in environment geometry', async () => {
    const source = await readSource('../src/scene/environment.js');
    expect(source).toMatch(/BoxGeometry\(\s*4\.4,\s*0\.09,\s*1\.35\s*\)/);
    expect(source).toMatch(/BoxGeometry\(\s*4\.4,\s*0\.04,\s*1\.35\s*\)/);
  });

  it('keeps laptop and lamp closer on X', () => {
    expect(LAYOUT.laptop.position[0]).toBeLessThan(0.95);
    expect(LAYOUT.lamp.position[0] - LAYOUT.laptop.position[0]).toBeLessThan(0.5);
    expect(Math.abs(LAYOUT.vinyl.position[0])).toBeLessThan(1.05);
  });
});
