import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  createLighting,
  setLampMood,
  getLampMood,
  pulseWindowFlash,
  applyWindowFlashLevel,
} from '../src/render/lighting.js';

describe('window flash API', () => {
  it('scales window intensity above mood baseline and can clear back', () => {
    const scene = new THREE.Scene();
    const { windowLight } = createLighting(scene);
    setLampMood(0.15);
    const dimBaseline = windowLight.intensity;

    applyWindowFlashLevel(1);
    expect(windowLight.intensity).toBeGreaterThan(dimBaseline);
    expect(getLampMood()).toBeCloseTo(0.15);

    applyWindowFlashLevel(0);
    expect(windowLight.intensity).toBeCloseTo(dimBaseline, 3);
  });

  it('pulseWindowFlash aliases applyWindowFlashLevel', () => {
    const scene = new THREE.Scene();
    const { windowLight } = createLighting(scene);
    setLampMood(0.15);
    const dimBaseline = windowLight.intensity;
    pulseWindowFlash(0.8);
    expect(windowLight.intensity).toBeGreaterThan(dimBaseline);
    applyWindowFlashLevel(0);
  });
});
