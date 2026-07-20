import * as THREE from 'three';

// Paint-a-bake helpers: art direction lives in paintFn(ctx, mode).
// mode is 'day' (lamp on, warm) or 'night' (lamp off, cool dusk).

export function createBakePair(width, height, paintFn) {
  const make = (mode) => {
    const cv = document.createElement('canvas');
    cv.width = width;
    cv.height = height;
    paintFn(cv.getContext('2d'), mode);
    const texture = new THREE.CanvasTexture(cv);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };
  return { day: make('day'), night: make('night') };
}

// soft radial light pool
export function pool(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${color}, ${alpha})`);
  g.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// soft dark contact shadow (AO) ellipse
export function ao(ctx, x, y, rx, ry, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
  g.addColorStop(0, `rgba(20, 12, 5, ${alpha})`);
  g.addColorStop(1, 'rgba(20, 12, 5, 0)');
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  ctx.translate(-x, -y);
  ctx.fillStyle = g;
  ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);
  ctx.restore();
}

// diagonal sunbeam band
export function beam(ctx, xTop, width, height, slope, color, alpha) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(xTop, 0);
  ctx.lineTo(xTop + width, 0);
  ctx.lineTo(xTop + width + slope, height);
  ctx.lineTo(xTop + slope, height);
  ctx.closePath();
  const g = ctx.createLinearGradient(xTop, 0, xTop + slope, height);
  g.addColorStop(0, `rgba(${color}, ${alpha})`);
  g.addColorStop(1, `rgba(${color}, ${alpha * 0.4})`);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

// vertical falloff darkening toward edges
export function vignette(ctx, width, height, alpha) {
  const g = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.35,
    width / 2, height / 2, Math.max(width, height) * 0.75
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(10, 6, 2, ${alpha})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}
