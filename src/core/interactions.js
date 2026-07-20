import * as THREE from 'three';
import gsap from 'gsap';

export function createInteractions(camera, domElement) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(-2, -2);
  const items = [];
  let enabled = true;
  let hovered = null;

  const labelEl = document.createElement('div');
  labelEl.className = 'hover-label';
  document.body.appendChild(labelEl);

  domElement.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    labelEl.style.transform = `translate(${e.clientX + 16}px, ${e.clientY - 8}px)`;
  });
  domElement.addEventListener('click', () => {
    if (enabled && hovered) hovered.onClick(hovered);
  });

  const HOVER_TINT = new THREE.Color(0xffd9a0);

  function register(item) {
    item.baseY = item.group.position.y;
    item.group.traverse((o) => {
      if (o.isMesh && o.material?.color) {
        o.userData.baseColor = o.material.color.getHex();
      }
    });
    items.push(item);
  }

  function applyHover(item, on) {
    item.group.traverse((o) => {
      if (o.isMesh && o.material?.color && o.userData.baseColor !== undefined) {
        // unlit materials have no emissive — hover warms the base color instead
        o.material.color.setHex(o.userData.baseColor);
        if (on) o.material.color.lerp(HOVER_TINT, 0.4);
      }
    });
    gsap.to(item.group.position, {
      y: item.baseY + (on ? 0.04 : 0), duration: 0.35, ease: 'power2.out',
    });
  }

  function setHover(item) {
    if (hovered === item) return;
    if (hovered) applyHover(hovered, false);
    hovered = item;
    if (hovered) applyHover(hovered, true);
    document.body.style.cursor = hovered ? 'pointer' : 'default';
    labelEl.textContent = hovered ? hovered.label : '';
    labelEl.style.opacity = hovered ? 1 : 0;
  }

  function update() {
    if (!enabled) { setHover(null); return; }
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

  return { register, update, setEnabled: (v) => { enabled = v; if (!v) setHover(null); } };
}
