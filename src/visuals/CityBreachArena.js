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
    this.addParallaxLayers();
    this.buildWorldFromSource({
      composed: () => this._queueWorldKit(),
      fallback: () => this.buildFallbackWorld(),
    });

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
    this.add(reactorCore, 'props');
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
    this.add(fireGlow, 'props');
    this._animatedMaterials.push({ material: fireGlowMat, pulse: 4.5, minOpacity: 0.12, maxOpacity: 0.32, phase: 0.1 });

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
    this.queueModel(`${root}/debris-1.glb`, { x: -7.8, y: -3.15, z: -0.96, scale: 0.7 });
    this.queueModel(`${root}/sign-highway-wide.glb`, { x: 7.35, y: 2.0, z: -2.24, scale: 0.62 });
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
