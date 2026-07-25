import * as THREE from 'three';
import gsap from 'gsap';

const HOME = {
  position: new THREE.Vector3(0, 0.95, 1.3),
  lookAt: new THREE.Vector3(0, 0.95, -1.0),
};

export function createCameraRig(camera) {
  const lookTarget = HOME.lookAt.clone();

  camera.position.copy(HOME.position);
  camera.lookAt(lookTarget);

  function update() {
    // Idle framing is fixed; flyTo/flyHome own motion.
  }

  function tween(pos, look) {
    const tl = gsap.timeline({ defaults: { duration: 1.2, ease: 'power2.inOut' } });
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
