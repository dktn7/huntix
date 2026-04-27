import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RunState } from '../core/RunState.js';
import {
  DEFAULT_ORTHO_CAMERA_TILT_X,
  ORTHO_HEIGHT,
  ORTHO_WIDTH,
  getCameraTiltX,
  setCameraTiltX,
} from './Renderer.js';
import { Actions } from './InputManager.js';
import { CameraShake } from './CameraShake.js';
import { HunterController } from '../gameplay/HunterController.js';
import { CombatController } from '../gameplay/CombatController.js';
import { EnemySpawner } from '../gameplay/EnemySpawner.js';
import { SparkPool } from '../gameplay/SparkPool.js';
import { DebugHitboxes } from '../gameplay/DebugHitboxes.js';
import { HUD } from '../gameplay/HUD.js';
import { ShopManager } from '../gameplay/ShopManager.js';
import { CollisionResolver } from '../gameplay/CollisionResolver.js';
import { PortalManager } from '../gameplay/PortalManager.js';
import { ZoneManager } from '../gameplay/ZoneManager.js';
import { getActiveArenaBounds, resetActiveArenaBounds, setActiveArenaBounds } from '../gameplay/ArenaBounds.js';
import { createAura } from '../visuals/AuraShader.js';
import { createPortalRift, createPortalFloorGlow } from '../visuals/PortalRiftShader.js';
import { HitFlarePool } from '../visuals/HitFlarePool.js';
import { AudioManager } from './AudioManager.js';
import { ZONE_CONFIGS } from '../gameplay/ZoneManager.js';
import { createRoomShellMeshes, resolveModelColormapUrl } from '../visuals/Base3DArena.js';

import { TitleScreen } from '../screens/TitleScreen.js';
import { HunterSelectScreen } from '../screens/HunterSelectScreen.js';
import { PauseMenu } from '../gameplay/PauseMenu.js';
import { SettingsPanel } from '../ui/SettingsPanel.js';

const SceneModes = {
  TITLE_SCREEN: 'TITLE_SCREEN',
  HUNTER_SELECT: 'HUNTER_SELECT',
  HUB: 'HUB',
  ZONE: 'ZONE',
  END_SCREEN: 'END_SCREEN',
};

const ZONE_CLEAR_RETURN_DELAY_MS = 1800;
const WIPE_RETURN_DELAY_MS = 800;
const SHOP_ANCHOR_X = -7.2;
const SHOP_ANCHOR_Y = -1.95;
const SHOP_INTERACT_RADIUS = 1.45;
const HUB_PORTAL_INTERACT_RADIUS = 1.35;
const HAZARD_DEFAULT_KNOCKBACK = { x: 0, y: 0.12 };
const CAMERA_TILT_LERP = 0.12;

// Positions of the two exit portals (world X)
const EXIT_PORTAL_HQ_X   = 5.95;
const EXIT_PORTAL_NEXT_X = 7.85;
// Walk-in radius to trigger a portal
const EXIT_PORTAL_RADIUS = 1.0;

// HQ portal colour — green, distinct from all zone palettes
const HQ_PORTAL_COLOUR = 0x00e676;

export class SceneManager {
  constructor(renderer, inputManager = null) {
    this.scene = new THREE.Scene();
    this.camera = renderer.createCamera();
    this.inputManager = inputManager;
    this.mode = SceneModes.TITLE_SCREEN;
    this._pauseMode = 'none';
    this.debugEnabled = false;
    this._zoneReturnPending = false;
    this._wipePending = false;
    this._activeZoneId = null;
    this._transitionLock = false;
    this._bossSeenZones = new Set();
    this._onboardingDone = false;

    // Exit portal state
    this._exitPortalOpen       = false;
    this._exitPortalNextZone   = null;
    this._exitPortalMeshes     = [];
    this._exitPortalHubGroup   = null;
    this._exitPortalNextGroup  = null;
    this._lastClearedZoneId    = null;
    this._zoneHazardTime = 0;
    this._zoneHazardTickAt = new Map();
    this._lastHubHintAt = 0;
    this._cameraTiltX = getCameraTiltX(this.camera);
    this._cameraTiltTargetX = this._cameraTiltX;
    this._hubParallaxLayers = [];
    this._hubParallaxTextureCache = new Map();
    this._hubParallaxLoader = new THREE.TextureLoader();
    this._hubLoader = new GLTFLoader();
    this._hubLoader.manager.setURLModifier((url) =>
      resolveModelColormapUrl(url, './assets/textures/props/hub/colormap.png')
    );
    this._hubModelCache = new Map();

    const overlay = document.getElementById('ui-overlay');
    this.portalManager = new PortalManager(overlay);
    this.zoneManager = new ZoneManager(this.scene);
    this.audio = new AudioManager();

    this._setupLighting();
    this._setupHubBackdrop();
    this._setupHubPortals();

    this.settingsPanel = new SettingsPanel(overlay, this.inputManager, this.audio);

    this.titleScreen = new TitleScreen(overlay,
      () => this.transitionToHunterSelect(false),
      () => this.transitionToHunterSelect(true),
      () => this.openSettingsPanel('full')
    );
    this.hunterSelectScreen = new HunterSelectScreen(overlay,
      (configs) => this.startRun(configs),
      () => this.transitionToTitle()
    );

    this.pauseMenu = new PauseMenu(overlay, {
      settingsPanel: this.settingsPanel,
      onResume: () => this.resume(),
      onAbandonRun: () => this.abandonRunToHub(),
      onQuitToTitle: () => this.quitToTitleFromPause(),
      getRunStats: () => this._buildPauseStats(),
      getControls: () => this.inputManager?.getBindings?.() || { rows: [] },
    });

    this.hunters = new HunterController(this.scene, RunState.players);
    this.player = this.hunters.primaryPlayer;
    this.resources = this.player?.resources || { health: 0, maxHealth: 0, mana: 0, maxMana: 0, surge: 0, maxSurge: 0, stamina: 0, maxStamina: 0 };
    this.combat = new CombatController();
    this.spawner = new EnemySpawner(this.scene, this.hunters.activeHumanPlayerCount);
    this.collision = new CollisionResolver();
    this.sparks = new SparkPool(this.scene);
    this.cameraShake = new CameraShake(this.camera);
    this.debugHitboxes = new DebugHitboxes(this.scene);
    this.hud = new HUD(overlay);
    this.shop = new ShopManager(overlay);
    this._slowMoTicks = 0;
    this._slowMoScale = 1;

    this._handlePlayerJoinedBound = this._handlePlayerJoined.bind(this);
    this._handleLevelupQueuedBound = this._handleLevelupQueued.bind(this);
    RunState.on('playerJoined', this._handlePlayerJoinedBound);
    RunState.on('levelupQueued', this._handleLevelupQueuedBound);
    this._playerAuras = [];
    this._hitFlares = new HitFlarePool(this.scene);
    this.hunters.setBillboardTiltX?.(this._cameraTiltX);
    this.spawner.setBillboardTiltX?.(this._cameraTiltX);

    // Ensure everything is hidden initially
    this._setHubVisible(false);
    this.hunters.setVisible(false);
    
    this.titleScreen.show();
  }

  pause(mode = null) {
    const nextMode = mode || this._resolvePauseMode();
    if (!nextMode || nextMode === 'none') return;
    this._setPauseMode(nextMode);
  }

  resume() {
    this._setPauseMode('none');
  }

  getPauseState() {
    return {
      open: this._pauseMode !== 'none',
      mode: this._pauseMode,
      context: this.pauseMenu?.getContext?.() || 'zone',
    };
  }

  isRunTimerPaused() {
    return this._pauseMode === 'full';
  }

  update(dt, input) {
    input.poll();

    const previousPauseMode = this._pauseMode;
    if (this._pauseMode !== 'none') {
      this.pauseMenu.update(input);
    }

    if (
      input.justPressed(Actions.PAUSE)
      && this._pauseMode === 'none'
      && previousPauseMode === 'none'
      && this._canOpenPause()
    ) {
      this.pause();
    }

    if (input.anyJustPressed() && !this.audio._initialized) {
      this.audio.init();
      this.audio.playMusic('title');
    }

    if (input.justPressed(Actions.DEBUG)) {
      this.debugEnabled = !this.debugEnabled;
      document.body.classList.toggle('debug', this.debugEnabled);
      this.debugHitboxes.setEnabled(this.debugEnabled);
    }

    if (
      this.settingsPanel.isOpen()
      && this._pauseMode === 'none'
      && (input.justPressed(Actions.PAUSE) || input.justPressedKey('Escape'))
    ) {
      this.settingsPanel.requestBack();
    }

    if (this._pauseMode === 'full') {
      this.hud.update(this.camera);
      return;
    }

    if (this.mode === SceneModes.TITLE_SCREEN) {
      if (!this.settingsPanel.isOpen()) {
        const prevIndex = this.titleScreen.selectedIndex;
        this.titleScreen.update(input);
        if (this.titleScreen.selectedIndex !== prevIndex) {
          this.audio.playSFX('ui-navigate');
        }
      }
      return;
    }

    if (this.mode === SceneModes.HUNTER_SELECT) {
      if (!this.settingsPanel.isOpen()) {
        const prevCursor = this.hunterSelectScreen.cursorIndex;
        this.hunterSelectScreen.update(input);
        if (this.hunterSelectScreen.cursorIndex !== prevCursor) {
          this.audio.playSFX('hunter-hover');
        }
      }
      return;
    }

    if (this.debugEnabled && input.justPressed(Actions.DEBUG_SURGE)) {
      this.hunters.fillSurge();
    }

    if (this.hud.isOnboardingOpen()) {
      if (input.anyJustPressed()) {
        this.hud.hideOnboarding();
        this._onboardingDone = true;
        this.audio.playSFX('ui-confirm');
      }
      this.hud.update(this.camera);
      return;
    }

    this._resolveAICardChoices();
    if (!this.hud.isCardOpen()) this._openNextCardScreen();
    if (this.hud.isCardOpen()) {
      this._updateCardInput(input);
      this.hud.update(this.camera);
      return;
    }

    if (this.mode === SceneModes.HUB) {
      this._updateHub(dt, input);
      this.hud.update(this.camera);
      return;
    }

    if (this.mode === SceneModes.END_SCREEN) {
      if (input.justPressed(Actions.PAUSE)) {
        this.transitionToTitle();
      } else if (
        input.justPressed(Actions.INTERACT)
        || input.justPressed(Actions.LIGHT)
        || input.justPressedKey('Enter')
      ) {
        this._returnToHubFromEndScreen(input);
      }
      this.hud.update(this.camera);
      return;
    }

    this._updateZone(dt, input);
  }

  transitionToTitle() {
    this._setPauseMode('none');
    this.settingsPanel.close({ skipCallback: true });
    this.pauseMenu.close();
    this.portalManager.hideResultsOverlay();
    this.portalManager.clearZoneCard();
    this.audio.playSFX('ui-back');
    this.hunterSelectScreen.hide();
    this.mode = SceneModes.TITLE_SCREEN;
    resetActiveArenaBounds();
    this.titleScreen.show();
  }

  transitionToHunterSelect(isCoop) {
    this._setPauseMode('none');
    this.settingsPanel.close({ skipCallback: true });
    this.pauseMenu.close();
    this.audio.playSFX('ui-confirm');
    this.titleScreen.hide();
    this.mode = SceneModes.HUNTER_SELECT;
    resetActiveArenaBounds();
    this.hunterSelectScreen.setCoop(isCoop);
    this.hunterSelectScreen.show();
  }

  openSettingsPanel(mode = 'full') {
    this.settingsPanel.open({ mode: mode === 'minimal' ? 'minimal' : 'full' });
  }

  quitToTitleFromPause() {
    this.transitionToTitle();
  }

  abandonRunToHub() {
    if (!RunState.players.length) return;

    const zeroCarry = new Array(RunState.players.length).fill(0);
    RunState.resetAfterWipe(zeroCarry);
    this.hunters.syncAllFromRunState(RunState.players);
    this.hunters.applyRunStateModifiers(RunState.players);
    this.player = this.hunters.primaryPlayer;
    this.resources = this.player?.resources || this.resources;
    this.spawner.setPlayerCount(this.hunters.activeHumanPlayerCount);
    this._switchToHub();
    this.hud.hideOnboarding();
    this._setPauseMode('none');
  }

  _setPauseMode(mode) {
    const nextMode = mode === 'full' || mode === 'minimal' ? mode : 'none';
    this._pauseMode = nextMode;

    if (nextMode === 'none') {
      this.pauseMenu.close();
      this.settingsPanel.close({ skipCallback: true });
      return;
    }

    const zoneId = this.mode === SceneModes.ZONE
      ? (this._activeZoneId || RunState.currentZone || 'city-breach')
      : 'hub';
    const zoneAccent = ZONE_CONFIGS[zoneId]?.portalColor ?? null;

    this.pauseMenu.open({
      mode: nextMode,
      context: this.mode === SceneModes.HUB ? 'hub' : 'zone',
      zoneId,
      accentColor: zoneAccent,
    });
  }

  _canOpenPause() {
    if (this.mode === SceneModes.TITLE_SCREEN || this.mode === SceneModes.HUNTER_SELECT) return false;
    if (this.mode === SceneModes.END_SCREEN) return false;
    if (this.hud.isOnboardingOpen() || this.hud.isCardOpen()) return false;
    return this.mode === SceneModes.HUB || this.mode === SceneModes.ZONE;
  }

  _resolvePauseMode() {
    if (!this._canOpenPause()) return 'none';
    if (this.mode === SceneModes.HUB) return 'full';
    if (this.mode !== SceneModes.ZONE) return 'full';
    if (!RunState.isCoOp) return 'full';
    return this._isZoneInActiveCombat() ? 'minimal' : 'full';
  }

  _isZoneInActiveCombat() {
    if (this.mode !== SceneModes.ZONE) return false;
    const route = this.spawner.getRouteState?.() || {};
    const activeEnemies = this.spawner.getActiveEnemies().some((enemy) => !enemy.isDead?.());
    const inBossState = route.zoneState === 'boss';
    const betweenWaveGateOpen = !!route.gateOpen;
    if (betweenWaveGateOpen) return false;
    if (inBossState) return true;
    if (activeEnemies) return true;
    return route.zoneState === 'waves';
  }

  _buildPauseStats() {
    const players = RunState.players || [];
    const route = this.spawner.getRouteState?.() || null;
    const zoneLabel = RunState.currentZoneLabel || (this.mode === SceneModes.HUB ? 'Hunter HQ' : 'Unknown Zone');
    const zoneNumber = RunState.currentZoneNumber || 0;
    const wave = this.mode === SceneModes.ZONE
      ? Math.max(1, (route?.waveIndex ?? -1) + 1)
      : '-';

    const totals = players.reduce((acc, player) => {
      const stats = player?.stats || {};
      acc.essenceCollected += stats.essenceCollected || 0;
      acc.essenceHeld += player?.essence || 0;
      acc.highestCombo = Math.max(acc.highestCombo, stats.highestCombo || 0);
      acc.enemiesKilled += stats.kills || 0;
      acc.damageDealt += stats.damageDealt || 0;
      acc.damageTaken += stats.damageTaken || 0;
      acc.deaths += stats.deaths || 0;
      acc.downs += stats.timesDown || 0;
      acc.revives += stats.revives || 0;
      return acc;
    }, {
      essenceCollected: 0,
      essenceHeld: 0,
      highestCombo: 0,
      enemiesKilled: 0,
      damageDealt: 0,
      damageTaken: 0,
      deaths: 0,
      downs: 0,
      revives: 0,
    });

    return {
      zoneLabel,
      zoneNumber,
      wave,
      essenceCollected: totals.essenceCollected,
      essenceHeld: totals.essenceHeld,
      highestCombo: totals.highestCombo,
      enemiesKilled: totals.enemiesKilled,
      damageDealt: totals.damageDealt,
      damageTaken: totals.damageTaken,
      deaths: totals.deaths,
      downs: totals.downs,
      revives: totals.revives,
      timeElapsed: RunState.runTimer || 0,
      players: players.map((player) => {
        return {
          playerIndex: player.playerIndex,
          hunterId: player.hunterId,
          hunterLabel: this._formatHunterLabel(player.hunterId),
          essenceHeld: player.essence || 0,
          highestCombo: player.stats?.highestCombo || 0,
          downs: player.stats?.timesDown || 0,
          revives: player.stats?.revives || 0,
          deaths: player.stats?.deaths || 0,
        };
      }),
    };
  }

  _formatHunterLabel(hunterId = '') {
    const id = String(hunterId || '').toLowerCase();
    if (!id) return 'Unknown';
    return id.charAt(0).toUpperCase() + id.slice(1);
  }

  startRun(playerConfigs) {
    this._setPauseMode('none');
    this.settingsPanel.close({ skipCallback: true });
    this.audio.playSFX('hunter-confirm');
    this.hunterSelectScreen.hide();
    RunState.init(playerConfigs);

    while (this.hunters.players.length < RunState.players.length) {
      const nextRunPlayer = RunState.players[this.hunters.players.length];
      if (!nextRunPlayer) break;
      this._handlePlayerJoined({ player: nextRunPlayer });
    }

    this.hunters.syncAllFromRunState(RunState.players);
    this.player = this.hunters.primaryPlayer || this.hunters.players[0] || null;
    if (!this.player) return;
    this.resources = this.player.resources;
    this.spawner.setPlayerCount(this.hunters.activeHumanPlayerCount);

    this._playerAuras.forEach(aura => this.scene.remove(aura));
    this._playerAuras = this.hunters.entries.map(entry => this._createAuraForEntry(entry));

    this._switchToHub();
    this.hud.showOnboarding();
  }

  getScene()  { return this.scene;  }
  getCamera() { return this.camera; }

  getDebugInfo() {
    return {
      mode: this.mode,
      zone: this._activeZoneId || 'hub',
      playerState: this.player?.state || 'IDLE',
      health: this.resources.health,
      maxHealth: this.resources.maxHealth,
      mana: this.resources.mana,
      maxMana: this.resources.maxMana,
      surge: this.resources.surge,
      maxSurge: this.resources.maxSurge,
      stamina: this.resources.stamina,
      maxStamina: this.resources.maxStamina,
      enemies: this.spawner.getActiveEnemies().length,
      pauseMode: this._pauseMode,
      combo: this.combat.comboCount,
      comboByPlayer: this.combat.getComboCounts(),
      hitstop: this.combat.hitstopRemaining,
      boss: RunState.activeBossName,
      bossHp: RunState.activeBossHp,
      bossHpMax: RunState.activeBossHpMax,
      bossPhase: RunState.activeBossPhase,
      cameraTiltX: this._cameraTiltX,
      cameraTiltTargetX: this._cameraTiltTargetX,
      parallax: this._collectParallaxDebug(),
    };
  }

  // ---------------------------------------------------------------------------
  // Scene setup
  // ---------------------------------------------------------------------------

  _setupLighting() {
    const ambient = new THREE.AmbientLight(0xe5ebff, 0.55);
    this.scene.add(ambient);
    const hemi = new THREE.HemisphereLight(0x8fb8ff, 0x1a1b28, 0.42);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffefdb, 0.95);
    key.position.set(-5, 6, 9);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x7bbcff, 0.55);
    rim.position.set(6, -2.5, 6);
    this.scene.add(rim);
  }

  _setupHubBackdrop() {
    this._hubBackdrop = [];
    this._hubHomeSpots = [];

    const add = (mesh) => {
      mesh.userData.hubPrimitive = true;
      this.scene.add(mesh);
      this._hubBackdrop.push(mesh);
      return mesh;
    };

    const hubProfile = ZONE_CONFIGS.hub?.roomProfile || {
      bounds: { minX: -8.4, maxX: 8.4, minY: -4.25, maxY: 3.35 },
      floorColor: 0x1b2230,
      wallColor: 0x222f49,
      frontWallColor: 0x1a253b,
      trimColor: 0x5a77b7,
      pillarColor: 0x324463,
      laneColor: 0x2e4364,
      bgLayerColor: 0x87a9ff,
      fgLayerColor: 0x111a2a,
      laneY: -2.2,
    };
    this._setupHubParallaxLayers(add, hubProfile.bounds);
    const shellMeshes = createRoomShellMeshes(hubProfile);
    for (const mesh of shellMeshes) add(mesh);

    const leftShopPad = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 2.2, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x25344a })
    );
    leftShopPad.position.set(-7.25, -1.95, -0.35);
    add(leftShopPad);

    const shopDesk = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 1.05, 0.72),
      new THREE.MeshLambertMaterial({ color: 0x40526e })
    );
    shopDesk.position.set(-7.2, -1.08, -1.2);
    add(shopDesk);

    const shopBeacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 1.3, 8),
      new THREE.MeshBasicMaterial({
        color: 0x5edfff,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      })
    );
    shopBeacon.position.set(-7.2, -0.25, -1.05);
    add(shopBeacon);

    const briefingBoard = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 1.8, 0.18),
      new THREE.MeshLambertMaterial({ color: 0x314057 })
    );
    briefingBoard.position.set(0, -0.3, -1.12);
    add(briefingBoard);

    const briefingGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.9, 1.15),
      new THREE.MeshBasicMaterial({
        color: 0x9fb4ff,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      })
    );
    briefingGlow.position.set(0, -0.3, -1.03);
    add(briefingGlow);

    const portalWall = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 5.4, 0.6),
      new THREE.MeshLambertMaterial({ color: 0x1f2942 })
    );
    portalWall.position.set(7.05, 0.2, -1.65);
    add(portalWall);

    for (let i = 0; i < 4; i += 1) {
      const bay = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 3.0, 0.18),
        new THREE.MeshLambertMaterial({ color: 0x263655 })
      );
      bay.position.set(4.8 + i * 1.2, 0.1, -1.2);
      add(bay);
    }

    const makeHomeSpot = (x, y, color, tall = false) => {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.52, 0.12, 14),
        new THREE.MeshLambertMaterial({ color: 0x223145 })
      );
      base.position.set(x, y, -0.24);
      add(base);

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
      add(emblem);
      this._hubHomeSpots.push({ base, emblem });
    };

    // Dabik corner (left rear), Benzu training lane, Sereisa terminal, Vesol alchemy station.
    makeHomeSpot(-7.95, 0.85, 0x9b59b6, true);
    makeHomeSpot(-4.9, -0.75, 0xf39c12, true);
    makeHomeSpot(1.9, 0.95, 0xf1c40f, false);
    makeHomeSpot(-1.9, -0.75, 0xe74c3c, false);

    this._queueHubWorldKit();
  }

  _setupHubParallaxLayers(add, bounds) {
    this._hubParallaxLayers.length = 0;
    const profile = ZONE_CONFIGS.hub?.parallaxProfile;
    if (!profile?.layers?.length) return;

    const centerX = (bounds.minX + bounds.maxX) * 0.5;
    const centerY = (bounds.minY + bounds.maxY) * 0.5;
    const width = (bounds.maxX - bounds.minX) * 1.45;
    const height = (bounds.maxY - bounds.minY) * 1.45;

    for (const layer of profile.layers) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({
          color: layer.tint ?? 0xffffff,
          transparent: true,
          opacity: layer.opacity ?? 0.7,
          depthWrite: false,
        })
      );
      mesh.position.set(centerX, centerY, layer.z ?? -8);
      mesh.renderOrder = mesh.position.z <= -8 ? -10 : mesh.position.z <= -2 ? -8 : -5;
      add(mesh);
      this._hubParallaxLayers.push({
        id: layer.id || 'layer',
        mesh,
        speed: Number.isFinite(layer.speed) ? layer.speed : 0,
        baseX: centerX,
      });
      if (layer.texture) this._loadHubParallaxTexture(layer.texture, mesh.material);
    }
  }

  _loadHubParallaxTexture(path, material) {
    if (!path || !material) return;
    if (!this._hubParallaxTextureCache.has(path)) {
      const pending = new Promise((resolve, reject) => {
        this._hubParallaxLoader.load(path, resolve, undefined, reject);
      }).then((texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        return texture;
      });
      this._hubParallaxTextureCache.set(path, pending);
    }

    this._hubParallaxTextureCache.get(path)
      .then((texture) => {
        material.map = texture.clone();
        material.map.needsUpdate = true;
        material.color.setHex(0xffffff);
        material.needsUpdate = true;
      })
      .catch(() => {
        // Keep tint fallback if loading fails.
      });
  }

  _queueHubWorldKit() {
    const root = './assets/models/world/hub';

    this._queueHubModel(`${root}/floorFull.glb`, { x: 0, y: -2.3, z: -1.05, scale: 0.74 });
    this._queueHubModel(`${root}/wall.glb`, { x: 0, y: 1.8, z: -2.7, scale: 0.86 });

    this._queueHubModel(`${root}/desk.glb`, { x: -7.2, y: -1.25, z: -1.08, scale: 0.72 });
    this._queueHubModel(`${root}/computerScreen.glb`, { x: 1.95, y: 0.7, z: -1.02, scale: 0.72 });
    this._queueHubModel(`${root}/table.glb`, { x: -1.9, y: -1.1, z: -1.0, scale: 0.72 });
    this._queueHubModel(`${root}/weapon-rack.glb`, { x: -7.55, y: 0.58, z: -1.14, scale: 0.72 });
    this._queueHubModel(`${root}/bench.glb`, { x: -4.95, y: -0.95, z: -0.98, scale: 0.74 });
  }

  _queueHubModel(path, options = {}) {
    this._loadHubModel(path)
      .then((source) => {
        if (!source) return;
        const model = source.clone(true);
        const {
          x = 0, y = 0, z = 0,
          scale = 1,
          rx = 0, ry = 0, rz = 0,
          tint = null,
          emissive = null,
          emissiveIntensity = 0.35,
          opacity = null,
        } = options;
        const tintColor = tint !== null ? new THREE.Color(tint) : null;
        const emissiveColor = emissive !== null ? new THREE.Color(emissive) : null;
        model.position.set(x, y, z);
        model.rotation.set(rx, ry, rz);
        model.scale.set(scale, scale, scale);
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
            if (typeof opacity === 'number') {
              working.opacity = Math.max(0, Math.min(1, opacity));
              working.transparent = working.opacity < 1;
            }
            nextMaterials.push(working);
          }
          child.material = Array.isArray(child.material) ? nextMaterials : (nextMaterials[0] || child.material);
          child.castShadow = false;
          child.receiveShadow = false;
          child.frustumCulled = true;
        });
        this.scene.add(model);
        this._hubBackdrop.push(model);
      })
      .catch(() => null);
  }

  _loadHubModel(path) {
    if (!this._hubModelCache.has(path)) {
      this._hubModelCache.set(path, new Promise((resolve, reject) => {
        this._hubLoader.load(path, (gltf) => resolve(gltf.scene), null, reject);
      }));
    }
    return this._hubModelCache.get(path);
  }

  _setupHubPortals() {
    this._hubPortals = [];
    const layout = this.zoneManager.getPortalLayout();
    const portalGeo = new THREE.TorusGeometry(0.52, 0.085, 8, 24);
    const pedestalGeo = new THREE.BoxGeometry(1.2, 0.18, 0.1);

    for (const entry of layout) {
      const portalMat = new THREE.MeshBasicMaterial({
        color: entry.color,
        transparent: true,
        opacity: 0.45,
      });
      const portal = new THREE.Mesh(portalGeo, portalMat);
      portal.position.set(entry.x, -2.18, 0.3);
      portal.renderOrder = 20;
      this.scene.add(portal);

      const pedestalMat = new THREE.MeshLambertMaterial({ color: 0x29364f });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.set(entry.x, -2.85, 0.2);
      this.scene.add(pedestal);

      this._queueHubModel('./assets/models/world/city-breach/portal.glb', {
        x: entry.x,
        y: -2.2,
        z: -1.05,
        scale: 0.52,
        ry: Math.PI,
        tint: entry.color,
        emissive: entry.color,
        emissiveIntensity: 0.55,
        opacity: 0.95,
      });

      this._hubPortals.push({ ...entry, mesh: portal, pedestal, unlocked: false });
    }
    this._syncHubPortals();
  }

  // ---------------------------------------------------------------------------
  // Per-frame updates
  // ---------------------------------------------------------------------------

  _updateHub(dt, input) {
    if (this.shop.isOpen()) {
      const shopInput = input.getPlayerInput(this.shop.playerIndex);
      const result = this.shop.update(shopInput);
      if (result?.ok && result.action === 'purchase') {
        this.hunters.applyRunStateModifiers(RunState.players);
      }
      this._updateCameraTilt(dt);
      this._updateHubParallax(this._getPlayerFocusX());
      this.hud.update(this.camera);
      return;
    }

    // Camera follows player across the HQ space
    const px = this.hunters.primaryPlayer?.position.x || 0;
    const hubBounds = ZONE_CONFIGS.hub?.playBounds || { minX: -8.4, maxX: 8.4 };
    const targetX = Math.max(hubBounds.minX + 0.9, Math.min(hubBounds.maxX - 0.9, px + 0.2));
    this.camera.position.x += (targetX - this.camera.position.x) * 0.06;
    this.camera.position.y += (-1.9 - this.camera.position.y) * 0.09;

    this.hunters.update(dt, input);
    this._updateCameraTilt(dt);
    this._updateHubParallax(this._getPlayerFocusX());
    this.sparks.update(dt);
    this.cameraShake.update(dt);
    this._animateHubPortals(dt);
    this._animateHubLandmarks(dt);
    this._syncPlayerAuras(dt);
    this._syncHubPortals();
    this._updateDebugHitboxes();

    const shopPlayerIndex = this._getShopInteractor(input);
    if (shopPlayerIndex !== null) {
      this.shop.open(shopPlayerIndex, Math.max(1, RunState.zonesCleared + 1));
      return;
    }

    if (!this._transitionLock) {
      const portalInteractor = this._getPortalInteractor(input);
      if (portalInteractor) {
        const portal = this._findNearestPortal(portalInteractor.position, false);
        if (portal?.unlocked) {
          this._enterZone(portal.zoneId, input);
        } else if (portal) {
          this._showLockedPortalHint(portal);
        }
      }
    }
  }

  _updateZone(dt, input) {
    this._updateSlowMo(dt);
    const scaledDt = dt * this._slowMoScale;
    const inHitstop = this.combat.consumeHitstop(dt);

    if (inHitstop) {
      this.combat.advanceHitboxes(dt);
      this.hunters.updateAnimations(dt);
      this.sparks.update(dt);
      this._hitFlares.update(dt);
      this.cameraShake.update(dt);
      this.spawner.syncVisuals();
      this.hud.setPlayerCombos(this.combat.getComboCounts());
      this.hud.update(this.camera);
      this._syncPlayerAuras(dt);
      this._updateDebugHitboxes();
      this._updateCameraTilt(dt);
      // Still animate exit portals during hitstop
      if (this._exitPortalOpen) this._tickExitPortals(dt);
      return;
    }

    const enemies = this.spawner.getActiveEnemies();
    const routeState = this.spawner.getRouteState?.() || null;
    const preparedInputs = this.hunters.prepareZoneInputs(
      scaledDt,
      input,
      enemies,
      routeState
    );
    const hitEvents = this.combat.update(
      scaledDt,
      preparedInputs,
      this.hunters.players,
      enemies,
      this.spawner
    );
    this._applyCombatEvents(hitEvents);
    this.hunters.update(scaledDt, input, preparedInputs);
    const spawnerEvents = this.spawner.update(scaledDt, this.hunters.players);
    this._applyCombatEvents(spawnerEvents);
    if (this.spawner.isRouteGateOpen() && this._didHumanPressInteract(preparedInputs)) {
      this.advanceZoneRoute(input);
    }
    this.collision.resolve(this.hunters.players, this.spawner.getActiveEnemies());
    this.spawner.syncVisuals();
    this.sparks.update(scaledDt);
    this._hitFlares.update(scaledDt);
    this.cameraShake.update(scaledDt);
    const currentRouteState = this.spawner.getRouteState?.() || routeState;
    this.zoneManager.update(scaledDt, this._getPlayerFocusX(), currentRouteState);
    this._applyZoneHazards(scaledDt, currentRouteState);
    this._updateSharedCamera();
    this._updateCameraTilt(scaledDt);
    this._checkForWipe();
    this.hud.setPlayerCombos(this.combat.getComboCounts());
    this.hud.update(this.camera);
    this._syncPlayerAuras(scaledDt);
    this._updateDebugHitboxes();

    // Animate + collision-check exit portals
    if (this._exitPortalOpen) this._tickExitPortals(scaledDt);
  }

  // ---------------------------------------------------------------------------
  // Exit portal — spawned after a zone boss is cleared
  // ---------------------------------------------------------------------------

  _tickExitPortals(dt) {
    if (this._exitPortalHubGroup) {
      const g = this._exitPortalHubGroup;
      g.ring.rotation.z += dt * 2.2;
      g.rift.material.uniforms.uTime.value += dt;
      g.glow.material.uniforms.uTime.value += dt;
    }
    if (this._exitPortalNextGroup) {
      const g = this._exitPortalNextGroup;
      g.ring.rotation.z += dt * 2.8;
      g.rift.material.uniforms.uTime.value += dt;
      g.glow.material.uniforms.uTime.value += dt;
    }

    for (const p of this.hunters.players) {
      if (p.state === 'DEAD') continue;
      if (Math.abs(p.position.x - EXIT_PORTAL_HQ_X) < EXIT_PORTAL_RADIUS) {
        this._resolveExitPortal('hub');
        return;
      }
      if (this._exitPortalNextGroup && Math.abs(p.position.x - EXIT_PORTAL_NEXT_X) < EXIT_PORTAL_RADIUS) {
        this._resolveExitPortal('continue');
        return;
      }
    }
  }

  _buildExitPortalGroup(x, colour) {
    const group = new THREE.Group();

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.13, 8, 28),
      new THREE.MeshBasicMaterial({
        color: colour,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })
    );
    group.add(ring);

    const { mesh: riftMesh, material: riftMat } = createPortalRift(colour);
    riftMesh.position.z = 0.01;
    group.add(riftMesh);

    const { mesh: glowMesh, material: glowMat } = createPortalFloorGlow(colour);
    glowMesh.position.set(0, -0.9, -0.15);
    group.add(glowMesh);

    group.position.set(x, -2.18, 0.3);
    group.renderOrder = 20;
    group.traverse((child) => {
      if (child.isMesh) child.renderOrder = 20;
    });
    this.scene.add(group);
    this._exitPortalMeshes.push(group);

    return { group, ring, rift: riftMesh, glow: glowMesh };
  }

  _openExitPortalChoice(clearedZoneId) {
    this._destroyExitPortals();

    const nextZoneId   = this.zoneManager.getNextZoneId(clearedZoneId);
    this._exitPortalOpen      = true;
    this._exitPortalNextZone  = nextZoneId;
    this._lastClearedZoneId   = clearedZoneId;

    this._exitPortalHubGroup = this._buildExitPortalGroup(EXIT_PORTAL_HQ_X, HQ_PORTAL_COLOUR);

    if (nextZoneId) {
      const nextColour = ZONE_CONFIGS[nextZoneId]?.portalColor ?? 0x7b3fff;
      this._exitPortalNextGroup = this._buildExitPortalGroup(EXIT_PORTAL_NEXT_X, nextColour);
    }

    const nextConfig = nextZoneId ? this.zoneManager.getZoneConfig(nextZoneId) : null;
    this.portalManager.showDualPortalLabels({
      hubLabel:  nextZoneId ? '← Return to HQ' : '← HQ  ·  Run Complete',
      nextLabel: nextConfig  ? `→ ${nextConfig.label}` : null,
    });
  }

  _resolveExitPortal(choice) {
    this._exitPortalOpen = false;
    this._destroyExitPortals();
    this.portalManager.hideDualPortalLabels();

    if (choice === 'continue' && this._exitPortalNextZone) {
      this._enterZone(this._exitPortalNextZone);
    } else {
      this._returnToHubAfterZoneClear();
    }
  }

  _destroyExitPortals() {
    for (const group of this._exitPortalMeshes) {
      this.scene.remove(group);
    }
    this._exitPortalMeshes    = [];
    this._exitPortalHubGroup  = null;
    this._exitPortalNextGroup = null;
  }

  // ---------------------------------------------------------------------------
  // Zone lifecycle
  // ---------------------------------------------------------------------------

  _enterZone(zoneId, input = null) {
    const config = this.zoneManager.getZoneConfig(zoneId);
    if (!config) return;

    this._setPauseMode('none');
    this.shop.close();
    this.hud.hideCardScreen();
    this._activeZoneId = zoneId;
    RunState.onZoneEntry(zoneId);
    RunState.setZoneInfo({ zoneId, zoneLabel: config.label, zoneNumber: config.number });
    RunState.clearBossInfo();
    this.mode = SceneModes.ZONE;
    this._zoneReturnPending = false;
    this._transitionLock = true;
    this._zoneHazardTime = 0;
    this._zoneHazardTickAt.clear();
    setActiveArenaBounds(config.playBounds, config.blockers || []);
    if (input) this.hunters.clearInputBuffers(input);
    this.hunters.setFormation(-4, -2.2);
    this._setHubVisible(false);
    this.zoneManager.showZone(zoneId);
    this.spawner.startZone(config);
    this.portalManager.showZoneTitleCard(config.label, config.number);
    this.hud.showZoneTitle(config.label, config.number);
    this.hud.clearBossBar();
    setTimeout(() => { this._transitionLock = false; }, 120);
  }

  enterZone(zoneId, input = null) {
    this._enterZone(zoneId, input);
  }

  advanceZoneRoute(input = null) {
    const advanced = this.spawner.advanceRoute();
    if (advanced && input) this.hunters.clearInputBuffers(input);
    return advanced;
  }

  startNewRunFromRunState() {
    while (this.hunters.players.length < RunState.players.length) {
      const player = RunState.players[this.hunters.players.length];
      if (!player) break;
      this._handlePlayerJoined({ player });
    }
    this.hunters.syncAllFromRunState(RunState.players);
    this.hunters.applyRunStateModifiers(RunState.players);
    this.spawner.setPlayerCount(this.hunters.activeHumanPlayerCount);
    this._switchToHub();
  }

  _onZoneCleared(zoneId, boss) {
    if (!zoneId || this._zoneReturnPending) return;

    this._zoneReturnPending = true;
    this._bossSeenZones.add(zoneId);
    const rewards = boss?.getRewards?.() || { xp: 0, essence: 0 };
    RunState.onZoneComplete(zoneId);
    this.hud.clearBossBar();

    // Resolve the per-zone clear background image
    const clearBg = this.zoneManager.getZoneClearBg(zoneId);

    // Show results card with zone-specific background
    this.portalManager.showResultsOverlay({
      title:   `${zoneId.replace('-', ' ').toUpperCase()} CLEAR`,
      essence: rewards.essence,
      xp:      rewards.xp,
      kills:   boss ? 1 : 0,
      bgImage: clearBg,
    });

    if (RunState.runComplete) {
      this.mode = SceneModes.END_SCREEN;
      this.zoneManager.showHub();
      this._setHubVisible(true);
      this._syncHubPortals();
      this.portalManager.showResultsOverlay({
        title:   'Victory',
        essence: rewards.essence,
        xp:      rewards.xp,
        kills:   boss ? 1 : 0,
        note:    'Run complete - Press Interact to return to HQ',
        bgImage: clearBg,
      });
      this.portalManager.showNameCard('Gate Closed', 'Interact: Return to HQ  |  Esc: Quit to Title', 4200);
      this._zoneReturnPending = false;
      return;
    }

    // After results card fades, spawn the dual exit portals
    setTimeout(() => {
      this._openExitPortalChoice(zoneId);
      this._zoneReturnPending = false;
    }, ZONE_CLEAR_RETURN_DELAY_MS);
  }

  _returnToHubAfterZoneClear() {
    this.portalManager.playExitTransition();
    this._switchToHub();
    this._zoneReturnPending = false;
  }

  _returnToHubFromEndScreen(input = null) {
    const totalEssence = RunState.players.reduce((sum, player) => sum + (player?.essence || 0), 0);
    this.audio.playSFX('ui-confirm');
    this.portalManager.playExitTransition({
      title:   'Returning to HQ',
      essence: totalEssence,
      xp:      0,
      kills:   0,
      note:    'Run summary saved',
    });
    this.portalManager.hideResultsOverlay();
    if (input) this.hunters.clearInputBuffers(input);
    this._switchToHub();
  }

  _switchToHub() {
    this._setPauseMode('none');
    this.mode = SceneModes.HUB;
    this._activeZoneId = null;
    this.zoneManager.showHub();
    this._setHubVisible(true);
    this._syncHubPortals();
    this.hunters.setFormation(0, -2.2);
    this.hud.clearBossBar();
    this.hud.hideCardScreen();
    this.combat.breakCombo();
    this.hud.setPlayerCombos([]);
    this.shop.close();
    this._zoneHazardTime = 0;
    this._zoneHazardTickAt.clear();
    const hubConfig = this.zoneManager.getZoneConfig('hub');
    setActiveArenaBounds(hubConfig?.playBounds, hubConfig?.blockers || []);
    RunState.clearBossInfo();
    this.spawner.startZone(null);
    this._resetCameraFrustum();
    this._transitionLock = false;

    // Highlight the suggested next portal if the player just cleared a zone
    if (this._lastClearedZoneId) {
      const suggestedNext = this.zoneManager.getNextZoneId(this._lastClearedZoneId);
      if (suggestedNext) this._setSuggestedPortal(suggestedNext);
    }
  }

  // ---------------------------------------------------------------------------
  // Hub portal helpers
  // ---------------------------------------------------------------------------

  _setHubVisible(visible) {
    for (const mesh of this._hubBackdrop) mesh.visible = visible;
    for (const portal of this._hubPortals) {
      portal.mesh.visible     = visible;
      portal.pedestal.visible = visible;
    }
  }

  _syncHubPortals() {
    const inHub        = this.mode === SceneModes.HUB;
    const unlockedZones = new Set(this.zoneManager.getUnlockedZoneIds(RunState.zonesCleared));
    for (const portal of this._hubPortals) {
      portal.unlocked            = unlockedZones.has(portal.zoneId);
      portal.mesh.visible        = inHub;
      portal.pedestal.visible    = inHub;
      portal.mesh.material.opacity     = portal.unlocked ? 0.95 : 0.28;
      portal.pedestal.material.opacity = portal.unlocked ? 1    : 0.35;
    }
  }

  _setSuggestedPortal(zoneId) {
    for (const portal of this._hubPortals) {
      const isSuggested = portal.zoneId === zoneId;
      portal.mesh.material.opacity = isSuggested ? 1.0 : (portal.unlocked ? 0.55 : 0.2);
      portal.mesh.material.color.setHex(isSuggested ? 0xaa66ff : portal.color);
      portal._suggested = isSuggested;
    }
    const clearedConfig = this.zoneManager.getZoneConfig(this._lastClearedZoneId);
    const nextConfig    = this.zoneManager.getZoneConfig(zoneId);
    if (clearedConfig && nextConfig) {
      this.portalManager.showNameCard(
        `Continue from ${clearedConfig.label}`,
        `\u2192 ${nextConfig.label} is ready`,
        3000
      );
    }
  }

  _findNearestUnlockedPortal(playerPosition) {
    return this._findNearestPortal(playerPosition, true);
  }

  _findNearestPortal(playerPosition, requireUnlocked = true) {
    if (!playerPosition) return null;
    let best = null;
    let bestDistance = Infinity;
    for (const portal of this._hubPortals) {
      if (requireUnlocked && !portal.unlocked) continue;
      const dx = playerPosition.x - portal.mesh.position.x;
      const dy = playerPosition.y - portal.mesh.position.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= HUB_PORTAL_INTERACT_RADIUS && distance < bestDistance) {
        best = portal;
        bestDistance = distance;
      }
    }
    return best;
  }

  _showLockedPortalHint(portal) {
    const now = performance.now();
    if (now - this._lastHubHintAt < 900) return;
    this._lastHubHintAt = now;

    const requirement = this.zoneManager.getUnlockRequirement(portal.zoneId);
    const config = this.zoneManager.getZoneConfig(portal.zoneId);
    if (!config) return;
    if (!requirement) {
      this.portalManager.showNameCard(`${config.label}`, 'Portal unavailable', 1100);
      return;
    }
    this.portalManager.showNameCard(
      `${config.label} Locked`,
      `Clear ${requirement} first`,
      1200
    );
  }

  _animateHubPortals(dt) {
    for (const portal of this._hubPortals) {
      portal.mesh.rotation.z += dt * (portal.unlocked ? 2.4 : 1.2);
      const pulse = 1 + Math.sin(performance.now() * 0.004 + portal.x) * 0.02;
      portal.mesh.scale.setScalar(portal.unlocked ? pulse : 0.96);
      portal.mesh.position.z    = -portal.mesh.position.y * 0.01 + 0.3;
      portal.pedestal.position.z = -portal.pedestal.position.y * 0.01;
    }
  }

  _animateHubLandmarks(_dt) {
    if (!this._hubHomeSpots?.length) return;
    const t = performance.now() * 0.001;
    for (let i = 0; i < this._hubHomeSpots.length; i += 1) {
      const entry = this._hubHomeSpots[i];
      if (!entry?.emblem || !entry?.base) continue;
      const wave = 1 + Math.sin(t * 2.2 + i * 1.3) * 0.06;
      entry.emblem.scale.setScalar(wave);
      if (entry.emblem.material?.opacity !== undefined) {
        entry.emblem.material.opacity = 0.54 + Math.sin(t * 3.1 + i) * 0.14;
      }
      entry.base.position.z = -entry.base.position.y * 0.01 - 0.25;
      entry.emblem.position.z = -entry.emblem.position.y * 0.01 - 0.19;
    }
  }

  // ---------------------------------------------------------------------------
  // Auras
  // ---------------------------------------------------------------------------

  _createAuraForEntry(entry) {
    const aura = createAura(entry.config.auraColor, 2.4);
    aura.visible = this.mode !== SceneModes.HUB;
    this.scene.add(aura);
    return aura;
  }

  _syncPlayerAuras(timeDelta) {
    for (let i = 0; i < this._playerAuras.length; i += 1) {
      const aura   = this._playerAuras[i];
      const player = this.hunters.players[i];
      if (!aura || !player) continue;
      aura.visible = this.mode !== SceneModes.HUB;
      aura.position.set(player.mesh.position.x, player.mesh.position.y, player.mesh.position.z - 0.05);
      aura.material.uniforms.uTime.value += timeDelta;
    }
  }

  // ---------------------------------------------------------------------------
  // Camera
  // ---------------------------------------------------------------------------

  _updateSharedCamera() {
    const players = this.hunters.players.filter(p => p.state !== 'DEAD');
    if (!players.length) return;

    let minX = players[0].position.x, maxX = players[0].position.x;
    let minY = players[0].position.y, maxY = players[0].position.y;
    for (const p of players) {
      minX = Math.min(minX, p.position.x); maxX = Math.max(maxX, p.position.x);
      minY = Math.min(minY, p.position.y); maxY = Math.max(maxY, p.position.y);
    }

    const focusX = (minX + maxX) / 2;
    const focusY = (minY + maxY) / 2;
    const laneCenterY = -2.2;
    const targetFocusY = laneCenterY + (focusY - laneCenterY) * 0.28;
    const aspect  = window.innerWidth / window.innerHeight;
    const padding = 2.25;
    const targetHeight = Math.max(
      ORTHO_HEIGHT,
      (maxY - minY) + padding,
      ((maxX - minX) + padding) / aspect
    );
    const boundedTargetHeight = Math.min(11.2, targetHeight);
    const currentHeight = this.camera.top - this.camera.bottom;
    const nextHeight    = currentHeight + (boundedTargetHeight - currentHeight) * 0.08;
    const halfH = nextHeight / 2;
    const halfW = halfH * aspect;

    const activeBounds = getActiveArenaBounds();
    const arenaMinX = activeBounds.minX;
    const arenaMaxX = activeBounds.maxX;
    const clampedX = Math.max(arenaMinX + halfW, Math.min(arenaMaxX - halfW, focusX));
    const camMinY = activeBounds.minY + 1.1;
    const camMaxY = activeBounds.maxY - 1.45;
    const clampedY = Math.max(camMinY, Math.min(camMaxY, targetFocusY));
    this.camera.position.x += (clampedX - this.camera.position.x) * 0.085;
    this.camera.position.y += (clampedY - this.camera.position.y) * 0.07;

    this.camera.top    =  halfH;
    this.camera.bottom = -halfH;
    this.camera.left   = -halfW;
    this.camera.right  =  halfW;
    this.camera.updateProjectionMatrix();
  }

  _getPlayerFocusX() {
    const players = this.hunters.players.filter(p => p.state !== 'DEAD');
    if (!players.length) return 0;
    return players.reduce((sum, p) => sum + p.position.x, 0) / players.length;
  }

  _resolveCameraTiltTarget() {
    const zoneId = this.mode === SceneModes.ZONE
      ? (this._activeZoneId || RunState.currentZone || 'city-breach')
      : 'hub';
    const profile = this.zoneManager.getCameraProfile?.(zoneId);
    if (Number.isFinite(profile?.tiltX)) return profile.tiltX;
    return DEFAULT_ORTHO_CAMERA_TILT_X;
  }

  _updateCameraTilt(dt) {
    this._cameraTiltTargetX = this._resolveCameraTiltTarget();
    this._cameraTiltX += (this._cameraTiltTargetX - this._cameraTiltX) * CAMERA_TILT_LERP;
    setCameraTiltX(this.camera, this._cameraTiltX);
    this.hunters.setBillboardTiltX?.(this._cameraTiltX);
    this.spawner.setBillboardTiltX?.(this._cameraTiltX);
  }

  _updateHubParallax(focusX) {
    for (const layer of this._hubParallaxLayers) {
      const offsetX = focusX * layer.speed;
      layer.mesh.position.x = layer.baseX + offsetX;
      if (layer.mesh.material?.map) {
        layer.mesh.material.map.offset.x = -offsetX * 0.01;
      }
    }
  }

  _collectParallaxDebug() {
    if (this.mode === SceneModes.HUB) {
      return this._hubParallaxLayers.map((layer) => ({
        id: layer.id,
        speed: layer.speed,
        x: layer.mesh.position.x,
        baseX: layer.baseX,
      }));
    }
    return this.zoneManager.getParallaxDebugInfo?.() || [];
  }

  _resetCameraFrustum() {
    const halfHeight = ORTHO_HEIGHT / 2;
    const halfWidth  = ORTHO_WIDTH  / 2;
    this.camera.top    =  halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.left   = -halfWidth;
    this.camera.right  =  halfWidth;
    this.camera.position.set(0, 0, 100);
    setCameraTiltX(this.camera, this._cameraTiltX);
    this.camera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------------------
  // Combat helpers
  // ---------------------------------------------------------------------------

  chooseCurrentCard(cardId = null) {
    if (!this.hud.isCardOpen()) {
      if (!this._openNextCardScreen()) return false;
    }
    const state = this.hud.getCardState();
    if (!state.open) return false;
    const selectedCardId = cardId || state.choices[state.selectedIndex]?.id;
    if (!selectedCardId) return false;
    const applied = RunState.applyCardChoice(state.playerIndex, selectedCardId);
    if (!applied) return false;
    this.hunters.applyRunStateModifiers(RunState.players);
    this.hud.hideCardScreen();
    this._resolveAICardChoices();
    this._openNextCardScreen();
    return true;
  }

  _openNextCardScreen() {
    if (this.hud.isCardOpen()) return true;
    const next = this._getNextHumanCardEntry();
    if (!next) return false;
    this.hud.showCardScreen(next);
    return true;
  }

  _applyCombatEvents(events) {
    for (const event of events) {
      if (!event) continue;
      if (event.type === 'hit') {
        this.sparks.spawn(event.x, event.y, event.intensity);
        this._hitFlares.spawn(event.x, event.y);
        this.cameraShake.request(event.intensity);
        this.hud.showDamageNumber(event.x, event.y, event.damage, event.attackType);
        if (event.killed) {
          this.sparks.spawnEssence(event.x, event.y, event.player || this.player);
          if (this.spawner.isCurrentWaveCleared()) this._startKillSlowMo();
        }
      } else if (event.type === 'damage') {
        this.hud.showDamageNumber(event.x, event.y, event.damage, event.attackType || 'light');
      } else if (event.type === 'statusDamage') {
        this.hud.showDamageNumber(event.x, event.y, event.damage, 'status');
      } else if (event.type === 'kill') {
        this.sparks.spawnEssence(event.x, event.y, event.player || this.player);
        if (this.spawner.isCurrentWaveCleared()) this._startKillSlowMo();
      } else if (event.type === 'hitbox') {
        this.combat.addHitbox(event.hitbox);
      } else if (event.type === 'playerHit') {
        this.cameraShake.request(0.35);
      } else if (event.type === 'waveClear') {
        this.hud.showWaveClear();
      } else if (event.type === 'routeGateOpen') {
        const gateLabel = event.gateKind === 'boss' ? 'BOSS GATE OPEN' : `AREA ${event.nextArea}`;
        this.portalManager.showNameCard(gateLabel, 'Press Interact to advance', 900);
      } else if (event.type === 'bossStart') {
        const boss = event.boss;
        if (event.zoneId) this._bossSeenZones.add(event.zoneId);
        RunState.setBossInfo({ bossId: boss.config.id || boss.name, bossName: boss.name, hp: boss.hp, hpMax: boss.hpMax, phase: boss.phase });
        this.hud.setBossBar({ name: boss.name, hp: boss.hp, hpMax: boss.hpMax, phaseThresholds: boss._phaseThresholds || [] });
        this.cameraShake.request(0.45);
      } else if (event.type === 'bossPhase') {
        RunState.setBossInfo({ bossId: event.bossId, bossName: event.name, hp: event.hp, hpMax: event.hpMax, phase: event.phase });
        this.hud.updateBossBar(event.hp, event.hpMax, event.phase);
        this.cameraShake.request(0.55);
      } else if (event.type === 'bossTelegraph') {
        this.hud.updateBossBar(event.boss.hp, event.boss.hpMax, event.boss.phase);
        this.cameraShake.request(0.2);
      } else if (event.type === 'bossAttack') {
        this.hud.updateBossBar(event.boss.hp, event.boss.hpMax, event.boss.phase);
      } else if (event.type === 'bossDefeated') {
        if (event.zoneId) this._bossSeenZones.add(event.zoneId);
        this.hud.clearBossBar();
        RunState.clearBossInfo();
      } else if (event.type === 'zoneClear') {
        this._onZoneCleared(event.zoneId, event.boss);
      } else if (event.type === 'spell') {
        this.sparks.spawn(event.x, event.y, 0.25);
      } else if (event.type === 'revive') {
        this.sparks.spawn(event.x, event.y, 0.45);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Slow-mo, input helpers, debug
  // ---------------------------------------------------------------------------

  _startKillSlowMo() {
    this._slowMoTicks = Math.max(this._slowMoTicks, 30);
    this._slowMoScale = 0.3;
  }

  _updateSlowMo() {
    if (this._slowMoTicks <= 0) { this._slowMoScale = 1; return; }
    this._slowMoTicks -= 1;
    if (this._slowMoTicks <= 0) this._slowMoScale = 1;
  }

  _didHumanPressInteract(preparedInputs) {
    for (let i = 0; i < preparedInputs.length; i += 1) {
      const entry = this.hunters.entries[i];
      if (entry?.runPlayer?.isAI) continue;
      if (preparedInputs[i]?.justPressed(Actions.INTERACT)) return true;
    }
    return false;
  }

  _getShopInteractor(inputManager) {
    for (const player of this.hunters.players) {
      const input = inputManager.getPlayerInput(player.playerIndex);
      if (!input?.justPressed(Actions.INTERACT)) continue;
      const dx = player.position.x - SHOP_ANCHOR_X;
      const dy = player.position.y - SHOP_ANCHOR_Y;
      if (Math.hypot(dx, dy) <= SHOP_INTERACT_RADIUS) return player.playerIndex;
    }
    return null;
  }

  _getPortalInteractor(inputManager) {
    for (const player of this.hunters.players) {
      const runPlayer = RunState.players[player.playerIndex];
      if (runPlayer?.isAI) continue;
      const input = inputManager.getPlayerInput(player.playerIndex);
      if (!input?.justPressed(Actions.INTERACT)) continue;
      return player;
    }
    return null;
  }

  _applyZoneHazards(dt, routeState) {
    if (this.mode !== SceneModes.ZONE) return;
    const hazards = this.zoneManager.getActiveHazards(routeState);
    if (!hazards.length) return;

    this._zoneHazardTime += dt;
    for (const player of this.hunters.players) {
      if (!player || player.state === 'DEAD' || player.state === 'DOWNED') continue;
      const runPlayer = RunState.players[player.playerIndex];
      if (runPlayer?.isAI) continue;

      for (const hazard of hazards) {
        if (!this._pointInsideHazard(player.position, hazard)) continue;

        const key = `${player.playerIndex}:${hazard.id}`;
        const nextTick = this._zoneHazardTickAt.get(key) || 0;
        if (this._zoneHazardTime < nextTick) continue;

        const damage = Math.max(1, Math.round(hazard.damage || 8));
        const applied = player.takeDamage(damage, HAZARD_DEFAULT_KNOCKBACK);
        if (!applied) continue;
        this._zoneHazardTickAt.set(key, this._zoneHazardTime + Math.max(0.2, hazard.tick || 0.45));

        this.hud.showDamageNumber(
          player.position.x,
          player.position.y + 0.8,
          damage,
          'status'
        );
        this.cameraShake.request(0.2);
      }
    }
  }

  _pointInsideHazard(position, hazard) {
    if (!position || !hazard) return false;
    if (hazard.shape === 'circle') {
      const dx = position.x - hazard.x;
      const dy = position.y - hazard.y;
      return (dx * dx) + (dy * dy) <= (hazard.radius * hazard.radius);
    }

    if (hazard.shape === 'rect') {
      const halfW = hazard.width * 0.5;
      const halfH = hazard.height * 0.5;
      return (
        position.x >= hazard.x - halfW
        && position.x <= hazard.x + halfW
        && position.y >= hazard.y - halfH
        && position.y <= hazard.y + halfH
      );
    }

    return false;
  }

  _updateDebugHitboxes() {
    const activeHitboxes = this.combat.getActiveHitboxes().concat(this.spawner.getProjectileHitboxes());
    this.debugHitboxes.update(this.player, this.spawner.getActiveEnemies(), activeHitboxes);
  }

  _handlePlayerJoined({ player }) {
    const entry = this.hunters.addRunPlayer(player);
    if (!entry) return;
    entry.player.setBillboardTiltX?.(this._cameraTiltX);
    this._playerAuras.push(this._createAuraForEntry(entry));
    this.spawner.setPlayerCount(this.hunters.activeHumanPlayerCount);
    if (this.mode === SceneModes.HUB) {
      this.hunters.setFormation(0, -2.2);
    } else {
      const primary = this.hunters.primaryPlayer;
      entry.player.position.x = primary.position.x - 0.6 + entry.player.playerIndex * 0.4;
      entry.player.position.y = primary.position.y;
    }
  }

  _handleLevelupQueued(entry) {
    const runPlayer = RunState.players[entry.playerIndex];
    if (runPlayer?.isAI) { this._resolveAICardChoices(); return; }
    this.hud.showLevelUpFlash();
    if (!this.hud.isCardOpen()) this._openNextCardScreen();
  }

  _resolveAICardChoices() {
    let changed = false;
    while (true) {
      const aiEntry = RunState.pendingLevelUps.find(e => RunState.players[e.playerIndex]?.isAI);
      if (!aiEntry) break;
      const cardId = aiEntry.choices[0]?.id;
      if (!cardId) break;
      if (!RunState.applyCardChoice(aiEntry.playerIndex, cardId)) break;
      changed = true;
    }
    if (changed) this.hunters.applyRunStateModifiers(RunState.players);
  }

  _getNextHumanCardEntry() {
    return RunState.pendingLevelUps.find(e => !RunState.players[e.playerIndex]?.isAI) || null;
  }

  _updateCardInput(input) {
    if (input.justPressed(Actions.MOVE_LEFT))  this.hud.moveCardSelection(-1);
    if (input.justPressed(Actions.MOVE_RIGHT)) this.hud.moveCardSelection(1);
    if (input.justPressedKey('KeyA')) return this.chooseCurrentCard(this.hud.getCardState().choices[0]?.id);
    if (input.justPressedKey('KeyB')) return this.chooseCurrentCard(this.hud.getCardState().choices[1]?.id);
    if (input.justPressedKey('KeyC')) return this.chooseCurrentCard(this.hud.getCardState().choices[2]?.id);
    if (input.justPressed(Actions.INTERACT) || input.justPressed(Actions.LIGHT)) return this.chooseCurrentCard();
    return false;
  }

  _checkForWipe() {
    if (this._wipePending || this.mode !== SceneModes.ZONE) return;
    const players = this.hunters.players;
    if (!players.length) return;
    const wiped = players.every(p => p.state === 'DEAD' || p.state === 'DOWNED');
    if (!wiped) return;
    this._wipePending = true;
    const keptEssence = RunState.onRunWipe();
    this.portalManager.playWipeTransition({ title: 'Gate Closed', essence: 0, xp: 0, kills: 0, note: '50% Essence retained' });
    setTimeout(() => {
      RunState.resetAfterWipe(keptEssence);
      this.hunters.syncAllFromRunState(RunState.players);
      this.spawner.startZone(null);
      this._switchToHub();
      this._wipePending = false;
    }, WIPE_RETURN_DELAY_MS);
  }
}
