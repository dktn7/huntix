import * as THREE from 'three';

const PARALLAX_TEXTURE_CACHE = new Map();
const parallaxTextureLoader = new THREE.TextureLoader();
const SURFACE_TEXTURE_CACHE = new Map();
const surfaceTextureLoader = new THREE.TextureLoader();
const WORLD_LAYER_ORDER = ['floor', 'walls', 'props', 'hazards', 'fallback', 'parallax'];

function isColormapTexture(path = '') {
  const normalized = String(path || '').replace(/\\/g, '/').toLowerCase();
  return /\/colormap\.png$/i.test(normalized);
}

export function shouldUseParallaxTexture(path = '') {
  return !!path && !isColormapTexture(path);
}

export function getParallaxLayerMetrics(bounds, layer = {}) {
  const arenaWidth = bounds.maxX - bounds.minX;
  const arenaHeight = bounds.maxY - bounds.minY;
  const centerX = (bounds.minX + bounds.maxX) * 0.5;
  const layerId = layer.id || 'layer';

  const presets = {
    background: { widthScale: 1.34, heightScale: 0.58, anchorY: 0.84, z: -20, opacity: 0.42, renderOrder: -12 },
    midground: { widthScale: 1.24, heightScale: 0.46, anchorY: 0.72, z: -8.4, opacity: 0.35, renderOrder: -9 },
    foreground: { widthScale: 1.18, heightScale: 0.24, anchorY: 0.12, z: -0.72, opacity: 0.28, renderOrder: -4 },
    layer: { widthScale: 1.24, heightScale: 0.42, anchorY: 0.72, z: -8, opacity: 0.34, renderOrder: -8 },
  };
  const preset = presets[layerId] || presets.layer;
  const opacity = Number.isFinite(layer.opacity) ? Math.max(0.08, Math.min(layer.opacity, 1)) : preset.opacity;

  return {
    x: centerX + (layer.offsetX || 0),
    y: bounds.minY + arenaHeight * ((layer.anchorY ?? preset.anchorY)) + (layer.offsetY || 0),
    z: Number.isFinite(layer.z) ? layer.z : preset.z,
    width: arenaWidth * (layer.widthScale ?? preset.widthScale),
    height: arenaHeight * (layer.heightScale ?? preset.heightScale),
    opacity,
    renderOrder: Number.isFinite(layer.renderOrder) ? layer.renderOrder : preset.renderOrder,
    baseX: centerX,
  };
}

function queueSurfaceTexture(path, material, options = {}) {
  if (!material || !path) return;
  const key = String(path);
  if (!SURFACE_TEXTURE_CACHE.has(key)) {
    const pending = new Promise((resolve, reject) => {
      surfaceTextureLoader.load(key, resolve, undefined, reject);
    }).then((texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      return texture;
    });
    SURFACE_TEXTURE_CACHE.set(key, pending);
  }

  SURFACE_TEXTURE_CACHE.get(key)
    .then((texture) => {
      const map = texture.clone();
      const repeatX = Number.isFinite(options.repeatX) ? Math.max(0.01, options.repeatX) : 1;
      const repeatY = Number.isFinite(options.repeatY) ? Math.max(0.01, options.repeatY) : 1;
      map.repeat.set(repeatX, repeatY);
      map.rotation = Number.isFinite(options.rotation) ? options.rotation : 0;
      map.needsUpdate = true;
      material.map = map;
      if (material.color) material.color.setHex(Number.isFinite(options.baseColor) ? options.baseColor : 0xffffff);
      material.needsUpdate = true;
    })
    .catch(() => {});
}

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
  const floorTexture = shouldUseParallaxTexture(profile.floorTexture) ? profile.floorTexture : null;
  const floorTextureRepeatX = profile.floorTextureRepeatX ?? 6;
  const floorTextureRepeatY = profile.floorTextureRepeatY ?? 3;
  const floorTextureRotation = profile.floorTextureRotation ?? 0;

  const meshes = [];
  const addMesh = (mesh, renderOrder = -5) => {
    mesh.userData.roomShell = true;
    mesh.renderOrder = renderOrder;
    meshes.push(mesh);
    return mesh;
  };

  const floorMesh = addMesh(new THREE.Mesh(new THREE.BoxGeometry(innerWidth, innerHeight, floorThickness), createLitMaterial(floorColor)), -10);
  floorMesh.position.set(centerX, centerY, floorZ);

  const floorSurfaceMaterial = createLitMaterial(floorColor, { transparent: true, opacity: 0.98, depthWrite: false });
  const floorSurface = addMesh(new THREE.Mesh(new THREE.PlaneGeometry(innerWidth * 0.99, innerHeight * 0.99), floorSurfaceMaterial), -9);
  floorSurface.position.set(centerX, centerY, floorZ + (floorThickness * 0.5) + 0.01);
  if (floorTexture) {
    queueSurfaceTexture(floorTexture, floorSurfaceMaterial, {
      repeatX: floorTextureRepeatX,
      repeatY: floorTextureRepeatY,
      rotation: floorTextureRotation,
      baseColor: 0xffffff,
    });
  }

  addMesh(new THREE.Mesh(new THREE.BoxGeometry(innerWidth * 0.82, laneWidth, 0.06), createLitMaterial(laneColor)), -10)
    .position.set(centerX, laneY, floorZ + 0.14);
  addMesh(new THREE.Mesh(new THREE.BoxGeometry(innerWidth + wallThickness * 2, wallThickness, wallDepth), createLitMaterial(wallColor)), -5)
    .position.set(centerX, backWallY, backWallZ);
  addMesh(new THREE.Mesh(new THREE.BoxGeometry(innerWidth + wallThickness * 2, wallThickness, wallDepth), createLitMaterial(frontWallColor)), -5)
    .position.set(centerX, frontWallY, frontWallZ);

  const leftWallX = bounds.minX - wallThickness * 0.62;
  const rightWallX = bounds.maxX + wallThickness * 0.62;
  addMesh(new THREE.Mesh(new THREE.BoxGeometry(wallThickness, innerHeight + wallThickness * 2, sideWallDepth), createLitMaterial(wallColor)), -5)
    .position.set(leftWallX, centerY, sideWallZ);
  addMesh(new THREE.Mesh(new THREE.BoxGeometry(wallThickness, innerHeight + wallThickness * 2, sideWallDepth), createLitMaterial(wallColor)), -5)
    .position.set(rightWallX, centerY, sideWallZ);

  const pillarGeo = new THREE.CylinderGeometry(0.28, 0.28, wallDepth * 1.05, 8);
  const pillarMat = createLitMaterial(pillarColor);
  for (const x of [leftWallX, rightWallX]) {
    for (const y of [frontWallY, backWallY]) addMesh(new THREE.Mesh(pillarGeo, pillarMat.clone()), -5).position.set(x, y, backWallZ - 0.08);
  }

  const trimMat = createLitMaterial(trimColor);
  addMesh(new THREE.Mesh(new THREE.BoxGeometry(innerWidth * 0.95, 0.12, 0.05), trimMat.clone()), -5).position.set(centerX, backWallY - 0.28, floorZ + 0.18);
  addMesh(new THREE.Mesh(new THREE.BoxGeometry(innerWidth * 0.95, 0.12, 0.05), trimMat.clone()), -5).position.set(centerX, frontWallY + 0.28, floorZ + 0.18);
  addMesh(new THREE.Mesh(new THREE.BoxGeometry(0.12, innerHeight * 0.9, 0.05), trimMat.clone()), -5).position.set(leftWallX + 0.26, centerY, floorZ + 0.18);
  addMesh(new THREE.Mesh(new THREE.BoxGeometry(0.12, innerHeight * 0.9, 0.05), trimMat.clone()), -5).position.set(rightWallX - 0.26, centerY, floorZ + 0.18);
  addMesh(new THREE.Mesh(new THREE.BoxGeometry(innerWidth + wallThickness * 1.7, 0.08, 0.12), createLitMaterial(darkenHex(wallColor, 0.35))), -4).position.set(centerX, backWallY - 0.18, backWallZ + 0.35);
  addMesh(new THREE.Mesh(new THREE.BoxGeometry(innerWidth + wallThickness * 1.7, 0.08, 0.12), createLitMaterial(darkenHex(frontWallColor, 0.38))), -4).position.set(centerX, frontWallY + 0.18, frontWallZ + 0.35);
  addMesh(new THREE.Mesh(new THREE.PlaneGeometry(innerWidth * 0.98, 1.8), createLitMaterial(bgLayerColor, { transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false })), -5).position.set(centerX, backWallY + 0.24, backWallZ - 0.56);
  addMesh(new THREE.Mesh(new THREE.PlaneGeometry(innerWidth * 0.96, 1.0), createLitMaterial(fgLayerColor, { transparent: true, opacity: 0.2, depthWrite: false })), -1).position.set(centerX, frontWallY - 0.1, frontWallZ + 0.3);
  return meshes;
}

export class Base2DArena {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.zoneConfig = options.zoneConfig || {};
    this.group = new THREE.Group();
    this.group.visible = false;
    this.group.name = `${this.zoneConfig.id || 'arena'}-world-root`;
    this.hazards = [];
    this._animatedMaterials = [];
    this._zoneColors = null;
    this._time = 0;
    this._zoneState = 'waves';
    this._bossBackdropDimmer = null;
    this._bossBackdropDimOpacity = 0.18;
    this._bossBackdropCurrentOpacity = 0;
    this._parallaxLayers = [];
    this._parallaxTextureJobs = [];
    this._parallaxProfile = this.zoneConfig.parallaxProfile || { layers: [] };
    this._textureFailures = new Set();
    this._worldLayers = {};
    this._fallbackBuilt = false;
    this._worldReady = false;
    this.bounds = options.bounds || { minX: -8.3, maxX: 8.3, minY: -4.2, maxY: 3.3 };
    this._initializeWorldLayers();
    this.scene.add(this.group);
  }

  _initializeWorldLayers() {
    for (const layerName of WORLD_LAYER_ORDER) {
      const layer = new THREE.Group();
      layer.name = `${this.zoneConfig.id || 'arena'}-${layerName}`;
      this._worldLayers[layerName] = layer;
      this.group.add(layer);
    }
    this._worldLayers.fallback.visible = false;
  }

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
      hazard._animEntry.paused = !visible;
    }
  }

  setZoneColors(colors = {}) {
    this._zoneColors = { ...colors };
    return this;
  }

  build() {
    this.addParallaxLayers();
    this.setFallbackActive(false);
    return this.group;
  }

  getLayer(layerName = 'props') { return this._worldLayers[layerName] || this._worldLayers.props; }
  add(mesh, layerName = 'props') { this.getLayer(layerName).add(mesh); return mesh; }

  addRoomShell(profile = {}, layerName = 'fallback') {
    const meshes = createRoomShellMeshes({ ...profile, bounds: this.bounds });
    for (const mesh of meshes) this.add(mesh, layerName);
    return meshes;
  }

  buildFlatWorld2D(profile = {}) {
    const { minX, maxX, minY, maxY } = this.bounds;
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;
    const floorColor = profile.floorColor ?? 0x242a38;
    const laneColor = profile.laneColor ?? 0x35445f;
    const backColor = profile.backColor ?? 0x121724;
    const ridgeColor = profile.ridgeColor ?? 0x1b2130;
    const silhouetteColor = profile.silhouetteColor ?? 0x0c1119;
    const bossDimOpacity = Number.isFinite(profile.bossDimOpacity) ? profile.bossDimOpacity : 0.18;
    const hasTexturedParallax = (this._parallaxProfile?.layers || [])
      .some((layer) => shouldUseParallaxTexture(layer?.texture));
    const laneOpacity = Number.isFinite(profile.laneOpacity)
      ? profile.laneOpacity
      : (hasTexturedParallax ? 0.3 : 0.96);
    const backOpacity = Number.isFinite(profile.backOpacity)
      ? profile.backOpacity
      : (hasTexturedParallax ? 0.08 : 0.9);
    const ridgeOpacity = Number.isFinite(profile.ridgeOpacity)
      ? profile.ridgeOpacity
      : (hasTexturedParallax ? 0.06 : 0.82);
    const silhouetteOpacity = Number.isFinite(profile.silhouetteOpacity)
      ? profile.silhouetteOpacity
      : (hasTexturedParallax ? 0.18 : 0.66);

    // Full rebuild style: when textured parallax exists, avoid large opaque
    // placeholder slabs that overpower the authored background art.
    if (!hasTexturedParallax) {
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 1.04, height * 0.78),
        new THREE.MeshLambertMaterial({ color: floorColor })
      );
      floor.position.set(centerX, minY + height * 0.26, -1.08);
      floor.renderOrder = -10;
      this.add(floor, 'floor');

      const lane = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 0.94, height * 0.18),
        new THREE.MeshBasicMaterial({ color: laneColor, transparent: true, opacity: laneOpacity, depthWrite: false })
      );
      lane.position.set(centerX, minY + height * 0.24, -1.02);
      lane.renderOrder = -9;
      this.add(lane, 'floor');

      const back = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 1.08, height * 0.56),
        new THREE.MeshBasicMaterial({ color: backColor, transparent: true, opacity: backOpacity, depthWrite: false })
      );
      back.position.set(centerX, minY + height * 0.76, -2.25);
      back.renderOrder = -8;
      this.add(back, 'walls');

      const ridge = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 1.02, height * 0.08),
        new THREE.MeshBasicMaterial({ color: ridgeColor, transparent: true, opacity: ridgeOpacity, depthWrite: false })
      );
      ridge.position.set(centerX, minY + height * 0.55, -1.65);
      ridge.renderOrder = -7;
      this.add(ridge, 'walls');

      for (const x of [minX + 1.0, maxX - 1.0]) {
        const silhouette = new THREE.Mesh(
          new THREE.PlaneGeometry(0.72, height * 0.56),
          new THREE.MeshBasicMaterial({ color: silhouetteColor, transparent: true, opacity: silhouetteOpacity, depthWrite: false })
        );
        silhouette.position.set(x, centerY + 0.1, -0.86);
        silhouette.renderOrder = -3;
        this.add(silhouette, 'props');
      }
    } else {
      // Minimal lane/readability overlay while letting generated art dominate.
      const lane = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 0.96, height * 0.14),
        new THREE.MeshBasicMaterial({
          color: laneColor,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
        })
      );
      lane.position.set(centerX, minY + height * 0.22, -1.02);
      lane.renderOrder = -9;
      this.add(lane, 'floor');
    }

    const bossDimmer = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 1.12, height * 0.74),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false })
    );
    bossDimmer.position.set(centerX, minY + height * 0.62, -1.62);
    bossDimmer.renderOrder = -6;
    this.add(bossDimmer, 'walls');
    this._bossBackdropDimmer = bossDimmer;
    this._bossBackdropDimOpacity = Math.max(0, Math.min(0.45, bossDimOpacity));
    this._bossBackdropCurrentOpacity = 0;
    this._worldReady = true;
    this.setFallbackActive(false);
  }

  buildFallbackWorld() {
    if (this._fallbackBuilt) return;
    const { minX, maxX, minY, maxY } = this.bounds;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    this.addRoomShell(this.zoneConfig.roomProfile || {}, 'fallback');
    this.addForegroundProps('fallback');
    this.addProp('platform', { x: centerX, y: centerY - 1.0, z: -0.5, color: 0x4a5a7a, width: 4.0, height: 0.3, depth: 1.5 }, 'fallback');
    this.addProp('crate', { x: minX + 2.0, y: maxY - 0.5, z: -1.5, color: 0x3a4a6a }, 'fallback');
    this.addProp('crate', { x: maxX - 2.0, y: maxY - 0.5, z: -1.5, color: 0x3a4a6a }, 'fallback');
    this._fallbackBuilt = true;
    this._worldReady = true;
  }

  setFallbackActive(active = false) { this.getLayer('fallback').visible = !!active; return this; }

  addParallaxLayers() {
    const zc = this._zoneColors || {};
    this._parallaxLayers.length = 0;
    const fallbackLayers = [
      { id: 'background', z: -20, speed: 0.05, opacity: 0.9, tint: zc.deep ?? 0x14233d },
      { id: 'midground', z: -8, speed: 0.3, opacity: 0.78, tint: zc.mid ?? 0x223a61 },
      { id: 'foreground', z: -1, speed: 0.8, opacity: 0.65, tint: zc.near ?? 0x315283 },
    ];
    const configuredLayers = this._parallaxProfile?.layers?.length ? this._parallaxProfile.layers : fallbackLayers;
    for (const layer of configuredLayers) {
      const metrics = getParallaxLayerMetrics(this.bounds, layer);
      const textured = shouldUseParallaxTexture(layer.texture);
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(metrics.width, metrics.height),
        new THREE.MeshBasicMaterial({
          color: textured ? 0xffffff : (layer.tint ?? 0xffffff),
          transparent: true,
          opacity: Math.max(0.08, metrics.opacity || 0),
          depthWrite: false,
        })
      );
      mesh.position.set(metrics.x, metrics.y, metrics.z);
      mesh.renderOrder = metrics.renderOrder;
      mesh.userData.parallaxLayer = layer.id || 'layer';
      this.add(mesh, 'parallax');
      this._parallaxLayers.push({
        id: layer.id || 'layer',
        mesh,
        baseX: metrics.baseX,
        speed: Number.isFinite(layer.speed) ? layer.speed : 0,
        baseOpacity: Math.max(0.08, metrics.opacity || 0),
      });
      if (shouldUseParallaxTexture(layer.texture)) this._queueParallaxTexture(layer.texture, mesh.material);
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
        this._textureFailures.add(normalized);
        if (typeof window !== 'undefined' && window.DEBUG) console.warn(`[DEBUG] Parallax texture load failed: ${normalized}`);
      });
    this._parallaxTextureJobs.push(job);
  }

  addForegroundProps(layerName = 'fallback') {
    const { minX, maxX, minY, maxY } = this.bounds;
    const centerY = (minY + maxY) / 2;
    const arenaHeight = maxY - minY;
    const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, arenaHeight * 1.5, 8), createLitMaterial(0x0a0e1a, { transparent: true, opacity: 0.6, depthWrite: false }));
    leftPillar.position.set(minX - 1.5, centerY, 2.0);
    this.add(leftPillar, layerName);
    const rightPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, arenaHeight * 1.5, 8), createLitMaterial(0x0a0e1a, { transparent: true, opacity: 0.6, depthWrite: false }));
    rightPillar.position.set(maxX + 1.5, centerY, 2.0);
    this.add(rightPillar, layerName);
  }

  addProp(type, options = {}, layerName = 'props') {
    const { minX, maxX, minY, maxY } = this.bounds;
    const opts = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: -1.0, color: 0x4a5a7a, ...options };
    let geo;
    if (type === 'crate') geo = new THREE.BoxGeometry(opts.width || 1.2, opts.height || 1.2, opts.depth || 1.2);
    else if (type === 'platform') geo = new THREE.BoxGeometry(opts.width || 3.0, opts.height || 0.3, opts.depth || 1.5);
    else if (type === 'pillar') geo = new THREE.CylinderGeometry(opts.radius || 0.3, opts.radius || 0.3, opts.height || 3.0, 8);
    else return null;
    const mesh = new THREE.Mesh(geo, createLitMaterial(opts.color));
    mesh.position.set(opts.x, opts.y, opts.z);
    return this.add(mesh, layerName);
  }

  addHazardRect({ id, x, y, width, height, color = 0xff5533, damage = 8, tick = 0.45, activeWhen = 'always', pulse = 7.5, minOpacity = 0.22, maxOpacity = 0.48 }) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: minOpacity, blending: THREE.AdditiveBlending, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
    mesh.position.set(x, y, -0.12);
    mesh.visible = activeWhen === 'always';
    this.add(mesh, 'hazards');
    const animEntry = { material: mat, pulse, minOpacity, maxOpacity, phase: x * 0.37 + y * 0.11, paused: activeWhen !== 'always' };
    this._animatedMaterials.push(animEntry);
    this.hazards.push({ id, shape: 'rect', x, y, width, height, damage, tick, activeWhen, mesh, _animEntry: animEntry });
  }

  addHazardCircle({ id, x, y, radius, color = 0x7f4dff, damage = 8, tick = 0.45, activeWhen = 'always', pulse = 8.5, minOpacity = 0.2, maxOpacity = 0.45 }) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: minOpacity, blending: THREE.AdditiveBlending, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 24), mat);
    mesh.position.set(x, y, -0.12);
    mesh.visible = activeWhen === 'always';
    this.add(mesh, 'hazards');
    const animEntry = { material: mat, pulse, minOpacity, maxOpacity, phase: x * 0.23 - y * 0.13, paused: activeWhen !== 'always' };
    this._animatedMaterials.push(animEntry);
    this.hazards.push({ id, shape: 'circle', x, y, radius, damage, tick, activeWhen, mesh, _animEntry: animEntry });
  }

  getActiveHazards(routeState = null) {
    const zoneState = routeState?.zoneState || 'waves';
    return this.hazards.filter((hazard) => {
      if (hazard.activeWhen === 'always') return true;
      if (hazard.activeWhen === 'boss') return zoneState === 'boss';
      if (hazard.activeWhen === 'waves') return zoneState === 'waves';
      return true;
    });
  }

  update(dt, focusX = 0, routeState = null) {
    this._time += dt;
    if (routeState?.zoneState && routeState.zoneState !== this._zoneState) this.setZoneState(routeState.zoneState);

    const bossActive = this._zoneState === 'boss';
    const targetDim = bossActive ? this._bossBackdropDimOpacity : 0;
    this._bossBackdropCurrentOpacity += (targetDim - this._bossBackdropCurrentOpacity) * 0.14;
    if (this._bossBackdropDimmer?.material) this._bossBackdropDimmer.material.opacity = this._bossBackdropCurrentOpacity;

    for (const layer of this._parallaxLayers) {
      const offsetX = focusX * layer.speed;
      layer.mesh.position.x = layer.baseX + offsetX;
      if (layer.mesh.material) layer.mesh.material.opacity = layer.baseOpacity * (bossActive ? 0.78 : 1);
      if (layer.mesh.material?.map) layer.mesh.material.map.offset.x = -offsetX * 0.01;
    }

    for (const entry of this._animatedMaterials) {
      if (entry.paused) continue;
      const wave = (Math.sin((this._time + entry.phase) * entry.pulse) + 1) * 0.5;
      entry.material.opacity = entry.minOpacity + wave * (entry.maxOpacity - entry.minOpacity);
    }

    this._updateFallbackVisibility();
  }

  getParallaxDebugInfo() {
    return this._parallaxLayers.map((layer) => ({ id: layer.id, speed: layer.speed, x: layer.mesh.position.x, baseX: layer.baseX }));
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((child) => {
      if (!child.isMesh) return;
      child.geometry?.dispose?.();
      if (Array.isArray(child.material)) child.material.forEach((m) => m?.dispose?.());
      else child.material?.dispose?.();
    });
    this._parallaxLayers.length = 0;
    this._parallaxTextureJobs.length = 0;
  }

  getWorldHealth() {
    const meshCount = this._countRenderableMeshes(this.group);
    const fallbackMeshes = this._countRenderableMeshes(this.getLayer('fallback'));
    return {
      zoneId: this.zoneConfig.id || 'arena',
      authoredLayerCount: this._countRenderableMeshes(this.getLayer('floor')) + this._countRenderableMeshes(this.getLayer('walls')) + this._countRenderableMeshes(this.getLayer('props')),
      meshCount,
      fallbackMeshCount: fallbackMeshes,
      fallbackActive: !!this.getLayer('fallback')?.visible,
      parallaxCount: this._parallaxLayers.length,
      worldReady: this._worldReady || meshCount > 0,
      textureFailureCount: this._textureFailures.size,
    };
  }

  _updateFallbackVisibility() {
    const hasAuthored = this._countRenderableMeshes(this.getLayer('floor')) + this._countRenderableMeshes(this.getLayer('walls')) + this._countRenderableMeshes(this.getLayer('props')) > 0;
    if (!hasAuthored) this._worldReady = false;
    this.setFallbackActive(false);
  }

  _countRenderableMeshes(root) {
    if (!root) return 0;
    let count = 0;
    root.traverse((child) => { if (child?.isMesh && child.visible !== false) count += 1; });
    return count;
  }
}
