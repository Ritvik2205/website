import * as THREE from 'three';

function makeCoverTexture() {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 320;
  const g = cv.getContext('2d');
  g.fillStyle = '#765137';
  g.fillRect(0, 0, 256, 320);
  g.font = '600 34px Caveat, cursive';
  g.fillStyle = '#e7dec9';
  g.fillText('JOURNAL', 28, 250);
  g.strokeStyle = '#a77a3f';
  g.lineWidth = 4;
  g.strokeRect(174, 28, 54, 66);
  g.beginPath();
  g.arc(201, 61, 18, 0, Math.PI * 2);
  g.moveTo(166, 67);
  g.lineTo(236, 67);
  g.moveTo(166, 76);
  g.lineTo(236, 76);
  g.stroke();
  return new THREE.CanvasTexture(cv);
}

export function createJournal() {
  const group = new THREE.Group();

  const cover = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.05, 0.3),
    new THREE.MeshBasicMaterial({ color: 0x765137 })
  );
  cover.position.y = 0.025;

  const top = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.3),
    new THREE.MeshBasicMaterial({ map: makeCoverTexture() })
  );
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.051;

  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.055, 0.3),
    new THREE.MeshBasicMaterial({ color: 0x493522 })
  );
  spine.position.set(-0.11, 0.0275, 0);

  const pages = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.035, 0.28),
    new THREE.MeshBasicMaterial({ color: 0xe7dec9 })
  );
  pages.position.set(0.005, 0.025, 0);

  const strap = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.012, 0.03),
    new THREE.MeshBasicMaterial({ color: 0x493522 })
  );
  strap.position.set(0, 0.058, 0);

  group.add(cover, top, spine, pages, strap);
  group.position.set(-0.9, 0.42, 0.1);
  group.rotation.y = 0.3;
  return { group, id: 'blog', label: 'journal' };
}
