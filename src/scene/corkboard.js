import * as THREE from 'three';
import gsap from 'gsap';
import { formatRange } from '../content/format.js';
import { LAYOUT, applyPose } from './layout.js';
import {
  BOARD,
  FEATURED_SLOTS,
  SET_PIECES,
  THREADS,
  buildDecor,
  pinPoint,
} from './corkboardLayout.js';

// Aged paper and faded ink for the investigation wall (palette from the art direction spec).
const PAPER = ['#efe4cc', '#e9dcc0', '#f4ecda', '#e3d4b5'];
const STICKY = ['#f2d98d', '#e9c46a', '#d9e2b8', '#f0c4a8'];
const INK = '#3b3a36';
const CLAY = '#cf6f4e';
const FRAME_COLOR = 0x7c5236;
const THREAD_COLOR = 0x6e3b2c;
const PX_PER_M = { featured: 2200, set: 900, decor: 900 };

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = Math.max(16, Math.round(w));
  cv.height = Math.max(16, Math.round(h));
  return [cv, cv.getContext('2d')];
}

function toTexture(cv) {
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function agePaper(g, W, H, color) {
  g.fillStyle = color;
  g.fillRect(0, 0, W, H);
  const edge = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
  edge.addColorStop(0, 'rgba(120, 90, 50, 0)');
  edge.addColorStop(1, 'rgba(120, 90, 50, 0.22)');
  g.fillStyle = edge;
  g.fillRect(0, 0, W, H);
}

/** Rows of word-shaped ink blocks: reads as typed or written text at a distance. */
function textBlocks(g, rnd, x, y, w, rowH, rows, color = INK, alpha = 0.55) {
  g.fillStyle = color;
  g.globalAlpha = alpha;
  for (let r = 0; r < rows; r++) {
    let cx = x;
    const end = x + w * (r === rows - 1 ? 0.3 + rnd() * 0.5 : 0.82 + rnd() * 0.18);
    while (cx < end) {
      const word = rowH * (1 + rnd() * 3.5);
      g.fillRect(cx, y + r * rowH * 1.9, Math.min(word, end - cx), rowH);
      cx += word + rowH * 0.8;
    }
  }
  g.globalAlpha = 1;
}

function wrapText(g, text, x, y, maxW, lineH, maxLines) {
  const words = String(text ?? '').split(/\s+/);
  let line = '';
  let lines = 0;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > maxW && line) {
      g.fillText(line, x, y + lines * lineH);
      line = word;
      if (++lines >= maxLines) return lines;
    } else {
      line = next;
    }
  }
  if (line) g.fillText(line, x, y + lines * lineH);
  return lines + 1;
}

const DRAW = {
  page(g, W, H, rnd, v) {
    agePaper(g, W, H, PAPER[v]);
    g.fillStyle = INK;
    g.globalAlpha = 0.75;
    g.fillRect(W * 0.1, H * 0.08, W * (0.35 + rnd() * 0.3), H * 0.035);
    g.globalAlpha = 1;
    textBlocks(g, rnd, W * 0.1, H * 0.18, W * 0.8, H * 0.018, 14);
    if (v % 2) {
      g.strokeStyle = INK;
      g.globalAlpha = 0.5;
      g.lineWidth = 2;
      g.strokeRect(W * 0.55, H * 0.62, W * 0.32, H * 0.22);
      g.globalAlpha = 1;
    }
  },
  sticky(g, W, H, rnd, v) {
    g.fillStyle = STICKY[v];
    g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(0, 0, 0, 0.06)';
    g.fillRect(0, 0, W, H * 0.16);
    g.strokeStyle = INK;
    g.globalAlpha = 0.6;
    g.lineWidth = Math.max(1.5, W * 0.025);
    for (let r = 0; r < 3; r++) {
      g.beginPath();
      const y = H * (0.36 + r * 0.18);
      g.moveTo(W * 0.14, y);
      for (let x = W * 0.14; x < W * (0.5 + rnd() * 0.35); x += W * 0.06) {
        g.lineTo(x, y + (rnd() - 0.5) * H * 0.05);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
  },
  photo(g, W, H, rnd, v) {
    g.fillStyle = '#f3ecdc';
    g.fillRect(0, 0, W, H);
    const b = Math.min(W, H) * 0.07;
    const sky = g.createLinearGradient(0, b, 0, H - b);
    sky.addColorStop(0, ['#8a7860', '#6f6a5c', '#9b8466', '#5f5a50'][v]);
    sky.addColorStop(1, '#2e2a24');
    g.fillStyle = sky;
    g.fillRect(b, b, W - b * 2, H - b * 2);
    g.fillStyle = 'rgba(30, 26, 20, 0.85)';
    // Rooftops / figures silhouette along the bottom.
    for (let x = b; x < W - b; x += W * 0.08) {
      const h = H * (0.15 + rnd() * 0.35);
      g.fillRect(x, H - b - h, W * (0.05 + rnd() * 0.05), h);
    }
    g.fillStyle = 'rgba(242, 220, 170, 0.75)';
    g.beginPath();
    g.arc(b + rnd() * (W - b * 2), b + H * 0.22, Math.min(W, H) * 0.07, 0, Math.PI * 2);
    g.fill();
  },
  index(g, W, H, rnd, v) {
    agePaper(g, W, H, '#f5efe0');
    g.fillStyle = 'rgba(190, 70, 60, 0.6)';
    g.fillRect(0, H * 0.2, W, Math.max(1, H * 0.015));
    g.fillStyle = 'rgba(80, 110, 150, 0.35)';
    for (let y = H * 0.34; y < H; y += H * 0.13) g.fillRect(0, y, W, Math.max(1, H * 0.01));
    textBlocks(g, rnd, W * 0.08, H * 0.06, W * 0.7, H * 0.06, 1, INK, 0.7);
    textBlocks(g, rnd, W * 0.08, H * 0.27, W * 0.85, H * 0.045, 3 + v % 2, INK, 0.45);
  },
  clipping(g, W, H, rnd, v) {
    agePaper(g, W, H, ['#ddd2bc', '#e4dbc8', '#d6caae', '#e8e0cc'][v]);
    g.fillStyle = INK;
    g.globalAlpha = 0.85;
    g.fillRect(W * 0.08, H * 0.06, W * 0.84, H * 0.09);
    g.globalAlpha = 1;
    const cols = 2;
    for (let c = 0; c < cols; c++) {
      textBlocks(g, rnd, W * (0.08 + c * 0.44), H * 0.22, W * 0.38, H * 0.013, 22, INK, 0.4);
    }
  },
  receipt(g, W, H, rnd) {
    agePaper(g, W, H, '#f6f1e6');
    textBlocks(g, rnd, W * 0.12, H * 0.05, W * 0.76, H * 0.012, 28, INK, 0.45);
  },
  poster(g, W, H, rnd) {
    agePaper(g, W, H, '#f1e8d2');
    g.strokeStyle = INK;
    g.lineWidth = W * 0.006;
    g.strokeRect(W * 0.04, H * 0.06, W * 0.92, H * 0.88);
    g.fillStyle = INK;
    g.textAlign = 'center';
    g.font = `600 ${Math.round(H * 0.16)}px Newsreader, Georgia, serif`;
    g.fillText('WORK LOG', W / 2, H * 0.3);
    g.font = `700 ${Math.round(H * 0.06)}px "Space Mono", monospace`;
    g.fillStyle = CLAY;
    g.fillText('— PINNED & CURRENT —', W / 2, H * 0.43);
    g.textAlign = 'start';
    textBlocks(g, rnd, W * 0.14, H * 0.55, W * 0.72, H * 0.03, 6, INK, 0.5);
  },
  map(g, W, H, rnd) {
    agePaper(g, W, H, '#e6dcc3');
    g.strokeStyle = 'rgba(80, 100, 90, 0.5)';
    g.lineWidth = W * 0.004;
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.moveTo(rnd() * W, 0);
      g.bezierCurveTo(rnd() * W, H * 0.3, rnd() * W, H * 0.7, rnd() * W, H);
      g.stroke();
    }
    g.fillStyle = 'rgba(120, 100, 70, 0.25)';
    for (let i = 0; i < 14; i++) g.fillRect(rnd() * W, rnd() * H, W * 0.06, H * 0.05);
    g.strokeStyle = CLAY;
    g.setLineDash?.([W * 0.015, W * 0.012]);
    g.lineWidth = W * 0.006;
    g.beginPath();
    g.moveTo(W * 0.1, H * 0.8);
    g.bezierCurveTo(W * 0.35, H * 0.2, W * 0.6, H * 0.9, W * 0.88, H * 0.3);
    g.stroke();
    g.setLineDash?.([]);
  },
  calendar(g, W, H, rnd) {
    agePaper(g, W, H, '#f3ecdc');
    g.fillStyle = INK;
    g.globalAlpha = 0.8;
    g.fillRect(0, 0, W, H * 0.16);
    g.globalAlpha = 1;
    g.strokeStyle = 'rgba(59, 58, 54, 0.45)';
    g.lineWidth = Math.max(1, W * 0.004);
    const cw = W / 7;
    const ch = (H * 0.84) / 5;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 7; c++) g.strokeRect(c * cw, H * 0.16 + r * ch, cw, ch);
    }
    g.strokeStyle = CLAY;
    g.lineWidth = W * 0.008;
    for (let i = 0; i < 3; i++) {
      const c = Math.floor(rnd() * 7);
      const r = Math.floor(rnd() * 5);
      g.beginPath();
      g.arc((c + 0.5) * cw, H * 0.16 + (r + 0.5) * ch, Math.min(cw, ch) * 0.38, 0, Math.PI * 2);
      g.stroke();
    }
  },
};

/** Featured sheet: a typed case file for one experience entry. */
function drawFeatured(g, W, H, entry, index) {
  const rnd = rng(index + 11);
  agePaper(g, W, H, PAPER[index % PAPER.length]);
  const pad = W * 0.09;
  g.fillStyle = CLAY;
  g.font = `700 ${Math.round(W * 0.045)}px "Space Mono", monospace`;
  g.fillText(`FILE ${String(index + 1).padStart(2, '0')}`, pad, H * 0.09);
  g.textAlign = 'right';
  g.fillStyle = INK;
  if (entry) g.fillText(formatRange(entry).toUpperCase(), W - pad, H * 0.09);
  g.textAlign = 'start';
  g.fillRect(pad, H * 0.115, W - pad * 2, Math.max(2, H * 0.004));
  if (!entry) {
    textBlocks(g, rnd, pad, H * 0.2, W - pad * 2, H * 0.02, 16);
    return;
  }
  g.fillStyle = INK;
  g.font = `600 ${Math.round(W * 0.085)}px Newsreader, Georgia, serif`;
  const orgLines = wrapText(g, entry.org, pad, H * 0.22, W - pad * 2, W * 0.09, 2);
  let y = H * 0.22 + orgLines * W * 0.09;
  g.font = `italic 400 ${Math.round(W * 0.06)}px Newsreader, Georgia, serif`;
  g.fillStyle = '#5a4a3a';
  wrapText(g, entry.title, pad, y + W * 0.01, W - pad * 2, W * 0.07, 2);
  y += W * 0.16;
  g.fillStyle = INK;
  g.font = `400 ${Math.round(W * 0.048)}px Newsreader, Georgia, serif`;
  const sumLines = wrapText(g, entry.summary, pad, y, W - pad * 2, W * 0.064, 4);
  y += sumLines * W * 0.064 + W * 0.05;
  textBlocks(g, rnd, pad, y, W - pad * 2, H * 0.014, Math.max(2, Math.floor((H * 0.86 - y) / (H * 0.027))), INK, 0.35);
  g.fillStyle = CLAY;
  g.font = `700 ${Math.round(W * 0.036)}px "Space Mono", monospace`;
  g.fillText((entry.tags ?? []).join(' · ').toUpperCase(), pad, H * 0.93);
}

function sheetMesh(sheet, map, z) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(sheet.w, sheet.h),
    new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0, emissive: 0xf2aa4c, emissiveIntensity: 0 }),
  );
  mesh.position.set(sheet.x, sheet.y, z);
  mesh.rotation.z = THREE.MathUtils.degToRad(sheet.rot);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function drawSheet(sheet, pxPerM) {
  const [cv, g] = makeCanvas(sheet.w * pxPerM, sheet.h * pxPerM);
  DRAW[sheet.kind](g, cv.width, cv.height, rng(sheet.seed ?? sheet.id.length * 97), sheet.variant ?? 0);
  return toTexture(cv);
}

function pin(color, radius, x, y, z) {
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 12, 8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2 }),
  );
  head.position.set(x, y, z);
  head.castShadow = true;
  return head;
}

function tape(x, y, z, rot) {
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(0.05, 0.016),
    new THREE.MeshStandardMaterial({ color: 0xece3cc, roughness: 0.6, transparent: true, opacity: 0.72 }),
  );
  strip.position.set(x, y, z);
  strip.rotation.z = rot;
  return strip;
}

function corkTexture() {
  const [cv, g] = makeCanvas(1024, 390);
  const rnd = rng(3);
  g.fillStyle = '#a47b52'; // cork
  g.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < 5200; i++) {
    const shade = rnd() < 0.5 ? 'rgba(60, 38, 18, 0.28)' : 'rgba(220, 180, 130, 0.22)';
    g.fillStyle = shade;
    g.fillRect(rnd() * cv.width, rnd() * cv.height, 1 + rnd() * 3, 1 + rnd() * 2);
  }
  return toTexture(cv);
}

export function createCorkboard() {
  const group = new THREE.Group();
  const reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(BOARD.width, BOARD.height, 0.04),
    new THREE.MeshStandardMaterial({ map: corkTexture(), roughness: 0.95, metalness: 0 }),
  );
  board.name = 'cork';
  board.receiveShadow = true;
  group.add(board);

  const frameMat = new THREE.MeshStandardMaterial({ color: FRAME_COLOR, roughness: 0.7, metalness: 0 });
  const fw = 0.05;
  for (const [w, h, x, y] of [
    [BOARD.width + fw * 2, fw, 0, BOARD.height / 2 + fw / 2],
    [BOARD.width + fw * 2, fw, 0, -BOARD.height / 2 - fw / 2],
    [fw, BOARD.height, -BOARD.width / 2 - fw / 2, 0],
    [fw, BOARD.height, BOARD.width / 2 + fw / 2, 0],
  ]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), frameMat);
    bar.position.set(x, y, 0.01);
    bar.name = 'boardFrame';
    bar.castShadow = true;
    bar.receiveShadow = true;
    group.add(bar);
  }

  // Back layer: map and calendar; then the collage; poster and featured on top.
  const FACE = 0.0205;
  let z = FACE;
  // ~0.15mm per layer keeps the whole collage within ~1.5cm of the cork.
  const step = 0.00015;
  const decor = buildDecor();
  const sheets = [];
  const add = (sheet, map, layerZ) => {
    const mesh = sheetMesh(sheet, map, layerZ);
    mesh.userData.sheet = sheet.id;
    group.add(mesh);
    sheets.push(mesh);
    return mesh;
  };

  for (const piece of SET_PIECES.slice(1)) add(piece, drawSheet(piece, PX_PER_M.set), (z += step));
  for (const sheet of decor) {
    add(sheet, drawSheet(sheet, PX_PER_M.decor), (z += step));
    const rnd = rng(sheet.seed);
    const top = sheet.y + sheet.h / 2 - 0.012;
    const style = rnd();
    if (style < 0.45) {
      group.add(pin([0xcf6f4e, 0xf2aa4c, 0x86a392, 0xe8e0cc][Math.floor(rnd() * 4)], 0.006, sheet.x, top, z + 0.004));
    } else if (style < 0.75) {
      group.add(tape(sheet.x, top + 0.004, z + 0.0005, (rnd() - 0.5) * 0.3));
    }
  }
  add(SET_PIECES[0], drawSheet(SET_PIECES[0], PX_PER_M.set), (z += step));
  const posterPin = pinPoint('poster');
  group.add(pin(0xcf6f4e, 0.011, posterPin.x, posterPin.y, z + 0.008));

  // Featured slots get real content in setFeatured(); blank case files until then.
  const featured = FEATURED_SLOTS.map((slot, i) => {
    const [cv, g] = makeCanvas(slot.w * PX_PER_M.featured, slot.h * PX_PER_M.featured);
    drawFeatured(g, cv.width, cv.height, null, i);
    const mesh = add({ ...slot, id: `f${i}` }, toTexture(cv), (z += step * 4));
    mesh.userData.slot = i;
    mesh.userData.baseZ = mesh.position.z;
    mesh.userData.canvas = [cv, g];
    const p = pinPoint(`f${i}`);
    group.add(pin(0xcf6f4e, 0.012, p.x, p.y, mesh.position.z + 0.008));
    return mesh;
  });

  // A handful of threads only — the reference wall is mostly paper, not string.
  const threadMat = new THREE.LineBasicMaterial({ color: THREAD_COLOR, transparent: true, opacity: 0.85 });
  for (const [a, b] of THREADS) {
    const pa = pinPoint(a);
    const pb = pinPoint(b);
    const sag = 0.03 + Math.abs(pb.x - pa.x) * 0.03;
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(pa.x, pa.y, FACE + 0.016),
      new THREE.Vector3((pa.x + pb.x) / 2, Math.min(pa.y, pb.y) - sag, FACE + 0.02),
      new THREE.Vector3(pb.x, pb.y, FACE + 0.016),
    );
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(20)), threadMat);
    line.name = 'thread';
    group.add(line);
  }

  applyPose(group, LAYOUT.corkboard);

  let entries = [];
  function paintFeatured() {
    featured.forEach((mesh, i) => {
      const [cv, g] = mesh.userData.canvas;
      g.clearRect?.(0, 0, cv.width, cv.height);
      drawFeatured(g, cv.width, cv.height, entries[i], i);
      mesh.material.map.needsUpdate = true;
      mesh.userData.experienceId = entries[i]?.id ?? null;
    });
  }

  /** Print the most recent entries onto the pinned sheets (redrawn once web fonts load). */
  function setFeatured(list) {
    entries = list.slice(0, FEATURED_SLOTS.length);
    paintFeatured();
    globalThis.document?.fonts?.ready?.then(paintFeatured);
  }

  let hoveredId = null;
  /** Lift and warm the hovered pinned sheet so it reads as clickable. */
  function setHovered(id) {
    if (id === hoveredId) return;
    hoveredId = id;
    for (const mesh of featured) {
      const on = !!id && mesh.userData.experienceId === id;
      const to = { z: mesh.userData.baseZ + (on ? 0.03 : 0) };
      const glow = { emissiveIntensity: on ? 0.07 : 0 };
      if (reduced) {
        mesh.position.z = to.z;
        mesh.material.emissiveIntensity = glow.emissiveIntensity;
      } else {
        gsap.to(mesh.position, { ...to, duration: 0.35, ease: 'expo.out' });
        gsap.to(mesh.material, { ...glow, duration: 0.35, ease: 'power2.out' });
      }
    }
  }

  /** World-space center of a pinned sheet, for camera framing. */
  function sheetWorldPosition(id) {
    const mesh = featured.find((m) => m.userData.experienceId === id);
    return mesh ? mesh.getWorldPosition(new THREE.Vector3()) : null;
  }

  return {
    group,
    id: 'experience',
    label: 'the board',
    // Wall-mounted: cursor only, no silhouette outline
    skipHoverVisual: true,
    featured,
    sheets,
    setFeatured,
    setHovered,
    sheetWorldPosition,
  };
}
