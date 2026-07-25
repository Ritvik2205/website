import * as THREE from 'three';
import gsap from 'gsap';

export function createInteractions(camera, domElement) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(-2, -2);
  const items = [];
  let enabled = true;
  let hovered = null;

  domElement.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  domElement.addEventListener('click', () => {
    if (enabled && hovered) hovered.onClick(hovered);
  });

  const HOVER_EMISSIVE = new THREE.Color(0xffd9a0);

  // GLB meshes stream in after register(), so the untinted base has to be
  // captured on first touch rather than only at registration time.
  function captureBase(o, mat) {
    if (mat.emissive) {
      if (!mat.userData.baseEmissive) {
        mat.userData.baseEmissive = mat.emissive.clone();
        mat.userData.baseEmissiveIntensity = mat.emissiveIntensity ?? 0;
      }
    } else if (mat.color && o.userData.baseColor === undefined) {
      o.userData.baseColor = mat.color.getHex();
    }
  }

  function register(item) {
    item.baseY = item.group.position.y;
    item.group.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const materials = Array.isArray(o.material) ? o.material : [o.material];
      for (const mat of materials) captureBase(o, mat);
    });
    items.push(item);
  }

  function applyHover(item, on) {
    if (!item.skipHoverVisual) {
      item.group.traverse((o) => {
        if (!o.isMesh || !o.material) return;
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        for (const mat of materials) {
          captureBase(o, mat);
          if (mat.emissive && mat.userData.baseEmissive) {
            mat.emissive.copy(mat.userData.baseEmissive);
            mat.emissiveIntensity = mat.userData.baseEmissiveIntensity ?? 0;
            if (on) {
              mat.emissive.lerp(HOVER_EMISSIVE, 0.55);
              mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 0.35);
            }
          } else if (mat.color && o.userData.baseColor !== undefined) {
            mat.color.setHex(o.userData.baseColor);
            if (on) mat.color.lerp(HOVER_EMISSIVE, 0.35);
          }
        }
      });
    }
    if (!item.skipHoverLift) {
      gsap.to(item.group.position, {
        y: item.baseY + (on ? 0.04 : 0), duration: 0.35, ease: 'power2.out',
      });
    }
  }

  function setHover(item) {
    if (hovered === item) return;
    if (hovered) applyHover(hovered, false);
    hovered = item;
    if (hovered) applyHover(hovered, true);
    document.body.style.cursor = hovered ? 'pointer' : 'default';
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
