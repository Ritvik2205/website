import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('gsap', () => ({
  default: {
    timeline: () => {
      const tl = {
        to() {
          return tl;
        },
        then: (fn) => Promise.resolve(fn?.()),
      };
      return tl;
    },
  },
}));

import * as THREE from 'three';
import { createCameraRig } from '../src/core/cameraRig.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('createCameraRig fixed framing', () => {
  it('uses a closer centered HOME and ignores pointer parallax', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: false }),
      addEventListener: vi.fn(),
      innerWidth: 800,
      innerHeight: 600,
    });

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    const rig = createCameraRig(camera);

    expect(rig.HOME.position.x).toBe(0);
    expect(rig.HOME.position.y).toBeCloseTo(0.95, 2);
    expect(rig.HOME.position.z).toBeCloseTo(1.3, 2);
    expect(camera.position.z).toBeCloseTo(1.3, 2);

    const before = camera.position.clone();
    rig.setPointer(1, 1);
    rig.update();
    expect(camera.position.x).toBeCloseTo(before.x, 5);
    expect(camera.position.y).toBeCloseTo(before.y, 5);
    expect(camera.position.z).toBeCloseTo(before.z, 5);
  });
});
