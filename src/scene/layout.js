import * as THREE from 'three';

const DESK_Y = 0.42;

/** Densified desk poses — shared by factories and camera anchors. */
export const LAYOUT = {
  deskY: DESK_Y,
  corkboard: {
    position: [0, 1.42, -1.17],
    rotation: [0, 0, 0],
    scale: 1.08,
  },
  vinyl: {
    position: [-1.05, DESK_Y, -0.45],
    rotation: [0, 0.18, 0],
    scale: 1.15,
  },
  journal: {
    position: [-0.75, DESK_Y, 0.18],
    rotation: [0, 0.28, 0],
    scale: 1.2,
  },
  sketchbook: {
    position: [0, DESK_Y, 0.32],
    rotation: [0, 0.04, 0],
    scale: 1.25,
  },
  laptop: {
    position: [0.95, DESK_Y, -0.05],
    rotation: [0, -0.38, 0],
    scale: 1.15,
  },
  lamp: {
    position: [1.45, DESK_Y, -0.55],
    rotation: [0, -0.35, 0],
    scale: 1.1,
  },
  teaCup: {
    position: [0.55, DESK_Y, -0.42],
    rotation: [0, -0.1, 0],
    scale: 1.05,
  },
  fillers: {
    books: { position: [-1.35, DESK_Y, 0.05], rotation: [0, 0.4, 0], scale: 1 },
    papers: { position: [-0.25, DESK_Y + 0.002, -0.55], rotation: [0, -0.2, 0], scale: 1 },
    plant: { position: [-1.55, DESK_Y, -0.7], rotation: [0, 0.5, 0], scale: 1 },
    penCup: { position: [0.38, DESK_Y, 0.22], rotation: [0, 0.1, 0], scale: 1 },
    keyboard: { position: [0.95, DESK_Y, 0.28], rotation: [0, -0.38, 0], scale: 0.9 },
  },
};

export const CAMERA_ANCHORS = {
  projects: {
    position: { x: 0.75, y: 0.82, z: 0.55 },
    lookAt: { x: 0.95, y: 0.58, z: -0.05 },
  },
  gallery: {
    position: { x: 0, y: 1.05, z: 0.72 },
    lookAt: { x: 0, y: 0.45, z: 0.32 },
  },
  blog: {
    position: { x: -0.75, y: 0.95, z: 0.65 },
    lookAt: { x: -0.75, y: 0.48, z: 0.18 },
  },
  music: {
    position: { x: -1.05, y: 0.88, z: 0.15 },
    lookAt: { x: -1.05, y: 0.55, z: -0.45 },
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
