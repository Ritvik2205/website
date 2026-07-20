import * as THREE from 'three';
import { createComposer } from '../render/composer.js';

export function createEngine(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x5d5440);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 20);

  const { composer, setSize } = createComposer(renderer, scene, camera);

  const tickFns = [];
  let paused = false;
  const clock = new THREE.Clock();

  function loop() {
    const dt = clock.getDelta();
    if (paused) return;
    for (const fn of tickFns) fn(dt);
    composer.render();
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    setSize(window.innerWidth, window.innerHeight);
  });

  return {
    scene, camera, renderer,
    start: () => renderer.setAnimationLoop(loop),
    onTick: (fn) => tickFns.push(fn),
    setRenderPaused: (v) => { paused = v; },
  };
}
