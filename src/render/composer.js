import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as THREE from 'three';

export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(window.innerWidth, window.innerHeight);

  composer.addPass(new RenderPass(scene, camera));

  // Higher threshold / lower strength so PBR specular does not bloom the whole desk
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.28,  // strength
    0.45,  // radius
    0.96,  // threshold
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  return {
    composer,
    bloom,
    setSize: (w, h) => composer.setSize(w, h),
  };
}
