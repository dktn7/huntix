import { createImpactBurstMesh } from './HitFlare.js';
import { EFFECTS } from './Palettes.js';

const FLARE_LIFETIME = 0.36;

/**
 * Pooled impact rings at hit positions; advances uTime on each mesh material.
 */
export class HitFlarePool {
  /** @param {import('three').Scene} scene */
  constructor(scene, count = 8) {
    this._items = [];
    const colour = EFFECTS.sparkHit;
    for (let i = 0; i < count; i += 1) {
      const mesh = createImpactBurstMesh(colour);
      mesh.visible = false;
      scene.add(mesh);
      this._items.push({ mesh, age: 0 });
    }
    this._cursor = 0;
  }

  /** Spawns a flare burst at world (x, y). */
  spawn(x, y) {
    const item = this._items[this._cursor];
    this._cursor = (this._cursor + 1) % this._items.length;
    item.mesh.position.set(x, y, -y * 0.01 + 0.18);
    item.mesh.material.uniforms.uTime.value = 0;
    item.age = 0;
    item.mesh.visible = true;
  }

  /** Advances active flares for one fixed tick. */
  update(dt) {
    for (const item of this._items) {
      if (!item.mesh.visible) continue;
      item.age += dt;
      item.mesh.material.uniforms.uTime.value += dt;
      if (item.age >= FLARE_LIFETIME) {
        item.mesh.visible = false;
      }
    }
  }
}
