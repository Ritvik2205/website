import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createBakedMaterial } from './bakedMaterial.js';

// Drop-in loader for real Blender bakes (hybrid contract — see
// docs/design/2026-07-06-baked-rendering-philosophy.md).
// One GLB group + day/night lightmap JPEGs baked to its atlas.
export async function loadBakedModel({ model, day, night }) {
  const textureLoader = new THREE.TextureLoader();
  const loadTexture = (url) =>
    new Promise((resolve, reject) => {
      textureLoader.load(url, (texture) => {
        texture.flipY = false; // GLTF UV convention
        texture.colorSpace = THREE.SRGBColorSpace;
        resolve(texture);
      }, undefined, reject);
    });

  const [gltf, dayTexture, nightTexture] = await Promise.all([
    new GLTFLoader().loadAsync(model),
    loadTexture(day),
    loadTexture(night),
  ]);

  const material = createBakedMaterial({ day: dayTexture, night: nightTexture });
  gltf.scene.traverse((o) => {
    if (o.isMesh) o.material = material;
  });

  return { group: gltf.scene, material };
}
