import * as THREE from 'three';
import { Base3DArena } from './Base3DArena.js';
import { SHADOW_CORE } from './Palettes.js';

export class ShadowCoreArena extends Base3DArena {
  constructor(scene, zoneConfig = null) {
    super(scene, { colormapTexture: './assets/textures/props/shadow-core/colormap.png' });
    this.zoneConfig = zoneConfig || {};
  }

  build() {
    this.setZoneColors({ deep: 0x010103, far: 0x040210, mid: 0x09071a, near: 0x110e24 });

    this.addRoomShell(this.zoneConfig.roomProfile || {
      bounds: { minX: -8.25, maxX: 8.25, minY: -4.2, maxY: 3.2 },
      floorColor: SHADOW_CORE.floor,
      wallColor: 0x271f4a,
      frontWallColor: 0x1e1739,
      trimColor: SHADOW_CORE.bloom,
      pillarColor: 0x35295e,
      laneColor: 0x3e2f73,
      bgLayerColor: 0xb08cff,
      fgLayerColor: 0x150f26,
      laneY: -2.2,
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
      this.add(crack);
    }
    this._animatedMaterials.push({
      material: crackMaterial,
      pulse: 3.9,
      minOpacity: 0.14,
      maxOpacity: 0.34,
      phase: -0.6,
    });

    const shardMaterial = new THREE.MeshLambertMaterial({ color: SHADOW_CORE.violet });
    for (let i = 0; i < 7; i += 1) {
      const shard = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.5, 5), shardMaterial);
      shard.position.set(-7.0 + i * 2.2, 1.9 + (i % 2) * 0.28, -2.05 - (i % 3) * 0.14);
      shard.rotation.z = (i % 2 === 0 ? -1 : 1) * 0.26;
      shard.rotation.x = Math.PI;
      this.add(shard);
    }

    const altarMaterial = new THREE.MeshLambertMaterial({ color: 0x2b2450 });
    const altar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.1, 1.05), altarMaterial);
    altar.position.set(6.9, 0.0, -1.36);
    this.add(altar);

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
    this.add(halo);
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

    this._queueWorldKit();

    // --- Procedural prop backups (always render regardless of GLB availability) ---

    // 5 downward hanging crystal spires across the top
    const spireMat = new THREE.MeshBasicMaterial({ color: 0x4d2d7a });
    const spireXPositions = [-6, -3, 0, 3, 6];
    for (const spireX of spireXPositions) {
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.8, 5), spireMat.clone());
      spire.rotation.x = Math.PI;
      spire.position.set(spireX, 3.5, -2.5);
      spire.castShadow = false;
      spire.receiveShadow = false;
      this.add(spire);
    }

    // Glowing void cracks in floor
    const voidCrackMat = new THREE.MeshBasicMaterial({
      color: SHADOW_CORE.bloom,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const crackOffsets = [0, 1.2, -1.2, 2.4, -2.4];
    for (let i = 0; i < crackOffsets.length; i += 1) {
      const crack = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.1), voidCrackMat.clone());
      crack.position.set(crackOffsets[i], -3.6, -0.9);
      crack.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.06;
      crack.castShadow = false;
      crack.receiveShadow = false;
      this.add(crack);
      this._animatedMaterials.push({ material: crack.material, pulse: 3.8, minOpacity: 0.08, maxOpacity: 0.3, phase: i * 0.7 });
    }

    // Crystal cluster floor accents (upright cones)
    const clusterMat = new THREE.MeshBasicMaterial({ color: 0x7c58c8 });
    for (const clusterX of [-7.2, -4.5, 4.5, 7.2]) {
      const cluster = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.7, 5), clusterMat.clone());
      cluster.position.set(clusterX, -3.8, -0.95);
      cluster.castShadow = false;
      cluster.receiveShadow = false;
      this.add(cluster);
    }

    this.addParallaxLayers();

    return this.group;
  }

  _queueWorldKit() {
    const root = './assets/models/world/shadow-core';
    const hubRoot = './assets/models/world/hub';

    for (let i = -1; i <= 1; i += 1) {
      this.queueModel(`${root}/shadow-tile.glb`, {
        x: i * 5.4,
        y: -2.35,
        z: -1.0,
        scale: 0.78,
      });
    }

    for (let i = -1; i <= 1; i += 1) {
      this.queueModel(`${root}/downward-spire.glb`, {
        x: i * 5.2,
        y: 2.45 + (i % 2) * 0.24,
        z: -2.66,
        scale: 0.72,
      });
    }
    this.queueModel(`${hubRoot}/hub-tile.glb`, { x: -7.95, y: -3.1, z: -0.96, scale: 0.56, tint: SHADOW_CORE.floor });
    this.queueModel(`${hubRoot}/hub-tile.glb`, { x: 7.95, y: -3.1, z: -0.96, scale: 0.56, tint: SHADOW_CORE.floor });

    this.queueModel(`${root}/shattered-glass.glb`, { x: -7.2, y: -1.7, z: -0.84, scale: 0.74 });
    this.queueModel(`${root}/shattered-glass.glb`, { x: 7.2, y: -2.85, z: -0.84, scale: 0.74, rz: Math.PI * 0.14 });
    this.queueModel(`${root}/platform-overhang.glb`, { x: 6.95, y: -0.3, z: -1.74, scale: 0.74 });
    this.queueModel(`${root}/rocks.glb`, { x: -7.35, y: -2.4, z: -0.94, scale: 0.78 });
    this.queueModel(`${root}/spike-block-wide.glb`, { x: 4.35, y: -3.62, z: -0.82, scale: 0.72 });
    this.queueModel('./assets/models/world/city-breach/portal.glb', {
      x: 7.2,
      y: -2.1,
      z: -1.2,
      scale: 0.5,
      tint: SHADOW_CORE.bloom,
      emissive: SHADOW_CORE.bloom,
      emissiveIntensity: 0.58,
    });
  }
}
