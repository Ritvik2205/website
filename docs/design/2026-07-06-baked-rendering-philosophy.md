# Baked Rendering Philosophy

Reference: [3D Cyber Desk](https://3dcyberroom.vercel.app/) by Thibault Introvigne (Awwwards honors). This doc captures how that site renders, and the rules this portfolio follows after adopting the same philosophy.

## Core principle: paint the light, don't compute it

Every shadow, ambient-occlusion pocket, and pool of light in the reference is **authored into textures** ahead of time (baked in Blender). At runtime there are **no lights in the scene at all** — the renderer just displays pre-lit surfaces. This is why the site looks cinematic yet runs cheap: lighting quality is an art problem, not a GPU problem.

## What the reference actually does (reverse-engineered from its bundle)

- Scene split into 3 GLB groups (`layout`, `cyber`, `stuff`) + one `unbaked` GLB for dynamic parts. Each group ships baked lightmap JPEGs in three moods: `-day`, `-neutral`, `-night` (~350–700 KB each).
- Every mesh uses `meshBasicMaterial` or a custom `ShaderMaterial` — zero `AmbientLight`/`DirectionalLight`/`SpotLight`/shadow maps.
- Mood switching is one uniform blending two bakes:

  ```glsl
  uniform sampler2D uDayTexture;
  uniform sampler2D uNightTexture;
  uniform float uNightMix;
  varying vec2 vUv;

  void main() {
      vec4 textureDay = texture2D(uDayTexture, vUv);
      vec4 textureNight = texture2D(uNightTexture, vUv);
      gl_FragColor = mix(textureNight, textureDay, uNightMix);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
  }
  ```

- Baked textures load with `flipY = false` and SRGB colorspace (the two classic GLTF-lightmap gotchas).
- Everything that glows (neon, tube lights, screens) is just **bright pixels + Bloom postprocessing** (intensity 1.15–2, luminanceThreshold 0.4). Glow is never a light source.
- Screens are separate planes with PNG/canvas textures driven by `uTime` shaders: scanline darkening, sine-wave distortion, shake offsets, simplex-noise glitches.
- Camera: fov 50, movement hard-clamped (camera-controls, fixed distance) — a directed view, not a free orbit.
- Debug tweakables (nightMix, bloom toggles) behind a Leva panel.

## Rules for this portfolio

1. **No scene lights.** If something looks lit, the light was painted.
2. **`MeshBasicMaterial` for props.** The texture (canvas-painted or PNG art) carries all shading. Sprite assets (vinyl, lamp) already contain their own shading — display them unlit.
3. **`BakedMaterial` for mood surfaces.** Wall, desk, floor use the day/night mix shader above (`src/render/bakedMaterial.js`). Bakes are painted in 2D canvas (`src/render/bakeCanvas.js`): base color → light pools (radial gradients) → sunbeams (diagonal bands) → AO (soft dark strokes at contact edges).
4. **One mood axis.** `nightMix` ∈ [0,1]: 1 = lamp on (warm, beams strong), 0 = lamp off (cool dusk, still readable — never black). The lamp toggle GSAP-tweens it; all baked materials update through a central registry (`setNightMix`).
5. **Glow = bright pixels + bloom.** UnrealBloomPass in the composer (`src/render/composer.js`). Window pane, laptop screen, lamp bulb are painted bright enough to cross the bloom threshold.
6. **Screens are shaders.** The laptop screen is a `uTime` ShaderMaterial over the terminal texture: scanlines + flicker, reference-style.
7. **Directed camera.** fov 50, cursor parallax only, GSAP fly-to anchors. No orbit.

## Asset licensing

The reference's GLBs and baked JPEGs are Thibault Introvigne's personal portfolio artwork with **no published license — we do not reuse them**. Technique and standard shader patterns are not copyrightable; files are. Legitimate texture/model sources if needed:

- [ambientCG](https://ambientcg.com) — CC0 PBR textures (wood, cork, plaster)
- [poly.pizza](https://poly.pizza) — CC0/CC-BY low-poly models
- [Kenney](https://kenney.nl) — CC0 game assets

## Blender drop-in path (hybrid contract)

When real baked assets exist, they drop in via `src/render/bakedModel.js`:

```js
const { group } = await loadBakedModel({
  model: '/models/desk-group.glb',
  day: '/textures/desk-group-day.jpg',
  night: '/textures/desk-group-night.jpg',
});
scene.add(group);
```

Contract per group:

- `public/models/<group>.glb` — single UV set, one texture atlas per group, no embedded materials needed
- `public/textures/<group>-day.jpg` + `<group>-night.jpg` — lightmaps baked to that atlas (Blender: Cycles bake → Combined, denoise, export JPEG q≈80)
- Loader applies `flipY = false`, SRGB, and one shared `BakedMaterial` per group; the group automatically joins the `nightMix` registry

Until then, canvas-painted bakes stand in — same shader, same registry, same mood axis.
