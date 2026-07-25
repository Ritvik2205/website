import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
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

  it('builds a hollow window frame that leaves the wall opening clear', () => {
    const { group } = createEnvironment();
    const frameColor = 0x493522;
    const bars = [];
    group.traverse((o) => {
      if (o.isMesh && o.material?.color?.getHex?.() === frameColor) bars.push(o);
    });

    expect(bars.length).toBe(4);
    for (const bar of bars) {
      bar.geometry.computeBoundingBox();
      const box = bar.geometry.boundingBox.clone().translate(bar.position);
      // No frame bar may cover the window centre, or it would plug the hole.
      expect(box.containsPoint(new THREE.Vector3(2.2, 1.8, bar.position.z))).toBe(false);
    }
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
    let stormPlane = null;
    group.traverse((o) => {
      if (o.isLineSegments) lines.push(o);
      if (o.isMesh && o.material?.isShaderMaterial) stormPlane = o;
    });
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(stormPlane).toBeTruthy();

    // Overscans the 0.62 x 0.82 wall opening so oblique views through the
    // window never reveal void past the storm plane's edges.
    stormPlane.geometry.computeBoundingBox();
    const size = stormPlane.geometry.boundingBox.getSize(new THREE.Vector3());
    expect(size.x).toBeGreaterThan(0.62);
    expect(size.y).toBeGreaterThan(0.82);
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
      lightningIn: 0,
    });

    // Advance enough frames for a double-flash envelope (~0.35s)
    for (let i = 0; i < 40; i++) update(1 / 60);
    expect(levels.some((v) => v > 0)).toBe(true);
    expect(levels[levels.length - 1]).toBe(0);
  });

  it('stays fully static under reduced motion', () => {
    const levels = [];
    const { group, update } = createAtmosphere({
      reduced: true,
      applyWindowFlashLevel: (v) => levels.push(v),
      lightningIn: 0,
    });

    let stormPlane = null;
    group.traverse((o) => { if (o.isMesh && o.material?.isShaderMaterial) stormPlane = o; });
    expect(stormPlane).toBeTruthy();

    for (let i = 0; i < 300; i++) update(1 / 60);

    expect(levels.every((v) => v === 0)).toBe(true);
    expect(stormPlane.material.uniforms.uTime.value).toBe(0);
    expect(stormPlane.material.uniforms.uFlash.value).toBe(0);
  });
});
