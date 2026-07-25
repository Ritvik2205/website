import * as THREE from 'three';
import { loadModel, markShadowCasters, nextFrame } from '../render/loadModel.js';
import { LAYOUT, applyPose } from './layout.js';

function paperSheet(w, h, color) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

function createPenCup() {
  const group = new THREE.Group();
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.04, 0.09, 20),
    new THREE.MeshStandardMaterial({ color: 0x688178, roughness: 0.55, metalness: 0.15 }),
  );
  cup.position.y = 0.045;
  cup.castShadow = true;
  group.add(cup);
  const colors = [0x171b22, 0xa77a3f, 0x688178];
  colors.forEach((color, i) => {
    const pen = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.14, 8),
      new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 }),
    );
    pen.position.set((i - 1) * 0.018, 0.12, 0.01 * (i % 2));
    pen.rotation.z = 0.12 * (i - 1);
    pen.castShadow = true;
    group.add(pen);
  });
  return group;
}

function createPapers() {
  const group = new THREE.Group();
  const sheets = [
    { w: 0.28, h: 0.2, y: 0.001, rot: -0.12, color: 0xe7dec9 },
    { w: 0.24, h: 0.18, y: 0.003, rot: 0.18, color: 0xf2ebe0 },
    { w: 0.22, h: 0.16, y: 0.005, rot: -0.05, color: 0xd8cfc0 },
  ];
  for (const s of sheets) {
    const sheet = paperSheet(s.w, s.h, s.color);
    sheet.position.y = s.y;
    sheet.rotation.z = s.rot;
    group.add(sheet);
  }
  return group;
}

function createBooksFallback() {
  const group = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.03, 0.22),
      new THREE.MeshStandardMaterial({
        color: [0x765137, 0x493522, 0x688178][i],
        roughness: 0.8,
      }),
    );
    book.position.y = 0.015 + i * 0.032;
    book.rotation.y = 0.08 * i;
    book.castShadow = true;
    group.add(book);
  }
  return group;
}

function createPlantFallback() {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.06, 0.1, 16),
    new THREE.MeshStandardMaterial({ color: 0x765137, roughness: 0.7 }),
  );
  pot.position.y = 0.05;
  pot.castShadow = true;
  const foliage = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x4a6b4e, roughness: 0.85 }),
  );
  foliage.position.y = 0.2;
  foliage.castShadow = true;
  g.add(pot, foliage);
  return g;
}

function createKeyboardFallback() {
  const g = new THREE.Group();
  const kb = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.02, 0.11),
    new THREE.MeshStandardMaterial({ color: 0x25282b, roughness: 0.5, metalness: 0.2 }),
  );
  kb.position.y = 0.01;
  kb.castShadow = true;
  g.add(kb);
  return g;
}

function withGlbOrFallback(url, height, fallback) {
  const wrap = new THREE.Group();
  wrap.add(fallback);
  const model = loadModel(url, { height });
  model.visible = false;
  wrap.add(model);
  const poll = () => {
    if (model.userData.assetStatus === 'loaded') {
      fallback.visible = false;
      model.visible = true;
    } else if (model.userData.assetStatus === 'error') {
      model.visible = false;
      fallback.visible = true;
    } else {
      nextFrame(poll);
    }
  };
  nextFrame(poll);
  return wrap;
}

/** Non-interactive desk clutter to fill negative space. */
export function createFillers() {
  const group = new THREE.Group();
  const poses = LAYOUT.fillers;

  const books = withGlbOrFallback('/models/books.glb', 0.16, createBooksFallback());
  applyPose(books, poses.books);
  group.add(books);

  const plant = withGlbOrFallback('/models/potted-plant.glb', 0.42, createPlantFallback());
  applyPose(plant, poses.plant);
  group.add(plant);

  const papers = createPapers();
  applyPose(papers, poses.papers);
  group.add(papers);

  const penCup = createPenCup();
  applyPose(penCup, poses.penCup);
  group.add(penCup);

  const keyboard = withGlbOrFallback('/models/keyboard.glb', 0.035, createKeyboardFallback());
  applyPose(keyboard, poses.keyboard);
  group.add(keyboard);

  markShadowCasters(group);
  return { group };
}
