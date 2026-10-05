import * as THREE from 'three';
import { markShadowCasters, withFallback } from '../render/loadModel.js';
import { attachPendantLight } from '../render/lighting.js';
import { LAYOUT, applyPose } from './layout.js';

// Bulb sits 7cm above the rim (tools/blender/desk_kit.py build_pendant).
const BULB_LOCAL = new THREE.Vector3(0, 0.07, 0);

function createFallback() {
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.16, 0.17, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x1f232a, roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide }),
  );
  shade.position.y = 0.085;
  return shade;
}

/** Non-interactive pendant lamp hanging over the corkboard; owns no light itself. */
export function createPendant() {
  const group = withFallback('/models/kit/pendant.glb', createFallback(), {
    // The spot sits inside the shade, so the shade must not shadow its own light.
    onLoad: (model) => markShadowCasters(model, { cast: false, receive: false }),
  });
  markShadowCasters(group, { cast: false, receive: false });
  applyPose(group, LAYOUT.pendant);
  const [x, y, z] = LAYOUT.corkboard.position;
  attachPendantLight(group, BULB_LOCAL, new THREE.Vector3(x, y - 0.05, z));
  return { group };
}
