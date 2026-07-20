import * as THREE from 'three';

function makeCoverTexture() {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 320;
  const g = cv.getContext('2d');
  g.fillStyle = '#6b4423';
  g.fillRect(0, 0, 256, 320);
  g.font = '600 48px Caveat, cursive';
  g.fillStyle = '#d4b896';
  g.textAlign = 'center';
  g.fillText('JOURNAL', 128, 170);
  return new THREE.CanvasTexture(cv);
}

export function createJournal() {
  const group = new THREE.Group();

  const cover = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.05, 0.3),
    new THREE.MeshBasicMaterial({ color: 0x6b4423 })
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
    new THREE.MeshBasicMaterial({ color: 0x4a2f15 })
  );
  spine.position.set(-0.11, 0.0275, 0);

  const pages = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.035, 0.28),
    new THREE.MeshBasicMaterial({ color: 0xf0e8d8 })
  );
  pages.position.set(0.005, 0.025, 0);

  const strap = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.012, 0.03),
    new THREE.MeshBasicMaterial({ color: 0x4a2f15 })
  );
  strap.position.set(0, 0.058, 0);

  group.add(cover, top, spine, pages, strap);
  group.position.set(-0.9, 0.42, 0.1);
  group.rotation.y = 0.3;
  return { group, id: 'blog', label: 'journal' };
}
