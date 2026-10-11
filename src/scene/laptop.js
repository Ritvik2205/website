import * as THREE from 'three';
import { loadModel, markShadowCasters, nextFrame } from '../render/loadModel.js';
import { LAYOUT, applyPose } from './layout.js';

const screenFragment = /* glsl */ `
uniform sampler2D uTexture;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec3 color = texture2D(uTexture, vUv).rgb;
  float scan = 0.9 + 0.1 * sin(vUv.y * 400.0 + uTime * 8.0);
  float flicker = 0.97 + 0.03 * sin(uTime * 47.0);
  color *= scan * flicker * 1.4;
  gl_FragColor = vec4(color, 1.0);
}
`;

function createFallback(screenMaterial) {
  const group = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({
    color: 0x171b22,
    roughness: 0.45,
    metalness: 0.55,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.3), dark);
  base.position.y = 0.01;
  base.castShadow = true;
  base.receiveShadow = true;

  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.015), dark.clone());
  lid.position.set(0, 0.15, -0.14);
  lid.rotation.x = -0.22;
  lid.castShadow = true;

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.24), screenMaterial);
  screen.position.set(0, 0.15, -0.131);
  screen.rotation.x = -0.22;

  group.add(base, lid, screen);
  return { group, screen };
}

export function createLaptop(projectNames = ['portfolio']) {
  const group = new THREE.Group();

  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 320;
  const g = cv.getContext('2d');
  g.fillStyle = '#171b22';
  g.fillRect(0, 0, 512, 320);
  g.font = '24px monospace';
  g.fillStyle = '#e7dec9';
  g.fillText('$ ~/projects', 24, 48);
  const shown = projectNames.slice(0, 4);
  shown.forEach((project, i) => {
    const y = 92 + i * 40;
    g.fillStyle = '#688178';
    g.fillText(i === shown.length - 1 ? '└──' : '├──', 24, y);
    g.fillStyle = '#e7dec9';
    g.fillText(project, 84, y);
  });
  g.fillStyle = '#e1a44b';
  g.fillRect(24, 246, 14, 28);
  const screenTexture = new THREE.CanvasTexture(cv);
  screenTexture.colorSpace = THREE.SRGBColorSpace;

  const screenMaterial = new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: screenFragment,
    uniforms: {
      uTexture: { value: screenTexture },
      uTime: { value: 0 },
    },
  });

  const { group: fallback, screen } = createFallback(screenMaterial);
  group.add(fallback);

  const model = loadModel('/models/kit/laptop.glb', { height: null });
  model.visible = false;
  group.add(model);

  const poll = () => {
    if (model.userData.assetStatus === 'loaded') {
      fallback.visible = false;
      model.visible = true;
      // Kit laptop exposes a UV-mapped `Screen` plane; glTF UVs expect flipY = false.
      const kitScreen = model.getObjectByName('Screen');
      if (kitScreen) {
        screenTexture.flipY = false;
        screenTexture.needsUpdate = true;
        kitScreen.material = screenMaterial;
      }
    } else if (model.userData.assetStatus === 'error') {
      model.visible = false;
      fallback.visible = true;
    } else {
      nextFrame(poll);
    }
  };
  nextFrame(poll);

  markShadowCasters(group);
  applyPose(group, LAYOUT.laptop);

  return {
    group,
    id: 'projects',
    label: 'projects',
    update: (dt) => { screenMaterial.uniforms.uTime.value += dt; },
  };
}
