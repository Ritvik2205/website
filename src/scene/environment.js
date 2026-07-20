import * as THREE from 'three';
import { createBakedMaterial } from '../render/bakedMaterial.js';
import { createBakePair, pool, ao, beam, vignette } from '../render/bakeCanvas.js';

// world→canvas mapping constants
const WALL_W = 1024, WALL_H = 512;   // plane 10 x 5 at (0, 2.5, -1.2)
const DESK_W = 1024, DESK_H = 512;   // plane 4.4 x 1.7, z from -1.2 to 0.5

function paintWall(ctx, mode) {
  const day = mode === 'day';

  const base = ctx.createLinearGradient(0, 0, 0, WALL_H);
  if (day) {
    base.addColorStop(0, '#4f4a36');
    base.addColorStop(0.55, '#5d5440');
    base.addColorStop(1, '#6d5f46');
  } else {
    base.addColorStop(0, '#35342c');
    base.addColorStop(0.55, '#403c32');
    base.addColorStop(1, '#4a443a');
  }
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, WALL_W, WALL_H);

  // diagonal sunbeams (strong by day, ghosts at dusk)
  beam(ctx, 620, 115, WALL_H, -364, '255, 200, 120', day ? 0.16 : 0.03);
  beam(ctx, 350, 50, WALL_H, -364, '255, 200, 120', day ? 0.1 : 0.02);

  // pool of light behind the corkboard (world y 1.42 → canvas ~367)
  pool(ctx, 512, 367, 330, day ? '255, 190, 110' : '140, 160, 190', day ? 0.14 : 0.08);

  // desk line contact shadow (world y ~0.42 → canvas ~469)
  const shadow = ctx.createLinearGradient(0, 440, 0, WALL_H);
  shadow.addColorStop(0, 'rgba(15, 10, 4, 0)');
  shadow.addColorStop(1, `rgba(15, 10, 4, ${day ? 0.35 : 0.45})`);
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 440, WALL_W, WALL_H - 440);

  vignette(ctx, WALL_W, WALL_H, day ? 0.22 : 0.35);
}

function paintDesk(ctx, mode) {
  const day = mode === 'day';

  ctx.fillStyle = day ? '#b08046' : '#6f5c42';
  ctx.fillRect(0, 0, DESK_W, DESK_H);

  // plank seams
  ctx.strokeStyle = day ? 'rgba(90, 60, 30, 0.25)' : 'rgba(40, 32, 22, 0.3)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (DESK_H / 6) * i + (i % 2 ? 4 : -3));
    ctx.lineTo(DESK_W, (DESK_H / 6) * i);
    ctx.stroke();
  }
  // subtle grain
  ctx.strokeStyle = day ? 'rgba(140, 100, 55, 0.12)' : 'rgba(90, 75, 55, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * DESK_H;
    ctx.beginPath();
    ctx.moveTo(Math.random() * DESK_W, y);
    ctx.lineTo(Math.random() * DESK_W, y + (Math.random() - 0.5) * 8);
    ctx.stroke();
  }

  // lamp light pool (lamp at world x 1.8, z -0.7) reaching toward the sketchbook
  pool(ctx, 930, 150, 300, '255, 190, 110', day ? 0.3 : 0.06);
  pool(ctx, 512, 437, 320, '255, 200, 130', day ? 0.22 : 0.05);
  // cool window spill from the right by dusk
  if (!day) pool(ctx, 980, 120, 260, '150, 170, 200', 0.1);

  // sunbeam band falling across the desk
  beam(ctx, 380, 200, DESK_H, -160, '255, 205, 130', day ? 0.12 : 0.02);

  // AO under every object footprint (x/z from main layout)
  ao(ctx, 512, 437, 160, 62, 0.34); // sketchbook
  ao(ctx, 302, 391, 96, 48, 0.32);  // journal
  ao(ctx, 768, 316, 128, 58, 0.34); // laptop
  ao(ctx, 209, 196, 120, 52, 0.32); // vinyl player
  ao(ctx, 930, 150, 70, 36, 0.35);  // lamp foot

  // front edge falloff
  const edge = ctx.createLinearGradient(0, DESK_H - 60, 0, DESK_H);
  edge.addColorStop(0, 'rgba(30, 18, 8, 0)');
  edge.addColorStop(1, `rgba(30, 18, 8, ${day ? 0.25 : 0.35})`);
  ctx.fillStyle = edge;
  ctx.fillRect(0, DESK_H - 60, DESK_W, 60);

  vignette(ctx, DESK_W, DESK_H, day ? 0.15 : 0.28);
}

function paintWindowPane(ctx, mode) {
  const day = mode === 'day';
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  if (day) {
    // bright enough to cross the bloom threshold
    g.addColorStop(0, '#f4faff');
    g.addColorStop(1, '#c8dcec');
  } else {
    g.addColorStop(0, '#5a7490');
    g.addColorStop(1, '#3a4c62');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
}

export function createEnvironment() {
  const group = new THREE.Group();

  // desk body (sides) — unlit flat wood
  const deskBody = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.09, 1.7),
    new THREE.MeshBasicMaterial({ color: 0x8a6538 })
  );
  deskBody.position.set(0, 0.375, -0.35);
  group.add(deskBody);

  // baked desk top
  const deskBake = createBakePair(DESK_W, DESK_H, paintDesk);
  const deskTop = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 1.7),
    createBakedMaterial(deskBake)
  );
  deskTop.rotation.x = -Math.PI / 2;
  deskTop.position.set(0, 0.4205, -0.35);
  group.add(deskTop);

  const deskEdge = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.18, 0.07),
    new THREE.MeshBasicMaterial({ color: 0x77522c })
  );
  deskEdge.position.set(0, 0.33, 0.53);
  group.add(deskEdge);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshBasicMaterial({ color: 0x2e2820 })
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  // baked wall
  const wallBake = createBakePair(WALL_W, WALL_H, paintWall);
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 5),
    createBakedMaterial(wallBake)
  );
  wall.position.set(0, 2.5, -1.2);
  group.add(wall);

  // window — pane blooms by day, dims by dusk
  const windowFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.9, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x5d4a2e })
  );
  windowFrame.position.set(2.2, 1.8, -1.19);
  group.add(windowFrame);

  const paneBake = createBakePair(64, 64, paintWindowPane);
  const windowPane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.8),
    createBakedMaterial(paneBake)
  );
  windowPane.position.set(2.2, 1.8, -1.165);
  group.add(windowPane);

  return { group };
}
