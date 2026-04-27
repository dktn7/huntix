import * as THREE from 'three';
import { Base3DArena } from './Base3DArena.js';
import { THUNDER_SPIRE } from './Palettes.js';

export class ThunderSpireArena extends Base3DArena {
  constructor(scene, zoneConfig = null) {
    super(scene, {
      colormapTexture: './assets/textures/props/thunder-spire/colormap.png',
      zoneConfig: zoneConfig || {},
    });
    this.zoneConfig = zoneConfig || {};
  }

  build() {
    this.setZoneColors({ deep: 0x050812, far: 0x0a1022, mid: 0x0f1830, near: 0x121e38 });

    this.addRoomShell(this.zoneConfig.roomProfile || {
      bounds: { minX: -8.2, maxX: 8.2, minY: -4.15, maxY: 3.2 },
      floorColor: THUNDER_SPIRE.floor,
      wallColor: 0x2f3951,
      frontWallColor: 0x262e42,
      trimColor: THUNDER_SPIRE.lightning,
      pillarColor: 0x4f5d78,
      laneColor: 0x3e4d6b,
      bgLayerColor: 0x89d9ff,
      fgLayerColor: 0x121a27,
      laneY: -2.2,
    });

    const railMat = new THREE.MeshLambertMaterial({ color: THUNDER_SPIRE.slate });
    for (let i = -4; i <= 4; i += 1) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.42, 8.1, 0.14), railMat);
      rail.position.set(i * 2.1, -2.2, -0.92);
      this.add(rail);
    }

    const conductorMat = new THREE.MeshLambertMaterial({ color: 0x5f6b8d });
    for (let i = 0; i < 6; i += 1) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.9, 10), conductorMat);
      rod.position.set(-7.0 + i * 2.85, 1.5, -1.72);
      this.add(rod);
    }

    const arcMat = new THREE.MeshBasicMaterial({
      color: THUNDER_SPIRE.lightning,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 5; i += 1) {
      const arc = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.12), arcMat);
      arc.position.set(-6.2 + i * 3.0, 0.7 + (i % 2) * 0.2, -1.05);
      arc.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.25;
      this.add(arc);
    }
    this._animatedMaterials.push({
      material: arcMat,
      pulse: 8.6,
      minOpacity: 0.1,
      maxOpacity: 0.36,
      phase: 0.2,
    });

    const wolfDen = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.55, 28),
      new THREE.MeshBasicMaterial({
        color: THUNDER_SPIRE.flash,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
      })
    );
    wolfDen.position.set(7.15, -2.1, -0.4);
    this.add(wolfDen);
    this._animatedMaterials.push({
      material: wolfDen.material,
      pulse: 4.8,
      minOpacity: 0.12,
      maxOpacity: 0.34,
      phase: 0.8,
    });

    this.addHazardRect({
      id: 'thunder-lane-top',
      x: -1.0,
      y: -1.03,
      width: 8.2,
      height: 0.64,
      color: THUNDER_SPIRE.lightning,
      damage: 8,
      tick: 0.4,
      activeWhen: 'always',
      pulse: 10.0,
      minOpacity: 0.1,
      maxOpacity: 0.45,
    });
    this.addHazardRect({
      id: 'thunder-lane-bottom',
      x: -1.0,
      y: -3.35,
      width: 8.2,
      height: 0.64,
      color: THUNDER_SPIRE.lightning,
      damage: 8,
      tick: 0.4,
      activeWhen: 'always',
      pulse: 10.0,
      minOpacity: 0.1,
      maxOpacity: 0.45,
    });
    this.addHazardCircle({
      id: 'thunder-storm-node',
      x: 8.8,
      y: -2.2,
      radius: 1.75,
      color: THUNDER_SPIRE.flash,
      damage: 10,
      tick: 0.42,
      activeWhen: 'boss',
      pulse: 9.4,
      minOpacity: 0.16,
      maxOpacity: 0.48,
    });

    this._queueWorldKit();

    // --- Procedural prop backups (always render regardless of GLB availability) ---

    // 5 vertical conductor rods
    const rodMat = new THREE.MeshBasicMaterial({ color: 0x8899bb });
    const rodXPositions = [-7, -3.5, 0, 3.5, 7];
    for (const rodX of rodXPositions) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 5.5, 8), rodMat.clone());
      rod.position.set(rodX, 1.5, -1.8);
      rod.castShadow = false;
      rod.receiveShadow = false;
      this.add(rod);
    }

    // Lightning arc horizontal planes connecting rod pairs
    const arcBackupMat = new THREE.MeshBasicMaterial({
      color: THUNDER_SPIRE.lightning,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const arcPairs = [
      { x: -5.25, y: 1.5 },
      { x: -1.75, y: 1.5 },
      { x: 1.75, y: 1.5 },
      { x: 5.25, y: 1.5 },
    ];
    for (let i = 0; i < arcPairs.length; i += 1) {
      const arc = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.06), arcBackupMat.clone());
      arc.position.set(arcPairs[i].x, arcPairs[i].y, -1.8);
      arc.castShadow = false;
      arc.receiveShadow = false;
      this.add(arc);
      this._animatedMaterials.push({ material: arc.material, pulse: 12.0, minOpacity: 0.06, maxOpacity: 0.3, phase: i * 0.4 });
    }

    // Industrial grate platform
    const grateMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.22, 1.0),
      new THREE.MeshBasicMaterial({ color: 0x2a3040 })
    );
    grateMesh.position.set(-3.5, -1.8, -1.0);
    grateMesh.castShadow = false;
    grateMesh.receiveShadow = false;
    this.add(grateMesh);

    // Storm ring on boss side
    const stormRingMat = new THREE.MeshBasicMaterial({
      color: THUNDER_SPIRE.flash,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const stormRing = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.6, 24), stormRingMat);
    stormRing.position.set(7.2, -2.1, -0.4);
    stormRing.castShadow = false;
    stormRing.receiveShadow = false;
    this.add(stormRing);
    this._animatedMaterials.push({ material: stormRingMat, pulse: 6.5, minOpacity: 0.1, maxOpacity: 0.36, phase: 1.2 });

    // Conduit tubes (horizontal, connecting wall to conductor rods)
    const conduitMat = new THREE.MeshBasicMaterial({ color: 0x3d5080 });
    const conduitPositions = [
      { x: -7.0, y: 0.4 },
      { x: 0.0, y: 0.4 },
      { x: 7.0, y: 0.4 },
    ];
    for (const pos of conduitPositions) {
      const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3.5, 8), conduitMat.clone());
      conduit.rotation.z = Math.PI / 2;
      conduit.position.set(pos.x, pos.y, -1.8);
      conduit.castShadow = false;
      conduit.receiveShadow = false;
      this.add(conduit);
    }

    this.addParallaxLayers();

    return this.group;
  }

  _queueWorldKit() {
    const root = './assets/models/world/thunder-spire';
    const hubRoot = './assets/models/world/hub';

    for (let i = -1; i <= 1; i += 1) {
      this.queueModel(`${root}/floor-large.glb`, {
        x: i * 5.45,
        y: -2.35,
        z: -1.02,
        scale: 0.76,
      });
    }
    for (let i = -1; i <= 1; i += 1) {
      this.queueModel(`${hubRoot}/hub-tile.glb`, {
        x: i * 5.45,
        y: -2.35,
        z: -0.94,
        scale: 0.72,
        tint: THUNDER_SPIRE.flash,
        opacity: 0.92,
      });
    }

    for (let i = -1; i <= 1; i += 1) {
      this.queueModel(`${root}/structure-wall.glb`, {
        x: i * 5.45,
        y: 2.1 + (i % 2) * 0.18,
        z: -2.74,
        scale: 0.72,
      });
    }

    this.queueModel(`${root}/lightning_conductor_rod.glb`, { x: -7.3, y: 0.35, z: -1.85, scale: 0.78 });
    this.queueModel(`${root}/lightning_conductor_rod.glb`, { x: 7.3, y: 0.35, z: -1.85, scale: 0.78 });
    this.queueModel(`${root}/conveyor.glb`, { x: -4.35, y: -1.45, z: -0.98, scale: 0.66 });
    this.queueModel(`${root}/conveyor.glb`, { x: 1.8, y: -2.95, z: -0.98, scale: 0.66 });
    this.queueModel(`${root}/crane.glb`, { x: 7.2, y: 0.65, z: -2.18, scale: 0.66 });
    this.queueModel(`${root}/screen-wide.glb`, { x: 6.8, y: 1.45, z: -1.96, scale: 0.66 });
    this.queueModel('./assets/models/world/city-breach/portal.glb', {
      x: 7.15,
      y: -2.2,
      z: -1.2,
      scale: 0.5,
      tint: THUNDER_SPIRE.lightning,
      emissive: THUNDER_SPIRE.lightning,
      emissiveIntensity: 0.62,
    });
  }
}
