import * as THREE from 'three';
import gsap from 'gsap';
import { loadModel, markShadowCasters, nextFrame } from '../render/loadModel.js';
import { setLampMood, getLampMood, attachLampLight } from '../render/lighting.js';
import { LAYOUT, applyPose } from './layout.js';

function makeGlowTexture() {
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 128;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 240, 200, 1)');
  grad.addColorStop(0.35, 'rgba(255, 200, 120, 0.55)');
  grad.addColorStop(1, 'rgba(255, 180, 100, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}

function createFallback() {
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
  const shade = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.13, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x688178, roughness: 0.65, metalness: 0.1 }),
  );
  shade.position.set(-0.03, 0.48, 0);
  shade.rotation.z = -0.12;
  shade.castShadow = true;
  group.add(base, stem, shade);
  return group;
}

export function createLamp() {
  const group = new THREE.Group();
  const fallback = createFallback();
  group.add(fallback);

  const model = loadModel('/models/lamp.glb', { height: 0.62 });
  model.visible = false;
  group.add(model);

  const glowMaterial = new THREE.MeshBasicMaterial({
    map: makeGlowTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.95,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), glowMaterial);
  glow.position.set(-0.03, 0.48, 0.02);
  glow.scale.setScalar(0.85);
  group.add(glow);

  const poll = () => {
    if (model.userData.assetStatus === 'loaded') {
      fallback.visible = false;
      model.visible = true;
      // Shade-local offset for the lamp.glb asset's cavity.
      const shadeLocal = new THREE.Vector3(0, 0.42, 0.02);
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
  applyPose(group, LAYOUT.lamp);
  // Fallback attach before the GLB load resolves; re-attached with the
  // asset-specific shade offset once loaded (see `poll` above).
  queueMicrotask(() => attachLampLight(group));

  let on = true;

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
  }

  return { group, id: 'lamp', label: 'lights', toggle };
}
