import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_COLORMAPS = {
  'city-breach': './assets/textures/props/city-breach/colormap.png',
  'ruin-den': './assets/textures/props/ruin-den/colormap.png',
  'shadow-core': './assets/textures/props/shadow-core/colormap.png',
  'thunder-spire': './assets/textures/props/thunder-spire/colormap.png',
  'hub': './assets/textures/props/hub/colormap.png',
};
const PARALLAX_TEXTURE_CACHE = new Map();
const parallaxTextureLoader = new THREE.TextureLoader();

function darkenHex(hex, amount = 0.26) {
  const color = new THREE.Color(hex);
  color.multiplyScalar(Math.max(0, Math.min(1, 1 - amount)));
  return color.getHex();
}

function createLitMaterial(color, options = {}) {
  const material = new THREE.MeshLambertMaterial({
    color,
    transparent: !!options.transparent,
    opacity: options.opacity ?? 1,
  });
  if (options.blending) material.blending = options.blending;
  if (options.depthWrite === false) material.depthWrite = false;
  return material;
}

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

  // Floor
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(innerWidth, innerHeight, floorThickness),
    createLitMaterial(floorColor)
  ), -10).position.set(centerX, centerY, floorZ);

  // Lane marker
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(innerWidth * 0.82, laneWidth, 0.06),
    createLitMaterial(laneColor)
  ), -10).position.set(centerX, laneY, floorZ + 0.14);

  // Back wall
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(innerWidth + wallThickness * 2, wallThickness, wallDepth),
    createLitMaterial(wallColor)
  ), -5).position.set(centerX, backWallY, backWallZ);

  // Front wall
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(innerWidth + wallThickness * 2, wallThickness, wallDepth),
    createLitMaterial(frontWallColor)
  ), -5).position.set(centerX, frontWallY, frontWallZ);

  // Side walls
  const leftWallX = bounds.minX - wallThickness * 0.62;
  const rightWallX = bounds.maxX + wallThickness * 0.62;
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, innerHeight + wallThickness * 2, sideWallDepth),
    createLitMaterial(wallColor)
  ), -5).position.set(leftWallX, centerY, sideWallZ);
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, innerHeight + wallThickness * 2, sideWallDepth),
    createLitMaterial(wallColor)
  ), -5).position.set(rightWallX, centerY, sideWallZ);

  // Cylinder pillars
  const pillarGeo = new THREE.CylinderGeometry(0.28, 0.28, wallDepth * 1.05, 8);
  const pillarMat = createLitMaterial(pillarColor);
  for (const x of [leftWallX, rightWallX]) {
    for (const y of [frontWallY, backWallY]) {
      addMesh(new THREE.Mesh(pillarGeo, pillarMat.clone()), -5).position.set(x, y, backWallZ - 0.08);
    }
  }

  // Trim
  const trimMat = createLitMaterial(trimColor);
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

  const undersideColor = darkenHex(wallColor, 0.35);
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(innerWidth + wallThickness * 1.7, 0.08, 0.12),
    createLitMaterial(undersideColor)
  ), -4).position.set(centerX, backWallY - 0.18, backWallZ + 0.35);
  addMesh(new THREE.Mesh(
    new THREE.BoxGeometry(innerWidth + wallThickness * 1.7, 0.08, 0.12),
    createLitMaterial(darkenHex(frontWallColor, 0.38))
  ), -4).position.set(centerX, frontWallY + 0.18, frontWallZ + 0.35);

  // Parallax background layer (deep)
  addMesh(new THREE.Mesh(
    new THREE.PlaneGeometry(innerWidth * 0.98, 1.8),
    createLitMaterial(bgLayerColor, {
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  ), -5).position.set(centerX, backWallY + 0.24, backWallZ - 0.56);

  // Foreground layer
  addMesh(new THREE.Mesh(
    new THREE.PlaneGeometry(innerWidth * 0.96, 1.0),
    createLitMaterial(fgLayerColor, {
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    })
  ), -1).position.set(centerX, frontWallY - 0.1, frontWallZ + 0.3);

  return meshes;
}

export class Base3DArena {
  static modelCache = new Map();

  constructor(scene, options = {}) {
    this.scene = scene;
    this.zoneConfig = options.zoneConfig || {};
    this.colormapTexture = options.colormapTexture || MODEL_COLORMAPS['shadow-core'];
    this.loader = new GLTFLoader();
    this.loader.manager.setURLModifier((url) => resolveModelColormapUrl(url, this.colormapTexture));
    this.group = new THREE.Group();
    this.group.visible = false;
    this.hazards = [];
    this._animatedMaterials = [];
    this._zoneColors = null;
    this._time = 0;
    this._zoneState = 'waves';
    this._pendingLoads = [];
    this._parallaxLayers = [];
    this._parallaxTextureJobs = [];
    this._parallaxProfile = this.zoneConfig.parallaxProfile || { layers: [] };
    this._visualScaleProfile = this.zoneConfig.visualScaleProfile || {};
    this.bounds = options.bounds || { minX: -8.3, maxX: 8.3, minY: -4.2, maxY: 3.3 };

    this.scene.add(this.group);
  }

  /** Call this when the zone transitions to boss phase so hazards become visible. */
  setZoneState(state) {
    this._zoneState = state;
    this._syncHazardVisibility();
  }

  _syncHazardVisibility() {
    for (const hazard of this.hazards) {
      let visible = false;
      if (hazard.activeWhen === 'always') visible = true;
      else if (hazard.activeWhen === 'boss') visible = this._zoneState === 'boss';
      else if (hazard.activeWhen === 'waves') visible = this._zoneState === 'waves';
      hazard.mesh.visible = visible;
      // Also pause/resume animation to avoid opacity bleed when hidden
      hazard._animEntry.paused = !visible;
    }
  }

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

    this.addProp('platform', { x: centerX, y: centerY - 1.0, z: -0.5, color: 0x4a5a7a, width: 4.0, height: 0.3, depth: 1.5 });
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
        this._applyModelOptions(model, { ...options, sourcePath: path });
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
      x = 0, y = 0, z = 0,
      sx = 1, sy = 1, sz = 1,
      scale = null,
      rx = 0, ry = 0, rz = 0,
      renderOrder = null,
      tint = null,
      emissive = null,
      emissiveIntensity = 0.4,
      transparent = null,
      opacity = null,
      visualRole = null,
      sourcePath = '',
    } = options;

    const uniformScale = typeof scale === 'number' ? scale : null;
    const tintColor = tint !== null ? new THREE.Color(tint) : null;
    const emissiveColor = emissive !== null ? new THREE.Color(emissive) : null;
    const resolvedRole = visualRole || this._resolveVisualRole(sourcePath);
    const scaleMultiplier = this._resolveVisualScaleMultiplier(resolvedRole);
    const effectiveScale = uniformScale !== null ? uniformScale * scaleMultiplier : null;
    model.position.set(x, y, z);
    model.rotation.set(rx, ry, rz);
    if (effectiveScale !== null) {
      model.scale.set(effectiveScale, effectiveScale, effectiveScale);
    } else {
      model.scale.set(sx * scaleMultiplier, sy * scaleMultiplier, sz * scaleMultiplier);
    }

    model.traverse((child) => {
      if (!child.isMesh) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      const nextMaterials = [];
      for (const material of materials) {
        if (!material) continue;
        let working = material.clone ? material.clone() : material;
        if (resolvedRole === 'structure' && working.isMeshBasicMaterial) {
          working = new THREE.MeshLambertMaterial({
            color: working.color || new THREE.Color(0xffffff),
            map: working.map || null,
            transparent: working.transparent,
            opacity: working.opacity,
            depthWrite: working.depthWrite,
          });
        }
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

  _resolveVisualRole(sourcePath = '') {
    const normalized = String(sourcePath || '').toLowerCase();
    if (normalized.includes('portal')) return 'portal';
    if (/(building|wall|tower|spire|column|structure|bridge|crane)/.test(normalized)) return 'structure';
    return 'prop';
  }

  _resolveVisualScaleMultiplier(role = 'prop') {
    const profile = this._visualScaleProfile || {};
    const world = Number.isFinite(profile.worldModelScale) ? profile.worldModelScale : 1.08;
    if (role === 'structure') {
      const structure = Number.isFinite(profile.structureScale) ? profile.structureScale : 1.26;
      return world * structure;
    }
    if (role === 'portal') {
      return world * 0.96;
    }
    const props = Number.isFinite(profile.propScale) ? profile.propScale : 1.12;
    return world * props;
  }

  addParallaxLayers() {
    const { minX, maxX, minY, maxY } = this.bounds;
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const zc = this._zoneColors || {};
    this._parallaxLayers.length = 0;
    const fallbackLayers = [
      { id: 'background', z: -20, speed: 0.05, opacity: 0.9, tint: zc.deep ?? 0x080c18 },
      { id: 'midground', z: -8, speed: 0.3, opacity: 0.7, tint: zc.mid ?? 0x151b2e },
      { id: 'foreground', z: -1, speed: 0.8, opacity: 0.45, tint: zc.near ?? 0x1a2238 },
    ];
    const configuredLayers = this._parallaxProfile?.layers?.length ? this._parallaxProfile.layers : fallbackLayers;

    for (const layer of configuredLayers) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 1.45, height * 1.45),
        new THREE.MeshBasicMaterial({
          color: layer.tint ?? 0xffffff,
          transparent: true,
          opacity: layer.opacity ?? 0.7,
          depthWrite: false,
        })
      );
      mesh.position.set(centerX, centerY, layer.z ?? -8);
      mesh.renderOrder = mesh.position.z <= -8 ? -10 : mesh.position.z <= -2 ? -8 : -5;
      mesh.userData.parallaxLayer = layer.id || 'layer';
      this.add(mesh);
      this._parallaxLayers.push({
        id: layer.id || 'layer',
        mesh,
        baseX: centerX,
        speed: Number.isFinite(layer.speed) ? layer.speed : 0,
      });
      if (layer.texture) this._queueParallaxTexture(layer.texture, mesh.material);
    }
  }

  _queueParallaxTexture(path, material) {
    if (!material || !path) return;
    const normalized = String(path);
    if (!PARALLAX_TEXTURE_CACHE.has(normalized)) {
      const pending = new Promise((resolve, reject) => {
        parallaxTextureLoader.load(normalized, resolve, undefined, reject);
      }).then((texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        return texture;
      });
      PARALLAX_TEXTURE_CACHE.set(normalized, pending);
    }

    const job = PARALLAX_TEXTURE_CACHE.get(normalized)
      .then((texture) => {
        if (!texture) return;
        material.map = texture.clone();
        material.map.needsUpdate = true;
        material.color.setHex(0xffffff);
        material.needsUpdate = true;
      })
      .catch(() => {
        // Keep tint-only fallback if the texture is unavailable.
      });

    this._parallaxTextureJobs.push(job);
  }

  addForegroundProps() {
    const { minX, maxX, minY, maxY } = this.bounds;
    const centerY = (minY + maxY) / 2;
    const arenaHeight = maxY - minY;

    const leftPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, arenaHeight * 1.5, 8),
      createLitMaterial(0x0a0e1a, { transparent: true, opacity: 0.6, depthWrite: false })
    );
    leftPillar.position.set(minX - 1.5, centerY, 2.0);
    leftPillar.userData.foregroundProp = true;
    this.add(leftPillar);

    const rightPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, arenaHeight * 1.5, 8),
      createLitMaterial(0x0a0e1a, { transparent: true, opacity: 0.6, depthWrite: false })
    );
    rightPillar.position.set(maxX + 1.5, centerY, 2.0);
    rightPillar.userData.foregroundProp = true;
    this.add(rightPillar);

    const cratePositions = [
      { x: minX + 1.0, y: minY + 0.5, z: 1.5 },
      { x: maxX - 1.0, y: minY + 0.5, z: 1.5 },
    ];
    for (const pos of cratePositions) {
      this.addProp('crate', { ...pos, color: 0x3a4a6a, width: 0.8, height: 0.8, depth: 0.8 });
    }
  }

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
    const mesh = new THREE.Mesh(geo, createLitMaterial(opts.color));
    mesh.position.set(opts.x, opts.y, opts.z);
    if (opts.depthEdge !== false && type !== 'pillar') {
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry((opts.width || 1.2) * 0.92, 0.06, Math.max(0.04, (opts.depth || 1.2) * 0.08)),
        createLitMaterial(darkenHex(opts.color, 0.45))
      );
      edge.position.set(0, -(opts.height || 1.2) * 0.44, (opts.depth || 1.2) * 0.42);
      mesh.add(edge);
    }
    return this.add(mesh);
  }

  addFloorRect(width, height, color, y = -2.25, z = -1.18) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, 0.12),
      createLitMaterial(color)
    );
    mesh.position.set(0, y, z);
    mesh.renderOrder = -10;
    return this.add(mesh);
  }

  addBackWall(width, height, color, y = 1.9, z = -2.5) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, 0.58),
      createLitMaterial(color)
    );
    mesh.position.set(0, y, z);
    mesh.renderOrder = -5;
    return this.add(mesh);
  }

  addHazardRect({
    id, x, y, width, height,
    color = 0xff5533, damage = 8, tick = 0.45,
    activeWhen = 'always', pulse = 7.5,
    minOpacity = 0.22, maxOpacity = 0.48,
  }) {
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: minOpacity,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
    mesh.position.set(x, y, -0.12);
    // Hide immediately if not always-active
    mesh.visible = activeWhen === 'always';
    this.add(mesh);
    const animEntry = { material: mat, pulse, minOpacity, maxOpacity, phase: x * 0.37 + y * 0.11, paused: activeWhen !== 'always' };
    this._animatedMaterials.push(animEntry);
    this.hazards.push({ id, shape: 'rect', x, y, width, height, damage, tick, activeWhen, mesh, _animEntry: animEntry });
  }

  addHazardCircle({
    id, x, y, radius,
    color = 0x7f4dff, damage = 8, tick = 0.45,
    activeWhen = 'always', pulse = 8.5,
    minOpacity = 0.2, maxOpacity = 0.45,
  }) {
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: minOpacity,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 24), mat);
    mesh.position.set(x, y, -0.12);
    // Hide immediately if not always-active
    mesh.visible = activeWhen === 'always';
    this.add(mesh);
    const animEntry = { material: mat, pulse, minOpacity, maxOpacity, phase: x * 0.23 - y * 0.13, paused: activeWhen !== 'always' };
    this._animatedMaterials.push(animEntry);
    this.hazards.push({ id, shape: 'circle', x, y, radius, damage, tick, activeWhen, mesh, _animEntry: animEntry });
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

  update(dt, focusX = 0, routeState = null) {
    this._time += dt;
    if (routeState?.zoneState && routeState.zoneState !== this._zoneState) {
      this.setZoneState(routeState.zoneState);
    }

    for (const layer of this._parallaxLayers) {
      const offsetX = focusX * layer.speed;
      layer.mesh.position.x = layer.baseX + offsetX;
      if (layer.mesh.material?.map) {
        layer.mesh.material.map.offset.x = -offsetX * 0.01;
      }
    }

    for (const entry of this._animatedMaterials) {
      if (entry.paused) continue;
      const wave = (Math.sin((this._time + entry.phase) * entry.pulse) + 1) * 0.5;
      entry.material.opacity = entry.minOpacity + wave * (entry.maxOpacity - entry.minOpacity);
    }
  }

  getParallaxDebugInfo() {
    return this._parallaxLayers.map((layer) => ({
      id: layer.id,
      speed: layer.speed,
      x: layer.mesh.position.x,
      baseX: layer.baseX,
    }));
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose?.();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m?.dispose?.());
        } else {
          child.material?.dispose?.();
        }
      }
    });
    this._parallaxLayers.length = 0;
    this._parallaxTextureJobs.length = 0;
  }
}
