import * as THREE from 'three';
import { SHADOW_CORE } from './Palettes.js';

export class ShadowCoreArena {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
    this.root = null;
    this._time = 0;
  }

  build() {
    this.root = new THREE.Group();

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 8),
      new THREE.MeshBasicMaterial({ color: SHADOW_CORE.floor })
    );
    this.root.add(floor);
    this.meshes.push(floor);

    const voidBack = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 11),
      new THREE.MeshBasicMaterial({ color: SHADOW_CORE.void, transparent: true, opacity: 0.98 })
    );
    voidBack.position.set(0, 2.8, -6);
    this.root.add(voidBack);
    this.meshes.push(voidBack);

    const bloom = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 8),
      new THREE.MeshBasicMaterial({ color: SHADOW_CORE.bloom, transparent: true, opacity: 0.08 })
    );
    bloom.position.set(8, 1.1, -2.2);
    this.root.add(bloom);
    this.meshes.push(bloom);

    const archMat = new THREE.MeshBasicMaterial({ color: SHADOW_CORE.silver, transparent: true, opacity: 0.68 });
    for (const x of [-13, -4, 7, 15]) {
      const arch = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.7, 0.2), archMat);
      arch.position.set(x, 0.9, -2.0);
      this.root.add(arch);
      this.meshes.push(arch);
    }

    const tendrilMat = new THREE.MeshBasicMaterial({ color: SHADOW_CORE.violet, transparent: true, opacity: 0.55 });
    for (const x of [-16, -7, 1, 10]) {
      const tendril = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.8, 0.12), tendrilMat);
      tendril.position.set(x, 1.2, -1.5);
      this.root.add(tendril);
      this.meshes.push(tendril);
    }

    this.scene.add(this.root);
    return this.root;
  }

  update(dt, focusX = 0) {
    if (!this.root) return;
    this._time += dt;
    const pulse = 0.5 + Math.sin(this._time * 0.8) * 0.5;
    if (this.meshes[1]?.material) {
      this.meshes[1].material.opacity = 0.95 + pulse * 0.03;
    }
    for (let i = 2; i < this.root.children.length; i += 1) {
      const child = this.root.children[i];
      child.position.x = child.position.x * 0.9995 + focusX * 0.0005;
    }
  }

  dispose() {
    for (const mesh of this.meshes) {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
      this.scene.remove(mesh);
    }
    if (this.root) this.scene.remove(this.root);
    this.meshes = [];
    this.root = null;
  }
}
