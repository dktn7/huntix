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
import { createCityBreachArena } from '../visuals/CityBreachArena.js';
import { createAura } from '../visuals/AuraShader.js';
import { HitFlarePool } from '../visuals/HitFlarePool.js';

const SceneModes = {
  HUB: 'HUB',
  CITY_BREACH: 'CITY_BREACH',
};

const ZONE_CLEAR_RETURN_DELAY_MS = 2000;
const ZONE_CLEAR_FADE_OUT_MS = 800;
const ZONE_CLEAR_FADE_IN_MS = 500;

export class SceneManager {
  /** Creates the Three.js scene, camera, arena, and Phase 1 gameplay systems. */
  constructor(renderer) {
    this.scene = new THREE.Scene();
    this.camera = renderer.createCamera();
    this.mode = SceneModes.HUB;
    this.debugEnabled = false;
    this._zoneReturnPending = false;
    this._fadeOverlay = this._setupFadeOverlay();
    this._handleZoneEntry = this._handleZoneEntry.bind(this);
    this._handleZoneComplete = this._handleZoneComplete.bind(this);
    this._handlePlayerJoined = this._handlePlayerJoined.bind(this);

    this._setupLighting();
    this._setupArena();
    this._setupHubPortal();

    this.hunters = new HunterController(this.scene, RunState.players);
    this.player = this.hunters.primaryPlayer;
    this.resources = this.player.resources;
    RunState.on('zoneEntry', this._handleZoneEntry);
    RunState.on('zoneComplete', this._handleZoneComplete);
    RunState.on('playerJoined', this._handlePlayerJoined);
    this.combat = new CombatController();
    this.spawner = new EnemySpawner(this.scene, this.hunters.activeHumanPlayerCount);
    this.collision = new CollisionResolver();
    this.sparks = new SparkPool(this.scene);
    this.cameraShake = new CameraShake(this.camera);
    this.debugHitboxes = new DebugHitboxes(this.scene);
    this.hud = new GameplayHUD(document.getElementById('ui-overlay'));
    this._slowMoTicks = 0;
    this._slowMoScale = 1;
    this._wipePending = false;

    this._cityBreachArena = createCityBreachArena();
    this._cityBreachArena.visible = false;
    this.scene.add(this._cityBreachArena);

    this._playerAuras = this.hunters.entries.map(entry => {
      const aura = createAura(entry.config.auraColor, 2.4);
      aura.visible = false;
      this.scene.add(aura);
      return aura;
    });

    this._hitFlares = new HitFlarePool(this.scene);
  }

  /** Advances input, gameplay simulation, and hitstop-aware enemy updates. */
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
      this._syncCityBreachAura(dt);
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
    this._updateSharedCamera();
    this._checkForWipe();
    this.hud.setCombo(this.combat.comboCount);
    this.hud.update(this.camera);
    this._syncCityBreachAura(scaledDt);
    this._updateDebugHitboxes();
  }

  /** Returns the managed Three.js scene. */
  getScene() {
    return this.scene;
  }

  /** Returns the managed orthographic camera. */
  getCamera() {
    return this.camera;
  }

  /** Returns lightweight state for the debug overlay. */
  getDebugInfo() {
    return {
      mode: this.mode,
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
    };
  }

  _setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffeedd, 0.6);
    dir.position.set(-3, 5, 10);
    this.scene.add(dir);
  }

  _setupArena() {
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

  _setupHubPortal() {
    const hunterPadGeo = new THREE.BoxGeometry(1.4, 0.16, 0.1);
    const hunterPadMat = new THREE.MeshLambertMaterial({ color: 0x3b2554 });
    this._hunterPad = new THREE.Mesh(hunterPadGeo, hunterPadMat);
    this._hunterPad.position.set(0, -2.85, 0.2);
    this.scene.add(this._hunterPad);

    const portalGeo = new THREE.TorusGeometry(0.55, 0.08, 8, 24);
    const portalMat = new THREE.MeshBasicMaterial({ color: 0x48f7ff });
    this._portalMesh = new THREE.Mesh(portalGeo, portalMat);
    this._portalMesh.position.set(3.2, -2.2, 0.3);
    this.scene.add(this._portalMesh);

    const pedestalGeo = new THREE.BoxGeometry(1.2, 0.18, 0.1);
    const pedestalMat = new THREE.MeshLambertMaterial({ color: 0x29364f });
    this._portalPedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    this._portalPedestal.position.set(3.2, -2.85, 0.2);
    this.scene.add(this._portalPedestal);
  }

  _updateHub(dt, input) {
    this.hunters.update(dt, input);
    this.sparks.update(dt);
    this.cameraShake.update(dt);
    this._animatePortal(dt);
    this._updateDebugHitboxes();

    if (input.justPressed(Actions.INTERACT) && this._isPlayerNearPortal()) {
      this._enterCityBreach(input);
    }
  }

  _enterCityBreach(input) {
    RunState.onZoneEntry('city-breach');
    this.mode = SceneModes.CITY_BREACH;
    this._zoneReturnPending = false;
    this.hunters.clearInputBuffers(input);
    this.hunters.setFormation(-4, -2.2);
    this._portalMesh.visible = false;
    this._portalPedestal.visible = false;
    this._hunterPad.visible = false;
    for (const m of this._hubBackdrop) {
      m.visible = false;
    }
    this._cityBreachArena.visible = true;
    for (const aura of this._playerAuras) aura.visible = true;
    this.spawner.startCityBreach();
  }

  _handleZoneEntry() {
    this.hunters.syncZoneEntry(RunState.players);
  }

  _handleZoneComplete() {
    this.hunters.syncZoneComplete(RunState.players);

    if (this._zoneReturnPending) return;

    this._zoneReturnPending = true;
    setTimeout(() => {
      this._returnToHubAfterZoneClear();
    }, ZONE_CLEAR_RETURN_DELAY_MS);
  }

  _handlePlayerJoined({ player }) {
    const entry = this.hunters.addRunPlayer(player);
    if (!entry) return;

    const aura = createAura(entry.config.auraColor, 2.4);
    aura.visible = this.mode !== SceneModes.HUB;
    this.scene.add(aura);
    this._playerAuras.push(aura);
    this.spawner.setPlayerCount(this.hunters.activeHumanPlayerCount);

    if (this.mode === SceneModes.HUB) {
      this.hunters.setFormation(0, -2.2);
    } else {
      const primary = this.hunters.primaryPlayer;
      entry.player.position.x = primary.position.x - 0.6 + entry.player.playerIndex * 0.4;
      entry.player.position.y = primary.position.y;
    }
  }

  async _returnToHubAfterZoneClear() {
    await this._fadeTo(1, ZONE_CLEAR_FADE_OUT_MS);
    this._switchToHub();
    await this._fadeTo(0, ZONE_CLEAR_FADE_IN_MS);
    this._zoneReturnPending = false;
  }

  _switchToHub() {
    this.mode = SceneModes.HUB;
    this.hunters.setFormation(0, -2.2);
    this._portalMesh.visible = true;
    this._portalPedestal.visible = true;
    this._hunterPad.visible = true;
    for (const m of this._hubBackdrop) {
      m.visible = true;
    }
    this._cityBreachArena.visible = false;
    for (const aura of this._playerAuras) aura.visible = false;
    this._resetCameraFrustum();
  }

  _setupFadeOverlay() {
    let overlay = document.getElementById('fade-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'fade-overlay';
      document.body.appendChild(overlay);
    }

    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = '#000';
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '100';
    return overlay;
  }

  _fadeTo(opacity, durationMs) {
    return new Promise(resolve => {
      this._fadeOverlay.style.transition = `opacity ${durationMs}ms ease`;
      this._fadeOverlay.style.opacity = String(opacity);
      setTimeout(resolve, durationMs);
    });
  }

  /** Y-sorts aura with player mesh; advances aura shader time (call after player.update). */
  _syncCityBreachAura(timeDelta) {
    for (let i = 0; i < this._playerAuras.length; i += 1) {
      const aura = this._playerAuras[i];
      const player = this.hunters.players[i];
      if (!aura || !player) continue;
      aura.position.set(
        player.mesh.position.x,
        player.mesh.position.y,
        player.mesh.position.z - 0.05
      );
      aura.material.uniforms.uTime.value += timeDelta;
    }
  }

  _isPlayerNearPortal() {
    const dx = this.player.position.x - this._portalMesh.position.x;
    const dy = this.player.position.y - this._portalMesh.position.y;
    return Math.hypot(dx, dy) <= 1.2;
  }

  _animatePortal(dt) {
    this._hunterPad.position.z = -this._hunterPad.position.y * 0.01;
    this._portalMesh.rotation.z += dt * 2.5;
    this._portalMesh.position.z = -this._portalMesh.position.y * 0.01 + 0.3;
    this._portalPedestal.position.z = -this._portalPedestal.position.y * 0.01;
  }

  _applyCombatEvents(events) {
    for (const event of events) {
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
        if (!event.hasNextWave) {
          this.hunters.syncRunStateResources();
          RunState.onZoneComplete('city-breach');
        }
      } else if (event.type === 'ultimate') {
        this.cameraShake.request(0.6);
      } else if (event.type === 'spell') {
        this.sparks.spawn(event.x, event.y, 0.25);
      } else if (event.type === 'revive') {
        this.sparks.spawn(event.x, event.y, 0.45);
      }
    }
  }

  _checkForWipe() {
    if (this._wipePending || this.mode === SceneModes.HUB) return;
    const players = this.hunters.players;
    if (!players.length) return;

    const wiped = players.every(player => player.state === 'DEAD' || player.state === 'DOWNED');
    if (!wiped) return;

    this._wipePending = true;
    const keptEssence = RunState.onRunWipe();
    setTimeout(() => {
      RunState.resetAfterWipe(keptEssence);
      this.hunters.syncAllFromRunState(RunState.players);
      this._switchToHub();
      this._wipePending = false;
    }, 800);
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
}
