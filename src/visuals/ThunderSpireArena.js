import * as THREE from 'three';
import { Base2DArena } from './Base2DArena.js';
import { THUNDER_SPIRE } from './Palettes.js';

export class ThunderSpireArena extends Base2DArena {
  constructor(scene, zoneConfig = null) {
    super(scene, {
      colormapTexture: './assets/textures/props/thunder-spire/colormap.png',
      zoneConfig: zoneConfig || {},
    });
    this.zoneConfig = zoneConfig || {};
  }

  build() {
    this.setZoneColors({ deep: 0x050812, far: 0x0a1022, mid: 0x0f1830, near: 0x121e38 });
    this.addParallaxLayers();
    this.buildFlatWorld2D({
      floorColor: 0x24344c,
      laneColor: 0x5e84bd,
      backColor: 0x111b2d,
      ridgeColor: 0x2a4364,
      silhouetteColor: 0x0d1523,
      laneOpacity: 0.95,
      backOpacity: 0.78,
      ridgeOpacity: 0.72,
      silhouetteOpacity: 0.54,
    });

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
      this.add(arc, 'props');
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
    this.add(wolfDen, 'props');
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

    return this.group;
  }

}
