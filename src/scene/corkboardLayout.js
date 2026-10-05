/**
 * Investigation-wall collage in board-local meters (origin at the board center, Y up).
 * Deterministic: the same seed always yields the same wall.
 * See docs/superpowers/specs/2026-10-06-investigation-board-design.md.
 */

export const BOARD = { width: 2.5, height: 0.95 };

/** Four pinned experience sheets, filled from the most recent content entries. */
export const FEATURED_SLOTS = [
  { x: -0.8, y: 0.12, w: 0.23, h: 0.29, rot: -2.5 },
  { x: -0.34, y: -0.13, w: 0.23, h: 0.29, rot: 1.5 },
  { x: 0.42, y: 0.07, w: 0.23, h: 0.29, rot: -1 },
  { x: 0.88, y: -0.11, w: 0.23, h: 0.29, rot: 2.5 },
];

/** Large set pieces, like the reference wall's "master plan", map, and calendar. */
export const SET_PIECES = [
  { id: 'poster', kind: 'poster', x: 0.02, y: 0.28, w: 0.36, h: 0.22, rot: 0.6 },
  { id: 'map', kind: 'map', x: 0.06, y: -0.23, w: 0.42, h: 0.3, rot: -0.6 },
  { id: 'calendar', kind: 'calendar', x: -0.36, y: 0.27, w: 0.22, h: 0.16, rot: 1.2 },
];

/** Only a handful of threads, from pin to pin (`f<n>` = featured slot n). */
export const THREADS = [
  ['poster', 'f0'],
  ['poster', 'f2'],
  ['f0', 'f1'],
  ['f2', 'f3'],
  ['f1', 'map'],
];

const DECOR_KINDS = [
  ['page', 0.3],
  ['sticky', 0.12],
  ['photo', 0.2],
  ['index', 0.14],
  ['clipping', 0.15],
  ['receipt', 0.09],
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function overlapArea(a, b) {
  const ox = Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2);
  const oy = Math.min(a.y + a.h / 2, b.y + b.h / 2) - Math.max(a.y - a.h / 2, b.y - b.h / 2);
  return ox > 0 && oy > 0 ? ox * oy : 0;
}

function sizeFor(kind, rnd) {
  switch (kind) {
    case 'page': { const w = 0.13 + rnd() * 0.04; return { w, h: w * 1.3 }; }
    case 'photo': return rnd() < 0.6 ? { w: 0.13, h: 0.095 } : { w: 0.095, h: 0.13 };
    case 'index': return { w: 0.13, h: 0.08 };
    case 'clipping': return { w: 0.1 + rnd() * 0.04, h: 0.13 + rnd() * 0.05 };
    case 'receipt': return { w: 0.05, h: 0.16 + rnd() * 0.04 };
    default: return { w: 0.065, h: 0.065 };
  }
}

function pickKind(rnd) {
  let r = rnd();
  for (const [kind, weight] of DECOR_KINDS) {
    if ((r -= weight) <= 0) return kind;
  }
  return 'page';
}

/**
 * Decorative sheets placed by rejection sampling. They may overlap each other
 * (it is a collage) but never cover a featured sheet or the poster.
 */
export function buildDecor({ seed = 7, attempts = 1400, max = 84 } = {}) {
  const rnd = mulberry32(seed);
  const protectedRects = [
    ...FEATURED_SLOTS.map((s) => ({ ...s, w: s.w + 0.02, h: s.h + 0.02 })),
    { ...SET_PIECES[0], w: SET_PIECES[0].w + 0.02, h: SET_PIECES[0].h + 0.02 },
  ];
  const placed = [];
  const margin = 0.04;

  const tryPlace = (sheet) => {
    const inside = Math.abs(sheet.x) + sheet.w / 2 < BOARD.width / 2 - margin
      && Math.abs(sheet.y) + sheet.h / 2 < BOARD.height / 2 - margin;
    if (!inside) return false;
    if (protectedRects.some((p) => overlapArea(sheet, p) > 0)) return false;
    const area = sheet.w * sheet.h;
    if (placed.some((p) => overlapArea(sheet, p) > area * 0.45)) return false;
    placed.push(sheet);
    return true;
  };

  for (let i = 0; i < attempts && placed.length < max; i++) {
    const kind = pickKind(rnd);
    const x = (rnd() - 0.5) * BOARD.width;
    const y = (rnd() - 0.5) * BOARD.height;
    const rot = (rnd() - 0.5) * 9;
    if (kind === 'sticky') {
      // Stickies come in small clusters, like the reference wall.
      const count = 2 + Math.floor(rnd() * 3);
      for (let k = 0; k < count && placed.length < max; k++) {
        tryPlace({
          id: `d${placed.length}`, kind, variant: Math.floor(rnd() * 4),
          x: x + (k % 2) * 0.072 + (rnd() - 0.5) * 0.01,
          y: y - Math.floor(k / 2) * 0.072 + (rnd() - 0.5) * 0.01,
          w: 0.065, h: 0.065, rot: (rnd() - 0.5) * 8, seed: Math.floor(rnd() * 1e9),
        });
      }
      continue;
    }
    tryPlace({
      id: `d${placed.length}`, kind, variant: Math.floor(rnd() * 4),
      x, y, ...sizeFor(kind, rnd), rot, seed: Math.floor(rnd() * 1e9),
    });
  }
  return placed;
}

/** Pin point (top-center) of a featured slot or set piece, in board-local meters. */
export function pinPoint(key) {
  const sheet = key.startsWith('f')
    ? FEATURED_SLOTS[Number(key.slice(1))]
    : SET_PIECES.find((s) => s.id === key);
  if (!sheet) return null;
  return { x: sheet.x, y: sheet.y + sheet.h / 2 - 0.02 };
}
