import * as THREE from 'three';

const OUTLINE_COLOR = 0xffd9a0;
const OUTLINE_SCALE = 1.06;

export function createInteractions(camera, domElement) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(-2, -2);
  const items = [];
  let enabled = true;
  let hovered = null;
  let hoverListener = null;

  domElement.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  domElement.addEventListener('click', () => {
    if (enabled && hovered) hovered.onClick(hovered);
  });

  function makeOutlineMesh(source) {
    const mat = new THREE.MeshBasicMaterial({
      color: OUTLINE_COLOR,
      side: THREE.BackSide,
      depthWrite: false,
      transparent: true,
      opacity: 0.9,
    });
    const outline = new THREE.Mesh(source.geometry, mat);
    outline.visible = false;
    outline.userData.isHoverOutline = true;
    outline.raycast = () => {};
    return outline;
  }

  function ensureOutlines(item) {
    if (item.skipHoverVisual) return;
    if (!item.outlinedUuids) item.outlinedUuids = new Set();
    if (!item.outlines) item.outlines = [];

    item.group.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      if (o.userData.isHoverOutline) return;
      if (item.outlinedUuids.has(o.uuid)) return;

      const outline = makeOutlineMesh(o);
      outline.position.copy(o.position);
      outline.rotation.copy(o.rotation);
      outline.scale.copy(o.scale).multiplyScalar(OUTLINE_SCALE);
      o.parent.add(outline);
      item.outlinedUuids.add(o.uuid);
      item.outlines.push(outline);
    });
  }

  function register(item) {
    item.outlines = [];
    item.outlinedUuids = new Set();
    ensureOutlines(item);
    items.push(item);
  }

  function applyHover(item, on) {
    if (item.skipHoverVisual) return;
    ensureOutlines(item);
    for (const outline of item.outlines || []) outline.visible = !!on;
  }

  function setHover(item) {
    if (hovered === item) return;
    if (hovered) applyHover(hovered, false);
    hovered = item;
    if (hovered) applyHover(hovered, true);
    document.body.style.cursor = hovered ? 'pointer' : 'default';
    hoverListener?.(hovered);
  }

  function update() {
    if (!enabled) { setHover(null); return; }

    for (const item of items) ensureOutlines(item);
    if (hovered && !hovered.skipHoverVisual) applyHover(hovered, true);

    raycaster.setFromCamera(pointer, camera);
    let found = null;
    let nearest = Infinity;
    for (const item of items) {
      const hits = raycaster.intersectObject(item.group, true);
      if (hits.length && hits[0].distance < nearest) {
        nearest = hits[0].distance;
        found = item;
      }
    }
    setHover(found);
  }

  return {
    register,
    update,
    setHoverListener: (fn) => { hoverListener = fn; },
    setEnabled: (v) => { enabled = v; if (!v) setHover(null); } };
}
