// Top face of deskTop mesh (center 0.42, height 0.04 → surface at 0.44)
const DESK_Y = 0.44;

/**
 * Desk composition. Back row against the wall (vinyl, papers, lamp), working
 * row in the middle (books, laptop), and a front row of open things
 * (journal, sketchbook, tea). Usable X stays within ±1.15 so nothing crops
 * at 16:10. Scales keep props true to each other: a ~9cm teacup, an A5
 * journal, a laptop a little narrower than the turntable.
 */
export const LAYOUT = {
  deskY: DESK_Y,
  // Board hangs just above the desk's back edge so the desk sits in front of it.
  corkboard: {
    position: [0, 0.98, -1.17],
    rotation: [0, 0, 0],
    scale: 1.0,
  },
  pendant: {
    position: [0, 1.62, -0.92],
    rotation: [0, 0, 0],
    scale: 1.0,
  },
  vinyl: {
    position: [-0.52, DESK_Y, -0.82],
    rotation: [0, 0.1, 0],
    scale: 0.9,
  },
  journal: {
    position: [-0.42, DESK_Y, -0.34],
    rotation: [0, 0.22, 0],
    scale: 0.8,
  },
  sketchbook: {
    position: [0.04, DESK_Y, -0.36],
    rotation: [0, -0.06, 0],
    scale: 0.9,
  },
  laptop: {
    position: [0.6, DESK_Y, -0.62],
    rotation: [0, -0.28, 0],
    scale: 1.05,
  },
  lamp: {
    position: [1.02, DESK_Y, -0.86],
    rotation: [0, -0.35, 0],
    scale: 1.0,
  },
  teaCup: {
    position: [0.98, DESK_Y, -0.4],
    rotation: [0, -0.3, 0],
    scale: 0.68,
  },
  fillers: {
    books: { position: [-0.98, DESK_Y, -0.55], rotation: [0, 0.32, 0], scale: 0.9 },
    papers: { position: [0.06, DESK_Y + 0.002, -0.82], rotation: [0, -0.12, 0], scale: 1.0 },
    plant: { position: [-1.02, DESK_Y, -0.92], rotation: [0, 0.3, 0], scale: 1.15 },
    penCup: { position: [0.3, DESK_Y, -0.8], rotation: [0, 0.08, 0], scale: 0.9 },
  },
};

/** Fly-in framing for a desk object: above and in front, looking slightly down at it. */
function deskAnchor([x, , z], { lift = 0.36, back = 0.52, lookY = 0.08 } = {}) {
  return {
    position: { x, y: DESK_Y + lift, z: z + back },
    lookAt: { x, y: DESK_Y + lookY, z },
  };
}

export const CAMERA_ANCHORS = {
  projects: deskAnchor(LAYOUT.laptop.position, { lift: 0.3, back: 0.6, lookY: 0.14 }),
  gallery: deskAnchor(LAYOUT.sketchbook.position, { lift: 0.48, back: 0.36, lookY: 0 }),
  blog: deskAnchor(LAYOUT.journal.position, { lift: 0.42, back: 0.36, lookY: 0 }),
  music: deskAnchor(LAYOUT.vinyl.position, { lift: 0.36, back: 0.62, lookY: 0.06 }),
  // Fallback only: main.js frames the board from the viewport aspect.
  experience: {
    position: { x: 0, y: 1.0, z: 0.6 },
    lookAt: { x: 0, y: 0.98, z: -1.17 },
  },
};

export function applyPose(group, pose) {
  if (!group || !pose) return group;
  const [x, y, z] = pose.position;
  group.position.set(x, y, z);
  if (pose.rotation) {
    group.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2]);
  }
  if (pose.scale != null) {
    const s = pose.scale;
    group.scale.setScalar(s);
  }
  return group;
}
