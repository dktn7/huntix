import * as THREE from 'three';
import { EnemyAI, EnemyTypes } from './EnemyAI.js';
import { Hitbox, HitboxOwners } from './Hitbox.js';
import { BossEncounter } from './BossEncounter.js';
import { ZONE_CONFIGS } from './ZoneManager.js';
import { pointInsideVisibleArena } from './ArenaBounds.js';

const MAX_ENEMIES = 20;
const ENEMY_CAPACITY = 20;
const PROJECTILE_CAPACITY = 10;
const PROJECTILE_ARM_TIME = 3 / 60;

const HP_MULTIPLIERS = {
  1: 1,
  2: 1.5,
  3: 1.9,
  4: 2.2,
};

const DEFAULT_WAVE_DELAY = 1.4;
const DEFAULT_ZONE_CLEAR_DELAY = 1.2;
const DEFAULT_ENCOUNTER_DELAY = 0.6;
const ATTACK_TOKENS_BY_PLAYER_COUNT = {
  1: 2,
  2: 3,
  3: 4,
  4: 5,
};

function cloneComposition(base = {}, extraGrunts = 0) {
  return {
    grunts: (base.grunts || 0) + extraGrunts,
    ranged: base.ranged || 0,
    bruisers: base.bruisers || 0,
    fireBruisers: base.fireBruisers || 0,
  };
}

export class EnemySpawner {
  /** Creates the enemy, projectile, wave, miniboss, and boss encounter manager. */
  constructor(scene, playerCount = 1) {
    this.scene = scene;
    this.playerCount = Math.max(1, Math.min(4, playerCount));
    this._enemies = [];
    this._projectiles = [];
    this._events = [];
    this._decoys = [];
    this._nextId = 1;
    this._waveIndex = -1;
    this._betweenWaveTimer = 0;
    this._pendingNextWave = false;
    this._waveClearEmitted = false;
    this._areaIndex = 0;
    this._routeGateOpen = false;
    this._routeGateKind = null;
    this._routeGateTimer = 0;
    this._routeGateEmitted = false;
    this._zoneConfig = null;
    this._zoneState = 'idle';
    this._encounterDelay = 0;
    this._zoneClearDelay = 0;
    this._minibossDone = false;
    this._bossEncounter = null;
    this._lastDefeatedBoss = null;
    this._bossSpawnEmitted = false;
    this._zoneClearEmitted = false;
    this._attackTokens = new Set();
    this._aiContext = {
      requestAttackToken: enemy => this._requestAttackToken(enemy),
      releaseAttackToken: enemy => this._releaseAttackToken(enemy),
    };

    this._matrix = new THREE.Matrix4();
    this._position = new THREE.Vector3();
    this._quaternion = new THREE.Quaternion();
    this._scale = new THREE.Vector3();
    this._color = new THREE.Color();

    const geo = new THREE.BoxGeometry(0.8, 1.1, 0.35);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    this._enemyMesh = new THREE.InstancedMesh(geo, mat, ENEMY_CAPACITY);
    this._enemyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._enemyMesh.count = 0;
    scene.add(this._enemyMesh);

    this._statusLights = [];
    for (let i = 0; i < ENEMY_CAPACITY; i += 1) {
      const light = new THREE.PointLight(0xffffff, 0, 2.2);
      light.visible = false;
      scene.add(light);
      this._statusLights.push(light);
    }

    const projectileGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const projectileMat = new THREE.MeshBasicMaterial({ color: 0x48f7ff });
    this._projectileMeshes = [];
    for (let i = 0; i < PROJECTILE_CAPACITY; i += 1) {
      const mesh = new THREE.Mesh(projectileGeo, projectileMat);
      mesh.visible = false;
      scene.add(mesh);
      this._projectileMeshes.push(mesh);
    }

    const decoyGeo = new THREE.BoxGeometry(0.75, 1.1, 0.3);
    const decoyMat = new THREE.MeshLambertMaterial({ color: 0x2c2c55, transparent: true, opacity: 0.65 });
    this._decoyMesh = new THREE.Mesh(decoyGeo, decoyMat);
    this._decoyMesh.visible = false;
    scene.add(this._decoyMesh);
  }

  /** Starts the scripted City Breach Phase 4-compatible encounter flow. */
  startCityBreach() {
    this.startZone(ZONE_CONFIGS['city-breach']);
  }

  /** Starts a configured zone run with waves, optional miniboss, and boss. */
  startZone(zoneConfig) {
    this._zoneConfig = zoneConfig || null;
    this._zoneState = 'waves';
    this._zoneClearEmitted = false;
    this._bossSpawnEmitted = false;
    this._minibossDone = !zoneConfig?.miniboss;
    this._areaIndex = 0;
    this._routeGateOpen = false;
    this._routeGateKind = null;
    this._routeGateTimer = 0;
    this._routeGateEmitted = false;
    this._bossEncounter = null;
    this._lastDefeatedBoss = null;
    this._encounterDelay = 0;
    this._zoneClearDelay = 0;
    this._resetWaveState();
    this._spawnNextWave();
  }

  /** Updates the active human player count used for future co-op HP scaling. */
  setPlayerCount(playerCount) {
    this.playerCount = Math.max(1, Math.min(4, playerCount));
    if (this._bossEncounter?.setPlayerCount) {
      this._bossEncounter.setPlayerCount(this.playerCount);
    }
  }

  /** Spawns a compatibility grunt wave, capped by the max enemy limit. */
  spawnWave(waveConfig = {}) {
    this._spawnComposition({
      grunts: waveConfig.grunts ?? 4,
      startX: waveConfig.startX ?? 3.5,
      spacing: waveConfig.spacing ?? 1.2,
      y: waveConfig.y ?? -2.2,
    });
    this._syncInstances();
  }

  /** Advances enemies, projectiles, decoys, and wave/boss timers. */
  update(dt, players) {
    this._events.length = 0;
    this._updateDecoys(dt);
    const targets = this._decoys.length > 0 ? players.concat(this._decoys) : players;

    for (const enemy of this._enemies) {
      const events = enemy.update(dt, targets, this._aiContext);
      this._handleEnemyEvents(events);
    }

    if (this._bossEncounter) {
      const events = this._bossEncounter.update(dt, targets);
      this._handleBossEvents(events);
      if (this._bossEncounter.canRemove()) {
        this._bossEncounter = null;
      }
    }

    this._updateProjectiles(dt, players);
    this.clearDead();
    this._updateWaveFlow(dt, players);
    this._syncInstances();
    this._syncProjectiles();
    return this.consumeEvents();
  }

  /** Returns the active enemy objects for combat queries. */
  getActiveEnemies() {
    return this._bossEncounter
      ? this._enemies.concat([this._bossEncounter])
      : this._enemies;
  }

  /** Returns active projectile hitboxes for debug and combat. */
  getProjectileHitboxes() {
    return this._projectiles
      .filter(projectile => projectile.age >= PROJECTILE_ARM_TIME)
      .map(projectile => this._projectileHitbox(projectile));
  }

  /** Adds an advanced-spell decoy taunt at the supplied position. */
  spawnDecoy(x, y) {
    this._decoys.length = 0;
    this._decoys.push({
      id: 'decoy',
      state: 'DECOY',
      position: { x, y },
      remaining: 3,
    });
    this._decoyMesh.position.set(x, y, -y * 0.01 + 0.1);
    this._decoyMesh.visible = true;
  }

  /** Freezes all active enemies for the supplied duration. */
  freezeAll(seconds) {
    for (const enemy of this._enemies) enemy.freeze(seconds);
    if (this._bossEncounter) this._bossEncounter.freeze(seconds);
  }

  /** Returns true when no living enemies remain in the current wave. */
  isCurrentWaveCleared() {
    return this._enemies.every(enemy => enemy.isDead());
  }

  /** Returns true while the in-zone route gate is waiting for players to advance. */
  isRouteGateOpen() {
    return this._routeGateOpen;
  }

  /** Returns compact route progress for HUD, tests, and debug overlays. */
  getRouteState() {
    return {
      areaIndex: this._areaIndex,
      gateOpen: this._routeGateOpen,
      gateKind: this._routeGateKind,
      waveIndex: this._waveIndex,
      zoneState: this._zoneState,
    };
  }

  /** Advances through an opened route gate into the next combat area or boss arena. */
  advanceRoute() {
    if (!this._routeGateOpen || !this._zoneConfig) return false;

    const gateKind = this._routeGateKind;
    this._routeGateOpen = false;
    this._routeGateKind = null;
    this._routeGateTimer = 0;
    this._routeGateEmitted = false;
    this._areaIndex += 1;

    if (gateKind === 'wave') {
      this._pendingNextWave = false;
      this._spawnNextWave();
      return true;
    }

    if (gateKind === 'boss') {
      if (!this._minibossDone && this._zoneConfig.miniboss) {
        this._spawnBossEncounter(this._zoneConfig.miniboss, 'miniboss');
        this._minibossDone = true;
        this._zoneState = 'miniboss';
      } else if (!this._bossEncounter && this._zoneConfig.boss) {
        this._spawnBossEncounter(this._zoneConfig.boss, 'boss');
        this._bossSpawnEmitted = true;
        this._zoneState = 'boss';
      }
      return true;
    }

    return false;
  }

  /** Removes dead enemies after their brief death cleanup delay. */
  clearDead() {
    this._enemies = this._enemies.filter(enemy => !enemy.canRemove());
  }

  /** Updates instanced enemy matrices without advancing AI. */
  syncVisuals() {
    this._syncInstances();
    this._syncProjectiles();
    if (this._bossEncounter?.syncVisuals) this._bossEncounter.syncVisuals();
  }

  /** Returns and clears queued spawner events. */
  consumeEvents() {
    const events = this._events.slice();
    this._events.length = 0;
    return events;
  }

  _handleEnemyEvents(events) {
    for (const event of events) {
      if (!event) continue;
      if (event.type === 'projectile') {
        this._spawnProjectile(event);
      } else {
        this._events.push(event);
      }
    }
  }

  _handleBossEvents(events) {
    for (const event of events) {
      if (!event) continue;

      if (event.type === 'spawnAdds') {
        this._spawnComposition(cloneComposition(event.composition));
        continue;
      }

      if (event.type === 'bossPhase') {
        this._events.push(event);
        continue;
      }

      if (event.type === 'bossTelegraph' || event.type === 'bossAttack') {
        this._events.push(event);
        continue;
      }

      if (event.type === 'bossDefeated') {
        if (event.kind === 'miniboss') {
          this._zoneState = 'miniboss';
          this._openRouteGate('boss', DEFAULT_ENCOUNTER_DELAY);
          this._lastDefeatedBoss = event.boss;
          this._events.push({ type: 'minibossDefeated', boss: event.boss, zoneId: this._zoneConfig?.id });
        } else {
          this._zoneState = 'complete';
          this._zoneClearDelay = DEFAULT_ZONE_CLEAR_DELAY;
          this._lastDefeatedBoss = event.boss;
        }
        this._events.push(event);
        continue;
      }

      if (event.type === 'kill') {
        this._events.push(event);
      } else {
        this._events.push(event);
      }
    }
  }

  _spawnProjectile(event) {
    if (this._projectiles.length >= PROJECTILE_CAPACITY) return;
    this._projectiles.push({
      id: `projectile-${event.owner.id}-${Math.floor(event.x * 100)}`,
      x: event.x,
      y: event.y,
      vx: event.vx,
      vy: event.vy,
      damage: event.damage,
      life: 2.2,
      age: 0,
      owner: event.owner,
    });
  }

  _updateProjectiles(dt, players) {
    for (const projectile of this._projectiles) {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.age += dt;
      projectile.life = Math.max(0, projectile.life - dt);
      if (projectile.age < PROJECTILE_ARM_TIME) continue;

      const hitbox = this._projectileHitbox(projectile);
      for (const player of players) {
        const hurtbox = player.getHurtbox?.();
        if (!hurtbox || !hitbox.intersects(hurtbox)) continue;
        hitbox.applyHit(player, projectile.owner);
        projectile.life = 0;
        this._events.push({
          type: 'playerHit',
          damage: projectile.damage,
          attackType: 'projectile',
          x: player.position.x,
          y: player.position.y,
        });
        break;
      }
    }

    this._projectiles = this._projectiles.filter(projectile => projectile.life > 0);
  }

  _projectileHitbox(projectile) {
    return new Hitbox({
      x: projectile.x - 0.12,
      y: projectile.y - 0.12,
      width: 0.24,
      height: 0.24,
      damage: projectile.damage,
      knockbackX: Math.sign(projectile.vx || 1) * 1.4,
      knockbackY: 0.2,
      owner: projectile.owner,
      ownerTag: HitboxOwners.ENEMY,
      targetTag: HitboxOwners.PLAYER,
      lifetime: projectile.life,
      attackType: 'projectile',
    });
  }

  _updateWaveFlow(dt) {
    if (!this._zoneConfig) return;

    if (this._zoneState === 'waves') {
      if (this.isCurrentWaveCleared() && !this._waveClearEmitted) {
        this._waveClearEmitted = true;
        this._pendingNextWave = this._waveIndex < this._zoneConfig.waves.length - 1;
        this._betweenWaveTimer = this._pendingNextWave ? DEFAULT_WAVE_DELAY : DEFAULT_ENCOUNTER_DELAY;
        this._openRouteGate(this._pendingNextWave ? 'wave' : 'boss', this._betweenWaveTimer);
        this._events.push({
          type: 'waveClear',
          wave: this._waveIndex + 1,
          hasNextWave: this._pendingNextWave,
          zoneId: this._zoneConfig.id,
        });
      }

      this._updateRouteGate(dt);
      return;
    }

    if (this._zoneState === 'miniboss') {
      if (!this._bossEncounter) {
        this._updateRouteGate(dt);
      }
      return;
    }

    if (this._zoneState === 'complete') {
      this._zoneClearDelay = Math.max(0, this._zoneClearDelay - dt);
      if (this._zoneClearDelay <= 0 && !this._zoneClearEmitted) {
        this._zoneClearEmitted = true;
        this._events.push({ type: 'zoneClear', zoneId: this._zoneConfig.id, boss: this._lastDefeatedBoss || this._bossEncounter });
      }
    }
  }

  _spawnBossEncounter(config, kind = 'boss') {
    const encounter = new BossEncounter(this.scene, {
      ...config,
      kind,
      zoneId: this._zoneConfig?.id || config.zoneId || kind,
    }, this.playerCount);
    this._bossEncounter = encounter;
    this._events.push({
      type: kind === 'miniboss' ? 'minibossStart' : 'bossStart',
      boss: encounter,
      zoneId: this._zoneConfig?.id,
    });
    this._encounterDelay = kind === 'miniboss' ? DEFAULT_ENCOUNTER_DELAY : 0;
  }

  _openRouteGate(kind, delay = DEFAULT_WAVE_DELAY) {
    this._routeGateKind = kind;
    this._routeGateTimer = Math.max(0, delay);
    this._routeGateOpen = false;
    this._routeGateEmitted = false;
  }

  _updateRouteGate(dt) {
    if (!this._routeGateKind || this._routeGateOpen) return;

    this._routeGateTimer = Math.max(0, this._routeGateTimer - dt);
    if (this._routeGateTimer > 0 || this._routeGateEmitted) return;

    this._routeGateOpen = true;
    this._routeGateEmitted = true;
    this._events.push({
      type: 'routeGateOpen',
      gateKind: this._routeGateKind,
      nextArea: this._areaIndex + 2,
      zoneId: this._zoneConfig?.id,
    });
  }

  _spawnNextWave() {
    if (!this._zoneConfig?.waves) return;

    this._waveIndex += 1;
    const wave = this._zoneConfig.waves[this._waveIndex];
    if (!wave) return;

    this._waveClearEmitted = false;
    const extraGrunts = Math.max(0, this.playerCount - 1);
    const composition = cloneComposition(wave, extraGrunts);
    this._spawnComposition({
      ...composition,
      startX: wave.startX ?? 2.2,
      spacing: wave.spacing ?? 1.25,
      y: wave.y ?? -2.2,
    });
    this._events.push({
      type: 'waveStart',
      wave: this._waveIndex + 1,
      miniboss: !!wave.miniboss,
      zoneId: this._zoneConfig.id,
    });
    this._encounterDelay = DEFAULT_ENCOUNTER_DELAY;
  }

  _resetWaveState() {
    this._enemies.length = 0;
    this._projectiles.length = 0;
    this._waveIndex = -1;
    this._betweenWaveTimer = 0;
    this._pendingNextWave = false;
    this._waveClearEmitted = false;
    this._routeGateOpen = false;
    this._routeGateKind = null;
    this._routeGateTimer = 0;
    this._routeGateEmitted = false;
    this._encounterDelay = 0;
  }

  _spawnComposition(config) {
    const startX = config.startX ?? 3.5;
    const spacing = config.spacing ?? 1.2;
    const y = config.y ?? -2.2;
    let slot = 0;

    slot = this._spawnMany(EnemyTypes.GRUNT, config.grunts || 0, startX, y, spacing, slot);
    slot = this._spawnMany(EnemyTypes.RANGED, config.ranged || 0, startX, y + 0.45, spacing, slot);
    slot = this._spawnMany(EnemyTypes.BRUISER, config.bruisers || 0, startX, y, spacing * 1.4, slot);
    this._spawnMany(EnemyTypes.FIRE_BRUISER, config.fireBruisers || 0, startX, y, spacing * 1.4, slot);
  }

  _spawnMany(type, count, startX, y, spacing, slot) {
    const hpMultiplier = HP_MULTIPLIERS[this.playerCount] || 1;
    const available = Math.max(0, MAX_ENEMIES - this._enemies.length);
    const spawnCount = Math.min(count, available);

    for (let i = 0; i < spawnCount; i += 1) {
      this._enemies.push(new EnemyAI({
        id: this._nextId++,
        type,
        x: startX + slot * spacing,
        y: y + (slot % 2) * 0.35,
        hpMultiplier,
      }));
      slot += 1;
    }

    return slot;
  }

  _updateDecoys(dt) {
    for (const decoy of this._decoys) {
      decoy.remaining = Math.max(0, decoy.remaining - dt);
    }
    this._decoys = this._decoys.filter(decoy => decoy.remaining > 0);
    this._decoyMesh.visible = this._decoys.length > 0;
    if (this._decoys[0]) {
      const decoy = this._decoys[0];
      this._decoyMesh.position.set(decoy.position.x, decoy.position.y, -decoy.position.y * 0.01 + 0.1);
    }
  }

  _syncInstances() {
    this._enemyMesh.count = Math.min(this._enemies.length, ENEMY_CAPACITY);

    for (let i = 0; i < ENEMY_CAPACITY; i += 1) {
      const enemy = this._enemies[i];
      if (!enemy || i >= this._enemyMesh.count) {
        this._statusLights[i].visible = false;
        continue;
      }

      this._writeScaleFor(enemy);
      this._position.set(enemy.position.x, enemy.position.y, -enemy.position.y * 0.01);
      this._matrix.compose(this._position, this._quaternion, this._scale);
      this._enemyMesh.setMatrixAt(i, this._matrix);
      this._enemyMesh.setColorAt(i, this._color.setHex(this._colorFor(enemy)));
      this._syncStatusLight(i, enemy);
    }

    this._enemyMesh.instanceMatrix.needsUpdate = true;
    if (this._enemyMesh.instanceColor) this._enemyMesh.instanceColor.needsUpdate = true;
  }

  _syncProjectiles() {
    for (let i = 0; i < PROJECTILE_CAPACITY; i += 1) {
      const projectile = this._projectiles[i];
      const mesh = this._projectileMeshes[i];
      if (!projectile) {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      mesh.position.set(projectile.x, projectile.y, -projectile.y * 0.01 + 0.25);
    }
  }

  _writeScaleFor(enemy) {
    const baseX = enemy.config.width / 0.8;
    const baseY = enemy.config.height / 1.1;
    if (enemy.state === 'DEAD') {
      this._scale.set(baseX, 0.1, 1);
    } else if (enemy.state === 'HURT') {
      this._scale.set(baseX * 1.15, baseY * 0.9, 1);
    } else if (enemy.isTelegraphing) {
      this._scale.set(baseX * 1.25, baseY * 1.25, 1);
    } else {
      this._scale.set(baseX, baseY, 1);
    }
  }

  _colorFor(enemy) {
    if (enemy.state === 'DEAD') return 0x222222;
    if (enemy.state === 'HURT') return 0xff5555;
    if (enemy.isTelegraphing) return 0xff3333;
    if (enemy.statusEffects?.getDisplayColor?.()) return enemy.statusEffects.getDisplayColor();
    if (enemy.state === 'AGGRO' || enemy.state === 'ATTACK') return 0x8c7a7a;
    return enemy.config.color;
  }

  _syncStatusLight(index, enemy) {
    const light = this._statusLights[index];
    const color = enemy.statusEffects?.getDisplayColor?.();
    light.visible = !!color || enemy.type === EnemyTypes.FIRE_BRUISER;
    if (!light.visible) return;

    light.color.setHex(color || 0xff6a00);
    light.intensity = color ? enemy.statusEffects.getPulseIntensity() : 0.9;
    light.position.set(enemy.position.x, enemy.position.y + 0.4, -enemy.position.y * 0.01 + 0.6);
  }
}
