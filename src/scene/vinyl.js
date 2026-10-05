import * as THREE from 'three';
import { loadModel, markShadowCasters, nextFrame } from '../render/loadModel.js';
import { LAYOUT, applyPose } from './layout.js';

function createFallback() {
  const group = new THREE.Group();
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.06, 0.36),
    new THREE.MeshStandardMaterial({ color: 0x5b3526, roughness: 0.7, metalness: 0.1 }),
  );
  plinth.position.y = 0.03;
  plinth.castShadow = true;
  plinth.receiveShadow = true;

  const platterGroup = new THREE.Group();
  platterGroup.position.set(-0.04, 0.075, 0);
  const platter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.018, 48),
    new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.4, metalness: 0.35 }),
  );
  platter.castShadow = true;
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.02, 24),
    new THREE.MeshStandardMaterial({ color: 0xc44444, roughness: 0.55, metalness: 0.1 }),
  );
  platterGroup.add(platter, label);

  const tonearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.18, 8),
    new THREE.MeshStandardMaterial({ color: 0xa77a3f, roughness: 0.35, metalness: 0.55 }),
  );
  tonearm.position.set(0.14, 0.11, 0.02);
  tonearm.rotation.z = Math.PI / 2.4;
  tonearm.rotation.y = -0.35;
  tonearm.castShadow = true;

  group.add(plinth, platterGroup, tonearm);
  group.userData.platterGroup = platterGroup;
  return group;
}

export function createVinyl() {
  const group = new THREE.Group();
  const fallback = createFallback();
  group.add(fallback);

  const player = loadModel('/models/kit/vinyl.glb', { height: null });
  player.visible = false;
  group.add(player);

  let platter = fallback.userData.platterGroup;
  let spinning = true;

  const poll = () => {
    if (player.userData.assetStatus === 'loaded') {
      fallback.visible = false;
      player.visible = true;
      // Kit `Platter` carries the record and label as children; never spin the deck.
      platter = player.getObjectByName('Platter');
    } else if (player.userData.assetStatus === 'error') {
      player.visible = false;
      fallback.visible = true;
      platter = fallback.userData.platterGroup;
    } else {
      nextFrame(poll);
    }
  };
  nextFrame(poll);

  markShadowCasters(group);
  applyPose(group, LAYOUT.vinyl);

  return {
    group,
    id: 'music',
    label: 'now spinning',
    setSpinning: (v) => { spinning = !!v; },
    update: (dt) => {
      if (!spinning || !platter) return;
      platter.rotation.y += dt * 2.2;
    },
  };
}
