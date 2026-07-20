import * as THREE from 'three';

function makeSketchTexture() {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 320;
  const g = cv.getContext('2d');
  g.fillStyle = '#f0ebe0';
  g.fillRect(0, 0, 256, 320);
  g.strokeStyle = '#999';
  g.lineWidth = 2;
  // loose face-profile doodle
  g.beginPath();
  g.moveTo(90, 60);
  g.bezierCurveTo(150, 50, 180, 110, 160, 170);
  g.bezierCurveTo(150, 210, 110, 230, 90, 210);
  g.stroke();
  g.beginPath();
  g.arc(125, 120, 8, 0, Math.PI * 2);
  g.stroke();
  // hatching lines
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.moveTo(50 + i * 6, 250);
    g.lineTo(90 + i * 6, 290);
    g.stroke();
  }
  return new THREE.CanvasTexture(cv);
}

export function createSketchbook() {
  const group = new THREE.Group();
  const paper = new THREE.MeshBasicMaterial({ color: 0xf0ebe0 });

  const leftPage = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.3), paper.clone());
  leftPage.material.map = makeSketchTexture();
  leftPage.position.set(-0.12, 0.012, 0);
  leftPage.rotation.z = 0.06;

  const rightPage = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.3), paper.clone());
  rightPage.position.set(0.12, 0.012, 0);
  rightPage.rotation.z = -0.06;

  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.02, 0.3),
    new THREE.MeshBasicMaterial({ color: 0xbbb3a0 })
  );
  spine.position.y = 0.008;

  const pencilColors = [0xd4a030, 0x666666, 0xc44444];
  pencilColors.forEach((color, i) => {
    const pencil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.14, 8),
      new THREE.MeshBasicMaterial({ color })
    );
    pencil.rotation.z = Math.PI / 2;
    pencil.rotation.y = 0.5 + i * 0.15;
    pencil.position.set(0.18, 0.008, 0.08 + i * 0.025);
    group.add(pencil);
  });

  group.add(leftPage, rightPage, spine);
  group.position.set(0, 0.42, 0.25);
  group.rotation.y = 0.04;
  return { group, id: 'gallery', label: 'sketches & photos' };
}
