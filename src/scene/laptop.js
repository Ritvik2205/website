import * as THREE from 'three';

const screenFragment = /* glsl */ `
uniform sampler2D uTexture;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec3 color = texture2D(uTexture, vUv).rgb;
  float scan = 0.9 + 0.1 * sin(vUv.y * 400.0 + uTime * 8.0);
  float flicker = 0.97 + 0.03 * sin(uTime * 47.0);
  color *= scan * flicker * 1.4; // pushed bright so the bloom pass catches it
  gl_FragColor = vec4(color, 1.0);
}
`;

export function createLaptop() {
  const group = new THREE.Group();
  const dark = new THREE.MeshBasicMaterial({ color: 0x171b22 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.3), dark);
  base.position.y = 0.01;

  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.015), dark.clone());
  lid.position.set(0, 0.15, -0.14);
  lid.rotation.x = -0.22;

  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 320;
  const g = cv.getContext('2d');
  g.fillStyle = '#171b22';
  g.fillRect(0, 0, 512, 320);
  g.font = '24px monospace';
  g.fillStyle = '#e7dec9';
  g.fillText('$ ~/projects', 24, 48);
  ['portfolio', 'ml-engine', 'api-server'].forEach((project, i) => {
    const y = 92 + i * 40;
    g.fillStyle = '#688178';
    g.fillText(i === 2 ? '└──' : '├──', 24, y);
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
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.24), screenMaterial);
  screen.position.set(0, 0.15, -0.131);
  screen.rotation.x = -0.22;

  group.add(base, lid, screen);
  group.position.set(1.1, 0.42, -0.15);
  group.rotation.y = -0.35;

  return {
    group,
    id: 'projects',
    label: 'projects',
    update: (dt) => { screenMaterial.uniforms.uTime.value += dt; },
  };
}
