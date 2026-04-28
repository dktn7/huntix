import * as THREE from 'three';
import { Base3DArena } from './Base3DArena.js';

export class HubWorld extends Base3DArena {
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
      deep: 0x08111d,
      far: 0x0f1a2b,
      mid: 0x16243a,
      near: 0x0c1422,
    });

    this._buildArchitecturalAnchor();
    this.addParallaxLayers();
    this.buildWorldFromSource({
      composed: () => this._queueWorldKit(),
      fallback: () => this._buildFallbackWorld(),
    });
    this._addLandmarks();

    return this.group;
  }

  _buildArchitecturalAnchor() {
    const floorBase = new THREE.Mesh(
      new THREE.BoxGeometry(15.8, 7.0, 0.2),
      new THREE.MeshLambertMaterial({ color: 0x263248 })
    );
    floorBase.position.set(0, -0.55, -1.28);
    floorBase.renderOrder = -11;
    this.add(floorBase, 'floor');

    const floorInlay = new THREE.Mesh(
      new THREE.PlaneGeometry(15.1, 6.35),
      new THREE.MeshBasicMaterial({
        color: 0x101925,
        transparent: true,
        opacity: 0.94,
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
      new THREE.MeshLambertMaterial({ color: 0x4b586f })
    );
    backWall.position.set(0, 2.32, -2.84);
    backWall.renderOrder = -6;
    this.add(backWall, 'walls');

    const rightPortalWall = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 5.55, 1.7),
      new THREE.MeshLambertMaterial({ color: 0x36445d })
    );
    rightPortalWall.position.set(7.35, -0.35, -2.48);
    rightPortalWall.renderOrder = -5;
    this.add(rightPortalWall, 'walls');

    const quartermasterMass = new THREE.Mesh(
      new THREE.BoxGeometry(2.9, 1.15, 1.05),
      new THREE.MeshLambertMaterial({ color: 0x2f3d56 })
    );
    quartermasterMass.position.set(-7.0, -1.2, -1.65);
    quartermasterMass.renderOrder = -3;
    this.add(quartermasterMass, 'props');

    const operationsTable = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 0.75, 0.72),
      new THREE.MeshLambertMaterial({ color: 0x202b3e })
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

  _queueWorldKit() {
    const root = this.zoneConfig?.worldSource?.looseAssetRoot || './assets/models/world/hub';

    this.queueModel(`${root}/floorFull.glb`, { x: 0.0, y: -0.55, z: -1.22, scale: 0.78, layer: 'floor' });
    this.queueModel(`${root}/floorHalf.glb`, { x: -5.25, y: -0.55, z: -1.2, scale: 0.72, layer: 'floor' });
    this.queueModel(`${root}/floorHalf.glb`, { x: 5.25, y: -0.55, z: -1.2, scale: 0.72, ry: Math.PI, layer: 'floor' });

    this.queueModel(`${root}/wall.glb`, { x: 0.0, y: 2.25, z: -3.0, scale: 0.66, layer: 'walls' });
    this.queueModel(`${root}/wallWindow.glb`, { x: -5.2, y: 1.82, z: -2.76, scale: 0.62, layer: 'walls' });
    this.queueModel(`${root}/wallWindowSlide.glb`, { x: -2.0, y: 1.78, z: -2.74, scale: 0.62, layer: 'walls' });
    this.queueModel(`${root}/wallDoorwayWide.glb`, { x: 7.05, y: 1.38, z: -2.5, scale: 0.68, ry: Math.PI * 0.5, layer: 'walls' });
    this.queueModel(`${root}/hub-pilar.glb`, { x: -7.95, y: 1.08, z: -2.5, scale: 0.62, layer: 'walls' });
    this.queueModel(`${root}/hub-pilar.glb`, { x: 7.95, y: 1.08, z: -2.5, scale: 0.62, layer: 'walls' });
    this.queueModel(`${root}/futuristic_pilar.glb`, { x: -0.95, y: 1.18, z: -2.42, scale: 0.56, layer: 'walls' });
    this.queueModel(`${root}/futuristic_pilar.glb`, { x: 1.15, y: 1.18, z: -2.42, scale: 0.56, layer: 'walls' });
    this.queueModel(`${root}/paneling.glb`, {
      x: 0.0,
      y: 1.82,
      z: -2.48,
      scale: 0.62,
      tint: 0x9ab9ff,
      emissive: 0x4f6de9,
      emissiveIntensity: 0.3,
      layer: 'walls',
    });

    this.queueModel(`${root}/desk.glb`, { x: -6.95, y: -1.1, z: -1.5, scale: 0.58, layer: 'props' });
    this.queueModel(`${root}/bench.glb`, { x: -4.65, y: -1.02, z: -1.34, scale: 0.58, layer: 'props' });
    this.queueModel(`${root}/table.glb`, { x: -1.65, y: -1.0, z: -1.38, scale: 0.58, layer: 'props' });
    this.queueModel(`${root}/computerScreen.glb`, { x: 1.85, y: 0.96, z: -1.48, scale: 0.54, layer: 'props' });
    this.queueModel(`${root}/weapon-rack.glb`, { x: -7.45, y: 0.82, z: -1.52, scale: 0.54, layer: 'props' });
    this.queueModel(`${root}/weapon-rack.glb`, { x: 7.45, y: 0.18, z: -1.52, scale: 0.54, ry: Math.PI * 0.5, layer: 'props' });
    this.queueModel(`${root}/sideTable.glb`, { x: -1.15, y: 0.92, z: -1.46, scale: 0.5, layer: 'props' });
    this.queueModel(`${root}/speaker.glb`, { x: 6.85, y: 1.2, z: -1.94, scale: 0.48, layer: 'props' });
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

  _buildFallbackWorld() {
    this.addRoomShell(this.zoneConfig.roomProfile || {}, 'fallback');
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
