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
import { CITY_BREACH } from '../visuals/Palettes.js';

const SceneModes = {
  HUB: 'HUB',
  ZONE: 'ZONE',
  END_SCREEN: 'END_SCREEN',
};

const ZONE_CLEAR_RETURN_DELAY_MS = 1800;
const ZONE_CLEAR_FADE_OUT_MS = 800;
const ZONE_CLEAR_FADE_IN_MS = 500;
const WIPE_RETURN_DELAY_MS = 800;
const ROUTE_GATE_X = 7.45;
const ROUTE_GATE_Y = -2.15;
const ROUTE_GATE_RADIUS = 1.25;

export class SceneManager {
  constructor(renderer) {
    this.scene = new THREE.Scene();
    this.camera = renderer.createCamera();
    this.mode = SceneModes.HUB;
    this.debugEnabled = false;
    this._zoneReturnPending = false;
    this._wipePending = false;
    this._activeZoneId = null;
    this._transitionLock = false;
    this._deferredZoneClear = null;
    this._zoneReturnTimer = null;
    this._characterSelectDone = window.location.search.includes('test=1') || window.location.search.toLowerCase().includes('oneforall=1');
    this._bossSeenZones = new Set();

    this.portalManager = new PortalManager(document.getElementById('ui-overlay'));
    this.zoneManager = new ZoneManager(this.scene);

    this._setupLighting();
    this._setupHubBackdrop();
    this._setupHubPortals();
    this._setupRouteGate();

    this.hunters = new HunterController(this.scene, RunState.players);
    this.player = this.hunters.primaryPlayer;
    this.resources = this.player.resources;
    this.combat = new CombatController();
    this.spawner = new EnemySpawner(this.scene, this.hunters.activePlayerCount);
    this.collision = new CollisionResolver();
    this.sparks = new SparkPool(this.scene);
    this.cameraShake = new CameraShake(this.camera);
    this.debugHitboxes = new DebugHitboxes(this.scene);
    this.hud = new HUD(document.getElementById('ui-overlay'));
    this.hud._onCardClick = (cardId) => this.chooseCurrentCard(cardId);
    this.hud._onCharacterClick = () => this.confirmCharacterSelection();
    this.shop = new ShopManager(document.getElementById('ui-overlay'));
    this._slowMoTicks = 0;
    this._slowMoScale = 1;

    RunState.on('playerJoined', this._handlePlayerJoined.bind(this));
    RunState.on('levelupQueued', this._handleLevelUpQueued.bind(this));
    this._playerAuras = this.hunters.entries.map(entry => this._createAuraForEntry(entry));
    this._hitFlares = new HitFlarePool(this.scene);
    if (!this._characterSelectDone) this.hud.showCharacterSelect(RunState.players[0]?.hunterId || 'dabik');
  }

  update(dt, input) {
    input.poll();

    if (input.justPressed(Actions.DEBUG)) {
      this.debugEnabled = !this.debugEnabled;
      document.body.classList.toggle('debug', this.debugEnabled);
      this.debugHitboxes.setEnabled(this.debugEnabled);
    }
    if (this.debugEnabled && input.justPressed(Actions.DEBUG_SURGE)) {
      this.hunters.fillSurge();
    }

    if (this.mode === SceneModes.HUB) {
      this._updateHub(dt, input);
      this.hud.update(this.camera);
      return;
    }

    if (this.mode === SceneModes.END_SCREEN) {
      this.hud.update(this.camera);
      return;
    }

    this._updateZone(dt, input);
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
      playerState: this.player.state,
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
      hitstop: this.combat.hitstopRemaining,
      boss: RunState.activeBossName,
      bossHp: RunState.activeBossHp,
      bossHpMax: RunState.activeBossHpMax,
      bossPhase: RunState.activeBossPhase,
      bossSeenZones: [...this._bossSeenZones],
      route: this.spawner?.getRouteState?.() || null,
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
    if (this.hud.isCharacterSelectOpen()) {
      this._updateCharacterSelectInput(input);
      this.hud.update(this.camera);
      return;
    }

    if (this.shop.isOpen()) {
      const result = this.shop.update(input.getPlayerInput(this.shop.playerIndex));
      if (result?.ok && result.action === 'purchase') this.hunters.applyRunStateModifiers(RunState.players);
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

    if (!this._transitionLock) {
      const shopPlayerIndex = this._findQuartermasterInteractor(input);
      if (shopPlayerIndex !== null) {
        this.shop.open(shopPlayerIndex, Math.max(1, RunState.zonesCleared + 1));
        return;
      }
    }

    if (!this._transitionLock && input.justPressed(Actions.INTERACT)) {
      const portal = this._findNearestUnlockedPortal();
      if (portal) this._enterZone(portal.zoneId, input);
    }
  }

  _updateZone(dt, input) {
    if (this.hud.isCardOpen()) {
      this._updateCardInput(input);
      this.hud.update(this.camera);
      return;
    }

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
      this.hud.setCombo(this.combat.comboCount);
      this.hud.update(this.camera);
      this._syncPlayerAuras(dt);
      this._updateDebugHitboxes();
      return;
    }

    const enemies = this.spawner.getActiveEnemies();
    const playerInputs = this.hunters.prepareZoneInputs(scaledDt, input, enemies, this._getCompanionFlow());
    const hitEvents = this.combat.update(
      scaledDt,
      playerInputs,
      this.hunters.players,
      enemies,
      this.spawner
    );
    this._applyCombatEvents(hitEvents);
    this.hunters.update(scaledDt, input, playerInputs);
    const spawnerEvents = this.spawner.update(scaledDt, this.hunters.players);
    this._applyCombatEvents(spawnerEvents);
    this.collision.resolve(this.hunters.players, this.spawner.getActiveEnemies());
    this.spawner.syncVisuals();
    this.sparks.update(scaledDt);
    this._hitFlares.update(scaledDt);
    this.cameraShake.update(scaledDt);
    this.zoneManager.update(scaledDt, this._getPlayerFocusX());
    this._updateSharedCamera();
    this._updateRouteGateVisual(dt);
    this._tryAdvanceRoute(input);
    this._checkForWipe();
    this.hud.setCombo(this.combat.comboCount);
    this.hud.update(this.camera);
    this._syncPlayerAuras(scaledDt);
    this._updateDebugHitboxes();
  }

  _enterZone(zoneId, input = null) {
    const config = this.zoneManager.getZoneConfig(zoneId);
    if (!config) return;

    if (this._zoneReturnTimer) {
      clearTimeout(this._zoneReturnTimer);
      this._zoneReturnTimer = null;
      this._zoneReturnPending = false;
    }

    this._activeZoneId = zoneId;
    RunState.onZoneEntry(zoneId);
    RunState.setZoneInfo({ zoneId, zoneLabel: config.label, zoneNumber: config.number });
    RunState.clearBossInfo();
    this.hunters.syncZoneEntry(RunState.players);
    this.hunters.applyRunStateModifiers(RunState.players);
    this.shop.close();
    this._setRouteGateVisible(false);
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

  _handlePlayerJoined({ player }) {
    const entry = this.hunters.addRunPlayer(player);
    if (!entry) return;

    this._playerAuras.push(this._createAuraForEntry(entry));
    this.spawner.setPlayerCount(this.hunters.activePlayerCount);

    if (this.mode === SceneModes.HUB) {
      this.hunters.setFormation(0, -2.2);
    } else {
      const primary = this.hunters.primaryPlayer;
      entry.player.position.x = primary.position.x - 0.6 + entry.player.playerIndex * 0.4;
      entry.player.position.y = primary.position.y;
    }
  }

  _handleLevelUpQueued() {
    this._resolveAICardPicks();
    if (this.mode === SceneModes.END_SCREEN || this.hud.isCardOpen()) return;
    if (this.shop.isOpen?.() || this.hud.isCharacterSelectOpen?.()) return;
    this._openNextCardScreen();
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
        this.combat.breakCombo();
        this.cameraShake.request(0.35);
      } else if (event.type === 'waveClear') {
        this.hud.showWaveClear();
        this._openNextCardScreen();
      } else if (event.type === 'routeGateOpen') {
        this._showRouteGate(event.gateKind, event.nextArea);
      } else if (event.type === 'bossStart' || event.type === 'minibossStart') {
        const boss = event.boss;
        if (event.type === 'bossStart' && this._activeZoneId) this._bossSeenZones.add(this._activeZoneId);
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
        if (event.type === 'minibossStart') {
          this.portalManager.showNameCard(boss.name, boss.config.flavor || '', 2000);
        }
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
        this._openNextCardScreen();
      } else if (event.type === 'bossDefeated') {
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
    const rewards = boss?.getRewards?.() || { xp: 0, essence: 0 };
    RunState.onZoneComplete(zoneId);
    this.hunters.syncZoneComplete(RunState.players);
    this.hunters.applyRunStateModifiers(RunState.players);
    this.hud.clearBossBar();
    this._setRouteGateVisible(false);
    this.portalManager.showResultsOverlay({
      title: `${zoneId.replace('-', ' ').toUpperCase()} CLEAR`,
      essence: rewards.essence,
      xp: rewards.xp,
      kills: boss ? 1 : 0,
    });

    if (this._openNextCardScreen()) {
      this._deferredZoneClear = { rewards, boss };
      return;
    }

    this._finishZoneClear(rewards, boss);
  }

  _finishZoneClear(rewards, boss) {
    if (RunState.runComplete) {
      this.mode = SceneModes.END_SCREEN;
      this.spawner.startZone(null);
      this.zoneManager.showHub();
      this._setHubVisible(true);
      this.portalManager.showResultsOverlay({
        title: 'Victory',
        essence: rewards.essence,
        xp: rewards.xp,
        kills: boss ? 1 : 0,
        note: 'Run complete',
      });
      this._zoneReturnPending = false;
      return;
    }

    this.spawner.startZone(null);
    this._setRouteGateVisible(false);
    this._zoneReturnTimer = setTimeout(() => {
      this._zoneReturnTimer = null;
      this._returnToHubAfterZoneClear();
    }, ZONE_CLEAR_RETURN_DELAY_MS);
  }

  _returnToHubAfterZoneClear() {
    this.portalManager.playExitTransition();
    this._switchToHub();
    this._zoneReturnPending = false;
  }

  _switchToHub() {
    this.mode = SceneModes.HUB;
    this._activeZoneId = null;
    this.zoneManager.showHub();
    this._setHubVisible(true);
    this._syncHubPortals();
    this.hunters.setFormation(0, -2.2);
    this.hud.clearBossBar();
    this.shop.close();
    this._setRouteGateVisible(false);
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
      portal.mesh.visible = visible || portal.unlocked;
      portal.pedestal.visible = visible || portal.unlocked;
    }
  }

  _syncHubPortals() {
    const unlockedZones = new Set(this.zoneManager.getUnlockedZoneIds(RunState.zonesCleared));
    for (const portal of this._hubPortals) {
      portal.unlocked = unlockedZones.has(portal.zoneId);
      portal.mesh.visible = true;
      portal.pedestal.visible = true;
      portal.mesh.material.opacity = portal.unlocked ? 0.95 : 0.28;
      portal.pedestal.material.opacity = portal.unlocked ? 1 : 0.35;
    }
  }

  _findNearestUnlockedPortal() {
    const player = this.player;
    let best = null;
    let bestDistance = Infinity;
    for (const portal of this._hubPortals) {
      if (!portal.unlocked) continue;
      const dx = player.position.x - portal.mesh.position.x;
      const dy = player.position.y - portal.mesh.position.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= 1.2 && distance < bestDistance) {
        best = portal;
        bestDistance = distance;
      }
    }
    return best;
  }

  _isNearQuartermaster(player = this.player) {
    if (!player) return false;
    return Math.hypot(player.position.x - -4.8, player.position.y - -2.2) <= 1.5;
  }

  _findQuartermasterInteractor(input) {
    for (const player of this.hunters.players) {
      const playerInput = input.getPlayerInput(player.playerIndex);
      if (playerInput.justPressed(Actions.INTERACT) && this._isNearQuartermaster(player)) {
        return player.playerIndex;
      }
    }
    return null;
  }

  advanceZoneRoute(input = null) {
    if (!this.spawner?.isRouteGateOpen?.()) return false;

    this._setRouteGateVisible(false);
    const advanced = this.spawner.advanceRoute();
    if (!advanced) return false;

    if (input) this.hunters.clearInputBuffers(input);
    this.hunters.setFormation(-6.6, ROUTE_GATE_Y);
    const route = this.spawner.getRouteState();
    const label = route.zoneState === 'boss' || route.zoneState === 'miniboss'
      ? 'Boss Gate'
      : `Area ${route.areaIndex + 1}`;
    this.portalManager.showZoneTitleCard(label, RunState.currentZoneNumber);
    this.cameraShake.request(0.25);
    return true;
  }

  _openNextCardScreen() {
    this._resolveAICardPicks();
    if (this.hud.isCardOpen()) return true;
    const entry = this._nextHumanCardEntry();
    if (!entry) return false;
    return this.hud.showCardScreen(entry);
  }

  _updateCardInput(input) {
    const cardState = this.hud.getCardState?.();
    const entry = cardState?.open
      ? RunState.pendingLevelUps.find(item => item.playerIndex === cardState.playerIndex)
      : this._nextHumanCardEntry();
    if (!entry) return;

    const playerInput = input.getPlayerInput(entry.playerIndex);
    if (playerInput.justPressed(Actions.MOVE_LEFT)) this.hud.moveCardSelection(-1);
    if (playerInput.justPressed(Actions.MOVE_RIGHT)) this.hud.moveCardSelection(1);
    
    // Direct hotkey selection (A, B, C)
    if (input.justPressedKey('KeyA')) this.chooseCurrentCard(entry.choices[0]?.id);
    if (input.justPressedKey('KeyB')) this.chooseCurrentCard(entry.choices[1]?.id);
    if (input.justPressedKey('KeyC')) this.chooseCurrentCard(entry.choices[2]?.id);

    if (playerInput.justPressed(Actions.INTERACT) || playerInput.justPressed(Actions.LIGHT)) {
      this.chooseCurrentCard();
    }
  }

  chooseCurrentCard(cardId = null) {
    const selected = this.hud.confirmCardSelection();
    const entry = selected
      ? RunState.pendingLevelUps.find(item => item.playerIndex === selected.playerIndex)
      : this._nextHumanCardEntry();
    const playerIndex = selected?.playerIndex ?? entry?.playerIndex ?? 0;
    const resolvedCardId = cardId || selected?.cardId || entry?.choices?.[0]?.id;
    if (!resolvedCardId || !RunState.applyCardChoice(playerIndex, resolvedCardId)) return false;

    this.hunters.applyRunStateModifiers(RunState.players);
    this._resolveAICardPicks();
    if (RunState.pendingLevelUps.length > 0) {
      const nextEntry = this._nextHumanCardEntry();
      if (nextEntry) {
        this.hud.showCardScreen(nextEntry);
      } else {
        this.hud.hideCardScreen();
      }
    } else {
      this.hud.hideCardScreen();
      if (this._deferredZoneClear) {
        const deferred = this._deferredZoneClear;
        this._deferredZoneClear = null;
        this._finishZoneClear(deferred.rewards, deferred.boss);
      }
    }
    return true;
  }

  _nextHumanCardEntry() {
    return RunState.pendingLevelUps.find(entry => !RunState.players[entry.playerIndex]?.isAI) || null;
  }

  _resolveAICardPicks() {
    let resolved = false;
    for (let i = RunState.pendingLevelUps.length - 1; i >= 0; i -= 1) {
      const entry = RunState.pendingLevelUps[i];
      const runPlayer = RunState.players[entry.playerIndex];
      if (!runPlayer?.isAI) continue;

      const card = this._chooseAICard(runPlayer, entry.choices);
      if (card && RunState.applyCardChoice(entry.playerIndex, card.id)) resolved = true;
    }
    if (resolved) this.hunters.applyRunStateModifiers(RunState.players);
  }

  _chooseAICard(runPlayer, choices = []) {
    if (!choices.length) return null;

    const priorities = {
      benzu: ['survival', 'power', 'mobility', 'style', 'utility'],
      sereisa: ['mobility', 'style', 'power', 'survival', 'utility'],
      vesol: ['style', 'power', 'survival', 'mobility', 'utility'],
      dabik: ['power', 'mobility', 'style', 'survival', 'utility'],
    }[runPlayer.hunterId] || ['power', 'survival', 'mobility', 'style', 'utility'];

    for (const category of priorities) {
      const card = choices.find(choice => choice.category === category);
      if (card) return card;
    }
    return choices[0];
  }

  _updateCharacterSelectInput(input) {
    if (input.justPressed(Actions.MOVE_LEFT)) this.hud.moveCharacterSelection(-1);
    if (input.justPressed(Actions.MOVE_RIGHT)) this.hud.moveCharacterSelection(1);
    
    // Direct numeric selection (1-4)
    for (let i = 0; i < 4; i += 1) {
      if (input.justPressedKey(`Digit${i + 1}`)) {
        this.hud._characterSelected = i;
        this.hud._renderCharacterSelect();
        return this.confirmCharacterSelection();
      }
    }

    if (input.justPressed(Actions.INTERACT) || input.justPressed(Actions.LIGHT)) {
      this.confirmCharacterSelection();
    }
  }

  confirmCharacterSelection() {
    const hunterId = this.hud.confirmCharacterSelection();
    if (!hunterId) return;
    RunState.init([{ hunterId, isAI: false, carryEssence: 0 }]);
    this._rebuildHuntersFromRunState();
    this._characterSelectDone = true;
  }

  _rebuildHuntersFromRunState() {
    for (const player of this.hunters.players) {
      if (player.mesh?.parent) player.mesh.parent.remove(player.mesh);
    }
    for (const aura of this._playerAuras) {
      if (aura?.parent) aura.parent.remove(aura);
    }
    this.hunters = new HunterController(this.scene, RunState.players);
    this.player = this.hunters.primaryPlayer;
    this.resources = this.player.resources;
    this._playerAuras = this.hunters.entries.map(entry => this._createAuraForEntry(entry));
    this.spawner.setPlayerCount(this.hunters.activePlayerCount);
    this.hunters.setFormation(0, -2.2);
  }

  rebuildFromRunState() {
    this.hud.hideCharacterSelect?.();
    this._characterSelectDone = true;
    this._rebuildHuntersFromRunState();
  }

  startNewRunFromRunState() {
    if (this._zoneReturnTimer) {
      clearTimeout(this._zoneReturnTimer);
      this._zoneReturnTimer = null;
    }
    this._bossSeenZones.clear();
    this._deferredZoneClear = null;
    this._zoneReturnPending = false;
    this._wipePending = false;
    this._activeZoneId = null;
    this.mode = SceneModes.HUB;
    this.spawner.startZone(null);
    this.zoneManager.showHub();
    this.hud.clearBossBar();
    this.hud.hideCharacterSelect?.();
    this.shop.close();
    this._setRouteGateVisible(false);
    this._setHubVisible(true);
    this._characterSelectDone = true;
    this._rebuildHuntersFromRunState();
    this.hunters.setFormation(0, -2.2);
  }

  _setupRouteGate() {
    const geo = new THREE.TorusGeometry(0.72, 0.08, 8, 28);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x48f7ff,
      transparent: true,
      opacity: 0.92,
    });
    this._routeGate = new THREE.Mesh(geo, mat);
    this._routeGate.position.set(ROUTE_GATE_X, ROUTE_GATE_Y, 0.45);
    this._routeGate.visible = false;
    this.scene.add(this._routeGate);

    const coreGeo = new THREE.PlaneGeometry(1.0, 1.4);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x9fd7ff,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    this._routeGateCore = new THREE.Mesh(coreGeo, coreMat);
    this._routeGateCore.position.set(ROUTE_GATE_X, ROUTE_GATE_Y, 0.42);
    this._routeGateCore.visible = false;
    this.scene.add(this._routeGateCore);
  }

  _showRouteGate(kind, nextArea) {
    if (!this._routeGate || !this._routeGateCore) return;

    const isBossGate = kind === 'boss';
    this._routeGate.material.color.setHex(isBossGate ? 0xff5555 : 0x48f7ff);
    this._routeGateCore.material.color.setHex(isBossGate ? 0xffaa55 : 0x9fd7ff);
    this._routeGate.position.set(ROUTE_GATE_X, ROUTE_GATE_Y, 0.45);
    this._routeGateCore.position.set(ROUTE_GATE_X, ROUTE_GATE_Y, 0.42);
    this._setRouteGateVisible(true);

    this.portalManager.showResultsOverlay({
      title: isBossGate ? 'Boss Gate Open' : `Area ${nextArea} Open`,
      note: 'Move into the gate',
    });
  }

  _setRouteGateVisible(visible) {
    if (this._routeGate) this._routeGate.visible = visible;
    if (this._routeGateCore) this._routeGateCore.visible = visible;
  }

  _updateRouteGateVisual(dt) {
    if (!this._routeGate?.visible) return;

    this._routeGate.rotation.z += dt * 2.8;
    const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.08;
    this._routeGate.scale.setScalar(pulse);
    this._routeGateCore.material.opacity = 0.22 + (pulse - 1) * 0.8;
  }

  _tryAdvanceRoute(input) {
    if (!this.spawner?.isRouteGateOpen?.() || this.hud.isCardOpen()) return;

    const player = this.player;
    if (!player) return;

    const dx = player.position.x - ROUTE_GATE_X;
    const dy = player.position.y - ROUTE_GATE_Y;
    const nearGate = Math.hypot(dx, dy) <= ROUTE_GATE_RADIUS || player.position.x >= ROUTE_GATE_X + 0.35;
    if (nearGate || (Math.abs(dx) <= 2.2 && input.justPressed(Actions.INTERACT))) {
      this.advanceZoneRoute(input);
    }
  }

  _getCompanionFlow() {
    const route = this.spawner?.getRouteState?.() || null;
    return {
      route,
      routeGateOpen: !!this.spawner?.isRouteGateOpen?.(),
      routeGateX: ROUTE_GATE_X,
      routeGateY: ROUTE_GATE_Y,
      bossActive: route?.zoneState === 'boss' || route?.zoneState === 'miniboss',
      areaIndex: route?.areaIndex || 0,
    };
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
