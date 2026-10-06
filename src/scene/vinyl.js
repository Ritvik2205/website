import * as THREE from 'three';
import { loadModel, markShadowCasters, nextFrame } from '../render/loadModel.js';
import { LAYOUT, applyPose } from './layout.js';

function createFallback() {
  const group = new THREE.Group();
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.06, 0.36),
    new THREE.MeshStandardMaterial({ color: 0x5b3526, roughness: 0.7, metalness: 0.1 }),
  );
  plinth.position.y = 0.03;
  plinth.castShadow = true;
  plinth.receiveShadow = true;

  const platterGroup = new THREE.Group();
  platterGroup.position.set(-0.04, 0.075, 0);
  const platter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.018, 48),
    new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.4, metalness: 0.35 }),
  );
  platter.castShadow = true;
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.02, 24),
    new THREE.MeshStandardMaterial({ color: 0xc44444, roughness: 0.55, metalness: 0.1 }),
  );
  label.name = 'Hub';
  platterGroup.add(platter, label);

  const tonearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.18, 8),
    new THREE.MeshStandardMaterial({ color: 0xa77a3f, roughness: 0.35, metalness: 0.55 }),
  );
  tonearm.position.set(0.14, 0.11, 0.02);
  tonearm.rotation.z = Math.PI / 2.4;
  tonearm.rotation.y = -0.35;
  tonearm.castShadow = true;

  group.add(plinth, platterGroup, tonearm);
  group.userData.platterGroup = platterGroup;
  return group;
}

// Album art sits on a disc laid over the record's `Hub` (kit meshes carry no UVs).
function createLabelDisc() {
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48),
    new THREE.MeshStandardMaterial({
      roughness: 0.6, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -2,
    }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.receiveShadow = true;
  disc.visible = false;
  return disc;
}

function mountLabel(disc, platter) {
  const hub = platter.getObjectByName('Hub');
  if (!hub) return;
  hub.geometry.computeBoundingBox();
  const { max } = hub.geometry.boundingBox;
  disc.scale.setScalar(max.x);
  disc.position.set(0, max.y + 0.0002, 0);
  hub.add(disc);
}

const textureLoader = new THREE.TextureLoader().setCrossOrigin('anonymous');

export function createVinyl() {
  const group = new THREE.Group();
  const fallback = createFallback();
  group.add(fallback);

  const player = loadModel('/models/kit/vinyl.glb', { height: null });
  player.visible = false;
  group.add(player);

  let platter = fallback.userData.platterGroup;
  let spinning = true;
  const labelDisc = createLabelDisc();
  mountLabel(labelDisc, platter);

  const poll = () => {
    if (player.userData.assetStatus === 'loaded') {
      fallback.visible = false;
      player.visible = true;
      // Kit `Platter` carries the record and label as children; never spin the deck.
      platter = player.getObjectByName('Platter');
      mountLabel(labelDisc, platter);
    } else if (player.userData.assetStatus === 'error') {
      player.visible = false;
      fallback.visible = true;
      platter = fallback.userData.platterGroup;
      mountLabel(labelDisc, platter);
    } else {
      nextFrame(poll);
    }
  };
  nextFrame(poll);

  markShadowCasters(group);
  applyPose(group, LAYOUT.vinyl);

  return {
    group,
    id: 'music',
    label: 'now spinning',
    setSpinning: (v) => { spinning = !!v; },
    /** Put cover art (`{ art }` from content/spotify.js) on the record label. */
    setRecord: ({ art }) => {
      textureLoader.load(art, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const mat = labelDisc.material;
        mat.map?.dispose();
        mat.map = texture;
        mat.needsUpdate = true;
        labelDisc.visible = true;
        // The kit's off-center HubDot would poke through the art.
        const dot = player.getObjectByName('HubDot');
        if (dot) dot.visible = false;
      });
    },
    update: (dt) => {
      if (!spinning || !platter) return;
      platter.rotation.y += dt * 2.2;
    },
  };
}
