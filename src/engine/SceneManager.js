import * as THREE from 'three';
import { RunState } from '../core/RunState.js';
import {
  DEFAULT_ORTHO_CAMERA_TILT_X,
  ORTHO_HEIGHT,
  ORTHO_WIDTH,
  getCameraTiltX,
  setCameraFocus,
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
import { HubWorld } from '../visuals/HubWorld.js';

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
    this._reconcileWorldVisibility();
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
      this._updateHubPreview(dt);
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
    this._activeZoneId = null;
    this.zoneManager.showHub();
    this._setHubVisible(false);
    this.hunters.setVisible(false);
    this.titleScreen.show();
  }

  transitionToHunterSelect(isCoop) {
    this._setPauseMode('none');
    this.settingsPanel.close({ skipCallback: true });
    this.pauseMenu.close();
    this.audio.playSFX('ui-confirm');
    this.titleScreen.hide();
    this.mode = SceneModes.HUNTER_SELECT;
    this._activateHubPreview();
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
    const mods = this.player?.hunterConfig?.modifiers || {};
    const scaling = {
      damage: 1 + (mods.damageMult || 0),
      spell: 1 + (mods.spellDamageMult || 0),
      status: 1 + (mods.statusDamageMult || 0),
      speed: 1 + (mods.speedMult || 0),
      cooldown: Math.max(0.2, 1 + (mods.cooldownMult || 0)),
      surgeGain: 1 + (mods.surgeGainMult || 0),
      essenceGain: 1 + (mods.essenceGainMult || 0),
      lifesteal: mods.lifesteal || 0,
      dodgeIFramesBonus: mods.dodgeIFrameBonus || 0,
    };

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
      scaling,
      parallax: this._collectParallaxDebug(),
      world: this.getWorldVisibilityDebug(),
    };
  }

  // ---------------------------------------------------------------------------
  // Scene setup
  // ---------------------------------------------------------------------------

  _setupLighting() {
    const ambient = new THREE.AmbientLight(0xe5ebff, 0.85);
    this.scene.add(ambient);
    const hemi = new THREE.HemisphereLight(0x9fc6ff, 0x24304a, 0.62);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffefdb, 1.15);
    key.position.set(-5, 6, 9);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x7bbcff, 0.72);
    rim.position.set(6, -2.5, 6);
    this.scene.add(rim);
  }

  _setupHubBackdrop() {
    this._hubWorld = new HubWorld(this.scene, ZONE_CONFIGS.hub);
    this._hubWorldBuilt = false;
    this._hubBackdrop = [this._hubWorld.group];
    this._hubHomeSpots = this._hubWorld.homeSpots;
  }

  _ensureHubWorldBuilt() {
    if (this._hubWorldBuilt || !this._hubWorld) return;
    this._hubWorld.build();
    this._hubWorldBuilt = true;
    this._hubHomeSpots = this._hubWorld.homeSpots;
  }

  _activateHubPreview() {
    this._activeZoneId = null;
    this.zoneManager.showHub();
    this._ensureHubWorldBuilt();
    this._setHubVisible(true);
    this._syncHubPortals();
    this.hunters.setVisible(false);
    this.shop.close();
    this.portalManager.hideResultsOverlay();
    this.portalManager.clearZoneCard();
    this.hud.hideOnboarding();
    this.hud.hideCardScreen();
    this.hud.clearBossBar();
    const hubConfig = this.zoneManager.getZoneConfig('hub');
    setActiveArenaBounds(hubConfig?.playBounds, hubConfig?.blockers || []);
    RunState.clearBossInfo();
    this.spawner.startZone(null);
    this._resetCameraFrustum();
    this._frameHubCamera({ snap: true, preview: true, focusX: 0 });
    this._reconcileWorldVisibility();
    this._scheduleVisibilityReconcile();
  }

  _setupHubPortals() {
    this._hubPortals = [];
    const layout = this.zoneManager.getPortalLayout();
    const ringGeo = new THREE.TorusGeometry(0.62, 0.09, 16, 72);
    const innerRingGeo = new THREE.TorusGeometry(0.45, 0.05, 12, 64);
    const coreGeo = new THREE.CircleGeometry(0.34, 48);
    const plateGeo = new THREE.CylinderGeometry(0.62, 0.74, 0.18, 18);
    const baseGeo = new THREE.CylinderGeometry(0.84, 1.02, 0.26, 18);

    for (const entry of layout) {
      const portalY = Number.isFinite(entry.y) ? entry.y : -1.9;
      const stack = new THREE.Group();
      stack.position.set(entry.x, portalY, 0);
      this.scene.add(stack);

      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(0.8, 40),
        new THREE.MeshBasicMaterial({
          color: entry.color,
          transparent: true,
          opacity: 0.2,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      glow.position.set(0, 0, 0.19);
      glow.renderOrder = 18;
      stack.add(glow);

      const core = new THREE.Mesh(
        coreGeo,
        new THREE.MeshBasicMaterial({
          color: entry.color,
          transparent: true,
          opacity: 0.36,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      core.position.set(0, 0, 0.24);
      core.renderOrder = 19;
      stack.add(core);

      const ringOuter = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({
          color: entry.color,
          transparent: true,
          opacity: 0.92,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      ringOuter.position.set(0, 0, 0.27);
      ringOuter.renderOrder = 20;
      stack.add(ringOuter);

      const ringInner = new THREE.Mesh(
        innerRingGeo,
        new THREE.MeshBasicMaterial({
          color: 0xdbe8ff,
          transparent: true,
          opacity: 0.48,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      ringInner.position.set(0, 0, 0.28);
      ringInner.renderOrder = 21;
      stack.add(ringInner);

      const portalPlate = new THREE.Mesh(plateGeo, new THREE.MeshLambertMaterial({ color: 0x263853 }));
      portalPlate.position.set(0, -0.58, 0.12);
      portalPlate.renderOrder = 10;
      stack.add(portalPlate);

      const portalBase = new THREE.Mesh(baseGeo, new THREE.MeshLambertMaterial({ color: 0x1e2d44 }));
      portalBase.position.set(0, -0.8, 0.06);
      portalBase.renderOrder = 9;
      stack.add(portalBase);

      const pedestal = portalBase;
      const portal = ringOuter;
      this._hubPortals.push({
        ...entry,
        y: portalY,
        group: stack,
        mesh: portal,
        glow,
        core,
        innerRing: ringInner,
        pedestal,
        unlocked: false,
      });
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
      this._hubWorld?.update(dt, this._getPlayerFocusX());
      this.hud.update(this.camera);
      return;
    }

    this._frameHubCamera({
      focusX: this.hunters.primaryPlayer?.position.x || 0,
      snap: false,
      preview: false,
    });

    this.hunters.update(dt, input);
    this._updateCameraTilt(dt);
    this._hubWorld?.update(dt, this._getPlayerFocusX());
    this.sparks.update(dt);
    this.cameraShake.update(dt);
    this._animateHubPortals(dt);
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

  _updateHubPreview(dt) {
    this._frameHubCamera({ snap: false, preview: true, focusX: 0 });
    this._updateCameraTilt(dt);
    this._hubWorld?.update(dt, 0);
    this.cameraShake.update(dt);
    this._animateHubPortals(dt);
    this._syncHubPortals();
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
    this.hunters.setVisible(true);
    this._setHubVisible(false);
    this.zoneManager.showZone(zoneId);
    this._reconcileWorldVisibility();
    this._scheduleVisibilityReconcile();
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
    this._ensureHubWorldBuilt();
    this._setHubVisible(true);
    this._syncHubPortals();
    this.hunters.setFormation(0, -2.2);
    this.hunters.setVisible(true);
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
    this._frameHubCamera({
      snap: true,
      preview: false,
      focusX: this.hunters.primaryPlayer?.position.x || 0,
    });
    this._reconcileWorldVisibility();
    this._scheduleVisibilityReconcile();
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
      if (portal.group) portal.group.visible = visible;
      portal.mesh.visible = visible;
      portal.pedestal.visible = visible;
      if (portal.glow) portal.glow.visible = visible;
      if (portal.core) portal.core.visible = visible;
      if (portal.innerRing) portal.innerRing.visible = visible;
    }
  }

  _syncHubPortals() {
    const inHub        = this.mode === SceneModes.HUB || this.mode === SceneModes.HUNTER_SELECT;
    const unlockedZones = new Set(this.zoneManager.getUnlockedZoneIds(RunState.zonesCleared));
    for (const portal of this._hubPortals) {
      portal.unlocked            = unlockedZones.has(portal.zoneId);
      if (portal.group) portal.group.visible = inHub;
      portal.mesh.visible = inHub;
      portal.pedestal.visible = inHub;
      if (portal.glow) portal.glow.visible = inHub;
      if (portal.core) portal.core.visible = inHub;
      if (portal.innerRing) portal.innerRing.visible = inHub;

      portal.mesh.material.opacity = portal.unlocked ? 0.96 : 0.22;
      if (portal.core?.material) portal.core.material.opacity = portal.unlocked ? 0.4 : 0.14;
      if (portal.glow?.material) portal.glow.material.opacity = portal.unlocked ? 0.24 : 0.08;
      portal.pedestal.material.opacity = portal.unlocked ? 1 : 0.55;
    }
  }

  _setSuggestedPortal(zoneId) {
    for (const portal of this._hubPortals) {
      const isSuggested = portal.zoneId === zoneId;
      portal.mesh.material.opacity = isSuggested ? 1.0 : (portal.unlocked ? 0.64 : 0.2);
      portal.mesh.material.color.setHex(isSuggested ? 0xaa66ff : portal.color);
      if (portal.core?.material) portal.core.material.color.setHex(isSuggested ? 0xaa66ff : portal.color);
      if (portal.glow?.material) portal.glow.material.color.setHex(isSuggested ? 0xaa66ff : portal.color);
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
      const anchorX = Number.isFinite(portal.group?.position?.x) ? portal.group.position.x : portal.x;
      const anchorY = Number.isFinite(portal.group?.position?.y) ? portal.group.position.y : portal.y;
      const dx = playerPosition.x - anchorX;
      const dy = playerPosition.y - anchorY;
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
      if (portal.innerRing) portal.innerRing.rotation.z -= dt * (portal.unlocked ? 1.8 : 0.9);
      const pulse = 1 + Math.sin(performance.now() * 0.004 + portal.x) * 0.02;
      portal.mesh.scale.setScalar(portal.unlocked ? pulse : 0.96);
      if (portal.core) portal.core.scale.setScalar(portal.unlocked ? (1 + (pulse - 1) * 1.6) : 0.96);
      if (portal.glow) portal.glow.scale.setScalar(portal.unlocked ? (1 + (pulse - 1) * 2.2) : 0.95);
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
    const profile = this.zoneManager.getCameraProfile?.(this._activeZoneId || RunState.currentZone || 'city-breach') || {};
    const laneBias = Number.isFinite(profile.laneBias) ? profile.laneBias : 0.3;
    const targetFocusY = laneCenterY + (focusY - laneCenterY) * laneBias;
    const aspect  = window.innerWidth / window.innerHeight;
    const padding = Number.isFinite(profile.framingPadding) ? profile.framingPadding : 2.6;
    const targetHeight = Math.max(
      ORTHO_HEIGHT,
      (maxY - minY) + padding,
      ((maxX - minX) + padding) / aspect
    );
    const minViewHeight = Number.isFinite(profile.zoomMin) ? profile.zoomMin : ORTHO_HEIGHT;
    const maxViewHeight = Number.isFinite(profile.zoomMax) ? profile.zoomMax : Math.max(ORTHO_HEIGHT, this._resolveCameraViewHeight() + 2.0);
    const boundedTargetHeight = Math.max(minViewHeight, Math.min(maxViewHeight, targetHeight));
    const currentHeight = this.camera.top - this.camera.bottom;
    const zoomLerp = Number.isFinite(profile.zoomLerp) ? profile.zoomLerp : 0.14;
    const nextHeight = currentHeight + (boundedTargetHeight - currentHeight) * zoomLerp;
    const halfH = nextHeight / 2;
    const halfW = halfH * aspect;

    const activeBounds = getActiveArenaBounds();
    const arenaMinX = activeBounds.minX;
    const arenaMaxX = activeBounds.maxX;
    const clampedX = Math.max(arenaMinX + halfW, Math.min(arenaMaxX - halfW, focusX));
    const camMinY = activeBounds.minY + 1.1;
    const camMaxY = activeBounds.maxY - 1.45;
    const clampedY = Math.max(camMinY, Math.min(camMaxY, targetFocusY));
    const currentFocusX = Number.isFinite(this.camera.userData.focusX) ? this.camera.userData.focusX : 0;
    const currentFocusY = Number.isFinite(this.camera.userData.focusY) ? this.camera.userData.focusY : 0;
    const followLerpX = Number.isFinite(profile.followLerpX) ? profile.followLerpX : 0.11;
    const followLerpY = Number.isFinite(profile.followLerpY) ? profile.followLerpY : 0.1;
    const nextFocusX = currentFocusX + (clampedX - currentFocusX) * followLerpX;
    const nextFocusY = currentFocusY + (clampedY - currentFocusY) * followLerpY;
    setCameraFocus(this.camera, nextFocusX, nextFocusY);

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

  _resolveCameraViewHeight() {
    const zoneId = this.mode === SceneModes.ZONE
      ? (this._activeZoneId || RunState.currentZone || 'city-breach')
      : 'hub';
    const profile = this.zoneManager.getCameraProfile?.(zoneId);
    if (Number.isFinite(profile?.viewHeight)) return profile.viewHeight;
    return ORTHO_HEIGHT;
  }

  _resolveCameraFocusY() {
    const zoneId = this.mode === SceneModes.ZONE
      ? (this._activeZoneId || RunState.currentZone || 'city-breach')
      : 'hub';
    const profile = this.zoneManager.getCameraProfile?.(zoneId);
    if (Number.isFinite(profile?.focusY)) return profile.focusY;
    return 0;
  }

  _updateCameraTilt(dt) {
    this._cameraTiltTargetX = this._resolveCameraTiltTarget();
    this._cameraTiltX += (this._cameraTiltTargetX - this._cameraTiltX) * CAMERA_TILT_LERP;
    setCameraTiltX(this.camera, this._cameraTiltX);
    this.hunters.setBillboardTiltX?.(this._cameraTiltX);
    this.spawner.setBillboardTiltX?.(this._cameraTiltX);
  }

  _collectParallaxDebug() {
    if (this.mode === SceneModes.HUB) {
      return this._hubWorld?.getParallaxDebugInfo?.() || [];
    }
    return this.zoneManager.getParallaxDebugInfo?.() || [];
  }

  getWorldVisibilityDebug() {
    const zoneHealth = this.zoneManager.getWorldHealthDebug?.() || null;
    const hubVisible = this._hubBackdrop?.some(mesh => !!mesh?.visible) || false;
    const hubMeshCount = this._countVisibleMeshes(this._hubWorld?.group);
    const hubParallaxCount = this._hubWorld?.getParallaxDebugInfo?.().length || 0;
    return {
      mode: this.mode,
      activeZoneId: this._activeZoneId || zoneHealth?.activeZoneId || 'hub',
      hub: {
        visible: hubVisible,
        meshCount: hubMeshCount,
        parallaxCount: hubParallaxCount,
      },
      zone: zoneHealth,
    };
  }

  _resetCameraFrustum() {
    const viewHeight = this._resolveCameraViewHeight();
    const halfHeight = viewHeight / 2;
    const halfWidth  = halfHeight * (window.innerWidth / window.innerHeight);
    this.camera.top    =  halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.left   = -halfWidth;
    this.camera.right  =  halfWidth;
    setCameraFocus(this.camera, 0, this._resolveCameraFocusY());
    setCameraTiltX(this.camera, this._cameraTiltX);
    this.camera.updateProjectionMatrix();
  }

  _reconcileWorldVisibility() {
    const inHub = this.mode === SceneModes.HUB || this.mode === SceneModes.HUNTER_SELECT;
    this._setHubVisible(inHub);
    if (inHub) {
      this.zoneManager.showHub();
      return;
    }
    if (this.mode === SceneModes.ZONE && this._activeZoneId) {
      this.zoneManager.showZone(this._activeZoneId);
    }
  }

  _scheduleVisibilityReconcile() {
    setTimeout(() => this._reconcileWorldVisibility(), 0);
  }

  _countVisibleMeshes(root) {
    if (!root) return 0;
    let count = 0;
    root.traverse((child) => {
      if (child?.isMesh && child.visible !== false) count += 1;
    });
    return count;
  }

  _frameHubCamera({ focusX = 0, snap = false, preview = false } = {}) {
    const profile = this.zoneManager.getCameraProfile?.('hub') || {};
    const hubBounds = ZONE_CONFIGS.hub?.playBounds || { minX: -8.4, maxX: 8.4 };
    const halfWidth = (this.camera.right - this.camera.left) * 0.5;
    const targetBaseX = preview ? 0 : (focusX + 0.2);
    const minFocusX = hubBounds.minX + halfWidth;
    const maxFocusX = hubBounds.maxX - halfWidth;
    const clampedX = minFocusX <= maxFocusX
      ? Math.max(minFocusX, Math.min(maxFocusX, targetBaseX))
      : 0;
    const targetY = this._resolveCameraFocusY();
    const currentFocusX = Number.isFinite(this.camera.userData.focusX) ? this.camera.userData.focusX : 0;
    const currentFocusY = Number.isFinite(this.camera.userData.focusY) ? this.camera.userData.focusY : targetY;
    const followX = Number.isFinite(profile.hubFollowLerpX) ? profile.hubFollowLerpX : 0.08;
    const followY = Number.isFinite(profile.hubFollowLerpY) ? profile.hubFollowLerpY : 0.1;
    const nextFocusX = snap ? clampedX : currentFocusX + (clampedX - currentFocusX) * (preview ? followX * 0.8 : followX);
    const nextFocusY = snap ? targetY : currentFocusY + (targetY - currentFocusY) * (preview ? followY * 0.85 : followY);
    setCameraFocus(this.camera, nextFocusX, nextFocusY);
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
    if (input.justPressedKey('KeyA') || input.justPressedKey('Digit1')) return this.chooseCurrentCard(this.hud.getCardState().choices[0]?.id);
    if (input.justPressedKey('KeyB') || input.justPressedKey('Digit2')) return this.chooseCurrentCard(this.hud.getCardState().choices[1]?.id);
    if (input.justPressedKey('KeyC') || input.justPressedKey('Digit3')) return this.chooseCurrentCard(this.hud.getCardState().choices[2]?.id);
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
