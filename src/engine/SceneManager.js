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
import { GameplayHUD } from '../gameplay/GameplayHUD.js';
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

    this.portalManager = new PortalManager(document.getElementById('ui-overlay'));
    this.zoneManager = new ZoneManager(this.scene);

    this._setupLighting();
    this._setupHubBackdrop();
    this._setupHubPortals();

    this.hunters = new HunterController(this.scene, RunState.players);
    this.player = this.hunters.primaryPlayer;
    this.resources = this.player.resources;
    this.combat = new CombatController();
    this.spawner = new EnemySpawner(this.scene, this.hunters.activeHumanPlayerCount);
    this.collision = new CollisionResolver();
    this.sparks = new SparkPool(this.scene);
    this.cameraShake = new CameraShake(this.camera);
    this.debugHitboxes = new DebugHitboxes(this.scene);
    this.hud = new GameplayHUD(document.getElementById('ui-overlay'));
    this._slowMoTicks = 0;
    this._slowMoScale = 1;

    RunState.on('playerJoined', this._handlePlayerJoined.bind(this));
    this._playerAuras = this.hunters.entries.map(entry => this._createAuraForEntry(entry));
    this._hitFlares = new HitFlarePool(this.scene);
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
    this.hunters.update(dt, input);
    this.sparks.update(dt);
    this.cameraShake.update(dt);
    this._animateHubPortals(dt);
    this._syncPlayerAuras(dt);
    this._syncHubPortals();
    this._updateDebugHitboxes();

    if (!this._transitionLock && input.justPressed(Actions.INTERACT)) {
      const portal = this._findNearestUnlockedPortal();
      if (portal) this._enterZone(portal.zoneId, input);
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
      this.hud.setCombo(this.combat.comboCount);
      this.hud.update(this.camera);
      this._syncPlayerAuras(dt);
      this._updateDebugHitboxes();
      return;
    }

    const enemies = this.spawner.getActiveEnemies();
    const hitEvents = this.combat.update(
      scaledDt,
      this.hunters.getInputSnapshots(input),
      this.hunters.players,
      enemies,
      this.spawner
    );
    this._applyCombatEvents(hitEvents);
    this.hunters.update(scaledDt, input);
    const spawnerEvents = this.spawner.update(scaledDt, this.hunters.players);
    this._applyCombatEvents(spawnerEvents);
    this.collision.resolve(this.hunters.players, this.spawner.getActiveEnemies());
    this.spawner.syncVisuals();
    this.sparks.update(scaledDt);
    this._hitFlares.update(scaledDt);
    this.cameraShake.update(scaledDt);
    this.zoneManager.update(scaledDt, this._getPlayerFocusX());
    this._updateSharedCamera();
    this._checkForWipe();
    this.hud.setCombo(this.combat.comboCount);
    this.hud.update(this.camera);
    this._syncPlayerAuras(scaledDt);
    this._updateDebugHitboxes();
  }

  _enterZone(zoneId, input = null) {
    const config = this.zoneManager.getZoneConfig(zoneId);
    if (!config) return;

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
      } else if (event.type === 'bossStart' || event.type === 'minibossStart') {
        const boss = event.boss;
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
    this.hud.clearBossBar();
    this.portalManager.showResultsOverlay({
      title: `${zoneId.replace('-', ' ').toUpperCase()} CLEAR`,
      essence: rewards.essence,
      xp: rewards.xp,
      kills: boss ? 1 : 0,
    });

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
    setTimeout(() => {
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
