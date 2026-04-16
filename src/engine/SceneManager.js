import * as THREE from 'three';
import { RunState } from '../core/RunState.js';
import { ORTHO_WIDTH } from './Renderer.js';
import { Actions } from './InputManager.js';
import { CameraShake } from './CameraShake.js';
import { PlayerState } from '../gameplay/PlayerState.js';
import { CombatController } from '../gameplay/CombatController.js';
import { ManaBar } from '../gameplay/ManaBar.js';
import { EnemySpawner } from '../gameplay/EnemySpawner.js';
import { SparkPool } from '../gameplay/SparkPool.js';
import { DebugHitboxes } from '../gameplay/DebugHitboxes.js';
import { GameplayHUD } from '../gameplay/GameplayHUD.js';
import { CollisionResolver } from '../gameplay/CollisionResolver.js';
import { createCityBreachArena } from '../visuals/CityBreachArena.js';
import { createAura } from '../visuals/AuraShader.js';
import { HUNTERS } from '../visuals/Palettes.js';
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

    this._setupLighting();
    this._setupArena();
    this._setupHubPortal();

    this.resources = new ManaBar();
    this.player = new PlayerState(this.scene, this.resources);
    RunState.on('zoneEntry', this._handleZoneEntry);
    RunState.on('zoneComplete', this._handleZoneComplete);
    this.combat = new CombatController(this.resources);
    this.spawner = new EnemySpawner(this.scene, 1);
    this.collision = new CollisionResolver();
    this.sparks = new SparkPool(this.scene);
    this.cameraShake = new CameraShake(this.camera);
    this.debugHitboxes = new DebugHitboxes(this.scene);
    this.hud = new GameplayHUD(document.getElementById('ui-overlay'));
    this._slowMoTicks = 0;
    this._slowMoScale = 1;

    this._cityBreachArena = createCityBreachArena();
    this._cityBreachArena.visible = false;
    this.scene.add(this._cityBreachArena);

    this._playerAura = createAura(HUNTERS.Dabik.auraColor, 2.4);
    this._playerAura.visible = false;
    this.scene.add(this._playerAura);

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

    if (this.mode === SceneModes.HUB) {
      this._updateHub(dt, input);
      return;
    }

    this._updateSlowMo(dt);
    const scaledDt = dt * this._slowMoScale;
    const inHitstop = this.combat.consumeHitstop(dt);
    if (inHitstop) {
      this.combat.advanceHitboxes(dt);
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
    const hitEvents = this.combat.update(scaledDt, input, this.player, enemies, this.spawner);
    this._applyCombatEvents(hitEvents);
    this.player.update(scaledDt, input);
    const spawnerEvents = this.spawner.update(scaledDt, [this.player]);
    this._applyCombatEvents(spawnerEvents);
    this.collision.resolve(this.player, this.spawner.getActiveEnemies());
    this.spawner.syncVisuals();
    this.sparks.update(scaledDt);
    this._hitFlares.update(scaledDt);
    this.cameraShake.update(scaledDt);
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
    this.player.update(dt, input);
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
    input.clearBuffer();
    this.player.position.x = -4;
    this.player.position.y = -2.2;
    this._portalMesh.visible = false;
    this._portalPedestal.visible = false;
    this._hunterPad.visible = false;
    for (const m of this._hubBackdrop) {
      m.visible = false;
    }
    this._cityBreachArena.visible = true;
    this._playerAura.visible = true;
    this.spawner.startCityBreach();
  }

  _handleZoneEntry() {
    const runPlayer = RunState.players[0];
    if (!runPlayer) return;

    this.resources.syncZoneEntryFromRunState(runPlayer);
    this.player.syncDownState(runPlayer.isDown);
  }

  _handleZoneComplete() {
    const runPlayer = RunState.players[0];
    if (runPlayer) this.resources.syncHealthFromRunState(runPlayer);

    if (this._zoneReturnPending) return;

    this._zoneReturnPending = true;
    setTimeout(() => {
      this._returnToHubAfterZoneClear();
    }, ZONE_CLEAR_RETURN_DELAY_MS);
  }

  async _returnToHubAfterZoneClear() {
    await this._fadeTo(1, ZONE_CLEAR_FADE_OUT_MS);
    this._switchToHub();
    await this._fadeTo(0, ZONE_CLEAR_FADE_IN_MS);
    this._zoneReturnPending = false;
  }

  _switchToHub() {
    this.mode = SceneModes.HUB;
    this.player.position.x = 0;
    this.player.position.y = -2.2;
    this._portalMesh.visible = true;
    this._portalPedestal.visible = true;
    this._hunterPad.visible = true;
    for (const m of this._hubBackdrop) {
      m.visible = true;
    }
    this._cityBreachArena.visible = false;
    this._playerAura.visible = false;
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
    this._playerAura.position.set(
      this.player.mesh.position.x,
      this.player.mesh.position.y,
      this.player.mesh.position.z - 0.05
    );
    this._playerAura.material.uniforms.uTime.value += timeDelta;
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
          this.sparks.spawnEssence(event.x, event.y, this.player);
          if (this.spawner.isCurrentWaveCleared()) this._startKillSlowMo();
        }
      } else if (event.type === 'damage') {
        this.hud.showDamageNumber(event.x, event.y, event.damage, event.attackType || 'light');
      } else if (event.type === 'statusDamage') {
        this.hud.showDamageNumber(event.x, event.y, event.damage, 'status');
      } else if (event.type === 'kill') {
        this.sparks.spawnEssence(event.x, event.y, this.player);
        if (this.spawner.isCurrentWaveCleared()) this._startKillSlowMo();
      } else if (event.type === 'hitbox') {
        this.combat.addHitbox(event.hitbox);
      } else if (event.type === 'playerHit') {
        this.cameraShake.request(0.35);
      } else if (event.type === 'waveClear') {
        this.hud.showWaveClear();
        if (!event.hasNextWave) {
          RunState.onZoneComplete('city-breach');
        }
      } else if (event.type === 'ultimate') {
        this.cameraShake.request(0.6);
      } else if (event.type === 'spell') {
        this.sparks.spawn(event.x, event.y, 0.25);
      }
    }
  }

  _updateDebugHitboxes() {
    const activeHitboxes = this.combat.getActiveHitboxes().concat(this.spawner.getProjectileHitboxes());
    this.debugHitboxes.update(this.player, this.spawner.getActiveEnemies(), activeHitboxes);
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
