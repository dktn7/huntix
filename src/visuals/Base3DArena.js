import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Shared logic for 3D world building.
 */
export class Base3DArena {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.group = new THREE.Group();
    this.scene.add(this.group);
  }

  async loadModel(path) {
    return new Promise((resolve, reject) => {
      this.loader.load(path, (gltf) => resolve(gltf.scene), null, reject);
    });
  }

  dispose() {
    this.scene.remove(this.group);
    // Add logic to traverse and dispose geometries/materials
  }
}
