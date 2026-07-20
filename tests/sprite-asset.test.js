import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSprite } from '../src/scene/spriteAsset.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function stubImageLoad() {
  let onLoad;
  let onError;
  vi.spyOn(THREE.ImageLoader.prototype, 'load').mockImplementation(
    (_url, loaded, _progress, failed) => {
      onLoad = loaded;
      onError = failed;
    },
  );
  return {
    succeed: (image) => onLoad(image),
    fail: () => onError(new Error('missing sprite')),
    hasErrorHandler: () => typeof onError === 'function',
  };
}

function stubCanvas() {
  const pixels = new Uint8ClampedArray([
    0, 0, 0, 0, 255, 255, 255, 255,
    0, 0, 0, 0, 255, 255, 255, 255,
  ]);
  const context = {
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: pixels })),
  };
  vi.stubGlobal('document', {
    createElement: vi.fn(() => ({
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
    })),
  });
}

describe('createSprite', () => {
  it('returns a loading group with the fallback visible immediately', () => {
    stubImageLoad();
    const fallback = new THREE.Group();

    const sprite = createSprite('/sprite.png', { height: 1, fallback });

    expect(sprite).toBeInstanceOf(THREE.Group);
    expect(sprite.children).toEqual([fallback]);
    expect(fallback.visible).toBe(true);
    expect(sprite.userData.assetStatus).toBe('loading');
  });

  it('replaces the fallback with a bottom-anchored SRGB sprite after loading', () => {
    const loader = stubImageLoad();
    stubCanvas();
    const fallback = new THREE.Group();
    const sprite = createSprite('/sprite.png', { height: 1, fallback });

    loader.succeed({ width: 2, height: 2 });

    const mesh = sprite.children.at(-1);
    expect(fallback.visible).toBe(false);
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.scale.toArray()).toEqual([0.5, 1, 1]);
    expect(mesh.position.y).toBe(0.5);
    expect(mesh.material.map.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(mesh.material.alphaTest).toBe(0.08);
    expect(sprite.userData.assetStatus).toBe('loaded');
  });

  it('keeps the fallback visible and records an image loading error', () => {
    const loader = stubImageLoad();
    const fallback = new THREE.Group();
    const sprite = createSprite('/missing.png', { fallback });

    expect(loader.hasErrorHandler()).toBe(true);
    loader.fail();

    expect(sprite.children).toEqual([fallback]);
    expect(fallback.visible).toBe(true);
    expect(sprite.userData.assetStatus).toBe('error');
  });
});
