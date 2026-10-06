import * as THREE from 'three';
import gsap from 'gsap';

// Frames the desk with the board and pendant behind it, no dead space above.
const HOME = {
  position: new THREE.Vector3(0, 0.98, 1.12),
  lookAt: new THREE.Vector3(0, 0.86, -1.0),
};

export function createCameraRig(camera) {
  const lookTarget = HOME.lookAt.clone();

  camera.position.copy(HOME.position);
  camera.lookAt(lookTarget);

  function update() {
    // Idle framing is fixed; flyTo/flyHome own motion.
  }

  const reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function tween(pos, look) {
    // Reduced motion: cut straight to the anchor.
    const tl = gsap.timeline({ defaults: { duration: reduced ? 0 : 1.2, ease: 'power2.inOut' } });
    tl.to(camera.position, { x: pos.x, y: pos.y, z: pos.z }, 0);
    tl.to(lookTarget, {
      x: look.x, y: look.y, z: look.z,
      onUpdate: () => camera.lookAt(lookTarget),
    }, 0);
    return tl.then();
  }

  return {
    update,
    setParallaxEnabled: () => {},
    flyTo: (a) => tween(a.position, a.lookAt),
    flyHome: () => tween(HOME.position, HOME.lookAt),
    setPointer: () => {},
    HOME,
  };
}
