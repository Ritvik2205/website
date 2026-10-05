import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

describe('Realtime PBR desk lighting', () => {
  it('enables shadow maps and palette-preserving tone mapping on the engine', async () => {
    const engine = await readSource('../src/core/engine.js');
    expect(engine).toContain('scene.background = new THREE.Color(0x12161e);');
    expect(engine).toContain('shadowMap.enabled = true');
    expect(engine).toContain('PCFShadowMap');
    expect(engine).toContain('NeutralToneMapping');
  });

  it('wires window directional, hemisphere fill, and lamp spot mood', async () => {
    const lighting = await readSource('../src/render/lighting.js');
    expect(lighting).toContain('DirectionalLight');
    expect(lighting).toContain('HemisphereLight');
    expect(lighting).toContain('SpotLight');
    expect(lighting).toContain('setLampMood');
    expect(lighting).toContain('castShadow = true');
  });

  it('uses flat Standard materials and the kit desk in the environment', async () => {
    const environment = await readSource('../src/scene/environment.js');
    expect(environment).toContain('MeshStandardMaterial');
    expect(environment).toContain('/models/kit/desk.glb');
    expect(environment).not.toContain('/textures/');
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
