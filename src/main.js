import { createEngine } from './core/engine.js';
import { createCameraRig } from './core/cameraRig.js';
import { createInteractions } from './core/interactions.js';
import { state, setMode, onModeChange } from './core/state.js';
import { createLighting, attachLampLight, getLampMood, applyWindowFlashLevel } from './render/lighting.js';
import { createEnvironment } from './scene/environment.js';
import { createLaptop } from './scene/laptop.js';
import { createSketchbook } from './scene/sketchbook.js';
import { createJournal } from './scene/journal.js';
import { createVinyl } from './scene/vinyl.js';
import { createLamp } from './scene/lamp.js';
import { createTeaCup } from './scene/teaCup.js';
import { createCorkboard } from './scene/corkboard.js';
import { createPendant } from './scene/pendant.js';
import { BOARD } from './scene/corkboardLayout.js';
import { createFillers } from './scene/fillers.js';
import { createAtmosphere } from './scene/atmosphere.js';
import { CAMERA_ANCHORS, LAYOUT } from './scene/layout.js';
import { Box3, MathUtils, Vector3 } from 'three';
import { createOverlayManager } from './ui/overlay.js';
import { createHud } from './ui/hud.js';
import { createBoardUi } from './ui/boardUi.js';
import { createProjectsPage } from './ui/pages/projects.js';
import { createGalleryPage } from './ui/pages/gallery.js';
import { createBlogPage } from './ui/pages/blog.js';
import { createMusicPage } from './ui/pages/music.js';
import { createExperiencePage } from './ui/pages/experience.js';
import { runIntro } from './ui/intro.js';
import { loadContent } from './content/loader.js';
import { watchNowPlaying } from './content/spotify.js';

const ANCHORS = CAMERA_ANCHORS;

const engine = createEngine(document.getElementById('scene'));
const { scene, camera } = engine;

createLighting(scene);

const rig = createCameraRig(camera);
engine.onTick(() => rig.update());

const environment = createEnvironment();
scene.add(environment.group);

const teaCup = createTeaCup();
scene.add(teaCup.group);

const fillers = createFillers();
scene.add(fillers.group);

scene.add(createPendant().group);

const interactions = createInteractions(camera, engine.renderer.domElement);
engine.onTick(() => interactions.update());

const overlays = createOverlayManager(document.getElementById('ui'));
const targets = new Map();

// Screen-space center of a desk object, so its page can reveal outward from it.
function screenPoint(group) {
  const p = new Box3().setFromObject(group).getCenter(new Vector3()).project(camera);
  return { x: ((p.x + 1) / 2) * window.innerWidth, y: ((1 - p.y) / 2) * window.innerHeight };
}

async function openItem(id) {
  if (state.mode !== 'idle') return;
  // Wide screens explore the corkboard in place; narrow ones go straight to the timeline.
  if (id === 'experience' && camera.aspect >= 1) return openBoard();
  setMode('zoomed', id);
  interactions.setEnabled(false);
  await rig.flyTo(ANCHORS[id]);
  await overlays.open(id, { origin: targets.has(id) ? screenPoint(targets.get(id)) : undefined });
  engine.setRenderPaused(true);
}

async function closeItem() {
  if (state.mode !== 'zoomed') return;
  setMode('closing');
  engine.setRenderPaused(false);
  await overlays.close();
  await rig.flyHome();
  interactions.setEnabled(true);
  setMode('idle');
}

// ---- Corkboard mode: zoomed('experience') without an overlay ----
// Layers unwind one at a time: timeline overlay → sheet card → board → desk.
let boardActive = false;
let activeSheet = null;
let featuredEntries = [];

/** Frame the whole board for the current viewport; slightly closer than the desk view. */
function boardAnchor() {
  const [x, y, z] = LAYOUT.corkboard.position;
  const t = Math.tan(MathUtils.degToRad(camera.fov / 2));
  const d = Math.max((BOARD.height / 2 + 0.1) / t, (BOARD.width / 2 + 0.1) / (t * camera.aspect));
  // Sit a little high so the camera looks over the laptop and lamp on the desk below.
  return { position: { x, y: y + 0.24, z: z + Math.min(d, 2.2) }, lookAt: { x, y, z } };
}

/** Close in on one sheet, offset so the card has room on the opposite side. */
function sheetAnchor(id) {
  const p = corkboard.sheetWorldPosition(id);
  const side = p.x < LAYOUT.corkboard.position[0] ? 1 : -1;
  const x = p.x + side * 0.13;
  return {
    anchor: { position: { x, y: p.y, z: p.z + 0.62 }, lookAt: { x, y: p.y, z: p.z } },
    cardSide: side > 0 ? 'right' : 'left',
  };
}

async function openBoard() {
  setMode('zoomed', 'experience');
  boardActive = true;
  interactions.setEnabled(false);
  await rig.flyTo(boardAnchor());
  boardUi.show();
  sheetInteractions.setEnabled(true);
}

async function openSheet(id) {
  const index = featuredEntries.findIndex((e) => e.id === id);
  if (index < 0) return;
  activeSheet = id;
  sheetInteractions.setEnabled(false);
  corkboard.setHovered(id);
  const { anchor, cardSide } = sheetAnchor(id);
  await rig.flyTo(anchor);
  boardUi.showCard(featuredEntries[index], index, cardSide);
}

async function closeSheet() {
  boardUi.hideCard();
  activeSheet = null;
  corkboard.setHovered(null);
  await rig.flyTo(boardAnchor());
  sheetInteractions.setEnabled(true);
}

async function openTimeline(id) {
  boardUi.hide();
  sheetInteractions.setEnabled(false);
  await overlays.open('experience');
  experiencePage.focus(id);
  engine.setRenderPaused(true);
}

async function closeTimeline() {
  engine.setRenderPaused(false);
  await overlays.close();
  boardUi.show();
  if (!activeSheet) sheetInteractions.setEnabled(true);
}

async function closeBoard() {
  boardUi.hideCard();
  boardUi.hide();
  activeSheet = null;
  boardActive = false;
  corkboard.setHovered(null);
  sheetInteractions.setEnabled(false);
  setMode('closing');
  await rig.flyHome();
  interactions.setEnabled(true);
  setMode('idle');
}

// One transition at a time; extra clicks/keys during a camera move are dropped.
let busy = false;
const guarded = (fn) => async (...args) => {
  if (busy) return;
  busy = true;
  try { await fn(...args); } finally { busy = false; }
};

const goBack = guarded(async () => {
  if (state.mode !== 'zoomed') return;
  if (!boardActive) return closeItem();
  if (overlays.isOpen()) return closeTimeline();
  if (activeSheet) return closeSheet();
  return closeBoard();
});

overlays.setCloseHandler(goBack);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') goBack(); });

const boardUi = createBoardUi(document.getElementById('ui'), {
  onBack: goBack,
  onTimeline: guarded(openTimeline),
  onCloseCard: guarded(closeSheet),
});

const sheetInteractions = createInteractions(camera, engine.renderer.domElement);
sheetInteractions.setEnabled(false);
engine.onTick(() => sheetInteractions.update());
sheetInteractions.setHoverListener((item) => { if (!activeSheet) corkboard.setHovered(item?.id ?? null); });

const vinyl = createVinyl();
engine.onTick((dt) => vinyl.update(dt));

const laptop = createLaptop();
engine.onTick((dt) => laptop.update(dt));

const corkboard = createCorkboard();

for (const obj of [laptop, createSketchbook(), createJournal(), vinyl, corkboard]) {
  scene.add(obj.group);
  targets.set(obj.id, obj.group);
  interactions.register({ ...obj, onClick: (i) => guarded(openItem)(i.id) });
}

const lamp = createLamp();
scene.add(lamp.group);
let lampOn = true;
function toggleLamp() {
  lamp.toggle();
  lampOn = !lampOn;
  hud.setLamp(lampOn);
}
interactions.register({ ...lamp, onClick: toggleLamp });
attachLampLight(lamp.group);

const atmosphere = createAtmosphere({
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  getLampMood,
  applyWindowFlashLevel,
  windowPane: environment.windowPane,
});
scene.add(atmosphere.group);
engine.onTick((dt) => atmosphere.update(dt));

const content = await loadContent();

const hud = createHud(document.getElementById('ui'), {
  site: content.site,
  sections: [
    { id: 'projects', label: 'Projects' },
    { id: 'experience', label: 'Experience' },
    { id: 'blog', label: 'Journal' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'music', label: 'Music' },
  ],
  onSelect: guarded(openItem),
  onLamp: toggleLamp,
});
interactions.setHoverListener((item) => hud.setHover(item?.id ?? null));
onModeChange((s) => hud.setVisible(s.mode === 'idle'));
overlays.register('projects', createProjectsPage(content.projects));
overlays.register('gallery', createGalleryPage(content.gallery));
const journalPage = createBlogPage(content.posts);
overlays.register('blog', journalPage.el, journalPage.hooks);

const musicPage = createMusicPage(content.site);
overlays.register('music', musicPage.el, musicPage.hooks);
watchNowPlaying(content.site.spotify, vinyl.setRecord);

// The four most recent entries are pinned on the board and become clickable sheets.
corkboard.setFeatured(content.experience);
featuredEntries = content.experience.slice(0, corkboard.featured.length);
for (const mesh of corkboard.featured) {
  const id = mesh.userData.experienceId;
  if (!id) continue;
  sheetInteractions.register({ group: mesh, id, label: id, skipHoverVisual: true, onClick: () => guarded(openSheet)(id) });
}

const experiencePage = createExperiencePage(content.experience);
overlays.register('experience', experiencePage.el);

engine.start();
rig.setParallaxEnabled(false);
await runIntro(camera, rig);
rig.setParallaxEnabled(true);
setMode('idle');
