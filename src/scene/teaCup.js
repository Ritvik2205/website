import * as THREE from 'three';
import { createSprite } from './spriteAsset.js';

function createFallback() {
  const group = new THREE.Group();
  const ceramic = new THREE.MeshBasicMaterial({ color: 0x7b8f98 });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.1, 20), ceramic);
  cup.position.y = 0.055;
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 24), ceramic);
  saucer.position.y = 0.006;
  group.add(saucer, cup);
  return group;
}

export function createTeaCup() {
  const group = new THREE.Group();
  group.add(createSprite('/assets/postroom/teacup.png', {
    height: 0.24,
    fallback: createFallback(),
  }));
  group.position.set(0.58, 0.42, -0.62);
  group.rotation.y = -0.08;
  return { group };
}
