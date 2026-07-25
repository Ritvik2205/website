import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { LAYOUT } from '../src/scene/layout.js';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

describe('desk density', () => {
  it('uses a shallow desk depth in environment geometry', async () => {
    const source = await readSource('../src/scene/environment.js');
    expect(source).toMatch(/BoxGeometry\(\s*4\.4,\s*0\.09,\s*1\.05\s*\)/);
    expect(source).toMatch(/BoxGeometry\(\s*4\.4,\s*0\.04,\s*1\.05\s*\)/);
  });

  it('seats props on the desk top surface', () => {
    expect(LAYOUT.deskY).toBeCloseTo(0.44, 2);
    expect(LAYOUT.laptop.position[1]).toBeCloseTo(LAYOUT.deskY, 5);
    expect(LAYOUT.lamp.position[1]).toBeCloseTo(LAYOUT.deskY, 5);
  });

  it('keeps a clear left-to-right order without laptop/lamp overlap', () => {
    const xs = {
      vinyl: LAYOUT.vinyl.position[0],
      journal: LAYOUT.journal.position[0],
      sketchbook: LAYOUT.sketchbook.position[0],
      laptop: LAYOUT.laptop.position[0],
      lamp: LAYOUT.lamp.position[0],
    };
    expect(xs.vinyl).toBeLessThan(xs.journal);
    expect(xs.journal).toBeLessThan(xs.sketchbook);
    expect(xs.sketchbook).toBeLessThan(xs.laptop);
    expect(xs.lamp - xs.laptop).toBeGreaterThan(0.3);
  });
});
