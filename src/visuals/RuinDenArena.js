import * as THREE from 'three';
import { Base2DArena } from './Base2DArena.js';
import { RUIN_DEN } from './Palettes.js';

export class RuinDenArena extends Base2DArena {
  constructor(scene, zoneConfig = null) {
    super(scene, {
      colormapTexture: './assets/textures/props/ruin-den/colormap.png',
      zoneConfig: zoneConfig || {},
    });
    this.zoneConfig = zoneConfig || {};
  }

  build() {
    this.setZoneColors({ deep: 0x080604, far: 0x110d0a, mid: 0x1a1410, near: 0x1e1612 });
    this.addParallaxLayers();
    this.buildFlatWorld2D({
      floorColor: 0x3a312c,
      laneColor: 0x766852,
      backColor: 0x1e1612,
      ridgeColor: 0x7b5134,
      silhouetteColor: 0x17120f,
      laneOpacity: 0.93,
      backOpacity: 0.78,
      ridgeOpacity: 0.72,
      silhouetteOpacity: 0.54,
    });

    const fissureMaterial = new THREE.MeshBasicMaterial({
      color: RUIN_DEN.fissure,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
    });
    for (let i = -3; i <= 3; i += 1) {
      const fissure = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.2), fissureMaterial);
      fissure.position.set(i * 2.6, -2.05 + ((i + 1) % 2) * 0.18, -0.92);
      fissure.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.2;
      this.add(fissure, 'props');
    }
    this._animatedMaterials.push({
      material: fissureMaterial,
      pulse: 4.3,
      minOpacity: 0.18,
      maxOpacity: 0.42,
      phase: 0,
    });

    const workLight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 1.2, 10),
      new THREE.MeshBasicMaterial({
        color: 0xd7cab0,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
      })
    );
    workLight.position.set(7.6, 1.2, -1.2);
    this.add(workLight, 'props');
    this._animatedMaterials.push({
      material: workLight.material,
      pulse: 6.6,
      minOpacity: 0.35,
      maxOpacity: 0.8,
      phase: 1.9,
    });

    this.addHazardRect({
      id: 'ruin-crumble-top',
      x: 0.2,
      y: -0.95,
      width: 6.0,
      height: 0.92,
      color: RUIN_DEN.fissure,
      damage: 7,
      tick: 0.5,
      activeWhen: 'waves',
      pulse: 5.1,
    });
    this.addHazardRect({
      id: 'ruin-crumble-bottom',
      x: -0.25,
      y: -3.45,
      width: 6.0,
      height: 0.92,
      color: RUIN_DEN.fissure,
      damage: 7,
      tick: 0.5,
      activeWhen: 'waves',
      pulse: 5.1,
    });
    this.addHazardCircle({
      id: 'ruin-boss-ring',
      x: 8.5,
      y: -2.2,
      radius: 1.9,
      color: RUIN_DEN.fissure,
      damage: 9,
      tick: 0.45,
      activeWhen: 'boss',
      pulse: 7.1,
      minOpacity: 0.2,
      maxOpacity: 0.52,
    });

    const torchGlowMat = new THREE.MeshBasicMaterial({
      color: 0xf4a832,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (const torchX of [-3.8, 3.8]) {
      const glow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 12), torchGlowMat.clone());
      glow.position.set(torchX, -0.9, -1.1);
      glow.castShadow = false;
      glow.receiveShadow = false;
      this.add(glow, 'props');
      this._animatedMaterials.push({ material: glow.material, pulse: 5.8, minOpacity: 0.1, maxOpacity: 0.42, phase: torchX * 0.3 });
    }

    const fissureStreakMat = new THREE.MeshBasicMaterial({
      color: RUIN_DEN.fissure,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const streakAngles = [0.32, -0.28, 0.18, -0.42, 0.25];
    for (let i = 0; i < streakAngles.length; i += 1) {
      const streak = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.06), fissureStreakMat.clone());
      streak.position.set(-6.0 + i * 3.0, 0.5 + (i % 2) * 0.4, -2.4);
      streak.rotation.z = streakAngles[i];
      streak.castShadow = false;
      streak.receiveShadow = false;
      this.add(streak, 'props');
      this._animatedMaterials.push({ material: streak.material, pulse: 4.2, minOpacity: 0.12, maxOpacity: 0.38, phase: i * 0.6 });
    }

    return this.group;
  }

}
