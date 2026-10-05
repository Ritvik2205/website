import * as THREE from 'three';
import { createComposer } from '../render/composer.js';

export function createEngine(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // Neutral keeps the stylized palette's hues; ACES pushed everything toward brown.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12161e);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 20);

  const { composer, setSize, update: updatePost } = createComposer(renderer, scene, camera);

  const tickFns = [];
  let paused = false;
  const clock = new THREE.Clock();

  function loop() {
    const dt = clock.getDelta();
    if (paused) return;
    for (const fn of tickFns) fn(dt);
    updatePost(dt);
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
