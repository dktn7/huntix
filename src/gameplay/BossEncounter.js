import * as THREE from 'three';
import { Hitbox, HitboxOwners, HitboxShapes } from './Hitbox.js';

const BOSS_HP_MULTIPLIERS = {
  1: 1,
  2: 1.6,
  3: 2.1,
  4: 2.5,
};

const DEFAULT_PHASE_THRESHOLDS = [0.6, 0.3];

const DEFAULT_PATTERNS = {
  1: [
    { key: 'slash', kind: 'arc', telegraph: 0.65, recover: 0.45, damage: 40, radius: 2.1, arcCos: -0.15, knockbackX: 2.6, knockbackY: 0.45 },
    { key: 'charge', kind: 'dash', telegraph: 0.75, recover: 0.45, damage: 45, width: 2.4, height: 1.0, knockbackX: 3.2, knockbackY: 0.4 },
  ],
  2: [
    { key: 'slam', kind: 'radial', telegraph: 0.8, recover: 0.55, damage: 55, radius: 2.6, knockbackX: 1.5, knockbackY: 0.7 },
    { key: 'projectile', kind: 'line', telegraph: 0.7, recover: 0.5, damage: 40, width: 3.4, height: 1.2, knockbackX: 2.1, knockbackY: 0.35 },
  ],
  3: [
    { key: 'burst', kind: 'radial', telegraph: 0.9, recover: 0.6, damage: 70, radius: 3.1, knockbackX: 1.8, knockbackY: 0.8 },
    { key: 'pressure', kind: 'multi', telegraph: 0.85, recover: 0.65, damage: 60, radius: 2.8, knockbackX: 2.4, knockbackY: 0.6 },
  ],
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function nearestPlayer(players, origin) {
  let best = null;
  let bestDistance = Infinity;
  for (const player of players) {
    if (!player || player.state === 'DEAD' || player.state === 'DOWNED') continue;
    const dx = player.position.x - origin.x;
    const dy = player.position.y - origin.y;
    const distance = Math.hypot(dx, dy);
    if (distance < bestDistance) {
      best = player;
      bestDistance = distance;
    }
  }
  return best;
}

export class BossEncounter {
  constructor(scene, config, playerCount = 1) {
    this.scene = scene;
    this.config = config;
    this.playerCount = Math.max(1, Math.min(4, playerCount));
    this.name = config.name || 'BOSS';
    this.id = config.id || this.name;
    this.type = config.type || 'BOSS';
    this.kind = config.kind || 'boss';
    this.zoneId = config.zoneId || 'zone';
    this.phase = 1;
    this.state = 'IDLE';
    this.isTelegraphing = false;
    this.hpMax = Math.max(1, Math.round((config.hp || 1000) * (BOSS_HP_MULTIPLIERS[this.playerCount] || 1)));
    this.hp = this.hpMax;
    this.position = { x: config.spawnX ?? 12, y: config.spawnY ?? -0.9 };
    this.facing = -1;
    this._events = [];
    this._phaseIndex = 0;
    this._currentAttack = null;
    this._state = 'idle';
    this._stateTimer = 0.8;
    this._telegraphTimer = 0;
    this._recoverTimer = 0;
    this._freezeTimer = 0;
    this._deathTimer = 0.7;
    this._removeTimer = 0.7;
    this._phaseFlash = 0;
    this._phaseThresholds = Array.isArray(config.phaseThresholds) && config.phaseThresholds.length > 0
      ? config.phaseThresholds.slice()
      : DEFAULT_PHASE_THRESHOLDS.slice();
    this._patterns = config.patterns || DEFAULT_PATTERNS;
    this._phaseAdds = config.phaseAdds || {};
    this._immuneStatuses = new Set(config.immuneStatuses || []);
    this._reward = config.reward || { xp: 500, essence: 200 };
    this._speed = config.speed || 0.85;
    this._moveRange = config.moveRange || 0.22;
    this._attackCursor = 0;
    this._phaseAnnounced = 1;
    this._bossDefeatedEmitted = false;

    const width = config.width || 3.0;
    const height = config.height || 3.2;
    const geo = new THREE.PlaneGeometry(width, height);
    const mat = new THREE.MeshBasicMaterial({
      color: config.color || 0xc0392b,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(this.position.x, this.position.y, 0.3);
    scene.add(this.mesh);

    this._baseScale = { x: width, y: height };
  }

  setPlayerCount(playerCount) {
    this.playerCount = Math.max(1, Math.min(4, playerCount));
    const multiplier = BOSS_HP_MULTIPLIERS[this.playerCount] || 1;
    const hpRatio = this.hpMax > 0 ? this.hp / this.hpMax : 1;
    this.hpMax = Math.max(1, Math.round((this.config.hp || 1000) * multiplier));
    this.hp = Math.max(1, Math.round(this.hpMax * hpRatio));
  }

  update(dt, players) {
    this._events.length = 0;

    if (this._freezeTimer > 0) {
      this._freezeTimer = Math.max(0, this._freezeTimer - dt);
      this._syncMesh();
      return this.consumeEvents();
    }

    if (this.hp <= 0) {
      this.state = 'DEAD';
      this.isTelegraphing = false;
      this._deathTimer = Math.max(0, this._deathTimer - dt);
      this._removeTimer = Math.max(0, this._removeTimer - dt);
      this.mesh.scale.set(
        this._baseScale.x * 0.95,
        Math.max(0.15, this._baseScale.y * (this._removeTimer / 0.7)),
        1
      );
      if (!this._bossDefeatedEmitted) {
        this._bossDefeatedEmitted = true;
        this._events.push({ type: 'bossDefeated', boss: this, zoneId: this.zoneId, kind: this.kind });
        this._events.push({ type: 'kill', enemy: this, x: this.position.x, y: this.position.y, boss: true });
      }
      this._syncMesh();
      return this.consumeEvents();
    }

    const target = nearestPlayer(players, this.position);
    if (target) {
      const dx = target.position.x - this.position.x;
      const dy = target.position.y - this.position.y;
      this.facing = dx >= 0 ? 1 : -1;
      const moveX = clamp(dx, -this._moveRange, this._moveRange) * this._speed;
      const moveY = clamp(dy, -0.08, 0.08) * this._speed;
      if (this._state !== 'telegraph') {
        this.position.x += moveX * dt;
        this.position.y += moveY * dt;
      }
    }

    this._checkPhaseTransitions();

    if (this._phaseFlash > 0) this._phaseFlash = Math.max(0, this._phaseFlash - dt);

    if (this._state === 'idle') {
      this.state = 'IDLE';
      this._stateTimer = Math.max(0, this._stateTimer - dt);
      if (this._stateTimer <= 0) {
        this._beginAttack();
      }
    } else if (this._state === 'telegraph') {
      this.state = 'TELEGRAPH';
      this.isTelegraphing = true;
      this._telegraphTimer = Math.max(0, this._telegraphTimer - dt);
      if (this._telegraphTimer <= 0) {
        this._fireAttack(target, players);
      }
    } else if (this._state === 'recover') {
      this.state = 'RECOVER';
      this.isTelegraphing = false;
      this._recoverTimer = Math.max(0, this._recoverTimer - dt);
      if (this._recoverTimer <= 0) {
        this._state = 'idle';
        this._stateTimer = 0.9;
      }
    }

    this._syncMesh();
    return this.consumeEvents();
  }

  takeDamage(amount, knockback = { x: 0, y: 0 }, hitMeta = {}) {
    if (this.hp <= 0) return false;
    if (hitMeta.statusType && this._immuneStatuses.has(hitMeta.statusType)) {
      // Bosses ignore their canonical status weakness in MVP if they are immune.
    }

    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this._state = 'dead';
      this.state = 'DEAD';
      this.isTelegraphing = false;
      this._deathTimer = 0.7;
      this._removeTimer = 0.7;
      this._events.push({ type: 'kill', enemy: this, x: this.position.x, y: this.position.y, boss: true });
      return true;
    }

    if (knockback) {
      this.position.x += clamp(knockback.x || 0, -0.4, 0.4);
      this.position.y += clamp(knockback.y || 0, -0.18, 0.18);
    }
    return true;
  }

  applyStatus(type) {
    return !this._immuneStatuses.has(type);
  }

  freeze(seconds) {
    this._freezeTimer = Math.max(this._freezeTimer, seconds);
  }

  getBodyBounds() {
    return new Hitbox({
      x: this.position.x - this._baseScale.x / 2,
      y: this.position.y - this._baseScale.y / 2,
      width: this._baseScale.x,
      height: this._baseScale.y,
      owner: this,
      ownerTag: HitboxOwners.ENEMY,
    });
  }

  getHurtbox() {
    if (this.hp <= 0) return null;
    return this.getBodyBounds();
  }

  isDead() {
    return this.hp <= 0;
  }

  canRemove() {
    return this.hp <= 0 && this._removeTimer <= 0;
  }

  getRewards() {
    return this._reward;
  }

  consumeEvents() {
    const events = this._events.slice();
    this._events.length = 0;
    return events;
  }

  _beginAttack() {
    const attacks = this._patterns[this.phase] || this._patterns[1] || DEFAULT_PATTERNS[1];
    this._currentAttack = attacks[this._attackCursor % attacks.length] || attacks[0];
    this._attackCursor += 1;
    this._state = 'telegraph';
    this.state = 'TELEGRAPH';
    this.isTelegraphing = true;
    this._telegraphTimer = this._currentAttack.telegraph || 0.6;
    this._events.push({
      type: 'bossTelegraph',
      boss: this,
      bossId: this.config.id || this.name,
      name: this.name,
      phase: this.phase,
      kind: this.kind,
      attack: this._currentAttack.key || this._currentAttack.kind,
    });
  }

  _fireAttack(target, players) {
    const attack = this._currentAttack || {};
    const eventBase = {
      boss: this,
      bossId: this.config.id || this.name,
      name: this.name,
      phase: this.phase,
      kind: this.kind,
      attack: attack.key || attack.kind || 'attack',
    };

    if (attack.kind === 'arc') {
      this._events.push({
        type: 'hitbox',
        hitbox: new Hitbox({
          shape: HitboxShapes.ARC,
          centerX: this.position.x,
          centerY: this.position.y,
          radius: attack.radius || 2.1,
          facing: this.facing,
          arcCos: attack.arcCos ?? -0.1,
          damage: attack.damage || 40,
          knockbackX: this.facing * (attack.knockbackX || 2.4),
          knockbackY: attack.knockbackY || 0.4,
          owner: this,
          ownerTag: HitboxOwners.ENEMY,
          targetTag: HitboxOwners.PLAYER,
          lifetime: 0.18,
          attackType: 'heavy',
        }),
      });
    } else if (attack.kind === 'dash') {
      const offset = this.facing * (attack.width || 2.2) * 0.45;
      this._events.push({
        type: 'hitbox',
        hitbox: new Hitbox({
          x: this.position.x + offset - (attack.width || 2.2) / 2,
          y: this.position.y - (attack.height || 1.0) / 2,
          width: attack.width || 2.2,
          height: attack.height || 1.0,
          damage: attack.damage || 45,
          knockbackX: this.facing * (attack.knockbackX || 2.8),
          knockbackY: attack.knockbackY || 0.35,
          owner: this,
          ownerTag: HitboxOwners.ENEMY,
          targetTag: HitboxOwners.PLAYER,
          lifetime: 0.12,
          attackType: 'heavy',
        }),
      });
    } else if (attack.kind === 'line') {
      this._events.push({
        type: 'hitbox',
        hitbox: new Hitbox({
          x: this.position.x - (attack.width || 3.4) / 2,
          y: this.position.y - (attack.height || 1.2) / 2,
          width: attack.width || 3.4,
          height: attack.height || 1.2,
          damage: attack.damage || 40,
          knockbackX: this.facing * (attack.knockbackX || 2.2),
          knockbackY: attack.knockbackY || 0.35,
          owner: this,
          ownerTag: HitboxOwners.ENEMY,
          targetTag: HitboxOwners.PLAYER,
          lifetime: 0.15,
          attackType: 'spell',
        }),
      });
    } else if (attack.kind === 'multi') {
      const radius = attack.radius || 2.8;
      const offsets = [-1, 1];
      for (const off of offsets) {
        this._events.push({
          type: 'hitbox',
          hitbox: new Hitbox({
            x: this.position.x + off * radius * 0.55 - radius / 2,
            y: this.position.y - radius / 2,
            width: radius,
            height: radius,
            damage: attack.damage || 60,
            knockbackX: off * (attack.knockbackX || 2.1),
            knockbackY: attack.knockbackY || 0.55,
            owner: this,
            ownerTag: HitboxOwners.ENEMY,
            targetTag: HitboxOwners.PLAYER,
            lifetime: 0.2,
            attackType: 'ultimate',
          }),
        });
      }
    } else {
      const radius = attack.radius || 2.4;
      this._events.push({
        type: 'hitbox',
        hitbox: new Hitbox({
          x: this.position.x - radius / 2,
          y: this.position.y - radius / 2,
          width: radius,
          height: radius,
          damage: attack.damage || 50,
          knockbackX: attack.knockbackX || 1.8,
          knockbackY: attack.knockbackY || 0.5,
          owner: this,
          ownerTag: HitboxOwners.ENEMY,
          targetTag: HitboxOwners.PLAYER,
          lifetime: 0.16,
          attackType: 'heavy',
        }),
      });
    }

    if (this._phaseAdds[this.phase]) {
      this._events.push({
        type: 'spawnAdds',
        boss: this,
        composition: this._phaseAdds[this.phase],
        zoneId: this.zoneId,
      });
    }

    this._state = 'recover';
    this.state = 'RECOVER';
    this.isTelegraphing = false;
    this._recoverTimer = attack.recover || 0.5;
    this._events.push({ type: 'bossAttack', ...eventBase });
  }

  _checkPhaseTransitions() {
    const ratio = this.hpMax > 0 ? this.hp / this.hpMax : 0;
    while (this.phase < 1 + this._phaseThresholds.length) {
      const threshold = this._phaseThresholds[this.phase - 1];
      if (ratio > threshold) break;

      this.phase += 1;
      this._phaseFlash = 0.25;
      this._state = 'idle';
      this.state = 'IDLE';
      this.isTelegraphing = false;
      this._stateTimer = 0.45;
      this._telegraphTimer = 0;
      this._recoverTimer = 0;
      this._events.push({
        type: 'bossPhase',
        boss: this,
        bossId: this.config.id || this.name,
        name: this.name,
        phase: this.phase,
        kind: this.kind,
        hp: this.hp,
        hpMax: this.hpMax,
      });

      if (this._phaseAdds[this.phase]) {
        this._events.push({
          type: 'spawnAdds',
          boss: this,
          composition: this._phaseAdds[this.phase],
          zoneId: this.zoneId,
        });
      }
    }
  }

  _syncMesh() {
    this.mesh.position.set(this.position.x, this.position.y, -this.position.y * 0.01 + 0.3);
    const phaseScale = this.phase === 1 ? 1 : this.phase === 2 ? 1.08 : 1.16;
    const flash = this._phaseFlash > 0 ? 1.08 : 1;
    this.mesh.scale.set(
      phaseScale * flash * (this._baseScale.x / Math.max(1, this._baseScale.x)),
      phaseScale * flash * (this._baseScale.y / Math.max(1, this._baseScale.y)),
      1
    );
    if (this.mesh.material?.color) {
      const base = new THREE.Color(this.config.color || 0xc0392b);
      if (this.phase === 2) base.lerp(new THREE.Color(0xffffff), 0.12);
      if (this.phase >= 3) base.lerp(new THREE.Color(0xffffff), 0.24);
      this.mesh.material.color.copy(base);
      this.mesh.material.opacity = this._phaseFlash > 0 ? 1 : 0.96;
    }
  }

  syncVisuals() {
    this._syncMesh();
  }
}
