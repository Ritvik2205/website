import * as THREE from 'three';
import gsap from 'gsap';
import { loadModel, markShadowCasters, nextFrame } from '../render/loadModel.js';
import { setLampMood, getLampMood, attachLampLight } from '../render/lighting.js';
import { LAYOUT, applyPose } from './layout.js';

const SHADE_COLOR = 0xf2c08a;
const SHADE_EMISSIVE = 0xff8c3a;

function makeGlowTexture() {
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 128;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 200, 120, 1)');
  grad.addColorStop(0.35, 'rgba(255, 140, 50, 0.6)');
  grad.addColorStop(1, 'rgba(255, 100, 30, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}

function makeShadeMaterial({ opacity = 0.58, emissiveIntensity = 0.85 } = {}) {
  return new THREE.MeshStandardMaterial({
    color: SHADE_COLOR,
    emissive: SHADE_EMISSIVE,
    emissiveIntensity,
    roughness: 0.82,
    metalness: 0,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

/** Prefer named shade meshes; otherwise take the highest mesh in the lamp. */
function findShadeMeshes(root) {
  const named = [];
  const candidates = [];
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const name = `${o.name} ${o.parent?.name || ''}`.toLowerCase();
    if (/shade|abajur|lampshade|capot/.test(name)) {
      named.push(o);
      return;
    }
    candidates.push(o);
  });
  if (named.length) return named;

  let best = null;
  let bestY = -Infinity;
  for (const mesh of candidates) {
    const box = new THREE.Box3().setFromObject(mesh);
    const y = (box.min.y + box.max.y) * 0.5;
    if (y > bestY) {
      bestY = y;
      best = mesh;
    }
  }
  return best ? [best] : [];
}

function applyTranslucentShade(root, shadeMaterials) {
  for (const mesh of findShadeMeshes(root)) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m) => m.dispose?.());
    } else {
      mesh.material?.dispose?.();
    }
    const mat = makeShadeMaterial();
    mesh.material = mat;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    shadeMaterials.push(mat);
  }
}

function createFallback(shadeMaterials) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.17, 0.05, 24),
    new THREE.MeshStandardMaterial({ color: 0xa77a3f, roughness: 0.45, metalness: 0.35 }),
  );
  base.position.y = 0.025;
  base.castShadow = true;
  const stem = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.36, 0.035),
    new THREE.MeshStandardMaterial({ color: 0xa77a3f, roughness: 0.4, metalness: 0.4 }),
  );
  stem.position.set(0.04, 0.23, 0);
  stem.rotation.z = -0.12;
  stem.castShadow = true;
  const shadeMat = makeShadeMaterial();
  shadeMaterials.push(shadeMat);
  const shade = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.13, 0.16),
    shadeMat,
  );
  shade.position.set(-0.03, 0.48, 0);
  shade.rotation.z = -0.12;
  shade.castShadow = false;
  group.add(base, stem, shade);
  return group;
}

export function createLamp() {
  const group = new THREE.Group();
  const shadeMaterials = [];
  const fallback = createFallback(shadeMaterials);
  group.add(fallback);

  const model = loadModel('/models/kit/lamp.glb', { height: null });
  let bulbMaterial = null;
  model.visible = false;
  group.add(model);

  const glowMaterial = new THREE.MeshBasicMaterial({
    map: makeGlowTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.95,
    color: 0xff8c3a,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), glowMaterial);
  glow.position.set(-0.03, 0.48, -0.04);
  glow.scale.setScalar(0.4);
  group.add(glow);

  const poll = () => {
    if (model.userData.assetStatus === 'loaded') {
      fallback.visible = false;
      model.visible = true;
      // Drop fallback shade mats; replace with GLB shade treatment
      shadeMaterials.length = 0;
      applyTranslucentShade(model, shadeMaterials);
      bulbMaterial = model.getObjectByName('Bulb')?.material ?? null;
      if (bulbMaterial) bulbMaterial.userData.onIntensity = bulbMaterial.emissiveIntensity;
      // Kit lamp bulb sits inside the shade mouth (see tools/blender/desk_kit.py).
      const shadeLocal = new THREE.Vector3(-0.175, 0.34, 0);
      glow.position.copy(shadeLocal);
      attachLampLight(group, shadeLocal);
    } else if (model.userData.assetStatus === 'error') {
      model.visible = false;
      fallback.visible = true;
    } else {
      nextFrame(poll);
    }
  };
  nextFrame(poll);

  markShadowCasters(group);
  // Translucent shade must not cast a hard shadow that blocks the glow.
  group.traverse((o) => {
    if (o.isMesh && o.material?.transparent && o.material?.emissive) {
      o.castShadow = false;
    }
  });
  applyPose(group, LAYOUT.lamp);
  // Fallback attach before the GLB load resolves; re-attached with the
  // asset-specific shade offset once loaded (see `poll` above).
  queueMicrotask(() => attachLampLight(group));

  let on = true;

  function setShadeLit(lit) {
    const intensity = lit ? 0.85 : 0.05;
    const opacity = lit ? 0.58 : 0.35;
    for (const mat of shadeMaterials) {
      gsap.to(mat, {
        emissiveIntensity: intensity,
        opacity,
        duration: 0.5,
        ease: 'power2.out',
      });
    }
  }

  function toggle() {
    on = !on;
    const proxy = { v: getLampMood() };
    gsap.to(proxy, {
      v: on ? 1 : 0.15,
      duration: 0.6,
      ease: 'power2.inOut',
      onUpdate: () => setLampMood(proxy.v),
    });
    gsap.to(glowMaterial, { opacity: on ? 0.95 : 0, duration: 0.4, ease: 'power2.out' });
    setShadeLit(on);
    if (bulbMaterial) {
      gsap.to(bulbMaterial, {
        emissiveIntensity: on ? bulbMaterial.userData.onIntensity : 0,
        duration: 0.5,
        ease: 'power2.out',
      });
    }
  }

  return { group, id: 'lamp', label: 'lights', toggle };
}
