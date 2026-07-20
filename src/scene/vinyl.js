import * as THREE from 'three';
import { createSprite } from './spriteAsset.js';

export function createVinyl() {
  const group = new THREE.Group();
  group.add(createSprite('/assets/vinyl-player.png', { height: 0.44 }));
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
