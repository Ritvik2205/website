import * as THREE from 'three';
import { markShadowCasters, withFallback } from '../render/loadModel.js';
import { LAYOUT, applyPose } from './layout.js';

function makeSketchTexture() {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 320;
  const g = cv.getContext('2d');
  g.fillStyle = '#e7dec9';
  g.fillRect(0, 0, 256, 320);
  g.strokeStyle = '#688178';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(90, 60);
  g.bezierCurveTo(150, 50, 180, 110, 160, 170);
  g.bezierCurveTo(150, 210, 110, 230, 90, 210);
  g.stroke();
  g.beginPath();
  g.arc(125, 120, 8, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.moveTo(50 + i * 6, 250);
    g.lineTo(90 + i * 6, 290);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSketchbook() {
  const fallback = new THREE.Group();
  const sketch = makeSketchTexture();
  const paper = new THREE.MeshStandardMaterial({
    color: 0xe7dec9,
    roughness: 0.88,
    metalness: 0.0,
  });

  const leftPage = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.3), paper.clone());
  leftPage.material.map = sketch;
  leftPage.material.needsUpdate = true;
  leftPage.position.set(-0.12, 0.012, 0);
  leftPage.rotation.z = 0.06;
  leftPage.castShadow = true;
  leftPage.receiveShadow = true;

  const rightPage = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.3), paper.clone());
  rightPage.position.set(0.12, 0.012, 0);
  rightPage.rotation.z = -0.06;
  rightPage.castShadow = true;
  rightPage.receiveShadow = true;

  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.02, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xa77a3f, roughness: 0.7 }),
  );
  spine.position.y = 0.008;
  spine.castShadow = true;

  const pencilColors = [0x688178, 0xa77a3f, 0x688178];
  pencilColors.forEach((color, i) => {
    const pencil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.14, 10),
      new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.15 }),
    );
    pencil.rotation.z = Math.PI / 2;
    pencil.rotation.y = 0.5 + i * 0.15;
    pencil.position.set(0.18, 0.008, 0.08 + i * 0.025);
    pencil.castShadow = true;
    fallback.add(pencil);
  });

  fallback.add(leftPage, rightPage, spine);

  const group = withFallback('/models/kit/sketchbook.glb', fallback, {
    onLoad: (model) => {
      const page = model.getObjectByName('PageLeft');
      if (!page) return;
      // glTF UVs expect flipY = false; clone so the fallback keeps its orientation.
      const map = sketch.clone();
      map.flipY = false;
      map.needsUpdate = true;
      page.material = new THREE.MeshStandardMaterial({ map, roughness: 0.85 });
      page.receiveShadow = true;
    },
  });
  markShadowCasters(group);
  applyPose(group, LAYOUT.sketchbook);
  return { group, id: 'gallery', label: 'sketches & photos' };
}
