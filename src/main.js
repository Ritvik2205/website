import { createEngine } from './core/engine.js';
import { createCameraRig } from './core/cameraRig.js';
import { createInteractions } from './core/interactions.js';
import { state, setMode } from './core/state.js';
import { createLighting, attachLampLight, getLampMood, applyWindowFlashLevel } from './render/lighting.js';
import { createEnvironment } from './scene/environment.js';
import { createLaptop } from './scene/laptop.js';
import { createSketchbook } from './scene/sketchbook.js';
import { createJournal } from './scene/journal.js';
import { createVinyl } from './scene/vinyl.js';
import { createLamp } from './scene/lamp.js';
import { createTeaCup } from './scene/teaCup.js';
import { createCorkboard } from './scene/corkboard.js';
import { createFillers } from './scene/fillers.js';
import { createAtmosphere } from './scene/atmosphere.js';
import { CAMERA_ANCHORS } from './scene/layout.js';
import { createOverlayManager } from './ui/overlay.js';
import { createProjectsPage } from './ui/pages/projects.js';
import { createGalleryPage } from './ui/pages/gallery.js';
import { createBlogPage } from './ui/pages/blog.js';
import { createMusicPage } from './ui/pages/music.js';
import { createCorkboardPage } from './ui/pages/corkboard.js';
import { runIntro } from './ui/intro.js';
import { loadContent } from './content/loader.js';

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

const interactions = createInteractions(camera, engine.renderer.domElement);
engine.onTick(() => interactions.update());

const overlays = createOverlayManager(document.getElementById('ui'));

async function openItem(id) {
  if (state.mode !== 'idle') return;
  setMode('zoomed', id);
  interactions.setEnabled(false);
  await rig.flyTo(ANCHORS[id]);
  await overlays.open(id);
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

overlays.setCloseHandler(closeItem);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeItem(); });

const vinyl = createVinyl();
engine.onTick((dt) => vinyl.update(dt));

const laptop = createLaptop();
engine.onTick((dt) => laptop.update(dt));

for (const obj of [laptop, createSketchbook(), createJournal(), vinyl, createCorkboard()]) {
  scene.add(obj.group);
  interactions.register({ ...obj, onClick: (i) => openItem(i.id) });
}

const lamp = createLamp();
scene.add(lamp.group);
interactions.register({ ...lamp, onClick: () => lamp.toggle() });
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
overlays.register('projects', createProjectsPage(content.projects));
overlays.register('gallery', createGalleryPage(content.gallery));
overlays.register('blog', createBlogPage(content.posts));

const musicPage = createMusicPage(content.site);
overlays.register('music', musicPage.el, musicPage.hooks);

const corkboardPage = createCorkboardPage(content.experience);
overlays.register('experience', corkboardPage, {
  onOpen: () => requestAnimationFrame(() => corkboardPage.redrawStrings()),
});

engine.start();
rig.setParallaxEnabled(false);
await runIntro(camera, rig);
rig.setParallaxEnabled(true);
setMode('idle');
