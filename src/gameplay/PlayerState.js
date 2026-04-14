import * as THREE from 'three';
import { ORTHO_WIDTH, ORTHO_HEIGHT } from '../engine/Renderer.js';
import { Hitbox, HitboxOwners } from './Hitbox.js';

const TICK = 1 / 60;
const PLAYER_WIDTH = 0.8;
const PLAYER_HEIGHT = 1.2;
const BASE_Y_SCALE = 0.4;
const ATTACK_BODY_GAP = 0.08;

export const PlayerStates = {
  IDLE: 'IDLE',
  MOVE: 'MOVE',
  ATTACK_LIGHT: 'ATTACK_LIGHT',
  ATTACK_HEAVY: 'ATTACK_HEAVY',
  DODGE: 'DODGE',
  HURT: 'HURT',
  DEAD: 'DEAD',
};

const STATE_DURATIONS = {
  [PlayerStates.ATTACK_LIGHT]: 10 * TICK,
  [PlayerStates.ATTACK_HEAVY]: 18 * TICK,
  [PlayerStates.DODGE]: 18 * TICK,
  [PlayerStates.HURT]: 10 * TICK,
  [PlayerStates.DEAD]: 24 * TICK,
};

export const PlayerAttackSpecs = {
  [PlayerStates.ATTACK_LIGHT]: {
    damage: 16,
    radius: 1.2,
    activeStart: 4 * TICK,
    activeLife: 0.1,
    lifetime: 0.1,
    arcCos: 0.35,
    knockbackX: 2.5,
    knockbackY: 0.5,
  },
  [PlayerStates.ATTACK_HEAVY]: {
    damage: 32,
    radius: 1.8,
    activeStart: 8 * TICK,
    activeLife: 0.15,
    lifetime: 0.15,
    arcCos: -0.2,
    knockbackX: 4,
    knockbackY: 0.7,
  },
};

export class PlayerState {
  /** Creates the player state machine and its placeholder mesh. */
  constructor(scene, resources) {
    this.resources = resources;
    this.state = PlayerStates.IDLE;
    this.position = { x: 0, y: -2.2 };
    this.velocity = { x: 0, y: 0 };
    this.facing = 1;
    this.moveSpeed = 5;

    this._stateElapsed = 0;
    this._stateDuration = 0;
    this._dodgeDirection = { x: 1, y: 0 };
    this._dodgeSpeed = 12;
    this._dodgeIFrameTimer = 0;
    this._dodgeCooldownTimer = 0;
    this._attackId = 0;
    this._knockback = { x: 0, y: 0 };
    this._visualTime = 0;
    this._attackSpeedMultiplier = 1;
    this._rapidStrikeTimer = 0;

    const geo = new THREE.BoxGeometry(PLAYER_WIDTH, PLAYER_HEIGHT, 0.4);
    this._baseMaterial = new THREE.MeshLambertMaterial({ color: 0x9b59b6 });
    this.mesh = new THREE.Mesh(geo, this._baseMaterial);
    this.mesh.position.set(this.position.x, this.position.y, 0);
    scene.add(this.mesh);
  }

  /** Advances movement, state timers, resources, and placeholder animation. */
  update(dt, input) {
    this._visualTime += dt;
    this.resources.update(dt);

    if (this._rapidStrikeTimer > 0) {
      this._rapidStrikeTimer = Math.max(0, this._rapidStrikeTimer - dt);
      if (this._rapidStrikeTimer <= 0) this._attackSpeedMultiplier = 1;
    }

    if (this._dodgeCooldownTimer > 0) {
      this._dodgeCooldownTimer = Math.max(0, this._dodgeCooldownTimer - dt);
    }
    if (this._dodgeIFrameTimer > 0) {
      this._dodgeIFrameTimer = Math.max(0, this._dodgeIFrameTimer - dt);
    }

    if (this.state === PlayerStates.DEAD) {
      this._updateTimedState(dt, input);
      this._syncMesh();
      return;
    }

    if (this.state === PlayerStates.IDLE || this.state === PlayerStates.MOVE) {
      this._updateFreeMovement(dt, input.moveVector);
    } else if (this.state === PlayerStates.DODGE) {
      this._updateDodge(dt);
      this._updateTimedState(dt, input);
    } else if (this.state === PlayerStates.HURT) {
      this._updateKnockback(dt);
      this._updateTimedState(dt, input);
    } else {
      this._updateTimedState(dt, input);
    }

    this._clampToArena();
    this._syncMesh();
  }

  /** Changes state and applies transition options such as dodge direction. */
  transitionTo(state, options = {}) {
    if (this.state === PlayerStates.DEAD) return false;
    if (this.state === PlayerStates.DODGE && state !== PlayerStates.DEAD && !options.force) return false;

    this.state = state;
    this._stateElapsed = 0;
    this._stateDuration = STATE_DURATIONS[state] || 0;

    if (state === PlayerStates.ATTACK_LIGHT || state === PlayerStates.ATTACK_HEAVY) {
      this._attackId += 1;
      this._stateDuration /= this._attackSpeedMultiplier;
    }

    if (state === PlayerStates.DODGE) {
      const dir = options.direction || this._dodgeDirection;
      const len = Math.hypot(dir.x, dir.y);
      this._dodgeDirection = len > 0
        ? { x: dir.x / len, y: dir.y / len }
        : { x: this.facing, y: 0 };
      this._dodgeIFrameTimer = 12 * TICK;
      this._dodgeCooldownTimer = 48 * TICK;
    }

    if (state === PlayerStates.HURT) {
      this._knockback = options.knockback || { x: 0, y: 0 };
    }

    if (state === PlayerStates.DEAD) {
      this._dodgeIFrameTimer = 0;
    }

    return true;
  }

  /** Applies damage and enters hurt or dead state unless i-frames are active. */
  takeDamage(amount, knockback = { x: 0, y: 0 }) {
    if (this.isInvincible() || this.state === PlayerStates.DEAD) return false;

    const alive = this.resources.takeDamage(amount);
    this.transitionTo(alive ? PlayerStates.HURT : PlayerStates.DEAD, { knockback });
    return true;
  }

  /** Returns true while dodge invincibility frames are active. */
  isInvincible() {
    return this._dodgeIFrameTimer > 0;
  }

  /** Returns the player's current body AABB for physical separation/debug only. */
  getBodyBounds() {
    return new Hitbox({
      x: this.position.x - PLAYER_WIDTH / 2,
      y: this.position.y - PLAYER_HEIGHT / 2,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      owner: this,
      ownerTag: HitboxOwners.PLAYER,
    });
  }

  /** Returns the player's current body AABB for legacy debug callers. */
  getBounds() {
    return this.getBodyBounds();
  }

  /** Returns the player's damageable hurtbox, or null during i-frames. */
  getHurtbox() {
    if (this.isInvincible() || this.state === PlayerStates.DEAD) return null;
    return this.getBodyBounds();
  }

  /** Returns the current attack spec used by CombatController damage hitboxes. */
  getAttackSpec() {
    const spec = PlayerAttackSpecs[this.state];
    if (!spec) return null;
    if (this._stateElapsed < spec.activeStart || this._stateElapsed >= spec.activeStart + spec.activeLife) {
      return null;
    }
    return { ...spec, lifetime: spec.activeLife };
  }

  /** Returns a debug-only attack AABB, or null when no attack is active. */
  getAttackHitbox() {
    const spec = this.getAttackSpec();
    if (!spec) return null;

    const width = spec.radius;
    const height = this.state === PlayerStates.ATTACK_HEAVY ? 1.4 : 0.9;
    const bodyEdgeX = this.position.x + this.facing * (PLAYER_WIDTH / 2 + ATTACK_BODY_GAP);
    const x = this.facing > 0 ? bodyEdgeX : bodyEdgeX - width;

    return new Hitbox({
      x,
      y: this.position.y - height / 2,
      width,
      height,
      damage: spec.damage,
      knockbackX: this.facing * spec.knockbackX,
      knockbackY: spec.knockbackY,
      owner: this,
      ownerTag: HitboxOwners.PLAYER,
    });
  }

  /** Returns true when dodge is available and enough stamina exists. */
  canDodge(staminaCost) {
    return this._dodgeCooldownTimer <= 0 && this.resources.stamina >= staminaCost;
  }

  /** Returns true when the current state is an attack state. */
  isAttacking() {
    return this.state === PlayerStates.ATTACK_LIGHT || this.state === PlayerStates.ATTACK_HEAVY;
  }

  /** Returns the current attack sequence id for one-hit-per-swing tracking. */
  get attackId() {
    return this._attackId;
  }

  /** Blinks to the far side of the target while staying inside arena bounds. */
  blinkBehind(target) {
    if (!target) return false;
    const side = target.position.x >= this.position.x ? 1 : -1;
    this.position.x = target.position.x + side * 0.9;
    this.position.y = target.position.y;
    this.facing = -side;
    this._clampToArena();
    this._syncMesh();
    return true;
  }

  /** Enables rapid-strike attack speed for a fixed duration. */
  setRapidStrike(seconds) {
    this._rapidStrikeTimer = Math.max(this._rapidStrikeTimer, seconds);
    this._attackSpeedMultiplier = 2;
  }

  /** Nudges the player body during collision resolution without applying damage. */
  displace(dx, dy) {
    if (this.state === PlayerStates.DEAD) return;
    this.position.x += dx;
    this.position.y += dy;
    this._clampToArena();
    this._syncMesh();
  }

  _updateFreeMovement(dt, moveVector) {
    if (moveVector.x !== 0) this.facing = Math.sign(moveVector.x);

    this.position.x += moveVector.x * this.moveSpeed * dt;
    this.position.y += moveVector.y * this.moveSpeed * dt * BASE_Y_SCALE;
    this.state = moveVector.x !== 0 || moveVector.y !== 0 ? PlayerStates.MOVE : PlayerStates.IDLE;
  }

  _updateDodge(dt) {
    this.position.x += this._dodgeDirection.x * this._dodgeSpeed * dt;
    this.position.y += this._dodgeDirection.y * this._dodgeSpeed * dt * BASE_Y_SCALE;
    if (this._dodgeDirection.x !== 0) this.facing = Math.sign(this._dodgeDirection.x);
  }

  _updateKnockback(dt) {
    this.position.x += this._knockback.x * dt;
    this.position.y += this._knockback.y * dt * BASE_Y_SCALE;
    this._knockback.x *= 0.82;
    this._knockback.y *= 0.82;
  }

  _updateTimedState(dt, input) {
    this._stateElapsed += dt;
    if (this._stateDuration <= 0 || this._stateElapsed < this._stateDuration) return;

    const mv = input.moveVector;
    this.transitionTo(mv.x !== 0 || mv.y !== 0 ? PlayerStates.MOVE : PlayerStates.IDLE, { force: true });
  }

  _clampToArena() {
    const hw = ORTHO_WIDTH / 2 - PLAYER_WIDTH / 2;
    const hh = ORTHO_HEIGHT / 2 - PLAYER_HEIGHT / 2;
    this.position.x = Math.max(-hw, Math.min(hw, this.position.x));
    this.position.y = Math.max(-hh, Math.min(hh, this.position.y));
  }

  _syncMesh() {
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;
    this.mesh.position.z = -this.position.y * 0.01;
    this.mesh.scale.set(1, 1, 1);
    this.mesh.rotation.z = 0;
    this.mesh.material.color.setHex(0x9b59b6);

    if (this.state === PlayerStates.IDLE) {
      this.mesh.position.y += Math.sin(this._visualTime * Math.PI * 2) * 0.05;
    } else if (this.state === PlayerStates.MOVE) {
      this.mesh.rotation.z = this.facing * -0.08;
    } else if (this.state === PlayerStates.ATTACK_LIGHT) {
      this.mesh.scale.x = this._attackScale(1.3);
      this.mesh.material.color.setHex(0xffffff);
    } else if (this.state === PlayerStates.ATTACK_HEAVY) {
      const scale = this._attackScale(1.5);
      this.mesh.scale.set(scale, scale, 1);
      this.mesh.material.color.setHex(0xffe066);
    } else if (this.state === PlayerStates.DODGE) {
      this.mesh.rotation.z = this._dodgeDirection.x * -0.25;
      this.mesh.scale.set(1.15, 0.85, 1);
      this.mesh.material.color.setHex(0x48f7ff);
    } else if (this.state === PlayerStates.HURT) {
      const shake = Math.sin(this._stateElapsed * 220) * 0.1;
      this.mesh.position.x += shake;
      this.mesh.material.color.setHex(0xff5555);
    } else if (this.state === PlayerStates.DEAD) {
      const t = Math.min(1, this._stateElapsed / STATE_DURATIONS[PlayerStates.DEAD]);
      this.mesh.scale.y = Math.max(0.05, 1 - t);
      this.mesh.material.color.setHex(0x333333);
    }
  }

  _attackScale(maxScale) {
    const progress = this._stateDuration > 0
      ? Math.min(1, this._stateElapsed / this._stateDuration)
      : 0;
    const pulse = 1 - Math.abs(progress * 2 - 1);
    return 1 + (maxScale - 1) * pulse;
  }
}
