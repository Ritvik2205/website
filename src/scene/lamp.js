import * as THREE from 'three';
import gsap from 'gsap';
import { createSprite } from './spriteAsset.js';
import { setNightMix, getNightMix } from '../render/bakedMaterial.js';

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

export function createLamp() {
  const group = new THREE.Group();
  group.add(createSprite('/assets/lamp.png', { height: 0.66 }));

  // bright additive glow over the bulb cage — this is what blooms
  const glowMaterial = new THREE.MeshBasicMaterial({
    map: makeGlowTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.95,
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), glowMaterial);
  glow.position.set(-0.135, 0.45, 0.03);
  group.add(glow);

  group.position.set(1.8, 0.42, -0.7);

  let on = true;

  // whole-room mood crossfade: nightMix 1 = lamp on (warm bakes), 0.15 = off (cool dusk)
  function toggle() {
    on = !on;
    const proxy = { v: getNightMix() };
    gsap.to(proxy, {
      v: on ? 1 : 0.15,
      duration: 0.6,
      ease: 'power2.inOut',
      onUpdate: () => setNightMix(proxy.v),
    });
    gsap.to(glowMaterial, { opacity: on ? 0.95 : 0, duration: 0.4, ease: 'power2.out' });
  }

  return { group, id: 'lamp', label: 'lights', toggle };
}
