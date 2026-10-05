import * as THREE from 'three';
import { withFallback } from '../render/loadModel.js';

// Soft stylized palette (docs/superpowers/specs/2026-10-05-soft-stylized-art-direction-design.md)
const OAK = 0xb9805a;
const OAK_DEEP = 0x7c5236;
const SLATE = 0x33435a;
const NIGHT = 0x12161e;

export function createEnvironment() {
  const group = new THREE.Group();
  const deskMat = new THREE.MeshStandardMaterial({ color: OAK, roughness: 0.62, metalness: 0 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: OAK_DEEP, roughness: 0.7, metalness: 0 });
  const wallMat = new THREE.MeshStandardMaterial({ color: SLATE, roughness: 0.92, metalness: 0 });
  // Procedural desk boxes stay as the fallback until the beveled kit desk loads.
  const deskFallback = new THREE.Group();

  const deskBody = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 0.09, 1.05),
    deskMat,
  );
  deskBody.position.set(0, 0.375, -0.675);
  deskBody.castShadow = true;
  deskBody.receiveShadow = true;
  deskFallback.add(deskBody);

  const deskTop = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 0.04, 1.05),
    deskMat,
  );
  // Centered so the top face sits at y = 0.44 (matches LAYOUT.deskY)
  deskTop.position.set(0, 0.42, -0.675);
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  deskFallback.add(deskTop);

  const deskEdge = new THREE.Mesh(
    new THREE.BoxGeometry(3.0, 0.18, 0.07),
    edgeMat,
  );
  deskEdge.position.set(0, 0.33, -0.15);
  deskEdge.castShadow = true;
  deskEdge.receiveShadow = true;
  deskFallback.add(deskEdge);

  const desk = withFallback('/models/kit/desk.glb', deskFallback);
  // Kit desk is authored centered; the fallback boxes already sit in world space.
  desk.children[1].position.set(0, 0, -0.675);
  group.add(desk);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
      color: NIGHT,
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
  const wall = new THREE.Mesh(wallGeometry, wallMat);
  wall.position.set(0, 2.5, -1.2);
  wall.receiveShadow = true;
  group.add(wall);

  // Four bars rather than a solid box, so the frame surrounds the wall hole
  // instead of plugging it. Inner opening matches windowOpeningWidth/Height;
  // outer extent stays 0.7 x 0.9 with a 0.04 jamb on every side.
  const frameMat = new THREE.MeshStandardMaterial({ color: OAK_DEEP, roughness: 0.7, metalness: 0 });
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
    bar.name = 'windowFrameBar';
    bar.position.set(x, y, frameZ);
    bar.castShadow = true;
    bar.receiveShadow = true;
    windowFrame.add(bar);
  }
  group.add(windowFrame);

  const windowPane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.8),
    new THREE.MeshStandardMaterial({
      color: 0x152030,
      emissive: 0x1e3048,
      emissiveIntensity: 0.35,
      roughness: 0.08,
      metalness: 0.12,
      transparent: true,
      opacity: 0.32,
    }),
  );
  windowPane.name = 'windowPane';
  windowPane.position.set(2.2, 1.8, -1.165);
  group.add(windowPane);

  // Simple mullion bars for window-shadow character
  const mullionMat = new THREE.MeshStandardMaterial({ color: 0x6a4630, roughness: 0.8 });
  const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.82, 0.03), mullionMat);
  mullionV.position.set(2.2, 1.8, -1.17);
  const mullionH = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.03), mullionMat);
  mullionH.position.set(2.2, 1.8, -1.17);
  mullionV.castShadow = true;
  mullionH.castShadow = true;
  group.add(mullionV, mullionH);

  return { group, windowPane };
}
