/**
 * Shared corkboard composition — percentage coords (0–100) on the board face.
 * Used by the 3D scene and the DOM overlay so the open view matches the default board.
 */

/** Decorative polaroids / scraps (not clickable). */
export const CORK_FILLERS = [
  { id: 'f01', kind: 'polaroid', left: 4, top: 6, w: 11, h: 14, rot: -6 },
  { id: 'f02', kind: 'polaroid', left: 14, top: 3, w: 13, h: 16, rot: 3 },
  { id: 'f03', kind: 'polaroid', left: 28, top: 5, w: 10, h: 13, rot: -2 },
  { id: 'f04', kind: 'scrap', left: 38, top: 4, w: 7, h: 8, rot: 8 },
  { id: 'f05', kind: 'polaroid', left: 46, top: 2, w: 12, h: 15, rot: -4 },
  { id: 'f06', kind: 'polaroid', left: 58, top: 6, w: 10, h: 12, rot: 5 },
  { id: 'f07', kind: 'polaroid', left: 70, top: 3, w: 14, h: 17, rot: -3 },
  { id: 'f08', kind: 'scrap', left: 84, top: 5, w: 6, h: 7, rot: -9 },
  { id: 'f09', kind: 'polaroid', left: 88, top: 10, w: 9, h: 12, rot: 4 },
  { id: 'f10', kind: 'polaroid', left: 2, top: 24, w: 12, h: 15, rot: 2 },
  { id: 'f11', kind: 'scrap', left: 16, top: 22, w: 5, h: 6, rot: -5 },
  { id: 'f12', kind: 'polaroid', left: 22, top: 28, w: 11, h: 14, rot: -7 },
  { id: 'f13', kind: 'polaroid', left: 36, top: 20, w: 9, h: 11, rot: 6 },
  { id: 'f14', kind: 'polaroid', left: 48, top: 24, w: 13, h: 16, rot: -2 },
  { id: 'f15', kind: 'scrap', left: 62, top: 22, w: 6, h: 7, rot: 11 },
  { id: 'f16', kind: 'polaroid', left: 70, top: 26, w: 10, h: 13, rot: 3 },
  { id: 'f17', kind: 'polaroid', left: 82, top: 28, w: 12, h: 14, rot: -5 },
  { id: 'f18', kind: 'polaroid', left: 6, top: 46, w: 10, h: 12, rot: 4 },
  { id: 'f19', kind: 'polaroid', left: 18, top: 48, w: 14, h: 17, rot: -3 },
  { id: 'f20', kind: 'scrap', left: 34, top: 44, w: 5, h: 6, rot: -8 },
  { id: 'f21', kind: 'polaroid', left: 42, top: 50, w: 11, h: 13, rot: 5 },
  { id: 'f22', kind: 'polaroid', left: 56, top: 46, w: 9, h: 12, rot: -6 },
  { id: 'f23', kind: 'polaroid', left: 68, top: 50, w: 12, h: 15, rot: 2 },
  { id: 'f24', kind: 'scrap', left: 82, top: 48, w: 7, h: 8, rot: 7 },
  { id: 'f25', kind: 'polaroid', left: 90, top: 52, w: 8, h: 11, rot: -4 },
  { id: 'f26', kind: 'polaroid', left: 3, top: 68, w: 11, h: 14, rot: -2 },
  { id: 'f27', kind: 'polaroid', left: 16, top: 72, w: 9, h: 12, rot: 6 },
  { id: 'f28', kind: 'scrap', left: 28, top: 70, w: 6, h: 7, rot: -10 },
  { id: 'f29', kind: 'polaroid', left: 36, top: 74, w: 13, h: 15, rot: 3 },
  { id: 'f30', kind: 'polaroid', left: 52, top: 70, w: 10, h: 13, rot: -5 },
  { id: 'f31', kind: 'polaroid', left: 64, top: 74, w: 12, h: 14, rot: 4 },
  { id: 'f32', kind: 'scrap', left: 78, top: 72, w: 5, h: 6, rot: 9 },
  { id: 'f33', kind: 'polaroid', left: 86, top: 68, w: 11, h: 14, rot: -3 },
];

/**
 * Clickable experience notes — same visual language as fillers, keyed by content id.
 * Positions chosen among denser clusters so they read as part of the board.
 */
export const CORK_INTERACTIVE = [
  { id: 'internship', kind: 'ruled', left: 8, top: 18, w: 14, h: 16, rot: -3 },
  { id: 'cmu', kind: 'sticky', left: 32, top: 14, w: 12, h: 14, rot: 2 },
  { id: 'hackathon', kind: 'ruled', left: 54, top: 18, w: 13, h: 15, rot: -2 },
  { id: 'trading', kind: 'ruled', left: 76, top: 16, w: 14, h: 16, rot: 3 },
  { id: 'photo-note', kind: 'polaroid', left: 24, top: 58, w: 13, h: 18, rot: -4 },
  { id: 'misc', kind: 'sticky', left: 58, top: 60, w: 12, h: 13, rot: 4 },
];

/** Extra pin nodes (percent) that only exist to densify the red-string web. */
export const CORK_PIN_NODES = [
  { id: 'p1', left: 20, top: 12 },
  { id: 'p2', left: 42, top: 10 },
  { id: 'p3', left: 66, top: 14 },
  { id: 'p4', left: 12, top: 36 },
  { id: 'p5', left: 50, top: 38 },
  { id: 'p6', left: 78, top: 40 },
  { id: 'p7', left: 30, top: 56 },
  { id: 'p8', left: 70, top: 58 },
  { id: 'p9', left: 44, top: 78 },
  { id: 'p10', left: 88, top: 36 },
  { id: 'p11', left: 6, top: 58 },
  { id: 'p12', left: 94, top: 74 },
];

/**
 * Dense string web as pairs of node keys.
 * Keys: `i:<experienceId>`, `f:<fillerId>`, or `p:<pinId>`.
 */
export const CORK_STRINGS = [
  ['i:internship', 'i:cmu'],
  ['i:cmu', 'i:hackathon'],
  ['i:hackathon', 'i:trading'],
  ['i:trading', 'i:internship'],
  ['i:photo-note', 'i:misc'],
  ['i:misc', 'i:cmu'],
  ['i:internship', 'p:p1'],
  ['i:cmu', 'p:p2'],
  ['i:hackathon', 'p:p3'],
  ['i:trading', 'p:p6'],
  ['i:photo-note', 'p:p7'],
  ['i:misc', 'p:p8'],
  ['p:p1', 'p:p4'],
  ['p:p4', 'p:p5'],
  ['p:p5', 'p:p3'],
  ['p:p2', 'p:p5'],
  ['p:p5', 'p:p6'],
  ['p:p6', 'p:p10'],
  ['p:p7', 'p:p9'],
  ['p:p8', 'p:p9'],
  ['p:p9', 'p:p12'],
  ['p:p11', 'p:p7'],
  ['p:p11', 'i:internship'],
  ['p:p4', 'f:f12'],
  ['p:p5', 'f:f14'],
  ['p:p6', 'f:f17'],
  ['p:p2', 'f:f05'],
  ['p:p3', 'f:f07'],
  ['p:p8', 'f:f23'],
  ['p:p9', 'f:f29'],
  ['f:f01', 'f:f10'],
  ['f:f10', 'f:f19'],
  ['f:f19', 'f:f26'],
  ['f:f07', 'f:f16'],
  ['f:f16', 'f:f23'],
  ['f:f23', 'f:f33'],
  ['f:f14', 'f:f21'],
  ['f:f21', 'f:f30'],
  ['f:f02', 'p:p1'],
  ['f:f17', 'p:p10'],
  ['f:f33', 'p:p12'],
  ['i:trading', 'f:f09'],
  ['i:photo-note', 'f:f19'],
  ['i:misc', 'f:f31'],
];

export const BOARD_WORLD = { width: 2.7, height: 1.3 };

/** Convert percent layout point to local board XY (origin center, Y up). */
export function percentToBoardXY(left, top) {
  const x = ((left / 100) - 0.5) * BOARD_WORLD.width;
  const y = (0.5 - (top / 100)) * BOARD_WORLD.height;
  return { x, y };
}

export function percentSizeToWorld(w, h) {
  return {
    w: (w / 100) * BOARD_WORLD.width,
    h: (h / 100) * BOARD_WORLD.height,
  };
}

/** Resolve a string endpoint key to percent position. */
export function resolveNodePercent(key) {
  const [kind, id] = key.split(':');
  if (kind === 'i') {
    const n = CORK_INTERACTIVE.find((item) => item.id === id);
    return n ? { left: n.left + n.w / 2, top: n.top + 4 } : null;
  }
  if (kind === 'f') {
    const n = CORK_FILLERS.find((item) => item.id === id);
    return n ? { left: n.left + n.w / 2, top: n.top + 3 } : null;
  }
  if (kind === 'p') {
    const n = CORK_PIN_NODES.find((item) => item.id === id);
    return n ? { left: n.left, top: n.top } : null;
  }
  return null;
}
