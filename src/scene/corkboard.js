import * as THREE from 'three';

const NOTES = [
  { w: 0.28, h: 0.2,  x: -0.98, y: 0.28,  rot: -0.06, color: 0xf5e6a0, pin: 0xc44444 }, // sticky
  { w: 0.24, h: 0.3,  x: -1.0,  y: -0.18, rot: 0.04,  color: 0xf0ede4, pin: 0x4488aa }, // ruled
  { w: 0.26, h: 0.3,  x: 0.98,  y: 0.3,   rot: 0.05,  color: 0xf4f2ee, pin: 0xc44444 }, // polaroid
  { w: 0.3,  h: 0.18, x: 1.02,  y: -0.2,  rot: -0.04, color: 0xd4eaf5, pin: 0x44aa88 }, // blue note
  { w: 0.24, h: 0.16, x: -0.62, y: -0.42, rot: 0.05,  color: 0xfad4d4, pin: 0x4488aa }, // pink
  { w: 0.26, h: 0.17, x: 0.6,   y: -0.44, rot: -0.05, color: 0xfce4b8, pin: 0xc44444 }, // cream
];
const STRINGS = [[0, 1], [2, 3], [4, 5]];

function makeTitleTexture() {
  const cv = document.createElement('canvas');
  cv.width = 1024;
  cv.height = 640;
  const g = cv.getContext('2d');
  g.fillStyle = '#e6e0ea';
  g.fillRect(0, 0, 1024, 640);
  // soft paper shading, bottom-left
  const grad = g.createLinearGradient(0, 640, 500, 200);
  grad.addColorStop(0, 'rgba(190, 150, 90, 0.28)');
  grad.addColorStop(1, 'rgba(190, 150, 90, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 640);
  g.fillStyle = '#c8742a';
  g.textAlign = 'center';
  g.font = '600 150px Caveat, cursive';
  g.fillText('Ritvik', 512, 280);
  g.fillText('Gupta', 512, 460);
  return new THREE.CanvasTexture(cv);
}

export function createCorkboard() {
  const group = new THREE.Group();

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 1.3, 0.04),
    new THREE.MeshBasicMaterial({ color: 0xb5762e })
  );

  const frameMat = new THREE.MeshBasicMaterial({ color: 0x9a6a32 });
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(2.86, 0.09, 0.07), frameMat);
  frameTop.position.set(0, 0.695, 0.005);
  const frameBottom = frameTop.clone();
  frameBottom.position.y = -0.695;
  const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.48, 0.07), frameMat);
  frameLeft.position.set(-1.385, 0, 0.005);
  const frameRight = frameLeft.clone();
  frameRight.position.x = 1.385;
  group.add(board, frameTop, frameBottom, frameLeft, frameRight);

  // central white title board
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
      new THREE.MeshBasicMaterial({ color: 0x8a5a28 })
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
      new THREE.MeshBasicMaterial({ color: n.pin })
    );
    pin.position.set(n.x, n.y + n.h / 2 - 0.012, 0.042);
    group.add(pin);
    pinPositions.push(pin.position.clone());
  }

  const stringMat = new THREE.LineBasicMaterial({ color: 0xc43030, transparent: true, opacity: 0.75 });
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
