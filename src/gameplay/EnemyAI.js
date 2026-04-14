import { Hitbox, HitboxOwners } from './Hitbox.js';
import { PlayerStates } from './PlayerState.js';
import { StatusEffects, StatusTypes } from './StatusEffects.js';

const BASE_Y_SCALE = 0.4;
const BODY_WIDTH = 0.8;
const BODY_HEIGHT = 1.1;

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
  HURT: 'HURT',
  DEAD: 'DEAD',
};

const ENEMY_CONFIGS = {
  [EnemyTypes.GRUNT]: {
    hp: 100,
    width: 0.8,
    height: 1.1,
    speed: 1.7,
    patrolSpeed: 0.7,
    attackDamage: 10,
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
    hp: 70,
    width: 0.7,
    height: 1.05,
    speed: 1.35,
    patrolSpeed: 0.55,
    attackDamage: 8,
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
    hp: 200,
    width: 1.3,
    height: 1.7,
    speed: 0.95,
    patrolSpeed: 0.35,
    attackDamage: 25,
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
    hp: 300,
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
    this._events = [];
  }

  /** Advances this enemy and returns spawned combat events. */
  update(dt, players) {
    this._events.length = 0;
    this._events.push(...this.statusEffects.update(dt, this));

    if (this.state === EnemyStates.DEAD) {
      this._removeTimer = Math.max(0, this._removeTimer - dt);
      return this.consumeEvents();
    }

    if (this._isControlLocked()) {
      this._frozenTimer = Math.max(0, this._frozenTimer - dt);
      this.isTelegraphing = false;
      return this.consumeEvents();
    }

    if (this._cooldown > 0) this._cooldown = Math.max(0, this._cooldown - dt);
    const player = this._nearestTarget(players);
    if (!player) return this.consumeEvents();

    this._stateElapsed += dt;
    this.isTelegraphing = this.state === EnemyStates.TELEGRAPH;

    if (this.state === EnemyStates.HURT) {
      this._updateHurt(dt);
      return this.consumeEvents();
    }

    const distance = this._distanceTo(player);
    if (this.state !== EnemyStates.TELEGRAPH && this.state !== EnemyStates.ATTACK) {
      if (this._shouldAttack(distance)) {
        this._transitionTo(EnemyStates.TELEGRAPH);
      } else if (distance <= this.aggroRange) {
        this._transitionTo(EnemyStates.AGGRO);
      } else if (this.state !== EnemyStates.PATROL && this.state !== EnemyStates.IDLE) {
        this._transitionTo(EnemyStates.PATROL);
      }
    }

    if (this.state === EnemyStates.PATROL || this.state === EnemyStates.IDLE) {
      this._updatePatrol(dt);
    } else if (this.state === EnemyStates.AGGRO) {
      this._updateAggro(dt, player, distance);
    } else if (this.state === EnemyStates.TELEGRAPH) {
      this._updateTelegraph(player);
    } else if (this.state === EnemyStates.ATTACK) {
      this._updateAttack(player);
    } else if (this.state === EnemyStates.RECOVER && this._stateElapsed >= 0.25) {
      this._transitionTo(distance <= this.aggroRange ? EnemyStates.AGGRO : EnemyStates.PATROL);
    }

    return this.consumeEvents();
  }

  /** Applies damage, knockback, and type-specific stagger rules. */
  takeDamage(amount, knockback = { x: 0, y: 0 }, hitMeta = {}) {
    if (this.state === EnemyStates.DEAD) return false;

    this.hp = Math.max(0, this.hp - amount);

    if (hitMeta.statusType) this.applyStatus(hitMeta.statusType);

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
  }

  /** Returns true once this enemy has entered the dead state. */
  isDead() {
    return this.state === EnemyStates.DEAD;
  }

  /** Returns true when death cleanup can remove this enemy from active lists. */
  canRemove() {
    return this.state === EnemyStates.DEAD && this._removeTimer <= 0;
  }

  /** Returns and clears queued enemy events. */
  consumeEvents() {
    const events = this._events.slice();
    this._events.length = 0;
    return events;
  }

  _nearestTarget(players) {
    let best = null;
    let bestDistance = Infinity;
    for (const player of players) {
      if (player.state === PlayerStates.DEAD) continue;
      const distance = this._distanceTo(player);
      if (distance < bestDistance) {
        best = player;
        bestDistance = distance;
      }
    }
    return best;
  }

  _distanceTo(target) {
    const dx = target.position.x - this.position.x;
    const dy = target.position.y - this.position.y;
    return Math.hypot(dx, dy);
  }

  _transitionTo(state) {
    if (this.state === state) return;
    this.state = state;
    this._stateElapsed = 0;
    this._hasAttacked = false;
    this.isTelegraphing = state === EnemyStates.TELEGRAPH;
  }

  _shouldAttack(distance) {
    if (this._cooldown > 0) return false;
    if (this.type === EnemyTypes.RANGED) {
      return distance <= this.config.preferredMax;
    }
    return distance <= this.attackRange;
  }

  _isControlLocked() {
    return this._frozenTimer > 0 || this.statusEffects.isStunned();
  }

  _updatePatrol(dt) {
    const speed = this.patrolSpeed * this.statusEffects.getSpeedMultiplier();
    this.position.x += this.facing * speed * dt;
    if (this.position.x <= this._patrolMinX) this.facing = 1;
    if (this.position.x >= this._patrolMaxX) this.facing = -1;
  }

  _updateAggro(dt, player, distance) {
    if (this.type === EnemyTypes.RANGED) {
      this._updateRangedSpacing(dt, player, distance);
      return;
    }

    this._moveToward(dt, player, this.speed);
  }

  _updateRangedSpacing(dt, player, distance) {
    const dx = player.position.x - this.position.x;
    this.facing = dx >= 0 ? 1 : -1;

    if (distance < this.config.retreatRange) {
      this._moveAway(dt, player, this.speed * 1.25);
    } else if (distance > this.config.preferredMax) {
      this._moveToward(dt, player, this.speed);
    } else if (this._cooldown <= 0) {
      this._transitionTo(EnemyStates.TELEGRAPH);
    }
  }

  _updateTelegraph(player) {
    const dx = player.position.x - this.position.x;
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
    const dx = target.position.x - this.position.x;
    const dy = target.position.y - this.position.y;
    const len = Math.hypot(dx, dy) || 1;
    const scaledSpeed = speed * this.statusEffects.getSpeedMultiplier();

    this.facing = dx >= 0 ? 1 : -1;
    this.position.x += (dx / len) * scaledSpeed * dt;
    this.position.y += (dy / len) * scaledSpeed * dt * BASE_Y_SCALE;
  }

  _moveAway(dt, target, speed) {
    const dx = this.position.x - target.position.x;
    const dy = this.position.y - target.position.y;
    const len = Math.hypot(dx, dy) || 1;
    const scaledSpeed = speed * this.statusEffects.getSpeedMultiplier();

    this.facing = dx >= 0 ? -1 : 1;
    this.position.x += (dx / len) * scaledSpeed * dt;
    this.position.y += (dy / len) * scaledSpeed * dt * BASE_Y_SCALE;
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
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
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
}
