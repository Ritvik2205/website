import * as THREE from 'three';

const RAIN_X_RANGE = [1.92, 2.48];
const RAIN_Y_RANGE = [1.4, 2.2];
const RAIN_DRIFT_RANGE = [-0.025, -0.01];
const LIGHTNING_DURATION = 0.35;
const DEFAULT_BASE_EMISSIVE = 0.35;

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

// Samples Poly Haven "Approaching Storm" (CC0) with a slow pan + deep-blue grade.
const stormFragmentShader = `
  uniform sampler2D uSky;
  uniform float uTime;
  uniform float uFlash;
  varying vec2 vUv;

  void main() {
    // Equirectangular sky: crop an upper storm band and drift horizontally.
    vec2 uv = vec2(
      fract(vUv.x * 0.42 + uTime * 0.006),
      mix(0.52, 0.88, vUv.y)
    );
    vec3 sky = texture2D(uSky, uv).rgb;

    float lum = dot(sky, vec3(0.299, 0.587, 0.114));
    vec3 deepBlue = vec3(0.03, 0.06, 0.14);
    vec3 greyCloud = vec3(0.28, 0.31, 0.36);
    vec3 graded = mix(deepBlue, greyCloud, smoothstep(0.05, 0.5, lum));
    // Keep some photo detail from the HDRI plate.
    graded = mix(graded, sky * vec3(0.45, 0.55, 0.85), 0.4);
    graded *= 0.72;

    vec3 flash = vec3(0.82, 0.88, 1.0) * uFlash;
    gl_FragColor = vec4(graded + flash, 1.0);
  }
`;

// Deliberately larger than the 0.62 x 0.82 wall opening: the plane sits ~0.08
// behind the wall, so an exact-size plane leaves visible void at the hole edges
// when the camera looks through the window obliquely.
const STORM_PLANE_SIZE = [1.0, 1.2];

function loadStormSkyMap() {
  if (typeof document === 'undefined') {
    const map = new THREE.Texture();
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }
  const map = new THREE.TextureLoader().load('/textures/storm-sky.jpg');
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  return map;
}

function createStormPlane() {
  const geometry = new THREE.PlaneGeometry(STORM_PLANE_SIZE[0], STORM_PLANE_SIZE[1]);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uSky: { value: loadStormSkyMap() },
      uTime: { value: 0 },
      uFlash: { value: 0 },
    },
    vertexShader: stormVertexShader,
    fragmentShader: stormFragmentShader,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(2.2, 1.8, -1.28);
  mesh.name = 'stormPlane';
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
    color: 0x7a8aa0,
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
 * Cinematic window weather: textured storm sky behind the glass,
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
    // The mid layer sits inside the window frame's depth slab (jambs span
    // z -1.21..-1.17). It clears them because RAIN_X_RANGE / RAIN_Y_RANGE stay
    // inside the 0.62 x 0.82 opening; keep that true if either range changes.
    const far = makeRainLayer({ count: 140, z: -1.22, speedScale: 0.6, opacity: 0.28, lengthScale: 0.8 });
    const mid = makeRainLayer({ count: 90, z: -1.185, speedScale: 1, opacity: 0.45, lengthScale: 1 });
    const near = makeRainLayer({ count: 40, z: -1.155, speedScale: 1.4, opacity: 0.65, lengthScale: 1.25 });
    rainLayers.push(far, mid, near);
    group.add(far.mesh, mid.mesh, near.mesh);
  }

  const baseEmissive = windowPane?.material?.emissiveIntensity ?? DEFAULT_BASE_EMISSIVE;
  let flashCountdown = lightningIn ?? nextLightningDelay();
  let flashElapsed = null; // null while idle, counts up through LIGHTNING_DURATION while flashing

  function update(dt) {
    // Reduced motion freezes the whole atmosphere, including the cloud drift
    // driven by uTime and the lightning flash driver.
    if (reduced) return;

    stormPlane.material.uniforms.uTime.value += dt;

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
        ? baseEmissive + envelope * THREE.MathUtils.lerp(1.4, 0.45, moodT)
        : baseEmissive;
    }

    if (progress >= 1) {
      flashElapsed = null;
      flashCountdown = nextLightningDelay();
    }
  }

  /** Fire a lightning flash now (the intro's arrival strike). */
  function strike() {
    if (!reduced) flashElapsed = 0;
  }

  return { group, update, strike };
}
