import * as THREE from 'three';
import { EnemyAI, EnemyStates, EnemyTypes } from './EnemyAI.js';
import { Hitbox, HitboxOwners } from './Hitbox.js';

const MAX_ENEMIES = 20;
const ENEMY_CAPACITY = 20;
const PROJECTILE_CAPACITY = 10;

const HP_MULTIPLIERS = {
  1: 1,
  2: 1.5,
  3: 2,
  4: 2.5,
};

const CITY_BREACH_WAVES = [
  { grunts: 3 },
  { grunts: 2, ranged: 1 },
  { grunts: 2, bruisers: 1 },
  { fireBruisers: 1, miniboss: true },
];

export class EnemySpawner {
  /** Creates the Phase 2 enemy, projectile, wave, and status-light manager. */
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

  /** Starts the scripted City Breach Phase 2 encounter. */
  startCityBreach() {
    this._enemies.length = 0;
    this._projectiles.length = 0;
    this._waveIndex = -1;
    this._betweenWaveTimer = 0;
    this._pendingNextWave = false;
    this._waveClearEmitted = false;
    this._spawnNextWave();
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

  /** Advances enemies, projectiles, decoys, and wave timers. */
  update(dt, players) {
    this._events.length = 0;
    this._updateDecoys(dt);
    const targets = this._decoys.length > 0 ? players.concat(this._decoys) : players;

    for (const enemy of this._enemies) {
      const events = enemy.update(dt, targets);
      this._handleEnemyEvents(events);
    }

    this._updateProjectiles(dt, players);
    this.clearDead();
    this._updateWaveFlow(dt);
    this._syncInstances();
    this._syncProjectiles();
    return this.consumeEvents();
  }

  /** Returns the active enemy objects for combat queries. */
  getActiveEnemies() {
    return this._enemies;
  }

  /** Returns active projectile hitboxes for debug and combat. */
  getProjectileHitboxes() {
    return this._projectiles.map(projectile => this._projectileHitbox(projectile));
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
  }

  /** Returns true when no living enemies remain in the current wave. */
  isCurrentWaveCleared() {
    return this._enemies.every(enemy => enemy.isDead());
  }

  /** Removes dead enemies after their brief death cleanup delay. */
  clearDead() {
    this._enemies = this._enemies.filter(enemy => !enemy.canRemove());
  }

  /** Updates instanced enemy matrices without advancing AI. */
  syncVisuals() {
    this._syncInstances();
    this._syncProjectiles();
  }

  /** Returns and clears queued spawner events. */
  consumeEvents() {
    const events = this._events.slice();
    this._events.length = 0;
    return events;
  }

  _handleEnemyEvents(events) {
    for (const event of events) {
      if (event.type === 'projectile') {
        this._spawnProjectile(event);
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
      owner: event.owner,
    });
  }

  _updateProjectiles(dt, players) {
    for (const projectile of this._projectiles) {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.life = Math.max(0, projectile.life - dt);

      const hitbox = this._projectileHitbox(projectile);
      for (const player of players) {
        const hurtbox = player.getHurtbox?.();
        if (!hurtbox || !hitbox.intersects(hurtbox)) continue;
        hitbox.applyHit(player, projectile.owner);
        projectile.life = 0;
        this._events.push({
          type: 'playerHit',
          damage: projectile.damage,
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
    if (this._waveIndex < 0) return;

    if (this.isCurrentWaveCleared() && !this._waveClearEmitted) {
      this._waveClearEmitted = true;
      this._pendingNextWave = this._waveIndex < CITY_BREACH_WAVES.length - 1;
      this._betweenWaveTimer = this._pendingNextWave ? 2 : 0;
      this._events.push({
        type: 'waveClear',
        wave: this._waveIndex + 1,
        hasNextWave: this._pendingNextWave,
      });
    }

    if (!this._pendingNextWave) return;
    this._betweenWaveTimer = Math.max(0, this._betweenWaveTimer - dt);
    if (this._betweenWaveTimer <= 0) {
      this._pendingNextWave = false;
      this._spawnNextWave();
    }
  }

  _spawnNextWave() {
    this._waveIndex += 1;
    const wave = CITY_BREACH_WAVES[this._waveIndex];
    if (!wave) return;

    this._waveClearEmitted = false;
    this._spawnComposition({
      ...wave,
      startX: wave.miniboss ? 3.2 : 2.2,
      spacing: 1.25,
      y: -2.2,
    });
    this._events.push({ type: 'waveStart', wave: this._waveIndex + 1, miniboss: !!wave.miniboss });
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
    if (enemy.state === EnemyStates.DEAD) {
      this._scale.set(baseX, 0.1, 1);
    } else if (enemy.state === EnemyStates.HURT) {
      this._scale.set(baseX * 1.15, baseY * 0.9, 1);
    } else if (enemy.isTelegraphing) {
      this._scale.set(baseX * 1.25, baseY * 1.25, 1);
    } else {
      this._scale.set(baseX, baseY, 1);
    }
  }

  _colorFor(enemy) {
    if (enemy.state === EnemyStates.DEAD) return 0x222222;
    if (enemy.state === EnemyStates.HURT) return 0xff5555;
    if (enemy.isTelegraphing) return 0xff3333;
    if (enemy.statusEffects.getDisplayColor()) return enemy.statusEffects.getDisplayColor();
    if (enemy.state === EnemyStates.AGGRO || enemy.state === EnemyStates.ATTACK) return 0x8c7a7a;
    return enemy.config.color;
  }

  _syncStatusLight(index, enemy) {
    const light = this._statusLights[index];
    const color = enemy.statusEffects.getDisplayColor();
    light.visible = !!color || enemy.type === EnemyTypes.FIRE_BRUISER;
    if (!light.visible) return;

    light.color.setHex(color || 0xff6a00);
    light.intensity = color ? enemy.statusEffects.getPulseIntensity() : 0.9;
    light.position.set(enemy.position.x, enemy.position.y + 0.4, -enemy.position.y * 0.01 + 0.6);
  }
}
