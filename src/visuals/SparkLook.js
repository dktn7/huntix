import * as THREE from 'three';
import { EFFECTS } from './Palettes.js';

/** Shared geometry for pooled hit sparks / essence (single draw-style footprint). */
export const sparkGeometry = new THREE.OctahedronGeometry(0.07, 0);

/** Bright hit chip colour — [EFFECTS.sparkHit](Palettes.js). */
export const sparkHitMaterial = new THREE.MeshBasicMaterial({
  color: EFFECTS.sparkHit,
  transparent: true,
  opacity: 0.98,
});

/** Essence pickup trail — [EFFECTS.essenceDrop](Palettes.js). */
export const sparkEssenceMaterial = new THREE.MeshBasicMaterial({
  color: EFFECTS.essenceDrop,
  transparent: true,
  opacity: 0.95,
});
