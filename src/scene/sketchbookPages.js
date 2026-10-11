import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Turnable parchment pages laid over the kit sketchbook (sketchbook-local space:
 * spine along Z at x = 0, pages lie in XZ facing +Y).
 *
 * Content is a flat list of page faces P. Spread s shows P[2s] (left) and
 * P[2s+1] (right). A fixed base sheet carries P[0] on the left and another the
 * last face on the right; every sheet in between turns over the spine with its
 * front on the right and its back on the left.
 */

const PAGE = { w: 0.208, d: 0.268 };
const BASE_Y = 0.023;
const EPS = 0.0005;
const SEGMENTS = 24;
const TEX = { w: 640, h: 824 };
const INK = '#3b2a1a';
const PARCHMENT = ['/textures/parchment-1.jpg', '/textures/parchment-2.jpg'];

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCover(g, img, W, H) {
  const s = Math.max(W / img.width, H / img.height);
  g.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
}

/** Rusty parchment ground with scorched edges. */
function drawParchment(g, W, H, parchment) {
  if (parchment) drawCover(g, parchment, W, H);
  else {
    g.fillStyle = '#d8c39a';
    g.fillRect(0, 0, W, H);
  }
  const burn = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.38, W / 2, H / 2, Math.max(W, H) * 0.72);
  burn.addColorStop(0, 'rgba(90, 50, 20, 0)');
  burn.addColorStop(1, 'rgba(80, 40, 15, 0.55)');
  g.fillStyle = burn;
  g.fillRect(0, 0, W, H);
}

function roundedClip(g, W, H, r) {
  g.beginPath();
  g.moveTo(r, 0);
  g.arcTo(W, 0, W, H, r);
  g.arcTo(W, H, 0, H, r);
  g.arcTo(0, H, 0, 0, r);
  g.arcTo(0, 0, W, 0, r);
  g.closePath();
  g.clip();
}

/**
 * Full-bleed page: the drawing covers the whole sheet (no margins), laid over
 * rusty parchment so stains still read through the paper's light areas.
 */
function drawFace(g, face, parchment, image) {
  const { w: W, h: H } = TEX;
  g.clearRect(0, 0, W, H);
  g.save();
  // Rounded paper corners; outside the clip stays transparent (alphaTest cuts it).
  roundedClip(g, W, H, 26);
  drawParchment(g, W, H, parchment);

  if (face.kind === 'title') {
    g.fillStyle = INK;
    g.textAlign = 'center';
    g.font = '600 92px Caveat, cursive';
    g.fillText(face.title, W / 2, H * 0.44);
    g.font = '400 44px Caveat, cursive';
    g.globalAlpha = 0.75;
    g.fillText(face.subtitle, W / 2, H * 0.52);
  } else if (face.kind === 'item' && image) {
    if (face.item.type === 'photo') {
      g.filter = 'sepia(0.45) contrast(1.05)';
      g.globalAlpha = 0.94;
      drawCover(g, image, W, H);
      g.globalAlpha = 1;
      g.filter = 'none';
      // Re-stain the print so it belongs to the same rusty paper.
      if (parchment) {
        g.globalCompositeOperation = 'multiply';
        g.globalAlpha = 0.35;
        drawCover(g, parchment, W, H);
        g.globalAlpha = 1;
        g.globalCompositeOperation = 'source-over';
      }
    } else {
      // Ink and marker sit in the paper: multiply keeps the parchment showing through.
      g.globalCompositeOperation = 'multiply';
      g.filter = 'contrast(1.1) saturate(0.9)';
      drawCover(g, image, W, H);
      g.filter = 'none';
      g.globalCompositeOperation = 'source-over';
    }
    // Scorch the edges again on top of the art.
    const burn = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
    burn.addColorStop(0, 'rgba(80, 40, 15, 0)');
    burn.addColorStop(1, 'rgba(70, 35, 12, 0.45)');
    g.fillStyle = burn;
    g.fillRect(0, 0, W, H);
  }

  if (face.kind === 'item') {
    // Small handwritten tag in the corner instead of a caption block.
    const label = face.item.caption ?? '';
    g.font = '600 40px Caveat, cursive';
    const tw = g.measureText(label).width;
    const left = face.number % 2 === 0;
    const x = left ? W * 0.06 : W * 0.94 - tw - 28;
    g.fillStyle = 'rgba(236, 222, 190, 0.86)';
    g.fillRect(x, H * 0.9, tw + 28, 50);
    g.fillStyle = INK;
    g.textAlign = 'left';
    g.fillText(label, x + 14, H * 0.9 + 37);
  }
  g.restore();
}

function faceTexture(mirror) {
  const cv = document.createElement('canvas');
  cv.width = TEX.w;
  cv.height = TEX.h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (mirror) {
    // Back faces are seen from the other side once the sheet lies on the left.
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.x = -1;
    tex.offset.x = 1;
  }
  return { tex, g: cv.getContext('2d') };
}

/** Plane from the spine (x = 0) to the outer edge (x = w), lying flat, facing +Y. */
function sheetGeometry() {
  const geo = new THREE.PlaneGeometry(PAGE.w, PAGE.d, SEGMENTS, 1);
  geo.translate(PAGE.w / 2, 0, 0);
  geo.rotateX(-Math.PI / 2);
  geo.userData.rest = Float32Array.from(geo.attributes.position.array);
  return geo;
}

/** p = 0 lies on the right, p = 1 on the left; mid-turn the outer edge lags so the page curls. */
function bend(geo, p, y) {
  const rest = geo.userData.rest;
  const pos = geo.attributes.position;
  const theta = p * Math.PI;
  const lift = Math.sin(p * Math.PI);
  const curl = -0.9 * lift;
  for (let i = 0; i < pos.count; i++) {
    const u = rest[i * 3];
    const t = u / PAGE.w;
    // Outer edge lags (curl) and the free corner billows slightly toward the viewer.
    const a = theta + curl * t * t;
    const z = rest[i * 3 + 2];
    pos.setXYZ(i, u * Math.cos(a), y + u * Math.sin(a) + 0.012 * lift * t, z * (1 - 0.03 * lift * t));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

function makeSheet() {
  const geo = sheetGeometry();
  const front = faceTexture(false);
  const back = faceTexture(true);
  const mat = (map, side) => new THREE.MeshStandardMaterial({ map, roughness: 0.9, side, alphaTest: 0.5 });
  const frontMesh = new THREE.Mesh(geo, mat(front.tex, THREE.FrontSide));
  const backMesh = new THREE.Mesh(geo, mat(back.tex, THREE.BackSide));
  for (const m of [frontMesh, backMesh]) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  const group = new THREE.Group();
  group.add(frontMesh, backMesh);
  return { group, geo, front, back, materials: [frontMesh.material, backMesh.material], p: 0, restY: 0, turnedY: 0 };
}

const FAN = { max: 10, dx: 0.008, dz: -0.0055, dy: -0.0007 };

/**
 * Sheets beneath the visible spread, fanned outward so the book's thickness
 * and the next pages' art peek past the edge (as in the reference reel).
 */
function makeFan(side) {
  const layers = [];
  for (let k = 0; k < FAN.max; k++) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(PAGE.w, PAGE.d),
      new THREE.MeshStandardMaterial({ roughness: 0.92, alphaTest: 0.5, side: THREE.DoubleSide }),
    );
    mesh.rotation.x = -Math.PI / 2;
    // Left layers mirror so the outer edge of a left page stays outermost.
    mesh.scale.x = side;
    mesh.position.set(side * (PAGE.w / 2 + (k + 1) * FAN.dx), (k + 1) * FAN.dy, (k + 1) * FAN.dz);
    mesh.material.color.setScalar(1 - 0.05 * (k + 1));
    mesh.receiveShadow = true;
    mesh.visible = false;
    layers.push(mesh);
  }
  return layers;
}

function hitZone(x) {
  const zone = new THREE.Mesh(
    new THREE.PlaneGeometry(PAGE.w, PAGE.d),
    // Invisible but still raycastable: only the material is hidden.
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  zone.rotation.x = -Math.PI / 2;
  zone.position.set(x, 0.03, 0);
  return zone;
}

export function createSketchbookPages() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const group = new THREE.Group();
  group.position.y = BASE_Y;
  const hitLeft = hitZone(-PAGE.w / 2);
  const hitRight = hitZone(PAGE.w / 2);
  group.add(hitLeft, hitRight);
  const fanRight = makeFan(1);
  const fanLeft = makeFan(-1);
  group.add(...fanRight, ...fanLeft);

  let sheets = [];
  let spread = 0;
  let spreads = 1;
  let turning = false;

  /** Show the sheets under each side of the current spread with their own art. */
  function updateFan() {
    fanRight.forEach((mesh, k) => {
      const sheet = sheets[spread + 2 + k];
      mesh.visible = !!sheet;
      if (sheet) mesh.material.map = sheet.front.tex;
      mesh.material.needsUpdate = true;
    });
    fanLeft.forEach((mesh, k) => {
      const sheet = sheets[spread - 1 - k];
      mesh.visible = !!sheet;
      // Back textures are pre-mirrored for BackSide; the mirrored layer undoes it.
      if (sheet) mesh.material.map = sheet.back.tex;
      mesh.material.needsUpdate = true;
    });
  }

  const place = (sheet) => {
    bend(sheet.geo, sheet.p, THREE.MathUtils.lerp(sheet.restY, sheet.turnedY, sheet.p));
    // Darken a little as the page stands up and turns away from the lamp.
    const shade = 1 - 0.28 * Math.sin(sheet.p * Math.PI);
    for (const m of sheet.materials) m.color.setScalar(shade);
  };

  /** Lay out the gallery as spreads: a title page, then one item per page. */
  async function setContent(items, { title, subtitle }) {
    const faces = [{ kind: 'title', title, subtitle }];
    items.forEach((item, i) => faces.push({ kind: 'item', item, number: i + 1, tilt: ((i * 37) % 7 - 3) * 0.012 }));
    if (faces.length % 2) faces.push({ kind: 'blank' });
    spreads = faces.length / 2;

    for (const s of sheets) group.remove(s.group);
    // Base left (fixed turned), turnable sheets, base right (fixed unturned).
    sheets = Array.from({ length: spreads + 1 }, makeSheet);
    const turnable = spreads - 1;
    sheets.forEach((sheet, i) => {
      if (i === 0) {
        sheet.p = 1;
      } else if (i <= turnable) {
        sheet.restY = (spreads - i + 1) * EPS;
        sheet.turnedY = (i + 1) * EPS;
      }
      place(sheet);
      group.add(sheet.group);
    });
    spread = 0;
    updateFan();

    await globalThis.document?.fonts?.load?.('54px Caveat').catch(() => {});
    const [parchments, images] = await Promise.all([
      Promise.all(PARCHMENT.map(loadImage)),
      Promise.all(items.map((item) => loadImage(item.src))),
    ]);
    const imageFor = (face) => (face.kind === 'item' ? images[face.number - 1] : null);
    const paint = ({ tex, g }, face, k) => {
      drawFace(g, face, parchments[k % parchments.length], imageFor(face));
      tex.needsUpdate = true;
    };
    // Sheet i carries faces 2i-1 (front, right page) and 2i (back, left page).
    sheets.forEach((sheet, i) => {
      const frontFace = faces[2 * i - 1];
      const backFace = faces[2 * i];
      if (frontFace) paint(sheet.front, frontFace, 2 * i - 1);
      if (backFace) paint(sheet.back, backFace, 2 * i);
    });
  }

  /** Turn one page; resolves false at either end or mid-turn. */
  function turn(dir) {
    const next = spread + dir;
    if (turning || next < 0 || next >= spreads) return Promise.resolve(false);
    const sheet = sheets[dir > 0 ? spread + 1 : spread];
    spread = next;
    updateFan();
    const to = dir > 0 ? 1 : 0;
    if (reduced) {
      sheet.p = to;
      place(sheet);
      return Promise.resolve(true);
    }
    turning = true;
    return gsap.to(sheet, {
      p: to,
      duration: 0.9,
      ease: 'power2.inOut',
      onUpdate: () => place(sheet),
    }).then(() => {
      turning = false;
      return true;
    });
  }

  return {
    group,
    hitLeft,
    hitRight,
    setContent,
    turn,
    get spread() { return spread; },
    get spreads() { return spreads; },
  };
}
