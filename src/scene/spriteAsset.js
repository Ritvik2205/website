import * as THREE from 'three';

// Textured plane from a transparent PNG, trimmed to its opaque bounding box
// so the raycast area hugs the artwork. Unlit: the PNG art carries its own
// shading (baked-rendering rule — see docs/design).
export function createSprite(url, { height = 1, fallback = null } = {}) {
  const group = new THREE.Group();
  group.userData.assetStatus = 'loading';
  if (fallback) {
    fallback.visible = true;
    group.add(fallback);
  }

  const material = new THREE.MeshBasicMaterial({
    transparent: true, alphaTest: 0.08,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);

  new THREE.ImageLoader().load(url, (img) => {
    const cv = document.createElement('canvas');
    cv.width = img.width;
    cv.height = img.height;
    const g = cv.getContext('2d');
    g.drawImage(img, 0, 0);
    const { data } = g.getImageData(0, 0, cv.width, cv.height);

    let minX = cv.width, minY = cv.height, maxX = 0, maxY = 0;
    for (let y = 0; y < cv.height; y++) {
      for (let x = 0; x < cv.width; x++) {
        if (data[(y * cv.width + x) * 4 + 3] > 16) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    const w = Math.max(1, maxX - minX + 1);
    const h = Math.max(1, maxY - minY + 1);
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    out.getContext('2d').drawImage(img, minX, minY, w, h, 0, 0, w, h);

    const texture = new THREE.CanvasTexture(out);
    texture.colorSpace = THREE.SRGBColorSpace;
    material.map = texture;
    material.needsUpdate = true;
    mesh.scale.set(height * (w / h), height, 1);
    mesh.position.y = height / 2; // bottom edge rests at group origin
    if (fallback) fallback.visible = false;
    group.add(mesh);
    group.userData.assetStatus = 'loaded';
  }, undefined, () => {
    group.userData.assetStatus = 'error';
  });

  return group;
}
