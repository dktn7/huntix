import * as THREE from 'three';
import { Base3DArena } from './Base3DArena.js';
import { SHADOW_CORE } from './Palettes.js';

export class ShadowCoreArena extends Base3DArena {
  constructor(scene, zoneConfig = null) {
    super(scene, {
      colormapTexture: './assets/textures/props/shadow-core/colormap.png',
      zoneConfig: zoneConfig || {},
    });
    this.zoneConfig = zoneConfig || {};
  }

  build() {
    this.setZoneColors({ deep: 0x010103, far: 0x040210, mid: 0x09071a, near: 0x110e24 });
    this.addParallaxLayers();
    this.buildWorldFromSource({
      composed: () => this._queueWorldKit(),
      fallback: () => this.buildFallbackWorld(),
    });

    const crackMaterial = new THREE.MeshBasicMaterial({
      color: SHADOW_CORE.bloom,
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = -4; i <= 4; i += 1) {
      const crack = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.12), crackMaterial);
      crack.position.set(i * 2.35, -2.1 + (i % 3) * 0.12, -0.92);
      crack.rotation.z = 0.28 * (i % 2 === 0 ? 1 : -1);
      this.add(crack, 'props');
    }
    this._animatedMaterials.push({
      material: crackMaterial,
      pulse: 3.9,
      minOpacity: 0.14,
      maxOpacity: 0.34,
      phase: -0.6,
    });

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.1, 10, 36),
      new THREE.MeshBasicMaterial({
        color: SHADOW_CORE.bloom,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
      })
    );
    halo.position.set(6.9, 1.35, -1.18);
    this.add(halo, 'props');
    this._animatedMaterials.push({
      material: halo.material,
      pulse: 5.9,
      minOpacity: 0.3,
      maxOpacity: 0.68,
      phase: 0.9,
    });

    this.addHazardCircle({
      id: 'shadow-void-pool-top',
      x: -2.2,
      y: -1.05,
      radius: 1.3,
      color: SHADOW_CORE.violet,
      damage: 8,
      tick: 0.42,
      activeWhen: 'always',
      pulse: 6.8,
    });
    this.addHazardCircle({
      id: 'shadow-void-pool-bottom',
      x: -2.2,
      y: -3.35,
      radius: 1.3,
      color: SHADOW_CORE.violet,
      damage: 8,
      tick: 0.42,
      activeWhen: 'always',
      pulse: 6.8,
    });
    this.addHazardRect({
      id: 'shadow-radiant-strip',
      x: 8.7,
      y: -2.2,
      width: 2.8,
      height: 1.2,
      color: SHADOW_CORE.bloom,
      damage: 9,
      tick: 0.45,
      activeWhen: 'boss',
      pulse: 9.2,
      minOpacity: 0.18,
      maxOpacity: 0.5,
    });

    return this.group;
  }

  _queueWorldKit() {
    const root = './assets/models/world/shadow-core';

    for (let i = -2; i <= 2; i += 1) {
      this.queueModel(`${root}/shadow-tile.glb`, {
        x: i * 3.15,
        y: -2.35,
        z: -1.0,
        scale: 0.72,
        layer: 'floor',
      });
    }

    for (let i = -1; i <= 1; i += 1) {
      this.queueModel(`${root}/downward-spire.glb`, {
        x: i * 5.2,
        y: 2.45 + (i % 2) * 0.24,
        z: -2.66,
        scale: 0.72,
        layer: 'walls',
      });
    }
    this.queueModel(`${root}/shadow-tile.glb`, { x: -7.95, y: -3.1, z: -0.96, scale: 0.56, tint: SHADOW_CORE.floor, layer: 'floor' });
    this.queueModel(`${root}/shadow-tile.glb`, { x: 7.95, y: -3.1, z: -0.96, scale: 0.56, tint: SHADOW_CORE.floor, layer: 'floor' });

    this.queueModel(`${root}/shattered-glass.glb`, { x: -7.2, y: -1.7, z: -0.84, scale: 0.74, layer: 'props' });
    this.queueModel(`${root}/shattered-glass.glb`, { x: 7.2, y: -2.85, z: -0.84, scale: 0.74, rz: Math.PI * 0.14, layer: 'props' });
    this.queueModel(`${root}/platform-overhang.glb`, { x: 6.95, y: -0.3, z: -1.74, scale: 0.74, layer: 'walls' });
    this.queueModel(`${root}/rocks.glb`, { x: -7.35, y: -2.4, z: -0.94, scale: 0.78, layer: 'props' });
    this.queueModel(`${root}/spike-block.glb`, { x: 4.35, y: -3.62, z: -0.82, scale: 0.78, layer: 'props' });
    this.queueModel('./assets/models/world/city-breach/portal.glb', {
      x: 7.2,
      y: -2.1,
      z: -1.2,
      scale: 0.5,
      tint: SHADOW_CORE.bloom,
      emissive: SHADOW_CORE.bloom,
      emissiveIntensity: 0.58,
      layer: 'props',
    });
  }
}
