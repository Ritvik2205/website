import { afterEach, describe, expect, it, vi } from 'vitest';

const gsap = vi.hoisted(() => ({ to: vi.fn() }));
vi.mock('gsap', () => ({ default: gsap }));

import * as THREE from 'three';
import { createInteractions } from '../src/core/interactions.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('createInteractions hover UI', () => {
  it('does not create a hover-label element', () => {
    const created = [];
    vi.stubGlobal('document', {
      body: { appendChild: vi.fn((el) => created.push(el)), style: {} },
      createElement: vi.fn((tag) => {
        const el = {
          tagName: tag.toUpperCase(),
          className: '',
          style: {},
          textContent: '',
        };
        return el;
      }),
    });

    const camera = { /* unused by construction */ };
    const dom = { addEventListener: vi.fn() };
    createInteractions(camera, dom);

    expect(document.createElement).not.toHaveBeenCalled();
    expect(document.body.appendChild).not.toHaveBeenCalled();
    expect(created.every((el) => el.className !== 'hover-label')).toBe(true);
  });

  it('shows silhouette outline meshes for late-added meshes without tint or lift', () => {
    vi.stubGlobal('document', { body: { style: {} } });
    vi.stubGlobal('window', { innerWidth: 800, innerHeight: 600 });

    const listeners = {};
    const dom = { addEventListener: vi.fn((type, fn) => { listeners[type] = fn; }) };
    const camera = new THREE.PerspectiveCamera(50, 800 / 600, 0.1, 100);
    camera.position.set(0, 0, 1);
    camera.updateMatrixWorld(true);

    const interactions = createInteractions(camera, dom);
    const group = new THREE.Group();
    interactions.register({ group, id: 'laptop', label: 'Laptop', onClick: vi.fn() });

    const lateMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x336699, emissive: 0x000000 }),
    );
    group.add(lateMesh);
    group.updateMatrixWorld(true);
    const baseEmissive = lateMesh.material.emissive.getHex();
    const baseY = group.position.y;

    listeners.pointermove({ clientX: 400, clientY: 300 });
    interactions.update();

    const outlines = [];
    group.traverse((o) => { if (o.userData?.isHoverOutline) outlines.push(o); });
    expect(outlines.length).toBeGreaterThan(0);
    expect(outlines.every((o) => o.visible)).toBe(true);
    expect(lateMesh.material.emissive.getHex()).toBe(baseEmissive);
    expect(group.position.y).toBeCloseTo(baseY, 5);
    expect(gsap.to).not.toHaveBeenCalled();

    listeners.pointermove({ clientX: -5000, clientY: -5000 });
    interactions.update();
    expect(outlines.every((o) => !o.visible)).toBe(true);
  });
});
