import * as THREE from 'three';
import { createSprite } from './spriteAsset.js';

function createFallback() {
  const group = new THREE.Group();
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.09, 0.34),
    new THREE.MeshBasicMaterial({ color: 0x5b3526 }),
  );
  plinth.position.y = 0.045;
  const platter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.025, 32),
    new THREE.MeshBasicMaterial({ color: 0x25282b }),
  );
  platter.position.set(-0.08, 0.1025, 0);
  const control = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.025, 16),
    new THREE.MeshBasicMaterial({ color: 0xa77a3f }),
  );
  control.position.set(0.22, 0.1025, 0.1);
  group.add(plinth, platter, control);
  return group;
}

export function createVinyl() {
  const group = new THREE.Group();
  const fallback = createFallback();
  group.add(createSprite('/assets/postroom/turntable.png', { height: 0.44, fallback }));
  group.position.set(-1.3, 0.42, -0.55);

  return {
    group,
    id: 'music',
    label: 'now spinning',
    // platter is baked into the artwork — spin lives on the music page disc
    setSpinning: () => {},
    update: () => {},
  };
}
