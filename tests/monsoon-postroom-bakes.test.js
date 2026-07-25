import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

describe('Realtime PBR desk lighting', () => {
  it('enables shadow maps and filmic tone mapping on the engine', async () => {
    const engine = await readSource('../src/core/engine.js');
    expect(engine).toContain('scene.background = new THREE.Color(0x171b22);');
    expect(engine).toContain('shadowMap.enabled = true');
    expect(engine).toContain('PCFSoftShadowMap');
    expect(engine).toContain('ACESFilmicToneMapping');
  });

  it('wires window directional, hemisphere fill, and lamp spot mood', async () => {
    const lighting = await readSource('../src/render/lighting.js');
    expect(lighting).toContain('DirectionalLight');
    expect(lighting).toContain('HemisphereLight');
    expect(lighting).toContain('SpotLight');
    expect(lighting).toContain('setLampMood');
    expect(lighting).toContain('castShadow = true');
  });

  it('uses Standard materials and ambientCG texture paths in the environment', async () => {
    const environment = await readSource('../src/scene/environment.js');
    expect(environment).toContain('MeshStandardMaterial');
    expect(environment).toContain('/textures/wood-color.jpg');
    expect(environment).toContain('/textures/plaster-color.jpg');
    expect(environment).toContain('receiveShadow');
    expect(environment).toContain('castShadow');
    expect(environment).not.toContain('createBakePair');
    expect(environment).not.toContain('createBakedMaterial');
  });

  it('preserves composer pass order with retuned bloom', async () => {
    const composer = await readSource('../src/render/composer.js');
    const renderPass = composer.indexOf('composer.addPass(new RenderPass');
    const bloomPass = composer.indexOf('composer.addPass(bloom)');
    const outputPass = composer.indexOf('composer.addPass(new OutputPass');
    expect(renderPass).toBeGreaterThan(-1);
    expect(bloomPass).toBeGreaterThan(renderPass);
    expect(outputPass).toBeGreaterThan(bloomPass);
    expect(composer).toContain('0.96');
  });
});
