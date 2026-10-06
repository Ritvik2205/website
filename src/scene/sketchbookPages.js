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

function drawFace(g, face, parchment, image) {
  const { w: W, h: H } = TEX;
  g.save();
  drawParchment(g, W, H, parchment);
  g.fillStyle = INK;
  g.textAlign = 'center';

  if (face.kind === 'title') {
    g.font = '600 92px Caveat, cursive';
    g.fillText(face.title, W / 2, H * 0.42);
    g.font = '400 44px Caveat, cursive';
    g.globalAlpha = 0.75;
    g.fillText(face.subtitle, W / 2, H * 0.5);
  } else if (face.kind === 'item') {
    const box = { x: W * 0.12, y: H * 0.1, w: W * 0.76, h: H * 0.62 };
    if (image) {
      const s = Math.min(box.w / image.width, box.h / image.height);
      const iw = image.width * s;
      const ih = image.height * s;
      const ix = box.x + (box.w - iw) / 2;
      const iy = box.y + (box.h - ih) / 2;
      if (face.item.type === 'photo') {
        // A sepia print taped onto the page.
        g.translate(W / 2, iy + ih / 2);
        g.rotate(face.tilt);
        g.translate(-W / 2, -(iy + ih / 2));
        g.fillStyle = '#efe4cc';
        g.fillRect(ix - 14, iy - 14, iw + 28, ih + 46);
        g.filter = 'sepia(0.6) contrast(1.05) brightness(0.92)';
        g.drawImage(image, ix, iy, iw, ih);
        g.filter = 'none';
        g.fillStyle = 'rgba(236, 226, 200, 0.75)';
        g.fillRect(ix + iw * 0.4, iy - 28, iw * 0.22, 30);
        g.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        // Sketches read as drawn into the paper: multiply + sepia ink.
        g.globalCompositeOperation = 'multiply';
        g.filter = 'sepia(0.85) contrast(1.15)';
        g.drawImage(image, ix, iy, iw, ih);
        g.filter = 'none';
        g.globalCompositeOperation = 'source-over';
      }
    }
    g.fillStyle = INK;
    g.font = '600 54px Caveat, cursive';
    g.fillText(face.item.caption ?? '', W / 2, H * 0.84);
  }

  if (face.number) {
    g.globalAlpha = 0.6;
    g.font = '700 22px "Space Mono", monospace';
    g.textAlign = face.number % 2 ? 'right' : 'left';
    g.fillText(String(face.number), face.number % 2 ? W * 0.9 : W * 0.1, H * 0.95);
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
  const curl = -0.55 * Math.sin(p * Math.PI);
  for (let i = 0; i < pos.count; i++) {
    const u = rest[i * 3];
    const a = theta + curl * (u / PAGE.w);
    pos.setXYZ(i, u * Math.cos(a), y + u * Math.sin(a), rest[i * 3 + 2]);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

function makeSheet() {
  const geo = sheetGeometry();
  const front = faceTexture(false);
  const back = faceTexture(true);
  const frontMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: front.tex, roughness: 0.9, side: THREE.FrontSide }));
  const backMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: back.tex, roughness: 0.9, side: THREE.BackSide }));
  for (const m of [frontMesh, backMesh]) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  const group = new THREE.Group();
  group.add(frontMesh, backMesh);
  return { group, geo, front, back, p: 0, restY: 0, turnedY: 0 };
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

  let sheets = [];
  let spread = 0;
  let spreads = 1;
  let turning = false;

  const place = (sheet) => bend(sheet.geo, sheet.p, THREE.MathUtils.lerp(sheet.restY, sheet.turnedY, sheet.p));

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
