import * as THREE from 'three';

// window rain only — the room itself has no floating particles
export function createAtmosphere({ reduced = false } = {}) {
  const group = new THREE.Group();

  const rainCount = reduced ? 0 : 60;
  let rain = null;
  const rainSpeeds = [];
  if (rainCount) {
    const rainPositions = new Float32Array(rainCount * 6);
    for (let i = 0; i < rainCount; i++) {
      const x = 1.92 + Math.random() * 0.56;
      const y = 1.42 + Math.random() * 0.76;
      const len = 0.03 + Math.random() * 0.04;
      rainPositions.set([x, y, -1.16, x - 0.004, y - len, -1.16], i * 6);
      rainSpeeds.push(0.6 + Math.random() * 0.8);
    }
    const rainGeom = new THREE.BufferGeometry();
    rainGeom.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    rain = new THREE.LineSegments(rainGeom, new THREE.LineBasicMaterial({
      color: 0x8aa8c0, transparent: true, opacity: 0.5,
    }));
    group.add(rain);
  }

  function update(dt) {
    if (!rain) return;
    const rp = rain.geometry.attributes.position;
    for (let i = 0; i < rainCount; i++) {
      let y1 = rp.array[i * 6 + 1] - rainSpeeds[i] * dt;
      const len = 0.03 + (i % 5) * 0.008;
      if (y1 < 1.4) y1 = 2.18;
      rp.array[i * 6 + 1] = y1;
      rp.array[i * 6 + 4] = y1 - len;
    }
    rp.needsUpdate = true;
  }

  return { group, update };
}
