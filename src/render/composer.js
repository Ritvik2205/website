import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import * as THREE from 'three';

/**
 * Final display-space grade: slight sepia split, vignette, and film grain.
 * Runs after OutputPass so it works on tone-mapped sRGB values.
 */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.03 },
    uVignette: { value: 0.35 },
    uSepia: { value: 0.12 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uSepia;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(c.rgb, vec3(l * 1.08, l * 0.94, l * 0.76), uSepia);
      float edge = length((vUv - 0.5) * vec2(1.15, 1.0));
      c.rgb *= 1.0 - uVignette * smoothstep(0.32, 0.85, edge);
      c.rgb += (hash(vUv * 1024.0 + fract(uTime * 7.0) * 61.0) - 0.5) * uGrain;
      gl_FragColor = c;
    }
  `,
};

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

  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);

  // Static grain under reduced motion; animated otherwise.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    composer,
    bloom,
    grade,
    setSize: (w, h) => composer.setSize(w, h),
    update: (dt) => { if (!reduced) grade.uniforms.uTime.value += dt; },
  };
}
