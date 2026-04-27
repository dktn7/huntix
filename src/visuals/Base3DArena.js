import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_COLORMAPS = {
  'city-breach': './assets/textures/props/city-breach/colormap.png',
  'ruin-den': './assets/textures/props/ruin-den/colormap.png',
  'shadow-core': './assets/textures/props/shadow-core/colormap.png',
  'thunder-spire': './assets/textures/props/thunder-spire/colormap.png',
  'hub': './assets/textures/props/hub/colormap.png',
};

export function resolveModelColormapUrl(url, fallbackTexture = MODEL_COLORMAPS['shadow-core']) {
  const normalized = String(url || '').replace(/\\/g, '/').toLowerCase();
  if (!/textures\/colormap\.png$/i.test(normalized)) return url;

  for (const [zoneId, texturePath] of Object.entries(MODEL_COLORMAPS)) {
    if (normalized.includes(`/world/${zoneId}/`) || normalized.includes(`${zoneId}/textures/`)) {
      return texturePath;
    }
  }
  return fallbackTexture;
}

export function createRoomShellMeshes(profile = {}) {
  const bounds = profile.bounds || { minX: -8.3, maxX: 8.3, minY: -4.2, maxY: 3.3 };
  const centerX = ((bounds.minX + bounds.maxX) * 0.5) + (profile.offsetX || 0);
  const centerY = ((bounds.minY + bounds.maxY) * 0.5) + (profile.offsetY || 0);
  const innerWidth = (bounds.maxX - bounds.minX) + (profile.widthPadding ?? 1.0);
  const innerHeight = (bounds.maxY - bounds.minY) + (profile.heightPadding ?? 1.0);
  const floorThickness = profile.floorThickness ?? 0.24;
  const floorZ = profile.floorZ ?? -1.22;
  const wallThickness = profile.wallThickness ?? 0.42;
  const wallDepth = profile.wallDepth ?? 1.04;
  const sideWallDepth = profile.sideWallDepth ?? 0.96;
  const backWallY = bounds.maxY + (profile.backInset ?? 0.6);
  const frontWallY = bounds.minY - (profile.frontInset ?? 0.56);
  const backWallZ = profile.backWallZ ?? (floorZ - 0.58);
  const frontWallZ = profile.frontWallZ ?? (floorZ + 0.34);
  const sideWallZ = profile.sideWallZ ?? (floorZ - 0.45);
  const laneY = profile.laneY ?? -2.2;
  const laneWidth = profile.laneWidth ?? 1.65;

  const floorColor = profile.floorColor ?? 0x1f2432;
  const wallColor = profile.wallColor ?? 0x2b3349;
  const frontWallColor = profile.frontWallColor ?? wallColor;
  const trimColor = profile.trimColor ?? 0x4f5f85;
  const pillarColor = profile.pillarColor ?? 0x38445d;
  const bgLayerColor = profile.bgLayerColor ?? 0x8aa6ff;
  const fgLayerColor = profile.fgLayerColor ?? 0x0f1724;
  const laneColor = profile.laneColor ?? 0x3a4b6e;

  const meshes = [];
  const addMesh = (mesh, renderOrder = -5) => {
    mesh.userData.roomShell = true;
    mesh.renderOrder = renderOrder;
    meshes.push(mesh);
    return mesh;
  };

  // Floor (unlit for flat 2D-in-3D aesthetic)
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(innerWidth, innerHeight, floorThickness),
    new THREE.MeshBasicMaterial({ color: floorColor })
  ), -10).position.set(centerX, centerY, floorZ);

  // Lane marker
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(innerWidth * 0.82, laneWidth, 0.06),
    new THREE.MeshBasicMaterial({ color: laneColor })
  ), -10).position.set(centerX, laneY, floorZ + 0.14);

  // Back wall
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(innerWidth + wallThickness * 2, wallThickness, wallDepth),
    new THREE.MeshBasicMaterial({ color: wallColor })
  ), -5).position.set(centerX, backWallY, backWallZ);

  // Front wall
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(innerWidth + wallThickness * 2, wallThickness, wallDepth),
    new THREE.MeshBasicMaterial({ color: frontWallColor })
  ), -5).position.set(centerX, frontWallY, frontWallZ);

  // Side walls
  const leftWallX = bounds.minX - wallThickness * 0.62;
  const rightWallX = bounds.maxX + wallThickness * 0.62;
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, innerHeight + wallThickness * 2, sideWallDepth),
    new THREE.MeshBasicMaterial({ color: wallColor })
  ), -5).position.set(leftWallX, centerY, sideWallZ);
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, innerHeight + wallThickness * 2, sideWallDepth),
    new THREE.MeshBasicMaterial({ color: wallColor })
  ), -5).position.set(rightWallX, centerY, sideWallZ);

  // Cylinder pillars (replaces box corners for smarter, more detailed geometry)
  const pillarGeo = new THREE.CylinderGeometry(0.28, 0.28, wallDepth * 1.05, 8);
  const pillarMat = new THREE.MeshBasicMaterial({ color: pillarColor });
  for (const x of [leftWallX, rightWallX]) {
    for (const y of [frontWallY, backWallY]) {
      addMesh(new THREE.Mesh(pillarGeo, pillarMat.clone()), -5).position.set(x, y, backWallZ - 0.08);
    }
  }

  // Trim (unlit)
  const trimMat = new THREE.MeshBasicMaterial({ color: trimColor });
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(innerWidth * 0.95, 0.12, 0.05),
    trimMat.clone()
  ), -5).position.set(centerX, backWallY - 0.28, floorZ + 0.18);
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(innerWidth * 0.95, 0.12, 0.05),
    trimMat.clone()
  ), -5).position.set(centerX, frontWallY + 0.28, floorZ + 0.18);
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(0.12, innerHeight * 0.9, 0.05),
    trimMat.clone()
  ), -5).position.set(leftWallX + 0.26, centerY, floorZ + 0.18);
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(0.12, innerHeight * 0.9, 0.05),
    trimMat.clone()
  ), -5).position.set(rightWallX - 0.26, centerY, floorZ + 0.18);

  // Parallax background layer (deep)
  addMesh(new THREE.Mesh(
    new THREE.PlaneGeometry(innerWidth * 0.98, 1.8),
    new THREE.MeshBasicMaterial({
      color: bgLayerColor,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  ), -5).position.set(centerX, backWallY + 0.24, backWallZ - 0.56);

  // Foreground layer
  addMesh(new THREE.Mesh(
    new THREE.PlaneGeometry(innerWidth * 0.96, 1.0),
    new THREE.MeshBasicMaterial({
      color: fgLayerColor,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    })
  ), -1).position.set(centerX, frontWallY - 0.1, frontWallZ + 0.3);

  return meshes;
}

/**
 * Shared logic for zone world building and lightweight environmental hazards.
 * Implements 2D-in-3D aesthetic: 3D world geometry with 2D sprite characters.
 */
export class Base3DArena {
  static modelCache = new Map();

  constructor(scene, options = {}) {
    this.scene = scene;
    this.colormapTexture = options.colormapTexture || MODEL_COLORMAPS['shadow-core'];
    this.loader = new GLTFLoader();
    this.loader.manager.setURLModifier((url) => resolveModelColormapUrl(url, this.colormapTexture));
    this.group = new THREE.Group();
    this.group.visible = false;
    this.hazards = [];
    this._animatedMaterials = [];
    this._zoneColors = null;
    this._time = 0;
    this._pendingLoads = [];
    this.bounds = options.bounds || { minX: -8.3, maxX: 8.3, minY: -4.2, maxY: 3.3 };

    this.scene.add(this.group);
  }

  /** Store zone-specific background gradient colors used by addParallaxLayers(). */
  setZoneColors(colors = {}) {
    this._zoneColors = { ...colors };
    return this;
  }

  build() {
    const { minX, maxX, minY, maxY } = this.bounds;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.addRoomShell();
    this.addParallaxLayers();
    this.addForegroundProps();

    // Smart prop positioning relative to arena center and bounds
    // Platform positioned at arena center, slightly behind players
    this.addProp('platform', { x: centerX, y: centerY - 1.0, z: -0.5, color: 0x4a5a7a, width: 4.0, height: 0.3, depth: 1.5 });

    // Background crates at arena edges for atmosphere
    this.addProp('crate', { x: minX + 2.0, y: maxY - 0.5, z: -1.5, color: 0x3a4a6a });
    this.addProp('crate', { x: maxX - 2.0, y: maxY - 0.5, z: -1.5, color: 0x3a4a6a });

    return this.group;
  }

  add(mesh) {
    this.group.add(mesh);
    return mesh;
  }

  addRoomShell(profile = {}) {
    const meshes = createRoomShellMeshes({ ...profile, bounds: this.bounds });
    for (const mesh of meshes) this.add(mesh);
    return meshes;
  }

  async loadModel(path) {
    if (!Base3DArena.modelCache.has(path)) {
      Base3DArena.modelCache.set(path, new Promise((resolve, reject) => {
        this.loader.load(path, (gltf) => resolve(gltf.scene), null, reject);
      }));
    }

    const source = await Base3DArena.modelCache.get(path);
    return source.clone(true);
  }

  queueModel(path, options = {}) {
    const job = this.loadModel(path)
      .then((model) => {
        if (!model) return null;
        this._applyModelOptions(model, options);
        if (path.includes('portal.glb')) {
          model.traverse((child) => {
            if (child.isMesh) {
              child.renderOrder = 20;
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              for (const mat of mats) { if (mat) mat.depthWrite = false; }
            }
          });
          model.position.y += 0.02;
        }
        this.add(model);
        return model;
      })
      .catch(() => null);

    this._pendingLoads.push(job);
    return job;
  }

  _applyModelOptions(model, options = {}) {
    const {
      x = 0,
      y = 0,
      z = 0,
      sx = 1,
      sy = 1,
      sz = 1,
      scale = null,
      rx = 0,
      ry = 0,
      rz = 0,
      renderOrder = null,
      tint = null,
      emissive = null,
      emissiveIntensity = 0.4,
      transparent = null,
      opacity = null,
    } = options;

    const uniformScale = typeof scale === 'number' ? scale : null;
    const tintColor = tint !== null ? new THREE.Color(tint) : null;
    const emissiveColor = emissive !== null ? new THREE.Color(emissive) : null;
    model.position.set(x, y, z);
    model.rotation.set(rx, ry, rz);
    if (uniformScale !== null) {
      model.scale.set(uniformScale, uniformScale, uniformScale);
    } else {
      model.scale.set(sx, sy, sz);
    }

    model.traverse((child) => {
      if (!child.isMesh) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      const nextMaterials = [];
      for (const material of materials) {
        if (!material) continue;
        const working = material.clone ? material.clone() : material;
        if (tintColor && working.color) working.color.multiply(tintColor);
        if (emissiveColor && 'emissive' in working) {
          working.emissive.copy(emissiveColor);
          working.emissiveIntensity = emissiveIntensity;
        }
        if (transparent !== null) working.transparent = !!transparent;
        if (typeof opacity === 'number') working.opacity = Math.max(0, Math.min(1, opacity));
        nextMaterials.push(working);
      }
      child.material = Array.isArray(child.material) ? nextMaterials : (nextMaterials[0] || child.material);
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = true;
      if (renderOrder !== null) child.renderOrder = renderOrder;
    });
  }

  /**
   * Add parallax background layers at varying Z depths for 2.5D depth illusion.
   * Layers are positioned relative to arena bounds for smart placement.
   * Creates a sense of depth as the camera moves (orthographic camera friendly).
   */
  addParallaxLayers() {
    const { minX, maxX, minY, maxY } = this.bounds;
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const zc = this._zoneColors || {};

    // Deep background layer (far Z) - darkest
    const deepBg = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 1.4, height * 1.4),
      new THREE.MeshBasicMaterial({
        color: zc.deep ?? 0x080c18,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      })
    );
    deepBg.position.set(centerX, centerY, -8.0);
    deepBg.renderOrder = -10;
    deepBg.userData.parallaxLayer = 'deep';
    this.add(deepBg);

    // Far background layer with subtle color
    const farBg = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 1.25, height * 1.25),
      new THREE.MeshBasicMaterial({
        color: zc.far ?? 0x0d1225,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      })
    );
    farBg.position.set(centerX, centerY, -6.0);
    farBg.renderOrder = -10;
    farBg.userData.parallaxLayer = 'far';
    this.add(farBg);

    // Mid background layer
    const midBg = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 1.1, height * 1.1),
      new THREE.MeshBasicMaterial({
        color: zc.mid ?? 0x151b2e,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      })
    );
    midBg.position.set(centerX, centerY, -4.0);
    midBg.renderOrder = -8;
    midBg.userData.parallaxLayer = 'mid';
    this.add(midBg);

    // Near background layer (closest to play field)
    const nearBg = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 1.05, height * 1.05),
      new THREE.MeshBasicMaterial({
        color: zc.near ?? 0x1a2238,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      })
    );
    nearBg.position.set(centerX, centerY, -2.0);
    nearBg.renderOrder = -5;
    nearBg.userData.parallaxLayer = 'near';
    this.add(nearBg);
  }

  /**
   * Add foreground props that create depth by occluding players.
   * These are positioned at Z > player Z to appear in front of sprites.
   * Pillars are positioned at arena sides with Y centered vertically.
   */
  addForegroundProps() {
    const { minX, maxX, minY, maxY } = this.bounds;
    const centerY = (minY + maxY) / 2;
    const arenaHeight = maxY - minY;

    // Left foreground pillar (occludes left side) - vertical cylinder centered in Y
    const leftPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, arenaHeight * 1.5, 8),
      new THREE.MeshBasicMaterial({
        color: 0x0a0e1a,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      })
    );
    leftPillar.position.set(minX - 1.5, centerY, 2.0);
    leftPillar.userData.foregroundProp = true;
    this.add(leftPillar);

    // Right foreground pillar
    const rightPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, arenaHeight * 1.5, 8),
      new THREE.MeshBasicMaterial({
        color: 0x0a0e1a,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      })
    );
    rightPillar.position.set(maxX + 1.5, centerY, 2.0);
    rightPillar.userData.foregroundProp = true;
    this.add(rightPillar);

    // Add foreground crates at smart positions (bottom corners, in front of players)
    const cratePositions = [
      { x: minX + 1.0, y: minY + 0.5, z: 1.5 },
      { x: maxX - 1.0, y: minY + 0.5, z: 1.5 },
    ];
    for (const pos of cratePositions) {
      this.addProp('crate', { ...pos, color: 0x3a4a6a, width: 0.8, height: 0.8, depth: 0.8 });
    }
  }

  /**
   * Add a 3D prop (crate, platform, etc.) positioned relative to arena bounds.
   * @param {string} type - Prop type: 'crate', 'platform', 'pillar'
   * @param {Object} options - Position, size, color options
   */
  addProp(type, options = {}) {
    const { minX, maxX, minY, maxY } = this.bounds;
    const defaults = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: -1.0,
      color: 0x4a5a7a,
    };
    const opts = { ...defaults, ...options };
    let geo;
    switch (type) {
      case 'crate':
        geo = new THREE.BoxGeometry(opts.width || 1.2, opts.height || 1.2, opts.depth || 1.2);
        break;
      case 'platform':
        geo = new THREE.BoxGeometry(opts.width || 3.0, opts.height || 0.3, opts.depth || 1.5);
        break;
      case 'pillar':
        geo = new THREE.CylinderGeometry(opts.radius || 0.3, opts.radius || 0.3, opts.height || 3.0, 8);
        break;
      default:
        return null;
    }
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: opts.color }));
    mesh.position.set(opts.x, opts.y, opts.z);
    return this.add(mesh);
  }

  addFloorRect(width, height, color, y = -2.25, z = -1.18) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, 0.12),
      new THREE.MeshBasicMaterial({ color })
    );
    mesh.position.set(0, y, z);
    mesh.renderOrder = -10;
    return this.add(mesh);
  }

  addBackWall(width, height, color, y = 1.9, z = -2.5) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, 0.58),
      new THREE.MeshBasicMaterial({ color })
    );
    mesh.position.set(0, y, z);
    mesh.renderOrder = -5;
    return this.add(mesh);
  }

  addHazardRect({
    id,
    x,
    y,
    width,
    height,
    color = 0xff5533,
    damage = 8,
    tick = 0.45,
    activeWhen = 'always',
    pulse = 7.5,
    minOpacity = 0.22,
    maxOpacity = 0.48,
  }) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: minOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      mat
    );
    mesh.position.set(x, y, -0.12);
    this.add(mesh);
    this._animatedMaterials.push({ material: mat, pulse, minOpacity, maxOpacity, phase: x * 0.37 + y * 0.11 });

    this.hazards.push({
      id,
      shape: 'rect',
      x,
      y,
      width,
      height,
      damage,
      tick,
      activeWhen,
      mesh,
    });
  }

  addHazardCircle({
    id,
    x,
    y,
    radius,
    color = 0x7f4dff,
    damage = 8,
    tick = 0.45,
    activeWhen = 'always',
    pulse = 8.5,
    minOpacity = 0.2,
    maxOpacity = 0.45,
  }) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: minOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 24),
      mat
    );
    mesh.position.set(x, y, -0.12);
    this.add(mesh);
    this._animatedMaterials.push({ material: mat, pulse, minOpacity, maxOpacity, phase: x * 0.23 - y * 0.13 });

    this.hazards.push({
      id,
      shape: 'circle',
      x,
      y,
      radius,
      damage,
      tick,
      activeWhen,
      mesh,
    });
  }

  getActiveHazards(routeState = null) {
    if (!this.hazards.length) return [];
    const zoneState = routeState?.zoneState || 'waves';
    return this.hazards.filter(hazard => {
      if (hazard.activeWhen === 'always') return true;
      if (hazard.activeWhen === 'boss') return zoneState === 'boss';
      if (hazard.activeWhen === 'waves') return zoneState === 'waves';
      return true;
    });
  }

  update(dt) {
    this._time += dt;
    for (const entry of this._animatedMaterials) {
      const wave = (Math.sin((this._time + entry.phase) * entry.pulse) + 1) * 0.5;
      entry.material.opacity = entry.minOpacity + wave * (entry.maxOpacity - entry.minOpacity);
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose?.();
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material?.dispose?.());
        } else {
          child.material?.dispose?.();
        }
      }
    });
  }
}
