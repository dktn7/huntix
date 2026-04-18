import { Hitbox, HitboxOwners } from './Hitbox.js';
import { PlayerStates } from './PlayerState.js';
import { StatusEffects, StatusTypes } from './StatusEffects.js';
import {
  centerMaxX,
  centerMaxY,
  centerMinX,
  centerMinY,
  clamp,
  clampCenterToVisibleArena,
} from './ArenaBounds.js';

const BASE_Y_SCALE = 0.4;
const BODY_WIDTH = 0.8;
const BODY_HEIGHT = 1.1;
const MELEE_RETARGET_SECONDS = 1.5;
const RANGED_RETARGET_SECONDS = 0.8;
const LANE_SPACING = 0.42;
const RANGED_STRAFE_SECONDS = 0.9;
const WAIT_RETRY_SECONDS = 0.5;
const MELEE_Y_TOLERANCE = 0.85;

export const EnemyTypes = {
  GRUNT: 'GRUNT',
  RANGED: 'RANGED',
  BRUISER: 'BRUISER',
  FIRE_BRUISER: 'FIRE_BRUISER',
};

export const EnemyStates = {
  IDLE: 'IDLE',
  PATROL: 'PATROL',
  AGGRO: 'AGGRO',
  TELEGRAPH: 'TELEGRAPH',
  ATTACK: 'ATTACK',
  RECOVER: 'RECOVER',
  WAIT: 'WAIT',
  HURT: 'HURT',
  DEAD: 'DEAD',
};

const ENEMY_CONFIGS = {
  [EnemyTypes.GRUNT]: {
    hp: 120,
    xp: 15,
    essence: 10,
    width: 0.8,
    height: 1.1,
    speed: 1.8,
    patrolSpeed: 0.7,
    attackDamage: 12,
    attackRange: 1.2,
    aggroRange: 8,
    cooldown: 1.8,
    telegraph: 0.4,
    attackLife: 0.12,
    color: 0x6d6d6d,
    hitboxWidth: 1.2,
    hitboxHeight: 0.9,
  },
  [EnemyTypes.RANGED]: {
    hp: 80,
    xp: 18,
    essence: 15,
    width: 0.7,
    height: 1.05,
    speed: 1.4,
    patrolSpeed: 0.55,
    attackDamage: 12,
    attackRange: 8,
    aggroRange: 12,
    cooldown: 3,
    telegraph: 0.6,
    attackLife: 0.12,
    color: 0x3f8cff,
    preferredMin: 5,
    preferredMax: 8,
    retreatRange: 2,
  },
  [EnemyTypes.BRUISER]: {
    hp: 420,
    xp: 40,
    essence: 32,
    width: 1.3,
    height: 1.7,
    speed: 0.95,
    patrolSpeed: 0.35,
    attackDamage: 28,
    attackRange: 1.8,
    aggroRange: 6,
    cooldown: 3,
    telegraph: 1.5,
    attackLife: 0.15,
    color: 0x4a4a52,
    hitboxWidth: 2.2,
    hitboxHeight: 1.5,
  },
  [EnemyTypes.FIRE_BRUISER]: {
    hp: 420,
    xp: 40,
    essence: 36,
    width: 1.45,
    height: 1.9,
    speed: 0.9,
    patrolSpeed: 0.3,
    attackDamage: 28,
    attackRange: 1.9,
    aggroRange: 7,
    cooldown: 2.8,
    telegraph: 1.5,
    attackLife: 0.15,
    color: 0xff6a00,
    hitboxWidth: 2.4,
    hitboxHeight: 1.6,
  },
};

export class EnemyAI {
  /** Creates a typed enemy using the shared Phase 2 FSM. */
  constructor({
    id,
    type = EnemyTypes.GRUNT,
    x = 0,
    y = -2.2,
    hpMultiplier = 1,
    patrolMinX = -6,
    patrolMaxX = 6,
  } = {}) {
    this.id = id;
    this.type = type;
    this.config = ENEMY_CONFIGS[type] || ENEMY_CONFIGS[EnemyTypes.GRUNT];
    this.state = EnemyStates.PATROL;
    this.position = { x, y };
    this.hp = this.config.hp * hpMultiplier;
    this.maxHp = this.hp;
    this.attackDamage = this.config.attackDamage;
    this.attackRange = this.config.attackRange;
    this.aggroRange = this.config.aggroRange;
    this.speed = this.config.speed;
    this.patrolSpeed = this.config.patrolSpeed;
    this.facing = -1;
    this.isTelegraphing = false;
    this.statusEffects = new StatusEffects();

    this._patrolMinX = patrolMinX;
    this._patrolMaxX = patrolMaxX;
    this._stateElapsed = 0;
    this._cooldown = 0;
    this._hasAttacked = false;
    this._knockback = { x: 0, y: 0 };
    this._removeTimer = 0.5;
    this._frozenTimer = 0;
    this._target = null;
    this._targetRefreshTimer = 0;
    this._lastAttacker = null;
    this._laneOffset = this._laneOffsetForType();
    this._strafeDirection = this.id % 2 === 0 ? 1 : -1;
    this._strafeTimer = RANGED_STRAFE_SECONDS;
    this._waitRetryTimer = 0;
    this._hasAttackToken = false;
    this._aiContext = null;
    this._events = [];
    this._clampToArena();
  }

  /** Advances this enemy and returns spawned combat events. */
  update(dt, players, aiContext = null) {
    this._aiContext = aiContext;
    this._events.length = 0;
    this._events.push(...this.statusEffects.update(dt, this));

    if (this.state === EnemyStates.DEAD) {
      this._removeTimer = Math.max(0, this._removeTimer - dt);
      return this.consumeEvents();
    }

    if (this._isControlLocked()) {
      this._frozenTimer = Math.max(0, this._frozenTimer - dt);
      this.isTelegraphing = false;
      this._releaseAttackToken();
      return this.consumeEvents();
    }

    if (this._cooldown > 0) this._cooldown = Math.max(0, this._cooldown - dt);
    const player = this._selectTarget(players, dt);
    if (!player) {
      this._releaseAttackToken();
      this._clampToArena();
      return this.consumeEvents();
    }

    this._stateElapsed += dt;
    this.isTelegraphing = this.state === EnemyStates.TELEGRAPH;

    if (this.state === EnemyStates.HURT) {
      this._updateHurt(dt);
      this._clampToArena();
      return this.consumeEvents();
    }

    const distance = this._distanceTo(player);
    if (this.state !== EnemyStates.TELEGRAPH && this.state !== EnemyStates.ATTACK) {
      if (this._shouldAttack(player, distance)) {
        this._transitionTo(EnemyStates.TELEGRAPH);
      } else if (this.state !== EnemyStates.WAIT && distance <= this.aggroRange) {
        this._transitionTo(EnemyStates.AGGRO);
      } else if (this.state !== EnemyStates.PATROL && this.state !== EnemyStates.IDLE) {
        this._transitionTo(EnemyStates.PATROL);
      }
    }

    if (this.state === EnemyStates.PATROL || this.state === EnemyStates.IDLE) {
      this._updatePatrol(dt);
    } else if (this.state === EnemyStates.AGGRO) {
      this._updateAggro(dt, player, distance);
    } else if (this.state === EnemyStates.WAIT) {
      this._updateWait(dt, player, distance);
    } else if (this.state === EnemyStates.TELEGRAPH) {
      this._updateTelegraph(player);
    } else if (this.state === EnemyStates.ATTACK) {
      this._updateAttack(player);
    } else if (this.state === EnemyStates.RECOVER && this._stateElapsed >= 0.25) {
      this._transitionTo(distance <= this.aggroRange ? EnemyStates.AGGRO : EnemyStates.PATROL);
    }

    this._clampToArena();
    return this.consumeEvents();
  }

  /** Applies damage, knockback, and type-specific stagger rules. */
  takeDamage(amount, knockback = { x: 0, y: 0 }, hitMeta = {}) {
    if (this.state === EnemyStates.DEAD) return false;

    this.hp = Math.max(0, this.hp - amount);

    if (hitMeta.statusType) this.applyStatus(hitMeta.statusType);
    if (hitMeta.source) this._lastAttacker = hitMeta.source;

    if (this.hp <= 0) {
      this._transitionTo(EnemyStates.DEAD);
      this._events.push({ type: 'kill', enemy: this, x: this.position.x, y: this.position.y });
      return true;
    }

    const shouldStagger = this._shouldStagger(hitMeta);
    if (shouldStagger) {
      this._knockback = knockback;
      this._transitionTo(EnemyStates.HURT);
    }
    this._clampToArena();
    return true;
  }

  /** Applies status damage without adding direct-hit stagger. */
  applyStatusDamage(amount, statusType) {
    if (this.state === EnemyStates.DEAD) return false;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this._transitionTo(EnemyStates.DEAD);
      this._events.push({ type: 'kill', enemy: this, x: this.position.x, y: this.position.y, statusType });
    }
    return true;
  }

  /** Applies or replaces a status effect on this enemy. */
  applyStatus(type) {
    if (this.statusEffects.apply(type) && type === StatusTypes.STUN) {
      if (this._isControlLocked()) return;
      this._transitionTo(EnemyStates.AGGRO);
    }
  }

  /** Freezes this enemy for the supplied duration. */
  freeze(seconds) {
    this._frozenTimer = Math.max(this._frozenTimer, seconds);
  }

  /** Returns the enemy's current body AABB for physical separation/debug only. */
  getBodyBounds() {
    return new Hitbox({
      x: this.position.x - this.config.width / 2,
      y: this.position.y - this.config.height / 2,
      width: this.config.width,
      height: this.config.height,
      owner: this,
      ownerTag: HitboxOwners.ENEMY,
    });
  }

  /** Returns the enemy's current body AABB for legacy debug callers. */
  getBounds() {
    return this.getBodyBounds();
  }

  /** Returns the enemy's damageable hurtbox. */
  getHurtbox() {
    if (this.state === EnemyStates.DEAD) return null;
    return this.getBodyBounds();
  }

  /** Nudges the enemy body during collision resolution without applying damage. */
  displace(dx, dy) {
    if (this.state === EnemyStates.DEAD) return;
    this.position.x += dx;
    this.position.y += dy;
    this._clampToArena();
  }

  /** Returns true once this enemy has entered the dead state. */
  isDead() {
    return this.state === EnemyStates.DEAD;
  }

  /** Returns true when death cleanup can remove this enemy from active lists. */
  canRemove() {
    return this.state === EnemyStates.DEAD && this._removeTimer <= 0;
  }

  /** Returns deterministic MVP rewards for this enemy type. */
  getRewards() {
    return {
      xp: this.config.xp || 10,
      essence: this.config.essence || 10,
    };
  }

  /** Returns and clears queued enemy events. */
  consumeEvents() {
    const events = this._events.slice();
    this._events.length = 0;
    return events;
  }

  _selectTarget(players, dt) {
    this._targetRefreshTimer = Math.max(0, this._targetRefreshTimer - dt);
    if (this._isValidTarget(this._target) && this._targetRefreshTimer > 0) return this._target;

    this._target = this._nearestTarget(players);
    this._targetRefreshTimer = this.type === EnemyTypes.RANGED
      ? RANGED_RETARGET_SECONDS
      : MELEE_RETARGET_SECONDS;
    return this._target;
  }

  _nearestTarget(players) {
    let best = null;
    let bestDistance = Infinity;
    for (const player of players) {
      if (!this._isValidTarget(player)) continue;
      const dx = Math.abs(this._targetX(player) - this.position.x);
      const dy = Math.abs(this._targetY(player) - this.position.y);
      let distance = dx + dy * 0.5;
      if (player === this._lastAttacker) distance *= 0.75;
      const hp = player.resources?.health ?? 9999;
      const bestHp = best?.resources?.health ?? 9999;
      if (distance < bestDistance || (Math.abs(distance - bestDistance) < 0.1 && hp < bestHp)) {
        best = player;
        bestDistance = distance;
      }
    }
    return best;
  }

  _isValidTarget(player) {
    return !!player && player.state !== PlayerStates.DEAD && player.state !== PlayerStates.DOWNED;
  }

  _distanceTo(target) {
    const dx = this._targetX(target) - this.position.x;
    const dy = this._targetY(target) - this.position.y;
    return Math.hypot(dx, dy);
  }

  _transitionTo(state) {
    if (this.state === state) return;
    this.state = state;
    this._stateElapsed = 0;
    this._hasAttacked = false;
    this.isTelegraphing = state === EnemyStates.TELEGRAPH;
    if (state === EnemyStates.WAIT) this._waitRetryTimer = WAIT_RETRY_SECONDS;
    if (
      state !== EnemyStates.TELEGRAPH &&
      state !== EnemyStates.ATTACK &&
      state !== EnemyStates.RECOVER
    ) {
      this._releaseAttackToken();
    }
  }

  _shouldAttack(player, distance) {
    if (this._cooldown > 0) return false;
    if (this.type === EnemyTypes.RANGED) {
      if (distance > this.config.preferredMax) return false;
      if (this._requestAttackToken()) return true;
      this._transitionTo(EnemyStates.WAIT);
      return false;
    }

    const dx = Math.abs(this._targetX(player) - this.position.x);
    const dy = Math.abs(this._targetY(player) - this.position.y);
    if (dx > this.attackRange || dy > MELEE_Y_TOLERANCE) return false;
    if (this._requestAttackToken()) return true;
    this._transitionTo(EnemyStates.WAIT);
    return false;
  }

  _isControlLocked() {
    return this._frozenTimer > 0 || this.statusEffects.isStunned();
  }

  _updatePatrol(dt) {
    const speed = this.patrolSpeed * this.statusEffects.getSpeedMultiplier();
    this.position.x += this.facing * speed * dt;
    const minX = Math.max(this._patrolMinX, centerMinX(this.config.width));
    const maxX = Math.min(this._patrolMaxX, centerMaxX(this.config.width));
    if (this.position.x <= minX) this.facing = 1;
    if (this.position.x >= maxX) this.facing = -1;
    this.position.x = clamp(this.position.x, minX, maxX);
  }

  _updateAggro(dt, player, distance) {
    if (this.type === EnemyTypes.RANGED) {
      this._updateRangedSpacing(dt, player, distance);
      return;
    }

    this._moveTowardSlot(dt, player, this.speed);
  }

  _updateWait(dt, player, distance) {
    this._waitRetryTimer = Math.max(0, this._waitRetryTimer - dt);
    if (distance > this.aggroRange) {
      this._transitionTo(EnemyStates.PATROL);
      return;
    }

    if (this._waitRetryTimer <= 0 && this._shouldAttack(player, distance)) {
      this._transitionTo(EnemyStates.TELEGRAPH);
      return;
    }

    const speed = this.patrolSpeed * 1.15;
    if (this.type === EnemyTypes.RANGED) {
      this._strafeVertical(dt, player, speed);
    } else {
      this._moveTowardSlot(dt, player, speed);
    }
  }

  _updateRangedSpacing(dt, player, distance) {
    const dx = this._targetX(player) - this.position.x;
    this.facing = dx >= 0 ? 1 : -1;
    this._strafeTimer = Math.max(0, this._strafeTimer - dt);
    if (this._strafeTimer <= 0) {
      this._strafeDirection *= -1;
      this._strafeTimer = RANGED_STRAFE_SECONDS;
    }

    if (distance < this.config.retreatRange) {
      if (this._atHorizontalBoundary()) {
        this._strafeVertical(dt, player, this.speed * 1.25);
        return;
      }
      this._moveAway(dt, player, this.speed * 1.25);
    } else if (distance > this.config.preferredMax) {
      this._moveTowardSlot(dt, player, this.speed);
    } else if (this._cooldown <= 0) {
      this._transitionTo(this._requestAttackToken() ? EnemyStates.TELEGRAPH : EnemyStates.WAIT);
    } else {
      this._strafeVertical(dt, player, this.speed);
      if (Math.abs(dx) < this.config.preferredMin) {
        const scaledSpeed = this.speed * this.statusEffects.getSpeedMultiplier();
        this.position.x -= this.facing * scaledSpeed * dt * 0.35;
      }
    }
  }

  _updateTelegraph(player) {
    const dx = this._targetX(player) - this.position.x;
    this.facing = dx >= 0 ? 1 : -1;
    if (this._stateElapsed >= this.config.telegraph) {
      this._transitionTo(EnemyStates.ATTACK);
    }
  }

  _updateAttack(player) {
    if (!this._hasAttacked) {
      this._hasAttacked = true;
      if (this.type === EnemyTypes.RANGED) {
        this._events.push(this._createProjectileEvent(player));
      } else {
        this._events.push({ type: 'hitbox', hitbox: this._createMeleeHitbox() });
      }
    }

    if (this._stateElapsed >= this.config.attackLife) {
      this._cooldown = this.config.cooldown;
      this._transitionTo(EnemyStates.RECOVER);
    }
  }

  _updateHurt(dt) {
    this.position.x += this._knockback.x * dt;
    this.position.y += this._knockback.y * dt * BASE_Y_SCALE;
    this._knockback.x *= 0.78;
    this._knockback.y *= 0.78;

    if (this._stateElapsed >= 0.12) {
      this._transitionTo(EnemyStates.AGGRO);
    }
  }

  _moveToward(dt, target, speed) {
    const dx = this._targetX(target) - this.position.x;
    const dy = this._targetY(target) - this.position.y;
    const len = Math.hypot(dx, dy) || 1;
    const scaledSpeed = speed * this.statusEffects.getSpeedMultiplier();

    this.facing = dx >= 0 ? 1 : -1;
    this.position.x += (dx / len) * scaledSpeed * dt;
    this.position.y += (dy / len) * scaledSpeed * dt * BASE_Y_SCALE;
  }

  _moveTowardSlot(dt, target, speed) {
    const desiredX = this._slotX(target);
    const desiredY = this._slotY(target);
    const dx = desiredX - this.position.x;
    const dy = desiredY - this.position.y;
    const len = Math.hypot(dx, dy) || 1;
    const scaledSpeed = speed * this.statusEffects.getSpeedMultiplier();

    this.facing = this._targetX(target) >= this.position.x ? 1 : -1;
    this.position.x += (dx / len) * scaledSpeed * dt;
    this.position.y += (dy / len) * scaledSpeed * dt * BASE_Y_SCALE;
  }

  _moveAway(dt, target, speed) {
    const dx = this.position.x - this._targetX(target);
    const dy = this.position.y - this._targetY(target);
    const len = Math.hypot(dx, dy) || 1;
    const scaledSpeed = speed * this.statusEffects.getSpeedMultiplier();

    this.facing = dx >= 0 ? -1 : 1;
    this.position.x += (dx / len) * scaledSpeed * dt;
    this.position.y += (dy / len) * scaledSpeed * dt * BASE_Y_SCALE;
  }

  _strafeVertical(dt, target, speed) {
    const scaledSpeed = speed * this.statusEffects.getSpeedMultiplier();
    const desiredY = this._slotY(target);
    const edgePadding = 0.08;
    if (this.position.y <= centerMinY(this.config.height) + edgePadding) this._strafeDirection = 1;
    if (this.position.y >= centerMaxY(this.config.height) - edgePadding) this._strafeDirection = -1;

    const dy = desiredY - this.position.y;
    const lanePull = Math.abs(dy) > 0.75 ? Math.sign(dy) : this._strafeDirection;
    this.position.y += lanePull * scaledSpeed * dt * BASE_Y_SCALE;
  }

  _slotX(target) {
    const targetX = this._targetX(target);
    const side = this.position.x >= targetX ? 1 : -1;

    if (this.type === EnemyTypes.RANGED) {
      const range = (this.config.preferredMin + this.config.preferredMax) * 0.5;
      return clamp(targetX + side * range, centerMinX(this.config.width), centerMaxX(this.config.width));
    }

    const distance = this.type === EnemyTypes.GRUNT
      ? Math.max(0.85, this.attackRange * 0.78)
      : Math.max(1.25, this.attackRange * 0.86);
    return clamp(targetX + side * distance, centerMinX(this.config.width), centerMaxX(this.config.width));
  }

  _slotY(target) {
    return clamp(
      this._targetY(target) + this._laneOffset,
      centerMinY(this.config.height),
      centerMaxY(this.config.height)
    );
  }

  _laneOffsetForType() {
    if (this.type === EnemyTypes.BRUISER || this.type === EnemyTypes.FIRE_BRUISER) {
      return (this.id % 2 === 0 ? 1 : -1) * 0.65;
    }
    if (this.type === EnemyTypes.RANGED) {
      return ((this.id % 3) - 1) * 0.55;
    }
    return ((this.id % 3) - 1) * LANE_SPACING;
  }

  _atHorizontalBoundary() {
    const minX = centerMinX(this.config.width);
    const maxX = centerMaxX(this.config.width);
    return this.position.x <= minX + 0.08 || this.position.x >= maxX - 0.08;
  }

  _requestAttackToken() {
    if (this._hasAttackToken) return true;
    if (!this._aiContext?.requestAttackToken) return true;
    const granted = this._aiContext.requestAttackToken(this);
    this._hasAttackToken = granted;
    if (!granted) this._waitRetryTimer = WAIT_RETRY_SECONDS;
    return granted;
  }

  _releaseAttackToken() {
    if (!this._hasAttackToken) return;
    this._hasAttackToken = false;
    this._aiContext?.releaseAttackToken?.(this);
  }

  _clampToArena() {
    clampCenterToVisibleArena(this.position, this.config.width, this.config.height);
    if (this.position.x <= centerMinX(this.config.width)) this.facing = 1;
    if (this.position.x >= centerMaxX(this.config.width)) this.facing = -1;
  }

  _createMeleeHitbox() {
    const width = this.config.hitboxWidth || this.attackRange;
    const height = this.config.hitboxHeight || BODY_HEIGHT;
    const x = this.facing > 0
      ? this.position.x + BODY_WIDTH / 2
      : this.position.x - BODY_WIDTH / 2 - width;

    return new Hitbox({
      x,
      y: this.position.y - height / 2,
      width,
      height,
      damage: this.attackDamage,
      knockbackX: this.facing * (this.type === EnemyTypes.GRUNT ? 2.2 : 3.5),
      knockbackY: 0.4,
      owner: this,
      ownerTag: HitboxOwners.ENEMY,
      targetTag: HitboxOwners.PLAYER,
      lifetime: this.config.attackLife,
      attackId: this.id * 1000 + Math.floor(this._stateElapsed * 60),
      attackType: this.type === EnemyTypes.GRUNT ? 'swipe' : 'slam',
    });
  }

  _createProjectileEvent(player) {
    const dx = this._targetX(player) - this.position.x;
    const dy = this._targetY(player) - this.position.y;
    const len = Math.hypot(dx, dy) || 1;

    return {
      type: 'projectile',
      owner: this,
      x: this.position.x + this.facing * 0.45,
      y: this.position.y,
      vx: (dx / len) * 4.5,
      vy: (dy / len) * 4.5,
      damage: this.attackDamage,
    };
  }

  _shouldStagger(hitMeta) {
    if (this.type !== EnemyTypes.BRUISER && this.type !== EnemyTypes.FIRE_BRUISER) return true;
    return hitMeta.attackType === 'heavy' || hitMeta.comboCount >= 3;
  }

  _targetX(target) {
    return target.combatCenterX ?? target.position.x;
  }

  _targetY(target) {
    return target.combatCenterY ?? target.position.y;
  }
}
