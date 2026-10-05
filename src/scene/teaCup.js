import * as THREE from 'three';
import { markShadowCasters, withFallback } from '../render/loadModel.js';
import { LAYOUT, applyPose } from './layout.js';

function createFallback() {
  const group = new THREE.Group();
  const ceramic = new THREE.MeshStandardMaterial({
    color: 0x7b8f98,
    roughness: 0.35,
    metalness: 0.05,
  });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.1, 28), ceramic);
  cup.position.y = 0.055;
  cup.castShadow = true;
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 28), ceramic);
  saucer.position.y = 0.006;
  saucer.castShadow = true;
  saucer.receiveShadow = true;
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.035, 0.008, 10, 20, Math.PI),
    ceramic,
  );
  handle.position.set(0.075, 0.06, 0);
  handle.rotation.y = Math.PI / 2;
  handle.castShadow = true;
  group.add(saucer, cup, handle);
  return group;
}

export function createTeaCup() {
  const group = withFallback('/models/kit/teacup.glb', createFallback());
  markShadowCasters(group);
  applyPose(group, LAYOUT.teaCup);
  return { group };
}
