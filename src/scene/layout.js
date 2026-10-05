import * as THREE from 'three';

// Top face of deskTop mesh (center 0.42, height 0.04 → surface at 0.44)
const DESK_Y = 0.44;

/**
 * Left-to-right desk order on a narrow, shallow top (±1.4 usable X):
 * plant → books → vinyl → journal → sketchbook → penCup → teaCup → laptop → keyboard → lamp
 */
export const LAYOUT = {
  deskY: DESK_Y,
  // Board sits lower so the pendant above it reads in the idle frame.
  corkboard: {
    position: [0, 1.25, -1.17],
    rotation: [0, 0, 0],
    scale: 1.0,
  },
  pendant: {
    position: [0, 1.84, -0.92],
    rotation: [0, 0, 0],
    scale: 1.0,
  },
  vinyl: {
    position: [-0.4, DESK_Y, -0.55],
    rotation: [0, 0.12, 0],
    scale: 1.0,
  },
  journal: {
    position: [-0.05, DESK_Y, -0.28],
    rotation: [0, 0.12, 0],
    scale: 1.05,
  },
  sketchbook: {
    position: [0.28, DESK_Y, -0.22],
    rotation: [0, 0.02, 0],
    scale: 1.05,
  },
  laptop: {
    position: [0.72, DESK_Y, -0.38],
    rotation: [0, -0.18, 0],
    scale: 1.0,
  },
  lamp: {
    position: [1.15, DESK_Y, -0.55],
    rotation: [0, -0.18, 0],
    scale: 1.0,
  },
  teaCup: {
    position: [0.48, DESK_Y, -0.55],
    rotation: [0, -0.08, 0],
    scale: 0.95,
  },
  fillers: {
    books: { position: [-0.85, DESK_Y, -0.35], rotation: [0, 0.22, 0], scale: 0.95 },
    papers: { position: [-0.2, DESK_Y + 0.002, -0.72], rotation: [0, -0.12, 0], scale: 0.95 },
    plant: { position: [-1.15, DESK_Y, -0.65], rotation: [0, 0.3, 0], scale: 0.95 },
    penCup: { position: [0.48, DESK_Y, -0.28], rotation: [0, 0.08, 0], scale: 0.95 },
    keyboard: { position: [0.72, DESK_Y, -0.08], rotation: [0, -0.18, 0], scale: 0.8 },
  },
};

export const CAMERA_ANCHORS = {
  projects: {
    position: { x: 0.55, y: 0.78, z: 0.2 },
    lookAt: { x: 0.72, y: 0.56, z: -0.38 },
  },
  gallery: {
    position: { x: 0.28, y: 0.95, z: 0.3 },
    lookAt: { x: 0.28, y: 0.48, z: -0.22 },
  },
  blog: {
    position: { x: -0.05, y: 0.88, z: 0.3 },
    lookAt: { x: -0.05, y: 0.5, z: -0.28 },
  },
  music: {
    position: { x: -0.4, y: 0.82, z: -0.05 },
    lookAt: { x: -0.4, y: 0.55, z: -0.55 },
  },
  // Fallback only: main.js frames the board from the viewport aspect.
  experience: {
    position: { x: 0, y: 1.3, z: 0.6 },
    lookAt: { x: 0, y: 1.25, z: -1.17 },
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
