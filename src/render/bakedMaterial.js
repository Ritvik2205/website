import * as THREE from 'three';

const registry = [];
let currentMix = 1; // 1 = lamp on (warm day bake), 0 = lamp off (cool dusk bake)

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform float uNightMix;
varying vec2 vUv;

void main() {
  vec4 textureDay = texture2D(uDayTexture, vUv);
  vec4 textureNight = texture2D(uNightTexture, vUv);
  // colorspace/tonemapping handled once, by the composer's OutputPass
  gl_FragColor = mix(textureNight, textureDay, uNightMix);
}
`;

export function createBakedMaterial({ day, night, transparent = false }) {
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent,
    uniforms: {
      uDayTexture: { value: day },
      uNightTexture: { value: night },
      uNightMix: { value: currentMix },
    },
  });
  registry.push(material);
  return material;
}

// unlit props (MeshBasicMaterial) follow the mood axis by dimming toward
// nightFactor of their base color — keeps them consistent with baked surfaces
const unlitRegistry = [];

export function registerUnlitGroup(group, nightFactor = 0.55) {
  group.traverse((o) => {
    if (o.isMesh && o.material?.color && !o.material.isShaderMaterial) {
      unlitRegistry.push({ mesh: o, base: o.material.color.clone(), nightFactor });
    }
  });
}

export function setNightMix(value) {
  currentMix = value;
  for (const material of registry) {
    material.uniforms.uNightMix.value = value;
  }
  for (const { mesh, base, nightFactor } of unlitRegistry) {
    const f = nightFactor + (1 - nightFactor) * value;
    mesh.material.color.copy(base).multiplyScalar(f);
    // keep the hover system's restore color in sync with the current mood
    mesh.userData.baseColor = mesh.material.color.getHex();
  }
}

export function getNightMix() {
  return currentMix;
}
