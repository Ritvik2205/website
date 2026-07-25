import * as THREE from 'three';

// Top face of deskTop mesh (center 0.42, height 0.04 → surface at 0.44)
const DESK_Y = 0.44;

/**
 * Left-to-right desk order on a shallow top:
 * plant → books → vinyl → journal → sketchbook → penCup → teaCup → laptop → keyboard → lamp
 */
export const LAYOUT = {
  deskY: DESK_Y,
  corkboard: {
    position: [0, 1.42, -1.17],
    rotation: [0, 0, 0],
    scale: 1.08,
  },
  vinyl: {
    position: [-0.55, DESK_Y, -0.55],
    rotation: [0, 0.12, 0],
    scale: 1.05,
  },
  journal: {
    position: [-0.12, DESK_Y, -0.28],
    rotation: [0, 0.14, 0],
    scale: 1.1,
  },
  sketchbook: {
    position: [0.32, DESK_Y, -0.22],
    rotation: [0, 0.02, 0],
    scale: 1.1,
  },
  laptop: {
    position: [0.9, DESK_Y, -0.38],
    rotation: [0, -0.22, 0],
    scale: 1.05,
  },
  lamp: {
    position: [1.35, DESK_Y, -0.55],
    rotation: [0, -0.2, 0],
    scale: 1.05,
  },
  teaCup: {
    position: [0.58, DESK_Y, -0.55],
    rotation: [0, -0.08, 0],
    scale: 1,
  },
  fillers: {
    books: { position: [-1.0, DESK_Y, -0.35], rotation: [0, 0.25, 0], scale: 1 },
    papers: { position: [-0.3, DESK_Y + 0.002, -0.72], rotation: [0, -0.15, 0], scale: 1 },
    plant: { position: [-1.2, DESK_Y, -0.65], rotation: [0, 0.35, 0], scale: 1 },
    penCup: { position: [0.55, DESK_Y, -0.28], rotation: [0, 0.08, 0], scale: 1 },
    keyboard: { position: [0.9, DESK_Y, -0.08], rotation: [0, -0.22, 0], scale: 0.85 },
  },
};

export const CAMERA_ANCHORS = {
  projects: {
    position: { x: 0.7, y: 0.82, z: 0.25 },
    lookAt: { x: 0.9, y: 0.58, z: -0.38 },
  },
  gallery: {
    position: { x: 0.32, y: 1.0, z: 0.35 },
    lookAt: { x: 0.32, y: 0.48, z: -0.22 },
  },
  blog: {
    position: { x: -0.12, y: 0.92, z: 0.35 },
    lookAt: { x: -0.12, y: 0.5, z: -0.28 },
  },
  music: {
    position: { x: -0.55, y: 0.88, z: 0.0 },
    lookAt: { x: -0.55, y: 0.55, z: -0.55 },
  },
  experience: {
    position: { x: 0, y: 1.42, z: -0.05 },
    lookAt: { x: 0, y: 1.42, z: -1.17 },
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
