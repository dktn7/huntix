import * as THREE from 'three';
import { RUIN_DEN } from './Palettes.js';

export class RuinDenArena {
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
      new THREE.MeshBasicMaterial({ color: RUIN_DEN.floor })
    );
    this.root.add(floor);
    this.meshes.push(floor);

    const voidBack = new THREE.Mesh(
      new THREE.PlaneGeometry(46, 10),
      new THREE.MeshBasicMaterial({ color: RUIN_DEN.void, transparent: true, opacity: 0.96 })
    );
    voidBack.position.set(0, 2.7, -5);
    this.root.add(voidBack);
    this.meshes.push(voidBack);

    const sideMat = new THREE.MeshBasicMaterial({ color: RUIN_DEN.stone });
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5, 2), sideMat);
    left.position.set(-19, 2.15, -0.3);
    this.root.add(left);
    this.meshes.push(left);

    const right = new THREE.Mesh(new THREE.BoxGeometry(0.8, 5, 2), sideMat);
    right.position.set(19, 2.15, -0.3);
    this.root.add(right);
    this.meshes.push(right);

    const rubbleMat = new THREE.MeshBasicMaterial({ color: RUIN_DEN.fissure });
    for (const x of [-15, -10, -4, 2, 9, 15]) {
      const rubble = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.4), rubbleMat);
      rubble.position.set(x, -1.85 + ((x + 15) % 2) * 0.15, -0.12);
      this.root.add(rubble);
      this.meshes.push(rubble);
    }

    const archMat = new THREE.MeshBasicMaterial({ color: RUIN_DEN.dust, transparent: true, opacity: 0.7 });
    for (const x of [-12, -2, 8]) {
      const arch = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.8, 0.2), archMat);
      arch.position.set(x, 0.95, -2.0);
      this.root.add(arch);
      this.meshes.push(arch);
    }

    this.scene.add(this.root);
    return this.root;
  }

  update(dt, focusX = 0) {
    if (!this.root) return;
    this._time += dt;
    const sway = Math.sin(this._time * 0.32) * 0.03;
    for (let i = 3; i < this.root.children.length; i += 1) {
      const child = this.root.children[i];
      child.position.x = child.position.x * 0.999 + focusX * 0.001 + sway;
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
