import * as THREE from 'three';
import gsap from 'gsap';

const HOME = {
  position: new THREE.Vector3(0, 1.15, 2.1),
  lookAt: new THREE.Vector3(0, 0.95, -1.2),
};
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createCameraRig(camera) {
  let parallaxOn = true;
  const pointer = { x: 0, y: 0 };
  const lookTarget = HOME.lookAt.clone();

  camera.position.copy(HOME.position);
  camera.lookAt(lookTarget);

  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // touch fallback: drag pans the view through the same lerp path
  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (!t) return;
    pointer.x = (t.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (t.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function update() {
    if (!parallaxOn || REDUCED) return;
    const tx = HOME.position.x + pointer.x * 0.25;
    const ty = HOME.position.y - pointer.y * 0.08;
    camera.position.x += (tx - camera.position.x) * 0.05;
    camera.position.y += (ty - camera.position.y) * 0.05;
    lookTarget.x += (HOME.lookAt.x + pointer.x * 0.4 - lookTarget.x) * 0.05;
    camera.lookAt(lookTarget);
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
    setParallaxEnabled: (v) => { parallaxOn = v; },
    flyTo: (a) => { parallaxOn = false; return tween(a.position, a.lookAt); },
    flyHome: async () => { await tween(HOME.position, HOME.lookAt); parallaxOn = true; },
    setPointer: (x, y) => { pointer.x = x; pointer.y = y; },
    HOME,
  };
}
