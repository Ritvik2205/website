import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cache = new Map();

export function nextFrame(cb) {
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(cb);
  else setTimeout(cb, 0);
}

function toStandardMaterial(material) {
  if (!material) {
    return new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.75, metalness: 0.05 });
  }
  if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
    return material;
  }

  const map = material.map || null;
  const color = material.color ? material.color.clone() : new THREE.Color(0xcccccc);
  const std = new THREE.MeshStandardMaterial({
    color,
    map,
    roughness: 0.72,
    metalness: 0.08,
    transparent: Boolean(material.transparent),
    opacity: material.opacity ?? 1,
    side: material.side ?? THREE.FrontSide,
  });
  if (map) map.colorSpace = THREE.SRGBColorSpace;
  material.dispose?.();
  return std;
}

function prepareGroup(root, { height = 1, castShadow = true, receiveShadow = true } = {}) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  if (size.y > 1e-5) {
    const scale = height / size.y;
    root.scale.multiplyScalar(scale);
    box.setFromObject(root);
  }
  // Sit on y=0
  box.setFromObject(root);
  root.position.y -= box.min.y;

  root.traverse((obj) => {
    if (!obj.isMesh) return;
    if (Array.isArray(obj.material)) {
      obj.material = obj.material.map(toStandardMaterial);
    } else {
      obj.material = toStandardMaterial(obj.material);
    }
    obj.castShadow = castShadow;
    obj.receiveShadow = receiveShadow;
  });
  return root;
}

/**
 * Load a GLB, normalize to `height`, enable shadows, ensure Standard materials.
 * Returns a Group immediately with `userData.assetStatus` updated async.
 */
export function loadModel(url, { height = 0.5, castShadow = true, receiveShadow = true } = {}) {
  const group = new THREE.Group();
  group.userData.assetStatus = 'loading';

  const apply = (scene) => {
    const model = scene.clone(true);
    prepareGroup(model, { height, castShadow, receiveShadow });
    group.clear();
    group.add(model);
    group.userData.assetStatus = 'loaded';
  };

  if (cache.has(url)) {
    cache.get(url).then(apply).catch(() => {
      group.userData.assetStatus = 'error';
    });
    return group;
  }

  const promise = new Promise((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
  });
  cache.set(url, promise);

  promise
    .then(apply)
    .catch(() => {
      group.userData.assetStatus = 'error';
    });

  return group;
}

/** Awaitable variant for composition roots that prefer sequential setup. */
export function loadModelAsync(url, options = {}) {
  const group = loadModel(url, options);
  return new Promise((resolve) => {
    const check = () => {
      if (group.userData.assetStatus === 'loaded') resolve(group);
      else if (group.userData.assetStatus === 'error') resolve(group);
      else nextFrame(check);
    };
    check();
  });
}

export function markShadowCasters(root, { cast = true, receive = true } = {}) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = cast;
    obj.receiveShadow = receive;
  });
}
