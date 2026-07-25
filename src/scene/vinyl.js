import * as THREE from 'three';
import { loadModel, markShadowCasters, nextFrame } from '../render/loadModel.js';
import { LAYOUT, applyPose } from './layout.js';

function createFallback() {
  const group = new THREE.Group();
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.09, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x5b3526, roughness: 0.7, metalness: 0.1 }),
  );
  plinth.position.y = 0.045;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  const platter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.025, 48),
    new THREE.MeshStandardMaterial({ color: 0x25282b, roughness: 0.35, metalness: 0.45 }),
  );
  platter.position.set(-0.08, 0.1025, 0);
  platter.castShadow = true;
  const control = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.025, 16),
    new THREE.MeshStandardMaterial({ color: 0xa77a3f, roughness: 0.4, metalness: 0.5 }),
  );
  control.position.set(0.22, 0.1025, 0.1);
  control.castShadow = true;
  group.add(plinth, platter, control);
  return group;
}

export function createVinyl() {
  const group = new THREE.Group();
  const fallback = createFallback();
  group.add(fallback);

  // Speaker + radio as music-station stand-ins when GLBs load
  const radio = loadModel('/models/radio.glb', { height: 0.28 });
  radio.visible = false;
  radio.position.set(-0.12, 0, 0);
  group.add(radio);

  const speaker = loadModel('/models/speaker.glb', { height: 0.22 });
  speaker.visible = false;
  speaker.position.set(0.18, 0, 0.02);
  group.add(speaker);

  const poll = () => {
    const radioReady = radio.userData.assetStatus === 'loaded';
    const speakerReady = speaker.userData.assetStatus === 'loaded';
    const radioErr = radio.userData.assetStatus === 'error';
    const speakerErr = speaker.userData.assetStatus === 'error';
    if (radioReady || speakerReady) {
      fallback.visible = false;
      radio.visible = radioReady;
      speaker.visible = speakerReady;
    } else if (radioErr && speakerErr) {
      fallback.visible = true;
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
    setSpinning: () => {},
    update: () => {},
  };
}
