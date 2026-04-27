import * as THREE from 'three';
import { Base3DArena } from './Base3DArena.js';
import { CITY_BREACH } from './Palettes.js';

export class CityBreachArena extends Base3DArena {
  constructor(scene, zoneConfig = null) {
    super(scene, {
      colormapTexture: './assets/textures/props/city-breach/colormap.png',
      zoneConfig: zoneConfig || {},
    });
    this.zoneConfig = zoneConfig || {};
  }

  build() {
    this.setZoneColors({ deep: 0x050509, far: 0x0d0a14, mid: 0x111018, near: 0x1a0f0a });

    this.addRoomShell(this.zoneConfig.roomProfile || {
      bounds: { minX: -8.25, maxX: 8.25, minY: -4.25, maxY: 3.25 },
      floorColor: CITY_BREACH.charcoal,
      wallColor: 0x2f3444,
      frontWallColor: 0x252b37,
      trimColor: 0xe58a2d,
      pillarColor: 0x3a3643,
      laneColor: 0x465061,
      bgLayerColor: 0xff8f5b,
      fgLayerColor: 0x141923,
      laneY: -2.2,
    });

    const laneStripeMaterial = new THREE.MeshLambertMaterial({ color: 0x7a6f65 });
    for (let i = -3; i <= 3; i += 1) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.22, 0.03), laneStripeMaterial);
      stripe.position.set(i * 2.45, -2.14, -0.92);
      this.add(stripe);
    }

    const collapseMaterial = new THREE.MeshLambertMaterial({ color: 0x2f2f3a });
    for (let i = 0; i < 4; i += 1) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.8, 0.7), collapseMaterial);
      slab.position.set(-7.25 + i * 0.6, -0.75 + (i % 2) * 0.28, -1.45 - i * 0.03);
      slab.rotation.z = -0.22 + i * 0.06;
      this.add(slab);
    }

    const warningMaterial = new THREE.MeshLambertMaterial({ color: 0xe58a2d });
    for (let i = 0; i < 6; i += 1) {
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.84, 0.16), warningMaterial);
      barrier.position.set(-6.95 + i * 0.74, 0.15 + ((i + 1) % 2) * 0.22, -1.08);
      this.add(barrier);
    }

    const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3643 });
    for (let i = 0; i < 3; i += 1) {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.8, 0.9), towerMaterial);
      tower.position.set(5.7 + i * 0.9, 1.1, -1.78 - i * 0.04);
      this.add(tower);
    }

    const reactorCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 2.2, 16),
      new THREE.MeshBasicMaterial({
        color: CITY_BREACH.gateFire,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      })
    );
    reactorCore.position.set(7.2, -2.2, -0.82);
    this.add(reactorCore);
    this._animatedMaterials.push({
      material: reactorCore.material,
      pulse: 4.5,
      minOpacity: 0.5,
      maxOpacity: 0.9,
      phase: 0,
    });

    this.addHazardCircle({
      id: 'city-reactor-vent-top',
      x: 6.2,
      y: -0.9,
      radius: 1.2,
      color: CITY_BREACH.gateFire,
      damage: 6,
      tick: 0.6,
      activeWhen: 'boss',
    });
    this.addHazardCircle({
      id: 'city-reactor-vent-bottom',
      x: 6.2,
      y: -3.45,
      radius: 1.2,
      color: CITY_BREACH.gateFire,
      damage: 6,
      tick: 0.6,
      activeWhen: 'boss',
    });
    this.addHazardRect({
      id: 'city-breach-line',
      x: 7.2,
      y: -2.2,
      width: 2.1,
      height: 1.15,
      color: CITY_BREACH.gateFireDeep,
      damage: 7,
      tick: 0.55,
      activeWhen: 'boss',
      pulse: 5.8,
    });

    this._queueWorldKit();

    // --- Procedural prop backups (always render regardless of GLB availability) ---

    // 3 tall building silhouettes
    const buildingMat = new THREE.MeshBasicMaterial({ color: 0x2a2a36 });
    for (const buildingX of [-6, 0, 6]) {
      const building = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.5, 0.5), buildingMat.clone());
      building.position.set(buildingX, 2.5, -2.8);
      building.castShadow = false;
      building.receiveShadow = false;
      this.add(building);
    }

    // Rubble piles at arena corners
    const rubbleMat = new THREE.MeshBasicMaterial({ color: 0x383838 });
    const rubbleCorners = [
      { x: -7.5, y: -3.8, rz: 0.18 },
      { x: 7.5, y: -3.8, rz: -0.18 },
      { x: -7.5, y: 2.7, rz: -0.12 },
      { x: 7.5, y: 2.7, rz: 0.12 },
    ];
    for (const pos of rubbleCorners) {
      const rubble = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.8), rubbleMat.clone());
      rubble.position.set(pos.x, pos.y, -1.0);
      rubble.rotation.z = pos.rz;
      rubble.castShadow = false;
      rubble.receiveShadow = false;
      this.add(rubble);
    }

    // Pulsing neon billboard (AdditiveBlending)
    const billboardMat = new THREE.MeshBasicMaterial({
      color: CITY_BREACH.neonMagenta,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const billboard = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.2), billboardMat);
    billboard.position.set(7.0, 2.2, -2.2);
    billboard.castShadow = false;
    billboard.receiveShadow = false;
    this.add(billboard);
    this._animatedMaterials.push({ material: billboardMat, pulse: 5.5, minOpacity: 0.06, maxOpacity: 0.22, phase: 0.5 });

    // Orange fire glow disc at reactor position
    const fireGlowMat = new THREE.MeshBasicMaterial({
      color: CITY_BREACH.gateFire,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const fireGlow = new THREE.Mesh(new THREE.CircleGeometry(0.9, 16), fireGlowMat);
    fireGlow.position.set(7.2, -2.2, -0.8);
    fireGlow.castShadow = false;
    fireGlow.receiveShadow = false;
    this.add(fireGlow);
    this._animatedMaterials.push({ material: fireGlowMat, pulse: 4.5, minOpacity: 0.12, maxOpacity: 0.32, phase: 0.1 });

    this.addParallaxLayers();

    return this.group;
  }

  _queueWorldKit() {
    const root = './assets/models/world/city-breach';

    for (let i = -1; i <= 1; i += 1) {
      this.queueModel(`${root}/tile-low.glb`, {
        x: i * 5.4,
        y: -2.28,
        z: -1.02,
        scale: 0.66,
        tint: 0xf4bc82,
      });
    }

    for (let i = -1; i <= 1; i += 1) {
      this.queueModel(`${root}/road-straight.glb`, {
        x: i * 5.4,
        y: -2.25,
        z: -0.96,
        scale: 0.55,
        tint: 0xf0c08f,
      });
    }

    for (let i = -1; i <= 1; i += 1) {
      this.queueModel(`${root}/BuildingBlock_1.glb`, {
        x: i * 5.45,
        y: 2.0 + (i % 2) * 0.16,
        z: -2.72,
        scale: 0.62,
      });
    }
    this.queueModel(`${root}/BuildingBlock_24.glb`, { x: -7.5, y: 1.55, z: -2.46, scale: 0.66 });
    this.queueModel(`${root}/Building_3.glb`, { x: 7.55, y: 1.4, z: -2.58, scale: 0.64 });
    this.queueModel(`${root}/BuildingBlock_2.glb`, { x: 0.0, y: 1.75, z: -2.64, scale: 0.64 });

    this.queueModel(`${root}/bridge-pillar.glb`, { x: -7.9, y: 0.9, z: -2.26, scale: 0.74 });
    this.queueModel(`${root}/bridge-pillar.glb`, { x: 7.9, y: 0.9, z: -2.26, scale: 0.74 });
    this.queueModel(`${root}/construction-barrier.glb`, { x: -6.75, y: -1.4, z: -0.9, scale: 0.72 });
    this.queueModel(`${root}/construction-barrier.glb`, { x: -5.55, y: -2.95, z: -0.9, scale: 0.72, rz: Math.PI * 0.02 });
    this.queueModel(`${root}/dustbin.glb`, { x: -7.8, y: -3.15, z: -0.96, scale: 0.76 });
    this.queueModel(`${root}/neon-sign.glb`, { x: 7.35, y: 2.0, z: -2.24, scale: 0.56 });
    this.queueModel(`${root}/portal.glb`, {
      x: 7.2,
      y: -2.25,
      z: -1.2,
      scale: 0.56,
      tint: CITY_BREACH.gateFire,
      emissive: CITY_BREACH.gateFire,
      emissiveIntensity: 0.55,
    });
  }
}
