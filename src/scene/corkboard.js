import * as THREE from 'three';
import { markShadowCasters } from '../render/loadModel.js';
import { LAYOUT, applyPose } from './layout.js';
import {
  CORK_FILLERS,
  CORK_INTERACTIVE,
  CORK_PIN_NODES,
  CORK_STRINGS,
  percentToBoardXY,
  percentSizeToWorld,
  resolveNodePercent,
} from './corkboardLayout.js';

const PIN_MAT = new THREE.MeshStandardMaterial({
  color: 0x2a2218,
  roughness: 0.45,
  metalness: 0.55,
});
const STRING_MAT = new THREE.LineBasicMaterial({
  color: 0xc41e2a,
  transparent: true,
  opacity: 0.88,
});

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makePhotoTexture(seed, kind) {
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 160;
  const g = cv.getContext('2d');
  const rnd = (() => {
    let s = seed || 1;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    };
  })();

  // Warm cork peeking for scraps; B&W photo for polaroids
  if (kind === 'scrap') {
    g.fillStyle = `hsl(${30 + rnd() * 20}, 18%, ${55 + rnd() * 20}%)`;
    g.fillRect(0, 0, 128, 160);
    g.fillStyle = 'rgba(40,30,20,0.35)';
    for (let i = 0; i < 40; i++) {
      g.fillRect(rnd() * 128, rnd() * 160, 2 + rnd() * 10, 1 + rnd() * 3);
    }
  } else {
    const base = 30 + rnd() * 40;
    g.fillStyle = `rgb(${base},${base},${base + 8})`;
    g.fillRect(0, 0, 128, 160);
    // Soft vignette figure / architecture blobs
    for (let i = 0; i < 5; i++) {
      const gx = 20 + rnd() * 90;
      const gy = 20 + rnd() * 110;
      const gr = g.createRadialGradient(gx, gy, 4, gx, gy, 20 + rnd() * 40);
      const c = 20 + rnd() * 90;
      gr.addColorStop(0, `rgba(${c},${c},${c},0.9)`);
      gr.addColorStop(1, 'rgba(20,20,24,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 160);
    }
    // Film grain
    const img = g.getImageData(0, 0, 128, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (rnd() - 0.5) * 28;
      img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
      img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
      img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
    }
    g.putImageData(img, 0, 0);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePolaroidMesh({ id, kind, left, top, w, h, rot }, z) {
  const size = percentSizeToWorld(w, h);
  const { x, y } = percentToBoardXY(left + w / 2, top + h / 2);
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.z = (rot * Math.PI) / 180;

  const border = kind === 'scrap' ? 0.01 : 0.018;
  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(size.w, size.h),
    new THREE.MeshStandardMaterial({
      color: kind === 'scrap' ? 0xd8cfc0 : 0xf2efe8,
      roughness: 0.88,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  );
  frame.castShadow = true;
  group.add(frame);

  const photoW = size.w - border * 2;
  const photoH = kind === 'polaroid' ? size.h - border * 2.6 : size.h - border * 2;
  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(photoW, photoH),
    new THREE.MeshStandardMaterial({
      map: makePhotoTexture(hashSeed(id), kind),
      roughness: 0.75,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  );
  photo.position.z = 0.002;
  photo.position.y = kind === 'polaroid' ? border * 0.35 : 0;
  photo.castShadow = true;
  group.add(photo);

  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), PIN_MAT);
  pin.position.set(0, size.h / 2 - 0.018, 0.012);
  pin.castShadow = true;
  group.add(pin);

  return group;
}

function makeInteractiveMesh(item, z) {
  const size = percentSizeToWorld(item.w, item.h);
  const { x, y } = percentToBoardXY(item.left + item.w / 2, item.top + item.h / 2);
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.z = (item.rot * Math.PI) / 180;
  group.userData.interactiveNote = item.id;

  let color = 0xe7dec9;
  if (item.kind === 'ruled') color = 0x9eb7c3;
  if (item.kind === 'polaroid') color = 0x8fa49c;

  const card = new THREE.Mesh(
    new THREE.PlaneGeometry(size.w, size.h),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide }),
  );
  card.castShadow = true;
  group.add(card);

  if (item.kind === 'polaroid') {
    const inset = new THREE.Mesh(
      new THREE.PlaneGeometry(size.w * 0.82, size.h * 0.62),
      new THREE.MeshStandardMaterial({
        map: makePhotoTexture(hashSeed(item.id), 'polaroid'),
        roughness: 0.7,
        side: THREE.DoubleSide,
      }),
    );
    inset.position.set(0, size.h * 0.08, 0.003);
    group.add(inset);
  }

  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), PIN_MAT);
  pin.position.set(0, size.h / 2 - 0.016, 0.012);
  pin.castShadow = true;
  group.add(pin);

  return group;
}

function addPinNode(node, z, group) {
  const { x, y } = percentToBoardXY(node.left, node.top);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), PIN_MAT);
  pin.position.set(x, y, z);
  pin.castShadow = true;
  group.add(pin);
}

function addString(aKey, bKey, group) {
  const a = resolveNodePercent(aKey);
  const b = resolveNodePercent(bKey);
  if (!a || !b) return;
  const pa = percentToBoardXY(a.left, a.top);
  const pb = percentToBoardXY(b.left, b.top);
  const mid = new THREE.Vector3(
    (pa.x + pb.x) / 2,
    (pa.y + pb.y) / 2 - 0.04 - Math.abs(pb.x - pa.x) * 0.04,
    0.055,
  );
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(pa.x, pa.y, 0.05),
    mid,
    new THREE.Vector3(pb.x, pb.y, 0.05),
  ]);
  const geom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(16));
  group.add(new THREE.Line(geom, STRING_MAT));
}

export function createCorkboard() {
  const group = new THREE.Group();

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 1.3, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x8a6948, roughness: 0.92, metalness: 0.0 }),
  );
  board.castShadow = true;
  board.receiveShadow = true;

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x604127, roughness: 0.7, metalness: 0.05 });
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(2.86, 0.09, 0.07), frameMat);
  frameTop.position.set(0, 0.695, 0.005);
  frameTop.castShadow = true;
  const frameBottom = frameTop.clone();
  frameBottom.position.y = -0.695;
  const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.48, 0.07), frameMat);
  frameLeft.position.set(-1.385, 0, 0.005);
  frameLeft.castShadow = true;
  const frameRight = frameLeft.clone();
  frameRight.position.x = 1.385;
  group.add(board, frameTop, frameBottom, frameLeft, frameRight);

  // Dense decorative layer
  CORK_FILLERS.forEach((item, i) => {
    group.add(makePolaroidMesh(item, 0.028 + (i % 5) * 0.0015));
  });

  // Clickable experience cards (visual only in 3D — click opens overlay)
  CORK_INTERACTIVE.forEach((item, i) => {
    group.add(makeInteractiveMesh(item, 0.036 + i * 0.001));
  });

  CORK_PIN_NODES.forEach((node) => addPinNode(node, 0.048, group));

  for (const [a, b] of CORK_STRINGS) {
    addString(a, b, group);
  }

  markShadowCasters(group);
  applyPose(group, LAYOUT.corkboard);

  return {
    group,
    id: 'experience',
    label: 'the board',
    // Wall-mounted: cursor only, no silhouette outline
    skipHoverVisual: true,
  };
}
