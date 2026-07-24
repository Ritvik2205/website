import * as THREE from 'three';

let lampMood = 1;
let flashLevel = 0; // 0..1, transient window-flash contribution
let windowLight;
let hemiLight;
let lampSpot;
let lampTarget;

const WINDOW_POS = new THREE.Vector3(2.2, 2.6, -0.4);
const DESK_AIM = new THREE.Vector3(0.2, 0.42, -0.2);

/**
 * Realtime PBR lighting for the desk scene.
 * Mood t=1 lamp-warm; t≈0.15 window-cool.
 */
export function createLighting(scene) {
  hemiLight = new THREE.HemisphereLight(0xffe2b8, 0x2a3340, 0.55);
  scene.add(hemiLight);

  windowLight = new THREE.DirectionalLight(0xd8e4f0, 1.35);
  windowLight.position.copy(WINDOW_POS);
  windowLight.target.position.copy(DESK_AIM);
  scene.add(windowLight);
  scene.add(windowLight.target);

  windowLight.castShadow = true;
  windowLight.shadow.mapSize.set(2048, 2048);
  windowLight.shadow.bias = -0.00035;
  windowLight.shadow.normalBias = 0.02;
  const cam = windowLight.shadow.camera;
  cam.near = 0.5;
  cam.far = 12;
  cam.left = -3.2;
  cam.right = 3.2;
  cam.top = 2.8;
  cam.bottom = -1.6;
  cam.updateProjectionMatrix();

  lampTarget = new THREE.Object3D();
  lampTarget.position.set(0.4, 0.42, 0.1);
  scene.add(lampTarget);

  lampSpot = new THREE.SpotLight(0xffc078, 18, 4.5, Math.PI / 5, 0.45, 1.4);
  lampSpot.position.set(1.45, 0.95, -0.45);
  lampSpot.target = lampTarget;
  lampSpot.castShadow = true;
  lampSpot.shadow.mapSize.set(1024, 1024);
  lampSpot.shadow.bias = -0.0002;
  scene.add(lampSpot);

  applyMood(lampMood);

  return {
    windowLight,
    hemiLight,
    lampSpot,
    lampTarget,
  };
}

/** Position the spot inside the lamp shade (shade-local offset) and aim at the desk. */
export function attachLampLight(lampGroup, shadeLocal = new THREE.Vector3(-0.03, 0.48, 0.02)) {
  if (!lampSpot || !lampGroup) return;
  const shadeWorld = shadeLocal.clone();
  lampGroup.localToWorld(shadeWorld);
  lampSpot.position.copy(shadeWorld);
  lampSpot.angle = Math.PI / 6;
  lampSpot.penumbra = 0.55;
  if (lampTarget) {
    lampTarget.position.set(shadeWorld.x - 0.35, 0.42, shadeWorld.z + 0.45);
  }
}

function applyMood(t) {
  if (!windowLight || !hemiLight || !lampSpot) return;
  const warm = THREE.MathUtils.clamp(t, 0.15, 1);
  const cool = 1 - (warm - 0.15) / 0.85;

  lampSpot.intensity = THREE.MathUtils.lerp(0.4, 18, (warm - 0.15) / 0.85);
  lampSpot.color.setHex(warm > 0.5 ? 0xffc078 : 0xe8a858);

  windowLight.intensity = THREE.MathUtils.lerp(0.85, 1.55, cool);
  windowLight.color.setRGB(
    THREE.MathUtils.lerp(0.95, 0.82, cool),
    THREE.MathUtils.lerp(0.9, 0.89, cool),
    THREE.MathUtils.lerp(0.82, 0.96, cool),
  );

  // Flash is transient; it boosts intensity most when the room is already dim
  // (lamp off / mood low) and nudges the color cooler like distant lightning.
  windowLight.intensity += flashLevel * THREE.MathUtils.lerp(1.8, 0.7, (warm - 0.15) / 0.85);
  if (flashLevel > 0) {
    windowLight.color.setRGB(
      THREE.MathUtils.lerp(windowLight.color.r, 0.75, flashLevel),
      THREE.MathUtils.lerp(windowLight.color.g, 0.85, flashLevel),
      THREE.MathUtils.lerp(windowLight.color.b, 1, flashLevel),
    );
  }

  hemiLight.intensity = THREE.MathUtils.lerp(0.35, 0.65, warm);
  hemiLight.color.setHex(warm > 0.4 ? 0xffe2b8 : 0xc5d4e0);
  hemiLight.groundColor.setHex(warm > 0.4 ? 0x3a2a1c : 0x1e2834);
}

export function setLampMood(value) {
  lampMood = THREE.MathUtils.clamp(value, 0.15, 1);
  applyMood(lampMood);
}

export function getLampMood() {
  return lampMood;
}

/**
 * Transient window-flash boost in [0, 1]. Re-enters through `applyMood` so it
 * always composes with the current lamp mood rather than owning a second axis.
 */
export function applyWindowFlashLevel(amount) {
  flashLevel = THREE.MathUtils.clamp(amount, 0, 1);
  applyMood(lampMood);
}

export function pulseWindowFlash(amount) {
  applyWindowFlashLevel(amount);
}
