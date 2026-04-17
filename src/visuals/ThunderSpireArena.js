import * as THREE from 'three';
import { THUNDER_SPIRE } from './Palettes.js';

export class ThunderSpireArena {
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
      new THREE.MeshBasicMaterial({ color: THUNDER_SPIRE.floor })
    );
    this.root.add(floor);
    this.meshes.push(floor);

    const stormBack = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 11),
      new THREE.MeshBasicMaterial({ color: THUNDER_SPIRE.storm, transparent: true, opacity: 0.96 })
    );
    stormBack.position.set(0, 2.9, -6);
    this.root.add(stormBack);
    this.meshes.push(stormBack);

    const towerMat = new THREE.MeshBasicMaterial({ color: THUNDER_SPIRE.slate });
    for (const x of [-14, -5, 4, 13]) {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.6, 0.25), towerMat);
      tower.position.set(x, 1.0, -2.4);
      this.root.add(tower);
      this.meshes.push(tower);
    }

    const boltMat = new THREE.MeshBasicMaterial({ color: THUNDER_SPIRE.lightning, transparent: true, opacity: 0.75 });
    for (const x of [-16, -8, 0, 8, 16]) {
      const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.2, 0.08), boltMat);
      bolt.position.set(x, 1.25, -1.0);
      this.root.add(bolt);
      this.meshes.push(bolt);
    }

    this.scene.add(this.root);
    return this.root;
  }

  update(dt, focusX = 0) {
    if (!this.root) return;
    this._time += dt;
    const flash = Math.sin(this._time * 1.4) > 0.92;
    if (this.meshes[1]?.material) {
      this.meshes[1].material.opacity = flash ? 1 : 0.94;
    }
    for (let i = 2; i < this.root.children.length; i += 1) {
      const child = this.root.children[i];
      child.position.x = child.position.x * 0.999 + focusX * 0.001 + Math.sin(this._time * 0.5 + i) * 0.005;
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
