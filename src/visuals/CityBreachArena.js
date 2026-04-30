import * as THREE from 'three';
import { Base2DArena } from './Base2DArena.js';
import { CITY_BREACH } from './Palettes.js';

export class CityBreachArena extends Base2DArena {
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
    this.buildFlatWorld2D({
      floorColor: 0x2a2d36,
      laneColor: 0x5c6d86,
      backColor: 0x151018,
      ridgeColor: 0x3a2320,
      silhouetteColor: 0x11151f,
      laneOpacity: 0.94,
      backOpacity: 0.8,
      ridgeOpacity: 0.72,
      silhouetteOpacity: 0.56,
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

}
