import { describe, expect, it, vi } from 'vitest';
import { createEnvironment } from '../src/scene/environment.js';
import { createAtmosphere } from '../src/scene/atmosphere.js';

vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return actual;
});

describe('createEnvironment window pane', () => {
  it('returns a wet-glass windowPane mesh', () => {
    const env = createEnvironment();
    expect(env.windowPane).toBeTruthy();
    expect(env.windowPane.isMesh).toBe(true);
    expect(env.windowPane.material.roughness).toBeLessThan(0.12);
    expect(env.windowPane.material.metalness).toBeGreaterThan(0.08);
    expect(env.windowPane.material.emissiveIntensity).toBeGreaterThan(0.5);
  });
});

describe('createAtmosphere cinematic storm', () => {
  it('creates no rain layers when reduced motion is set', () => {
    const { group } = createAtmosphere({ reduced: true });
    const lines = [];
    group.traverse((o) => { if (o.isLineSegments) lines.push(o); });
    expect(lines).toHaveLength(0);
  });

  it('creates multiple rain layers and a storm plane when motion is allowed', () => {
    const { group } = createAtmosphere({ reduced: false });
    const lines = [];
    let shaders = 0;
    group.traverse((o) => {
      if (o.isLineSegments) lines.push(o);
      if (o.isMesh && o.material?.isShaderMaterial) shaders += 1;
    });
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(shaders).toBeGreaterThanOrEqual(1);
  });

  it('drives applyWindowFlashLevel during a forced lightning update', () => {
    const levels = [];
    const pane = {
      material: { emissiveIntensity: 1.15 },
    };
    const { update } = createAtmosphere({
      reduced: false,
      getLampMood: () => 0.15,
      applyWindowFlashLevel: (v) => levels.push(v),
      windowPane: pane,
      // test-only override — implement as optional opts.__lightningIn = 0 to fire immediately
      lightningIn: 0,
    });

    // Advance enough frames for a double-flash envelope (~0.35s)
    for (let i = 0; i < 40; i++) update(1 / 60);
    expect(levels.some((v) => v > 0)).toBe(true);
    expect(levels[levels.length - 1]).toBe(0);
  });
});
