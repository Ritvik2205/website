import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerUnlitGroup, setNightMix } from '../src/render/bakedMaterial.js';
import { createSprite } from '../src/scene/spriteAsset.js';

afterEach(() => {
  setNightMix(1);
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
    const mesh = sprite.children.find((child) => child.isMesh);

    expect(sprite).toBeInstanceOf(THREE.Group);
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(sprite.children).toEqual([fallback, mesh]);
    expect(fallback.visible).toBe(true);
    expect(mesh.visible).toBe(false);
    expect(sprite.userData.assetStatus).toBe('loading');
  });

  it('populates the stable sprite mesh and detaches the fallback after loading', () => {
    const loader = stubImageLoad();
    stubCanvas();
    const fallback = new THREE.Group();
    const sprite = createSprite('/sprite.png', { height: 1, fallback });
    const mesh = sprite.children.find((child) => child.isMesh);

    loader.succeed({ width: 2, height: 2 });

    expect(sprite.children).toEqual([mesh]);
    expect(fallback.parent).toBeNull();
    expect(fallback.visible).toBe(false);
    expect(mesh.visible).toBe(true);
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.scale.toArray()).toEqual([0.5, 1, 1]);
    expect(mesh.position.y).toBe(0.5);
    expect(mesh.material.map.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(mesh.material.alphaTest).toBe(0.08);
    expect(sprite.userData.assetStatus).toBe('loaded');
  });

  it('registers the eventual sprite mesh for mood updates before image loading finishes', () => {
    const loader = stubImageLoad();
    stubCanvas();
    const sprite = createSprite('/sprite.png');
    const mesh = sprite.children.find((child) => child.isMesh);
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    const baseColor = mesh.material.color.clone();

    registerUnlitGroup(sprite, 0.5);
    loader.succeed({ width: 2, height: 2 });
    setNightMix(0);

    expect(mesh.material.map).toBeInstanceOf(THREE.CanvasTexture);
    expect(mesh.material.color.r).toBeCloseTo(baseColor.r * 0.5);
    expect(mesh.material.color.g).toBeCloseTo(baseColor.g * 0.5);
    expect(mesh.material.color.b).toBeCloseTo(baseColor.b * 0.5);
  });

  it('keeps the fallback visible and records an image loading error', () => {
    const loader = stubImageLoad();
    const fallback = new THREE.Group();
    const sprite = createSprite('/missing.png', { fallback });
    const mesh = sprite.children.find((child) => child.isMesh);

    expect(loader.hasErrorHandler()).toBe(true);
    loader.fail();

    expect(sprite.children).toEqual([fallback, mesh]);
    expect(fallback.visible).toBe(true);
    expect(mesh.visible).toBe(false);
    expect(sprite.userData.assetStatus).toBe('error');
  });
});
