import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

describe('Monsoon Postroom deterministic room bakes', () => {
  it('uses the approved scene, bake, window, and flat-geometry palette', async () => {
    const [engine, environment] = await Promise.all([
      readSource('../src/core/engine.js'),
      readSource('../src/scene/environment.js'),
    ]);

    expect(engine).toContain('scene.background = new THREE.Color(0x171b22);');

    for (const color of [
      '#3B3B35', '#565044', '#675744',
      '#202A34', '#2C3C49', '#334B5F',
      '#765137', '#493B35',
      '#dce8ed', '#9eb7c3',
      '#526f82', '#2f4658',
    ]) {
      expect(environment).toContain(color);
    }

    for (const color of ['0x765137', '0x563822', '0x171b22', '0x493522']) {
      expect(environment).toContain(`color: ${color}`);
    }
  });

  it('uses deterministic desk grain and the specified light and AO placements', async () => {
    const environment = await readSource('../src/scene/environment.js');
    const paintDesk = environment.match(
      /function paintDesk\(ctx, mode\) \{[\s\S]*?\n\}\n\nfunction paintWindowPane/,
    )?.[0];

    expect(paintDesk).toBeDefined();
    expect(paintDesk).not.toContain('Math.random');
    expect(paintDesk).toContain('for (let i = 0; i < 48; i++)');
    expect(paintDesk).toContain('const y = (i * 73) % DESK_H;');
    expect(paintDesk).toContain('const x = (i * 137) % DESK_W;');
    expect(paintDesk).toContain(
      'ctx.bezierCurveTo(x + 90, y - 3, x + 180, y + 4, x + 280, y);',
    );

    expect(environment).toContain("day ? '225, 190, 135' : '190, 210, 220'");
    expect(environment).toContain(
      "pool(ctx, 512, 367, 330, day ? '225, 164, 75' : '105, 130, 145'",
    );
    expect(environment).toContain('pool(ctx, 620, 350, 360');
    expect(environment).toContain('pool(ctx, 930, 150');

    for (const footprint of [
      'ao(ctx, 512, 437, 160, 62, 0.34);',
      'ao(ctx, 302, 391, 96, 48, 0.32);',
      'ao(ctx, 768, 316, 128, 58, 0.34);',
      'ao(ctx, 209, 196, 120, 52, 0.32);',
      'ao(ctx, 930, 150, 70, 36, 0.35);',
      'ao(ctx, 647, 174, 44, 24',
    ]) {
      expect(environment).toContain(footprint);
    }
  });

  it('keeps lighting baked and preserves composer pass order', async () => {
    const [engine, environment, composer] = await Promise.all([
      readSource('../src/core/engine.js'),
      readSource('../src/scene/environment.js'),
      readSource('../src/render/composer.js'),
    ]);
    const touchedSources = `${engine}\n${environment}\n${composer}`;

    expect(touchedSources).not.toMatch(
      /\b(?:AmbientLight|DirectionalLight|SpotLight)\b|shadowMap/,
    );

    const renderPass = composer.indexOf('composer.addPass(new RenderPass');
    const bloomPass = composer.indexOf('composer.addPass(bloom)');
    const outputPass = composer.indexOf('composer.addPass(new OutputPass');
    expect(renderPass).toBeGreaterThan(-1);
    expect(bloomPass).toBeGreaterThan(renderPass);
    expect(outputPass).toBeGreaterThan(bloomPass);
  });
});
