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
    base.addColorStop(0, '#3B3B35');
    base.addColorStop(0.55, '#565044');
    base.addColorStop(1, '#675744');
  } else {
    base.addColorStop(0, '#202A34');
    base.addColorStop(0.55, '#2C3C49');
    base.addColorStop(1, '#334B5F');
  }
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, WALL_W, WALL_H);

  // broad window-frame bands (warm by day, cool ghosts at dusk)
  const bandColor = day ? '225, 190, 135' : '190, 210, 220';
  beam(ctx, 620, 180, WALL_H, -364, bandColor, day ? 0.1 : 0.03);
  beam(ctx, 350, 120, WALL_H, -364, bandColor, day ? 0.06 : 0.02);

  // pool of light behind the corkboard (world y 1.42 → canvas ~367)
  pool(ctx, 512, 367, 330, day ? '225, 164, 75' : '105, 130, 145', day ? 0.14 : 0.08);

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

  ctx.fillStyle = day ? '#765137' : '#493B35';
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
  for (let i = 0; i < 48; i++) {
    const y = (i * 73) % DESK_H;
    const x = (i * 137) % DESK_W;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 90, y - 3, x + 180, y + 4, x + 280, y);
    ctx.stroke();
  }

  // Honey Lamp pools at the lamp origin and across the journal/sketchbook
  pool(ctx, 930, 150, 300, '225, 164, 75', day ? 0.3 : 0.06);
  pool(ctx, 620, 350, 360, '225, 164, 75', day ? 0.22 : 0.05);
  // cool window spill from the right by dusk
  if (!day) pool(ctx, 980, 120, 260, '105, 130, 145', 0.1);

  // window band falling across the desk
  beam(ctx, 380, 200, DESK_H, -160, '225, 190, 135', day ? 0.12 : 0.02);

  // AO under every object footprint (x/z from main layout)
  ao(ctx, 512, 437, 160, 62, 0.34); // sketchbook
  ao(ctx, 302, 391, 96, 48, 0.32);  // journal
  ao(ctx, 768, 316, 128, 58, 0.34); // laptop
  ao(ctx, 209, 196, 120, 52, 0.32); // vinyl player
  ao(ctx, 930, 150, 70, 36, 0.35);  // lamp foot
  ao(ctx, 647, 174, 44, 24, 0.32);  // tea cup

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
    g.addColorStop(0, '#dce8ed');
    g.addColorStop(1, '#9eb7c3');
  } else {
    g.addColorStop(0, '#526f82');
    g.addColorStop(1, '#2f4658');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
}

export function createEnvironment() {
  const group = new THREE.Group();

  // desk body (sides) — unlit flat wood
  const deskBody = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.09, 1.7),
    new THREE.MeshBasicMaterial({ color: 0x765137 })
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
    new THREE.MeshBasicMaterial({ color: 0x563822 })
  );
  deskEdge.position.set(0, 0.33, 0.53);
  group.add(deskEdge);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshBasicMaterial({ color: 0x171b22 })
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
    new THREE.MeshBasicMaterial({ color: 0x493522 })
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
