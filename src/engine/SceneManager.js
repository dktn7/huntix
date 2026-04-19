import * as THREE from 'three';
import { RunState } from '../core/RunState.js';
import { ORTHO_HEIGHT, ORTHO_WIDTH } from './Renderer.js';
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
import { createAura } from '../visuals/AuraShader.js';
import { HitFlarePool } from '../visuals/HitFlarePool.js';
import { AudioManager } from './AudioManager.js';

import { TitleScreen } from '../screens/TitleScreen.js';
import { HunterSelectScreen } from '../screens/HunterSelectScreen.js';

const SceneModes = {
  TITLE_SCREEN: 'TITLE_SCREEN',
  HUNTER_SELECT: 'HUNTER_SELECT',
  HUB: 'HUB',
  ZONE: 'ZONE',
  END_SCREEN: 'END_SCREEN',
};

const ZONE_CLEAR_RETURN_DELAY_MS = 1800;
const WIPE_RETURN_DELAY_MS = 800;
const SHOP_ANCHOR_X = -4.8;
const SHOP_ANCHOR_Y = -2.2;
const SHOP_INTERACT_RADIUS = 1.25;

export class SceneManager {
  constructor(renderer) {
    this.scene = new THREE.Scene();
    this.camera = renderer.createCamera();
    this.mode = SceneModes.TITLE_SCREEN;
    this.debugEnabled = false;
    this._zoneReturnPending = false;
    this._wipePending = false;
    this._activeZoneId = null;
    this._transitionLock = false;
    this._bossSeenZones = new Set();
    this._onboardingDone = false;

    const overlay = document.getElementById('ui-overlay');
    this.portalManager = new PortalManager(overlay);
    this.zoneManager = new ZoneManager(this.scene);
    this.audio = new AudioManager();

    this._setupLighting();
    this._setupHubBackdrop();
    this._setupHubPortals();

    this.titleScreen = new TitleScreen(overlay, 
      () => this.transitionToHunterSelect(false),
      () => this.transitionToHunterSelect(true)
    );
    this.hunterSelectScreen = new HunterSelectScreen(overlay,
      (configs) => this.startRun(configs),
      () => this.transitionToTitle()
    );

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
    
    this.titleScreen.show();
  }

  update(dt, input) {
    input.poll();

    if (input.anyJustPressed() && !this.audio._initialized) {
      this.audio.init();
      this.audio.playMusic('title');
    }

    if (input.justPressed(Actions.DEBUG)) {
      this.debugEnabled = !this.debugEnabled;
      document.body.classList.toggle('debug', this.debugEnabled);
      this.debugHitboxes.setEnabled(this.debugEnabled);
    }
    
    if (this.mode === SceneModes.TITLE_SCREEN) {
      const prevIndex = this.titleScreen.selectedIndex;
      this.titleScreen.update(input);
      if (this.titleScreen.selectedIndex !== prevIndex) {
        this.audio.playSFX('ui-navigate');
      }
      return;
    }

    if (this.mode === SceneModes.HUNTER_SELECT) {
      const prevCursor = this.hunterSelectScreen.cursorIndex;
      this.hunterSelectScreen.update(input);
      if (this.hunterSelectScreen.cursorIndex !== prevCursor) {
        this.audio.playSFX('hunter-hover');
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
    this.portalManager.hideResultsOverlay();
    this.portalManager.clearZoneCard();
    this.audio.playSFX('ui-back');
    this.hunterSelectScreen.hide();
    this.mode = SceneModes.TITLE_SCREEN;
    this.titleScreen.show();
  }

  transitionToHunterSelect(isCoop) {
    this.audio.playSFX('ui-confirm');
    this.titleScreen.hide();
    this.mode = SceneModes.HUNTER_SELECT;
    this.hunterSelectScreen.setCoop(isCoop);
    this.hunterSelectScreen.show();
  }

  startRun(playerConfigs) {
    this.audio.playSFX('hunter-confirm');
    this.hunterSelectScreen.hide();
    RunState.init(playerConfigs);
    
    // Re-initialize hunters and systems with new RunState
    this.hunters.syncAllFromRunState(RunState.players);
    this.player = this.hunters.primaryPlayer;
    this.resources = this.player.resources;
    this.spawner.setPlayerCount(this.hunters.activeHumanPlayerCount);
    
    // Clear and recreate auras
    this._playerAuras.forEach(aura => this.scene.remove(aura));
    this._playerAuras = this.hunters.entries.map(entry => this._createAuraForEntry(entry));

    this._switchToHub();
    this.hud.showOnboarding();
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

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
      combo: this.combat.comboCount,
      comboByPlayer: this.combat.getComboCounts(),
      hitstop: this.combat.hitstopRemaining,
      boss: RunState.activeBossName,
      bossHp: RunState.activeBossHp,
      bossHpMax: RunState.activeBossHpMax,
      bossPhase: RunState.activeBossPhase,
    };
  }

  _setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffeedd, 0.6);
    dir.position.set(-3, 5, 10);
    this.scene.add(dir);
  }

  _setupHubBackdrop() {
    this._hubBackdrop = [];

    const groundGeo = new THREE.PlaneGeometry(ORTHO_WIDTH, 2);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -3, 0);
    this.scene.add(ground);
    this._hubBackdrop.push(ground);

    const bgColors = [0x16213e, 0x0f3460, 0x16213e];
    bgColors.forEach((color, i) => {
      const geo = new THREE.BoxGeometry(ORTHO_WIDTH, 3, 0.1);
      const mat = new THREE.MeshLambertMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, 2 + i * 2, -(i + 1) * 2);
      this.scene.add(mesh);
      this._hubBackdrop.push(mesh);
    });
  }

  _setupHubPortals() {
    this._hubPortals = [];
    const layout = this.zoneManager.getPortalLayout();
    const portalGeo = new THREE.TorusGeometry(0.62, 0.09, 8, 24);
    const pedestalGeo = new THREE.BoxGeometry(1.2, 0.18, 0.1);

    for (const entry of layout) {
      const portalMat = new THREE.MeshBasicMaterial({
        color: entry.color,
        transparent: true,
        opacity: 0.45,
      });
      const portal = new THREE.Mesh(portalGeo, portalMat);
      portal.position.set(entry.x, -2.2, 0.3);
      this.scene.add(portal);

      const pedestalMat = new THREE.MeshLambertMaterial({ color: 0x29364f });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.set(entry.x, -2.85, 0.2);
      this.scene.add(pedestal);

      this._hubPortals.push({
        ...entry,
        mesh: portal,
        pedestal,
        unlocked: false,
      });
    }
    this._syncHubPortals();
  }

  _updateHub(dt, input) {
    if (this.shop.isOpen()) {
      const shopInput = input.getPlayerInput(this.shop.playerIndex);
      const result = this.shop.update(shopInput);
      if (result?.ok && result.action === 'purchase') {
        this.hunters.applyRunStateModifiers(RunState.players);
      }
      this.hud.update(this.camera);
      return;
    }

    this.hunters.update(dt, input);
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
        const portal = this._findNearestUnlockedPortal(portalInteractor.position);
        if (portal) this._enterZone(portal.zoneId, input);
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
      return;
    }

    const enemies = this.spawner.getActiveEnemies();
    const preparedInputs = this.hunters.prepareZoneInputs(
      scaledDt,
      input,
      enemies,
      this.spawner.getRouteState?.() || null
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
    this.zoneManager.update(scaledDt, this._getPlayerFocusX());
    this._updateSharedCamera();
    this._checkForWipe();
    this.hud.setPlayerCombos(this.combat.getComboCounts());
    this.hud.update(this.camera);
    this._syncPlayerAuras(scaledDt);
    this._updateDebugHitboxes();
  }

  _enterZone(zoneId, input = null) {
    const config = this.zoneManager.getZoneConfig(zoneId);
    if (!config) return;

    this.shop.close();
    this.hud.hideCardScreen();
    this._activeZoneId = zoneId;
    RunState.onZoneEntry(zoneId);
    RunState.setZoneInfo({ zoneId, zoneLabel: config.label, zoneNumber: config.number });
    RunState.clearBossInfo();
    this.mode = SceneModes.ZONE;
    this._zoneReturnPending = false;
    this._transitionLock = true;
    if (input) this.hunters.clearInputBuffers(input);
    this.hunters.setFormation(-4, -2.2);
    this._setHubVisible(false);
    this.zoneManager.showZone(zoneId);
    this.spawner.startZone(config);
    this.portalManager.showZoneTitleCard(config.label, config.number);
    this.hud.showZoneTitle(config.label, config.number);
    this.hud.clearBossBar();
    setTimeout(() => {
      this._transitionLock = false;
    }, 120);
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

  _handlePlayerJoined({ player }) {
    const entry = this.hunters.addRunPlayer(player);
    if (!entry) return;

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
      } else if (event.type === 'bossStart' || event.type === 'minibossStart') {
        const boss = event.boss;
        if (event.zoneId) this._bossSeenZones.add(event.zoneId);
        RunState.setBossInfo({
          bossId: boss.config.id || boss.name,
          bossName: boss.name,
          hp: boss.hp,
          hpMax: boss.hpMax,
          phase: boss.phase,
        });
        this.hud.setBossBar({
          name: boss.name,
          hp: boss.hp,
          hpMax: boss.hpMax,
          phaseThresholds: boss._phaseThresholds || [],
        });
        this.cameraShake.request(0.45);
      } else if (event.type === 'bossPhase') {
        RunState.setBossInfo({
          bossId: event.bossId,
          bossName: event.name,
          hp: event.hp,
          hpMax: event.hpMax,
          phase: event.phase,
        });
        this.hud.updateBossBar(event.hp, event.hpMax, event.phase);
        this.cameraShake.request(0.55);
      } else if (event.type === 'bossTelegraph') {
        this.hud.updateBossBar(event.boss.hp, event.boss.hpMax, event.boss.phase);
        this.cameraShake.request(0.2);
      } else if (event.type === 'bossAttack') {
        this.hud.updateBossBar(event.boss.hp, event.boss.hpMax, event.boss.phase);
      } else if (event.type === 'minibossDefeated') {
        this.hud.showWaveClear();
        this.portalManager.showResultsOverlay({
          title: `${event.boss.name} Defeated`,
          essence: event.boss.getRewards().essence,
          xp: event.boss.getRewards().xp,
          kills: 1,
        });
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

  _onZoneCleared(zoneId, boss) {
    if (!zoneId || this._zoneReturnPending) return;

    this._zoneReturnPending = true;
    this._bossSeenZones.add(zoneId);
    const rewards = boss?.getRewards?.() || { xp: 0, essence: 0 };
    RunState.onZoneComplete(zoneId);
    this.hud.clearBossBar();
    this.portalManager.showResultsOverlay({
      title: `${zoneId.replace('-', ' ').toUpperCase()} CLEAR`,
      essence: rewards.essence,
      xp: rewards.xp,
      kills: boss ? 1 : 0,
    });

    if (RunState.runComplete) {
      this.mode = SceneModes.END_SCREEN;
      this.zoneManager.showHub();
      this._setHubVisible(true);
      this._syncHubPortals();
      this.portalManager.showResultsOverlay({
        title: 'Victory',
        essence: rewards.essence,
        xp: rewards.xp,
        kills: boss ? 1 : 0,
        note: 'Run complete - Press Interact to return to Hub',
      });
      this.portalManager.showNameCard('Gate Closed', 'Interact: Return to Hub  |  Esc: Quit to Title', 4200);
      this._zoneReturnPending = false;
      return;
    }

    setTimeout(() => {
      this._returnToHubAfterZoneClear();
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
      title: 'Returning to Hub',
      essence: totalEssence,
      xp: 0,
      kills: 0,
      note: 'Run summary saved',
    });
    this.portalManager.hideResultsOverlay();
    if (input) this.hunters.clearInputBuffers(input);
    this._switchToHub();
  }

  _switchToHub() {
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
    RunState.clearBossInfo();
    this.spawner.startZone(null);
    this._resetCameraFrustum();
    this._transitionLock = false;
  }

  _setHubVisible(visible) {
    for (const mesh of this._hubBackdrop) {
      mesh.visible = visible;
    }
    for (const portal of this._hubPortals) {
      portal.mesh.visible = visible;
      portal.pedestal.visible = visible;
    }
  }

  _syncHubPortals() {
    const inHub = this.mode === SceneModes.HUB;
    const unlockedZones = new Set(this.zoneManager.getUnlockedZoneIds(RunState.zonesCleared));
    for (const portal of this._hubPortals) {
      portal.unlocked = unlockedZones.has(portal.zoneId);
      portal.mesh.visible = inHub;
      portal.pedestal.visible = inHub;
      portal.mesh.material.opacity = portal.unlocked ? 0.95 : 0.28;
      portal.pedestal.material.opacity = portal.unlocked ? 1 : 0.35;
    }
  }

  _findNearestUnlockedPortal(playerPosition) {
    if (!playerPosition) return null;
    let best = null;
    let bestDistance = Infinity;
    for (const portal of this._hubPortals) {
      if (!portal.unlocked) continue;
      const dx = playerPosition.x - portal.mesh.position.x;
      const dy = playerPosition.y - portal.mesh.position.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 1.2 && distance < bestDistance) {
        best = portal;
        bestDistance = distance;
      }
    }
    return best;
  }

  _animateHubPortals(dt) {
    for (const portal of this._hubPortals) {
      portal.mesh.rotation.z += dt * (portal.unlocked ? 2.4 : 1.2);
      const pulse = 1 + Math.sin(performance.now() * 0.004 + portal.x) * 0.02;
      portal.mesh.scale.setScalar(portal.unlocked ? pulse : 0.96);
      portal.mesh.position.z = -portal.mesh.position.y * 0.01 + 0.3;
      portal.pedestal.position.z = -portal.pedestal.position.y * 0.01;
    }
  }

  _createAuraForEntry(entry) {
    const aura = createAura(entry.config.auraColor, 2.4);
    aura.visible = this.mode !== SceneModes.HUB;
    this.scene.add(aura);
    return aura;
  }

  _syncPlayerAuras(timeDelta) {
    for (let i = 0; i < this._playerAuras.length; i += 1) {
      const aura = this._playerAuras[i];
      const player = this.hunters.players[i];
      if (!aura || !player) continue;
      aura.visible = this.mode !== SceneModes.HUB;
      aura.position.set(player.mesh.position.x, player.mesh.position.y, player.mesh.position.z - 0.05);
      aura.material.uniforms.uTime.value += timeDelta;
    }
  }

  _updateDebugHitboxes() {
    const activeHitboxes = this.combat.getActiveHitboxes().concat(this.spawner.getProjectileHitboxes());
    this.debugHitboxes.update(this.player, this.spawner.getActiveEnemies(), activeHitboxes);
  }

  _updateSharedCamera() {
    const players = this.hunters.players.filter(player => player.state !== 'DEAD');
    if (!players.length) return;

    let minX = players[0].position.x;
    let maxX = players[0].position.x;
    let minY = players[0].position.y;
    let maxY = players[0].position.y;
    for (const player of players) {
      minX = Math.min(minX, player.position.x);
      maxX = Math.max(maxX, player.position.x);
      minY = Math.min(minY, player.position.y);
      maxY = Math.max(maxY, player.position.y);
    }

    const aspect = window.innerWidth / window.innerHeight;
    const padding = 2.6;
    const targetHeight = Math.max(
      ORTHO_HEIGHT,
      (maxY - minY) + padding,
      ((maxX - minX) + padding) / aspect
    );
    const currentHeight = this.camera.top - this.camera.bottom;
    const nextHeight = currentHeight + (targetHeight - currentHeight) * 0.08;
    const halfHeight = nextHeight / 2;
    const halfWidth = halfHeight * aspect;

    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.updateProjectionMatrix();
  }

  _getPlayerFocusX() {
    const players = this.hunters.players.filter(player => player.state !== 'DEAD');
    if (!players.length) return 0;
    const total = players.reduce((sum, player) => sum + player.position.x, 0);
    return total / players.length;
  }

  _resetCameraFrustum() {
    const halfHeight = ORTHO_HEIGHT / 2;
    const halfWidth = ORTHO_WIDTH / 2;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.position.set(0, 0, 100);
    this.camera.updateProjectionMatrix();
  }

  _startKillSlowMo() {
    this._slowMoTicks = Math.max(this._slowMoTicks, 30);
    this._slowMoScale = 0.3;
  }

  _updateSlowMo() {
    if (this._slowMoTicks <= 0) {
      this._slowMoScale = 1;
      return;
    }

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

  _handleLevelupQueued(entry) {
    const runPlayer = RunState.players[entry.playerIndex];
    if (runPlayer?.isAI) {
      this._resolveAICardChoices();
      return;
    }
    if (!this.hud.isCardOpen()) this._openNextCardScreen();
  }

  _resolveAICardChoices() {
    let changed = false;

    while (true) {
      const aiEntry = RunState.pendingLevelUps.find(entry => RunState.players[entry.playerIndex]?.isAI);
      if (!aiEntry) break;
      const cardId = aiEntry.choices[0]?.id;
      if (!cardId) break;
      if (!RunState.applyCardChoice(aiEntry.playerIndex, cardId)) break;
      changed = true;
    }

    if (changed) this.hunters.applyRunStateModifiers(RunState.players);
  }

  _getNextHumanCardEntry() {
    return RunState.pendingLevelUps.find(entry => !RunState.players[entry.playerIndex]?.isAI) || null;
  }

  _updateCardInput(input) {
    if (input.justPressed(Actions.MOVE_LEFT)) this.hud.moveCardSelection(-1);
    if (input.justPressed(Actions.MOVE_RIGHT)) this.hud.moveCardSelection(1);

    if (input.justPressedKey('KeyA')) return this.chooseCurrentCard(this.hud.getCardState().choices[0]?.id);
    if (input.justPressedKey('KeyB')) return this.chooseCurrentCard(this.hud.getCardState().choices[1]?.id);
    if (input.justPressedKey('KeyC')) return this.chooseCurrentCard(this.hud.getCardState().choices[2]?.id);

    if (input.justPressed(Actions.INTERACT) || input.justPressed(Actions.LIGHT)) {
      return this.chooseCurrentCard();
    }
    return false;
  }

  _checkForWipe() {
    if (this._wipePending || this.mode !== SceneModes.ZONE) return;
    const players = this.hunters.players;
    if (!players.length) return;

    const wiped = players.every(player => player.state === 'DEAD' || player.state === 'DOWNED');
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
