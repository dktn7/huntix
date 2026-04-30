import * as THREE from 'three';
import { Base2DArena } from './Base2DArena.js';

export class HubWorld extends Base2DArena {
  constructor(scene, zoneConfig = null) {
    super(scene, {
      colormapTexture: './assets/textures/props/hub/colormap.png',
      zoneConfig: zoneConfig || {},
      bounds: zoneConfig?.playBounds || zoneConfig?.roomProfile?.bounds,
    });
    this.zoneConfig = zoneConfig || {};
    this.homeSpots = [];
  }

  build() {
    this.setZoneColors({
      deep: 0x20385f,
      far: 0x2b4976,
      mid: 0x416196,
      near: 0x5b82be,
    });

    this.buildFlatWorld2D({
      floorColor: 0x2e4468,
      laneColor: 0x78a8ef,
      backColor: 0x3a5f95,
      ridgeColor: 0x6f97d4,
      silhouetteColor: 0x1a2b44,
      laneOpacity: 0.98,
      backOpacity: 0.94,
      ridgeOpacity: 0.88,
      silhouetteOpacity: 0.5,
    });
    this._buildArchitecturalAnchor();
    this.addParallaxLayers();
    this._addLandmarks();

    return this.group;
  }

  _buildArchitecturalAnchor() {
    const floorBase = new THREE.Mesh(
      new THREE.BoxGeometry(15.8, 7.0, 0.2),
      new THREE.MeshLambertMaterial({ color: 0x1f3355 })
    );
    floorBase.position.set(0, -0.55, -1.28);
    floorBase.renderOrder = -11;
    this.add(floorBase, 'floor');

    const floorInlay = new THREE.Mesh(
      new THREE.PlaneGeometry(15.1, 6.35),
      new THREE.MeshBasicMaterial({
        color: 0x152949,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
      })
    );
    floorInlay.position.set(0, -0.55, -1.16);
    floorInlay.renderOrder = -10;
    this.add(floorInlay, 'floor');

    const logoRing = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.75, 40),
      new THREE.MeshBasicMaterial({
        color: 0x78a4ff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    logoRing.position.set(0, -0.6, -1.12);
    logoRing.renderOrder = -9;
    this.add(logoRing, 'floor');

    const logoCore = new THREE.Mesh(
      new THREE.CircleGeometry(0.82, 28),
      new THREE.MeshBasicMaterial({
        color: 0x1d3f79,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    logoCore.position.set(0, -0.6, -1.1);
    logoCore.renderOrder = -9;
    this.add(logoCore, 'floor');

    const logoBarMaterial = new THREE.MeshBasicMaterial({
      color: 0xb1c8ff,
      transparent: true,
      opacity: 0.56,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (const rotation of [0, Math.PI * 0.5, Math.PI * 0.25, -Math.PI * 0.25]) {
      const bar = new THREE.Mesh(
        new THREE.PlaneGeometry(rotation === 0 || rotation === Math.PI * 0.5 ? 2.35 : 1.85, 0.15),
        logoBarMaterial.clone()
      );
      bar.position.set(0, -0.6, -1.08);
      bar.rotation.z = rotation;
      bar.renderOrder = -8;
      this.add(bar, 'floor');
    }

    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(16.2, 1.15, 1.55),
      new THREE.MeshLambertMaterial({ color: 0x365784 })
    );
    backWall.position.set(0, 2.32, -2.84);
    backWall.renderOrder = -6;
    this.add(backWall, 'walls');

    const rightPortalWall = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 5.55, 1.7),
      new THREE.MeshLambertMaterial({ color: 0x2a466b })
    );
    rightPortalWall.position.set(7.35, -0.35, -2.48);
    rightPortalWall.renderOrder = -5;
    this.add(rightPortalWall, 'walls');

    const quartermasterMass = new THREE.Mesh(
      new THREE.BoxGeometry(2.9, 1.15, 1.05),
      new THREE.MeshLambertMaterial({ color: 0x294466 })
    );
    quartermasterMass.position.set(-7.0, -1.2, -1.65);
    quartermasterMass.renderOrder = -3;
    this.add(quartermasterMass, 'props');

    const operationsTable = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 0.75, 0.72),
      new THREE.MeshLambertMaterial({ color: 0x223a58 })
    );
    operationsTable.position.set(-1.85, -1.05, -1.48);
    operationsTable.renderOrder = -3;
    this.add(operationsTable, 'props');

    const monitorGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 0.34),
      new THREE.MeshBasicMaterial({
        color: 0x7fb4ff,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    monitorGlow.position.set(0, 1.92, -2.0);
    monitorGlow.renderOrder = -4;
    this.add(monitorGlow, 'walls');
  }

  _addLandmarks() {
    if (this.homeSpots.length) return;
    const makeHomeSpot = (x, y, color, tall = false) => {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.52, 0.12, 14),
        new THREE.MeshLambertMaterial({ color: 0x223145 })
      );
      base.position.set(x, y, -0.24);
      this.add(base, 'props');

      const emblem = new THREE.Mesh(
        tall ? new THREE.CylinderGeometry(0.11, 0.11, 1.0, 10) : new THREE.SphereGeometry(0.2, 12, 10),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
        })
      );
      emblem.position.set(x, y + (tall ? 0.62 : 0.2), -0.18);
      this.add(emblem, 'props');
      this.homeSpots.push({ base, emblem });
    };

    makeHomeSpot(-7.95, 0.85, 0x9b59b6, true);
    makeHomeSpot(-4.9, -0.75, 0xf39c12, true);
    makeHomeSpot(1.9, 0.95, 0xf1c40f, false);
    makeHomeSpot(-1.9, -0.75, 0xe74c3c, false);
  }

  buildFallbackWorld() {
    this.setFallbackActive(false);
  }

  update(dt, focusX = 0, routeState = null) {
    super.update(dt, focusX, routeState);
    for (let i = 0; i < this.homeSpots.length; i += 1) {
      const entry = this.homeSpots[i];
      if (!entry?.base || !entry?.emblem) continue;
      const wave = 1 + Math.sin(this._time * 2.2 + i * 1.3) * 0.06;
      entry.emblem.scale.setScalar(wave);
      if (entry.emblem.material?.opacity !== undefined) {
        entry.emblem.material.opacity = 0.54 + Math.sin(this._time * 3.1 + i) * 0.14;
      }
      entry.base.position.z = -entry.base.position.y * 0.01 - 0.25;
      entry.emblem.position.z = -entry.emblem.position.y * 0.01 - 0.19;
    }
  }
}
