import * as THREE from 'three';

const RAIN_X_RANGE = [1.92, 2.48];
const RAIN_Y_RANGE = [1.4, 2.2];
const RAIN_DRIFT_RANGE = [-0.025, -0.01];
const LIGHTNING_DURATION = 0.35;
const DEFAULT_BASE_EMISSIVE = 1.15;

// Piecewise-linear double-flash envelope: rise → peak → dip → second (softer)
// peak → fade to 0, sampled across the flash's [0, 1] progress fraction.
const FLASH_KEYFRAMES = [
  [0, 0],
  [0.08, 1],
  [0.22, 0.12],
  [0.34, 0.7],
  [0.5, 0.08],
  [1, 0],
];

function flashEnvelope(p) {
  for (let i = 0; i < FLASH_KEYFRAMES.length - 1; i++) {
    const [p0, v0] = FLASH_KEYFRAMES[i];
    const [p1, v1] = FLASH_KEYFRAMES[i + 1];
    if (p <= p1) {
      const t = THREE.MathUtils.clamp((p - p0) / (p1 - p0), 0, 1);
      return THREE.MathUtils.lerp(v0, v1, t);
    }
  }
  return 0;
}

function nextLightningDelay() {
  return 5 + Math.random() * 5;
}

const stormVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const stormFragmentShader = `
  uniform float uTime;
  uniform float uFlash;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  void main() {
    vec2 drift = vec2(uTime * 0.015, uTime * 0.01);
    float clouds = noise(vUv * 3.5 + drift) * 0.6 + noise(vUv * 7.0 - drift) * 0.4;
    vec3 base = mix(vec3(0.11, 0.15, 0.21), vec3(0.27, 0.33, 0.41), clouds);
    vec3 flash = vec3(0.75, 0.85, 1.0) * uFlash;
    gl_FragColor = vec4(base + flash, 0.85);
  }
`;

function createStormPlane() {
  const geometry = new THREE.PlaneGeometry(0.62, 0.82);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uFlash: { value: 0 },
    },
    vertexShader: stormVertexShader,
    fragmentShader: stormFragmentShader,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(2.2, 1.8, -1.28);
  return mesh;
}

/**
 * One streaked-rain layer against the window. Streaks recycle to the top of
 * `RAIN_Y_RANGE` once they fall past the bottom, keeping a constant density.
 */
function makeRainLayer({ count, z, speedScale = 1, opacity = 0.5, lengthScale = 1 }) {
  const positions = new Float32Array(count * 6);
  const speeds = [];
  const lengths = [];
  const drifts = [];

  for (let i = 0; i < count; i++) {
    const x = RAIN_X_RANGE[0] + Math.random() * (RAIN_X_RANGE[1] - RAIN_X_RANGE[0]);
    const y = RAIN_Y_RANGE[0] + Math.random() * (RAIN_Y_RANGE[1] - RAIN_Y_RANGE[0]);
    const len = (0.03 + Math.random() * 0.04) * lengthScale;
    const dx = RAIN_DRIFT_RANGE[0] + Math.random() * (RAIN_DRIFT_RANGE[1] - RAIN_DRIFT_RANGE[0]);
    positions.set([x, y, z, x + dx, y - len, z], i * 6);
    speeds.push((0.6 + Math.random() * 0.8) * speedScale);
    lengths.push(len);
    drifts.push(dx);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0x8aa8c0,
    transparent: true,
    opacity,
  });
  const mesh = new THREE.LineSegments(geometry, material);

  function update(dt) {
    const attr = mesh.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const idx = i * 6;
      let y1 = attr.array[idx + 1] - speeds[i] * dt;
      let x1 = attr.array[idx];
      if (y1 < RAIN_Y_RANGE[0]) {
        y1 = RAIN_Y_RANGE[1];
        x1 = RAIN_X_RANGE[0] + Math.random() * (RAIN_X_RANGE[1] - RAIN_X_RANGE[0]);
      }
      attr.array[idx] = x1;
      attr.array[idx + 1] = y1;
      attr.array[idx + 3] = x1 + drifts[i];
      attr.array[idx + 4] = y1 - lengths[i];
    }
    attr.needsUpdate = true;
  }

  return { mesh, speeds, update };
}

/**
 * Cinematic window weather: a slow cloud-noise storm plane behind the glass,
 * three parallax rain layers, and a periodic double-flash lightning driver
 * that composes with the realtime lighting mood via `applyWindowFlashLevel`.
 */
export function createAtmosphere({
  reduced = false,
  getLampMood = () => 1,
  applyWindowFlashLevel = () => {},
  windowPane = null,
  lightningIn,
} = {}) {
  const group = new THREE.Group();

  const stormPlane = createStormPlane();
  group.add(stormPlane);

  const rainLayers = [];
  if (!reduced) {
    const far = makeRainLayer({ count: 140, z: -1.22, speedScale: 0.6, opacity: 0.28, lengthScale: 0.8 });
    const mid = makeRainLayer({ count: 90, z: -1.18, speedScale: 1, opacity: 0.45, lengthScale: 1 });
    const near = makeRainLayer({ count: 40, z: -1.155, speedScale: 1.4, opacity: 0.65, lengthScale: 1.25 });
    rainLayers.push(far, mid, near);
    group.add(far.mesh, mid.mesh, near.mesh);
  }

  const baseEmissive = windowPane?.material?.emissiveIntensity ?? DEFAULT_BASE_EMISSIVE;
  let flashCountdown = lightningIn ?? nextLightningDelay();
  let flashElapsed = null; // null while idle, counts up through LIGHTNING_DURATION while flashing

  function update(dt) {
    stormPlane.material.uniforms.uTime.value += dt;

    if (reduced) return;

    for (const layer of rainLayers) layer.update(dt);

    if (flashElapsed === null) {
      flashCountdown -= dt;
      if (flashCountdown > 0) return;
      flashElapsed = 0;
    } else {
      flashElapsed += dt;
    }

    const progress = Math.min(flashElapsed / LIGHTNING_DURATION, 1);
    const envelope = flashEnvelope(progress);

    applyWindowFlashLevel(envelope);
    stormPlane.material.uniforms.uFlash.value = envelope;
    if (windowPane?.material) {
      const moodT = THREE.MathUtils.clamp((getLampMood() - 0.15) / 0.85, 0, 1);
      windowPane.material.emissiveIntensity = envelope > 0
        ? baseEmissive + envelope * THREE.MathUtils.lerp(1.6, 0.5, moodT)
        : baseEmissive;
    }

    if (progress >= 1) {
      flashElapsed = null;
      flashCountdown = nextLightningDelay();
    }
  }

  return { group, update };
}
