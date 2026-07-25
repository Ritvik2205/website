import * as THREE from 'three';

const loader = new THREE.TextureLoader();

function loadMap(url, { colorSpace = THREE.SRGBColorSpace, wrap = true } = {}) {
  if (typeof document === 'undefined') {
    const map = new THREE.Texture();
    map.colorSpace = colorSpace;
    return map;
  }
  const map = loader.load(url);
  map.colorSpace = colorSpace;
  if (wrap) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
  }
  return map;
}

function woodMaterial({ repeat = [2.2, 1.2] } = {}) {
  const map = loadMap('/textures/wood-color.jpg');
  const roughnessMap = loadMap('/textures/wood-roughness.jpg', { colorSpace: THREE.NoColorSpace });
  const normalMap = loadMap('/textures/wood-normal.jpg', { colorSpace: THREE.NoColorSpace });
  const aoMap = loadMap('/textures/wood-ao.jpg', { colorSpace: THREE.NoColorSpace });
  for (const t of [map, roughnessMap, normalMap, aoMap]) {
    t.repeat.set(repeat[0], repeat[1]);
  }
  return new THREE.MeshStandardMaterial({
    map,
    roughnessMap,
    normalMap,
    aoMap,
    roughness: 0.85,
    metalness: 0.04,
    color: 0xffffff,
  });
}

function plasterMaterial() {
  const map = loadMap('/textures/plaster-color.jpg');
  const roughnessMap = loadMap('/textures/plaster-roughness.jpg', { colorSpace: THREE.NoColorSpace });
  const normalMap = loadMap('/textures/plaster-normal.jpg', { colorSpace: THREE.NoColorSpace });
  for (const t of [map, roughnessMap, normalMap]) {
    t.repeat.set(3.5, 1.8);
  }
  return new THREE.MeshStandardMaterial({
    map,
    roughnessMap,
    normalMap,
    roughness: 0.92,
    metalness: 0.02,
    color: 0xc4b49a,
  });
}

export function createEnvironment() {
  const group = new THREE.Group();
  const deskMat = woodMaterial({ repeat: [2.4, 1.1] });
  const edgeMat = woodMaterial({ repeat: [2.4, 0.2] });
  edgeMat.color = new THREE.Color(0xb8956a);
  const wallMat = plasterMaterial();

  const deskBody = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.09, 1.05),
    deskMat,
  );
  deskBody.position.set(0, 0.375, -0.675);
  deskBody.castShadow = true;
  deskBody.receiveShadow = true;
  group.add(deskBody);

  const deskTop = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.04, 1.05),
    deskMat,
  );
  // Centered so the top face sits at y = 0.44 (matches LAYOUT.deskY)
  deskTop.position.set(0, 0.42, -0.675);
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  // aoMap needs a second UV set; duplicate uv -> uv2
  deskTop.geometry.setAttribute('uv2', deskTop.geometry.attributes.uv);
  deskBody.geometry.setAttribute('uv2', deskBody.geometry.attributes.uv);
  group.add(deskTop);

  const deskEdge = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.18, 0.07),
    edgeMat,
  );
  deskEdge.position.set(0, 0.33, -0.15);
  deskEdge.castShadow = true;
  deskEdge.receiveShadow = true;
  group.add(deskEdge);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
      color: 0x1a1f28,
      roughness: 0.95,
      metalness: 0.05,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Wall is a 10x5 plane with a rectangular hole cut out so the storm plane
  // and far rain (behind the wall at z ~ -1.22 / -1.28) are actually visible
  // through the window instead of being occluded by a solid backdrop.
  const wallWidth = 10;
  const wallHeight = 5;
  const windowOpeningWidth = 0.62;
  const windowOpeningHeight = 0.82;
  const windowLocalX = 2.2; // wall is centered at world x = 0, so local x === world x
  const windowLocalY = 1.8 - 2.5; // wall is centered at world y = 2.5

  const wallShape = new THREE.Shape();
  wallShape.moveTo(-wallWidth / 2, -wallHeight / 2);
  wallShape.lineTo(wallWidth / 2, -wallHeight / 2);
  wallShape.lineTo(wallWidth / 2, wallHeight / 2);
  wallShape.lineTo(-wallWidth / 2, wallHeight / 2);
  wallShape.closePath();

  const windowHole = new THREE.Path();
  windowHole.moveTo(windowLocalX - windowOpeningWidth / 2, windowLocalY - windowOpeningHeight / 2);
  windowHole.lineTo(windowLocalX + windowOpeningWidth / 2, windowLocalY - windowOpeningHeight / 2);
  windowHole.lineTo(windowLocalX + windowOpeningWidth / 2, windowLocalY + windowOpeningHeight / 2);
  windowHole.lineTo(windowLocalX - windowOpeningWidth / 2, windowLocalY + windowOpeningHeight / 2);
  windowHole.closePath();
  wallShape.holes.push(windowHole);

  const wallGeometry = new THREE.ShapeGeometry(wallShape);
  // ShapeGeometry emits raw world-space UVs; remap to 0-1 so wallMat's
  // texture repeat/tiling matches what the original PlaneGeometry produced.
  const wallUv = wallGeometry.attributes.uv;
  for (let i = 0; i < wallUv.count; i++) {
    wallUv.setXY(
      i,
      (wallUv.getX(i) + wallWidth / 2) / wallWidth,
      (wallUv.getY(i) + wallHeight / 2) / wallHeight,
    );
  }
  wallUv.needsUpdate = true;

  const wall = new THREE.Mesh(wallGeometry, wallMat);
  wall.position.set(0, 2.5, -1.2);
  wall.receiveShadow = true;
  group.add(wall);

  // Four bars rather than a solid box, so the frame surrounds the wall hole
  // instead of plugging it. Inner opening matches windowOpeningWidth/Height;
  // outer extent stays 0.7 x 0.9 with a 0.04 jamb on every side.
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x493522, roughness: 0.7, metalness: 0.1 });
  const frameDepth = 0.04;
  const jamb = 0.04;
  const frameZ = -1.19;
  const frameOuterHeight = windowOpeningHeight + jamb * 2;
  const windowFrame = new THREE.Group();
  const frameBars = [
    // left / right jambs run the full outer height
    [jamb, frameOuterHeight, 2.2 - (windowOpeningWidth + jamb) / 2, 1.8],
    [jamb, frameOuterHeight, 2.2 + (windowOpeningWidth + jamb) / 2, 1.8],
    // head / sill span only the opening so they butt against the jambs
    [windowOpeningWidth, jamb, 2.2, 1.8 + (windowOpeningHeight + jamb) / 2],
    [windowOpeningWidth, jamb, 2.2, 1.8 - (windowOpeningHeight + jamb) / 2],
  ];
  for (const [w, h, x, y] of frameBars) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, frameDepth), frameMat);
    bar.position.set(x, y, frameZ);
    bar.castShadow = true;
    bar.receiveShadow = true;
    windowFrame.add(bar);
  }
  group.add(windowFrame);

  const windowPane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.8),
    new THREE.MeshStandardMaterial({
      color: 0x8aa8b8,
      emissive: 0xa8c8dc,
      emissiveIntensity: 1.15,
      roughness: 0.06,
      metalness: 0.18,
      transparent: true,
      opacity: 0.92,
    }),
  );
  windowPane.name = 'windowPane';
  windowPane.position.set(2.2, 1.8, -1.165);
  group.add(windowPane);

  // Simple mullion bars for window-shadow character
  const mullionMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.8 });
  const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.82, 0.03), mullionMat);
  mullionV.position.set(2.2, 1.8, -1.17);
  const mullionH = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.03), mullionMat);
  mullionH.position.set(2.2, 1.8, -1.17);
  mullionV.castShadow = true;
  mullionH.castShadow = true;
  group.add(mullionV, mullionH);

  return { group, windowPane };
}
