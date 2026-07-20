import * as THREE from 'three';
import { createSprite } from './spriteAsset.js';

const NOTES = [
  { w: 0.28, h: 0.2,  x: -0.98, y: 0.28,  rot: -0.06, color: 0xe7dec9 },
  { w: 0.24, h: 0.3,  x: -1.0,  y: -0.18, rot: 0.04,  color: 0x9eb7c3 },
  { w: 0.26, h: 0.3,  x: 0.98,  y: 0.3,   rot: 0.05,  color: 0x8fa49c },
  { w: 0.3,  h: 0.18, x: 1.02,  y: -0.2,  rot: -0.04, color: 0x9eb7c3 },
  { w: 0.24, h: 0.16, x: -0.62, y: -0.42, rot: 0.05,  color: 0x8fa49c },
  { w: 0.26, h: 0.17, x: 0.6,   y: -0.44, rot: -0.05, color: 0xe7dec9 },
];
const STRINGS = [[0, 1], [2, 3], [4, 5]];

function paintTitleCanvas(cv) {
  const g = cv.getContext('2d');
  g.fillStyle = '#e7dec9';
  g.fillRect(0, 0, 1024, 640);

  // Rag Paper route ledger with restrained baked-in handling marks.
  const grad = g.createLinearGradient(0, 640, 500, 200);
  grad.addColorStop(0, 'rgba(118, 81, 55, 0.22)');
  grad.addColorStop(1, 'rgba(118, 81, 55, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 640);

  g.fillStyle = '#171b22';
  g.textAlign = 'center';
  g.font = '700 76px "Space Mono", monospace';
  g.fillText('MONSOON / POSTROOM', 512, 180);
  g.fillStyle = '#688178';
  g.fillRect(138, 228, 748, 8);
  g.fillStyle = '#493b35';
  g.font = '600 128px Caveat, cursive';
  g.fillText('Ritvik Gupta', 512, 430);
}

function makeTitleTexture() {
  const cv = document.createElement('canvas');
  cv.width = 1024;
  cv.height = 640;
  paintTitleCanvas(cv);

  const texture = new THREE.CanvasTexture(cv);
  const fontsReady = document.fonts?.ready;
  if (fontsReady) {
    Promise.resolve(fontsReady)
      .then(() => {
        paintTitleCanvas(cv);
        texture.needsUpdate = true;
      })
      .catch(() => {});
  }
  return texture;
}

export function createCorkboard() {
  const group = new THREE.Group();

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 1.3, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x8a6948 })
  );

  const frameMat = new THREE.MeshBasicMaterial({ color: 0x604127 });
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(2.86, 0.09, 0.07), frameMat);
  frameTop.position.set(0, 0.695, 0.005);
  const frameBottom = frameTop.clone();
  frameBottom.position.y = -0.695;
  const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.48, 0.07), frameMat);
  frameLeft.position.set(-1.385, 0, 0.005);
  const frameRight = frameLeft.clone();
  frameRight.position.x = 1.385;
  group.add(board, frameTop, frameBottom, frameLeft, frameRight);

  const ephemeraHeight = 1.1;
  const ephemera = createSprite('/assets/postroom/ephemera.png', {
    height: ephemeraHeight,
  });
  ephemera.position.set(0, -ephemeraHeight / 2, 0.02);
  group.add(ephemera);

  // Central Rag Paper route ledger.
  const title = new THREE.Mesh(
    new THREE.PlaneGeometry(1.24, 0.78),
    new THREE.MeshBasicMaterial({ map: makeTitleTexture() })
  );
  title.position.set(0, 0.02, 0.028);
  title.rotation.z = 0.012;
  group.add(title);
  for (const [px, py] of [[-0.56, 0.36], [0.57, 0.37], [-0.57, -0.33], [0.56, -0.34]]) {
    const tack = new THREE.Mesh(
      new THREE.SphereGeometry(0.014, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xa77a3f })
    );
    tack.position.set(px, py, 0.04);
    group.add(tack);
  }

  const pinPositions = [];
  for (const n of NOTES) {
    const note = new THREE.Mesh(
      new THREE.PlaneGeometry(n.w, n.h),
      new THREE.MeshBasicMaterial({ color: n.color })
    );
    note.position.set(n.x, n.y, 0.028);
    note.rotation.z = n.rot;
    group.add(note);

    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.013, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xa77a3f })
    );
    pin.position.set(n.x, n.y + n.h / 2 - 0.012, 0.042);
    group.add(pin);
    pinPositions.push(pin.position.clone());
  }

  const stringMat = new THREE.LineBasicMaterial({
    color: 0x688178,
    transparent: true,
    opacity: 0.72,
  });
  for (const [a, b] of STRINGS) {
    const pa = pinPositions[a];
    const pb = pinPositions[b];
    const mid = pa.clone().lerp(pb, 0.5);
    mid.y -= 0.07;
    mid.z += 0.008;
    const curve = new THREE.CatmullRomCurve3([pa, mid, pb]);
    const geom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(20));
    group.add(new THREE.Line(geom, stringMat));
  }

  group.position.set(0, 1.42, -1.17);
  return { group, id: 'experience', label: 'the board' };
}
