import * as THREE from 'three';
import { Hitbox, HitboxOwners } from './Hitbox.js';
import { ySortHunterMesh } from '../visuals/HunterMeshes.js';
import { clampBottomToVisibleArena } from './ArenaBounds.js';

const TICK = 1 / 60;
const PLAYER_WIDTH = 0.8;
const PLAYER_HEIGHT = 1.2;
const BASE_Y_SCALE = 0.4;
const ATTACK_BODY_GAP = 0.08;
const SPEED_TO_WORLD_UNITS = 64;
const DOWNED_SECONDS = 8;
const LIGHT_COMBO_WINDOW = 0.55;
const JUMP_HEIGHT = 2.5;

export const PlayerStates = {
  IDLE: 'IDLE',
  MOVE: 'MOVE',
  ATTACK_LIGHT: 'ATTACK_LIGHT',
  ATTACK_HEAVY: 'ATTACK_HEAVY',
  SPELL_MINOR: 'SPELL_MINOR',
  SPELL_ADVANCED: 'SPELL_ADVANCED',
  ULTIMATE: 'ULTIMATE',
  JUMP: 'JUMP',
  DODGE: 'DODGE',
  HURT: 'HURT',
  DOWNED: 'DOWNED',
  REVIVE: 'REVIVE',
  DEAD: 'DEAD',
};

const STATE_DURATIONS = {
  [PlayerStates.ATTACK_LIGHT]: 10 * TICK,
  [PlayerStates.ATTACK_HEAVY]: 18 * TICK,
  [PlayerStates.SPELL_MINOR]: 14 * TICK,
  [PlayerStates.SPELL_ADVANCED]: 24 * TICK,
  [PlayerStates.ULTIMATE]: 60 * TICK,
  [PlayerStates.JUMP]: 30 * TICK,
  [PlayerStates.DODGE]: 18 * TICK,
  [PlayerStates.HURT]: 10 * TICK,
  [PlayerStates.REVIVE]: 18 * TICK,
  [PlayerStates.DEAD]: 24 * TICK,
};

export const PlayerAttackSpecs = {
  [PlayerStates.ATTACK_LIGHT]: {
    radius: 1.2,
    activeStart: 4 * TICK,
    activeLife: 0.1,
    lifetime: 0.1,
    arcCos: 0.35,
    knockbackX: 2.5,
    knockbackY: 0.5,
  },
  [PlayerStates.ATTACK_HEAVY]: {
    radius: 1.8,
    activeStart: 8 * TICK,
    activeLife: 0.15,
    lifetime: 0.15,
    arcCos: -0.2,
    knockbackX: 4,
    knockbackY: 0.7,
  },
};

const DEFAULT_HUNTER_CONFIG = {
  id: 'dabik',
  label: 'Dabik',
  hp: 900,
  mana: 120,
  speed: 320,
  lightDamage: 18,
  heavyDamage: 42,
  dodgeIFrames: 12,
  statusType: 'BLEED',
  auraColor: 0x9b59b6,
};

export class PlayerState {
  /** Creates the player state machine and its placeholder mesh. */
  constructor(scene, resources, options = {}) {
    this.id = options.playerIndex || 0;
    this.playerIndex = options.playerIndex || 0;
    this.hunterConfig = options.hunterConfig || DEFAULT_HUNTER_CONFIG;
    this.runPlayer = options.runPlayer || null;
    this.resources = resources;
    this.state = PlayerStates.IDLE;
    this.isDown = false;
    this.downTimer = 0;
    this.isEliminated = false;
    this._coOpEnabled = false;
    this.position = { x: options.x ?? 0, y: options.y ?? -2.2 };
    this.velocity = { x: 0, y: 0 };
    this.facing = 1;
    this.baseMoveSpeed = this.hunterConfig.speed / SPEED_TO_WORLD_UNITS;
    this.moveSpeed = this.baseMoveSpeed;

    this._stateElapsed = 0;
    this._stateDuration = 0;
    this._dodgeDirection = { x: 1, y: 0 };
    this._dodgeSpeed = 12;
    this._dodgeIFrameTimer = 0;
    this._dodgeCooldownTimer = 0;
    this._jumpLift = 0;
    this._attackId = 0;
    this._knockback = { x: 0, y: 0 };
    this._visualTime = 0;
    this._attackSpeedMultiplier = 1;
    this._rapidStrikeTimer = 0;
    this._speedMultiplierTimer = 0;
    this._speedMultiplier = 1;
    this._bonusInvincibleTimer = 0;
    this._stormSurgeTimer = 0;
    this._lightComboStep = 0;
    this._lightComboTimer = 0;
    this._animationRevision = 0;

    this.mesh = options.mesh || this._createFallbackMesh();
    this._visualBody = this.mesh.userData?.bodyMesh || this.mesh;
    this._baseMaterial = this._visualBody.material || null;
    this.mesh.position.set(this.position.x, this.position.y, 0);
    if (!this.mesh.parent) scene.add(this.mesh);
  }

  /** Advances movement, state timers, resources, and placeholder animation. */
  update(dt, input) {
    this._visualTime += dt;
    if (this.state !== PlayerStates.DEAD && this.state !== PlayerStates.DOWNED) {
      this.resources.update(dt);
    }

    if (this._lightComboTimer > 0) {
      this._lightComboTimer = Math.max(0, this._lightComboTimer - dt);
      if (this._lightComboTimer <= 0) this._lightComboStep = 0;
    }

    if (this._rapidStrikeTimer > 0) {
      this._rapidStrikeTimer = Math.max(0, this._rapidStrikeTimer - dt);
      if (this._rapidStrikeTimer <= 0) this._attackSpeedMultiplier = 1;
    }
    if (this._speedMultiplierTimer > 0) {
      this._speedMultiplierTimer = Math.max(0, this._speedMultiplierTimer - dt);
      if (this._speedMultiplierTimer <= 0) this._speedMultiplier = 1;
    }
    if (this._bonusInvincibleTimer > 0) {
      this._bonusInvincibleTimer = Math.max(0, this._bonusInvincibleTimer - dt);
    }
    if (this._stormSurgeTimer > 0) {
      this._stormSurgeTimer = Math.max(0, this._stormSurgeTimer - dt);
    }

    if (this._dodgeCooldownTimer > 0) {
      this._dodgeCooldownTimer = Math.max(0, this._dodgeCooldownTimer - dt);
    }
    if (this._dodgeIFrameTimer > 0) {
      this._dodgeIFrameTimer = Math.max(0, this._dodgeIFrameTimer - dt);
    }

    if (this.state === PlayerStates.DEAD || this.state === PlayerStates.DOWNED) {
      if (this.state === PlayerStates.DOWNED) {
        this.downTimer = Math.max(0, this.downTimer - dt);
        if (this.downTimer <= 0) {
          this.isEliminated = true;
          this.isDown = true;
          this.transitionTo(PlayerStates.DEAD, { force: true });
        }
      }
      this._updateTimedState(dt, input);
      this._syncMesh();
      return;
    }

    if (this.state === PlayerStates.IDLE || this.state === PlayerStates.MOVE) {
      this._updateFreeMovement(dt, input.moveVector);
    } else if (this.state === PlayerStates.JUMP) {
      this._updateJump(dt, input.moveVector);
      this._updateTimedState(dt, input);
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
    if (this.state === PlayerStates.DOWNED && state !== PlayerStates.REVIVE && state !== PlayerStates.DEAD) return false;
    if (this.state === PlayerStates.HURT && state !== PlayerStates.DEAD && !options.force) return false;
    if (this.state === PlayerStates.ULTIMATE && state !== PlayerStates.DEAD && !options.force) return false;
    if (this.state === PlayerStates.DODGE && state !== PlayerStates.DEAD && !options.force) return false;
    if (this._isCommittedState() && state !== PlayerStates.DEAD && state !== PlayerStates.HURT && !options.force) return false;

    this.state = state;
    this._animationRevision += 1;
    this._stateElapsed = 0;
    this._stateDuration = STATE_DURATIONS[state] || 0;

    if (state === PlayerStates.ATTACK_LIGHT || state === PlayerStates.ATTACK_HEAVY) {
      this._attackId += 1;
      this._stateDuration /= this._attackSpeedMultiplier;
    }

    if (state !== PlayerStates.JUMP) {
      this._jumpLift = 0;
    }

    if (state === PlayerStates.ATTACK_LIGHT) {
      this._lightComboStep = this._lightComboTimer > 0
        ? (this._lightComboStep % 3) + 1
        : 1;
      this._lightComboTimer = LIGHT_COMBO_WINDOW;
    }

    if (state === PlayerStates.DODGE) {
      const dir = options.direction || this._dodgeDirection;
      const len = Math.hypot(dir.x, dir.y);
      this._dodgeDirection = len > 0
        ? { x: dir.x / len, y: dir.y / len }
        : { x: this.facing, y: 0 };
      this._dodgeIFrameTimer = this.hunterConfig.dodgeIFrames * TICK;
      this._dodgeCooldownTimer = 48 * TICK;
    }

    if (state === PlayerStates.HURT) {
      this._knockback = options.knockback || { x: 0, y: 0 };
    }

    if (state === PlayerStates.DEAD) {
      this._dodgeIFrameTimer = 0;
      this._jumpLift = 0;
    }

    return true;
  }

  /** Applies damage and enters hurt or dead state unless i-frames are active. */
  takeDamage(amount, knockback = { x: 0, y: 0 }) {
    if (this.isInvincible() || this.state === PlayerStates.DEAD || this.state === PlayerStates.DOWNED) return false;

    const alive = this.resources.takeDamage(amount);
    if (alive) {
      this.transitionTo(PlayerStates.HURT, { knockback });
      return true;
    }

    if (this.runPlayer?.secondWindReady) {
      this.runPlayer.secondWindReady = false;
      this.resources.health = Math.max(1, Math.ceil(this.resources.maxHealth * 0.2));
      this.setInvincible(2);
      this.transitionTo(PlayerStates.HURT, { knockback, force: true });
      return true;
    }

    if (this._coOpEnabled) {
      this._enterDowned();
      return false;
    }

    this.transitionTo(PlayerStates.DEAD, { knockback });
    return true;
  }

  /** Syncs transition-only downed state from RunState. */
  syncDownState(isDown) {
    this.isDown = isDown;
    if (isDown) {
      this.state = PlayerStates.DOWNED;
      this._jumpLift = 0;
      this._animationRevision += 1;
      return;
    }
    if (this.state !== PlayerStates.DEAD || this.resources.health <= 0) return;

    this.state = PlayerStates.IDLE;
    this._stateElapsed = 0;
    this._stateDuration = 0;
    this._dodgeIFrameTimer = 0;
    this._knockback.x = 0;
    this._knockback.y = 0;
  }

  /** Returns true while dodge invincibility frames are active. */
  isInvincible() {
    return this._dodgeIFrameTimer > 0 || this._bonusInvincibleTimer > 0;
  }

  /** Enables or disables co-op death rules for this player. */
  setCoOpEnabled(enabled) {
    this._coOpEnabled = !!enabled;
  }

  /** Revives a downed player at the supplied health fraction. */
  revive(healthFraction = 0.3) {
    if (!this.isDown || this.isEliminated) return false;
    this.isDown = false;
    this.downTimer = 0;
    this.resources.health = Math.max(1, Math.ceil(this.resources.maxHealth * healthFraction));
    this.transitionTo(PlayerStates.REVIVE, { force: true });
    return true;
  }

  /** Resets live state from RunState after a wipe or run reset. */
  resetForRunState(runPlayer, hunterConfig = null) {
    this.runPlayer = runPlayer;
    if (hunterConfig) this.applyHunterConfig(hunterConfig);
    this.isDown = !!runPlayer.isDown;
    this.downTimer = runPlayer.downTimer || 0;
    this.isEliminated = false;
    this.state = this.isDown ? PlayerStates.DOWNED : PlayerStates.IDLE;
    this._stateElapsed = 0;
    this._stateDuration = 0;
    this._dodgeIFrameTimer = 0;
    this._dodgeCooldownTimer = 0;
    this._jumpLift = 0;
    this._knockback.x = 0;
    this._knockback.y = 0;
    this._animationRevision += 1;
    this._syncMesh();
  }

  /** Applies a derived hunter config after progression changes. */
  applyHunterConfig(config) {
    this.hunterConfig = config;
    this.baseMoveSpeed = this.hunterConfig.speed / SPEED_TO_WORLD_UNITS;
    this.moveSpeed = this.baseMoveSpeed;
  }

  /** Returns the player's current body AABB for physical separation/debug only. */
  getBodyBounds() {
    return new Hitbox({
      x: this.position.x - PLAYER_WIDTH / 2,
      y: this.position.y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      owner: this,
      ownerTag: HitboxOwners.PLAYER,
    });
  }

  /** Returns the world X coordinate at the center of the damageable body. */
  get combatCenterX() {
    return this.position.x;
  }

  /** Returns the world Y coordinate at the center of the damageable body. */
  get combatCenterY() {
    return this.position.y + PLAYER_HEIGHT / 2;
  }

  /** Returns the player's current body AABB for legacy debug callers. */
  getBounds() {
    return this.getBodyBounds();
  }

  /** Returns the player's damageable hurtbox, or null during i-frames. */
  getHurtbox() {
    if (this.isInvincible() || this.state === PlayerStates.DEAD || this.state === PlayerStates.DOWNED) return null;
    return this.getBodyBounds();
  }

  /** Returns the current attack spec used by CombatController damage hitboxes. */
  getAttackSpec() {
    const spec = PlayerAttackSpecs[this.state];
    if (!spec) return null;
    if (this._stateElapsed < spec.activeStart || this._stateElapsed >= spec.activeStart + spec.activeLife) {
      return null;
    }
    return {
      ...spec,
      damage: this.state === PlayerStates.ATTACK_HEAVY
        ? this.hunterConfig.heavyDamage
        : this.hunterConfig.lightDamage,
      lifetime: spec.activeLife,
    };
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
      y: this.combatCenterY - height / 2,
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
    return !this.isAirborne() && this._dodgeCooldownTimer <= 0 && this.resources.stamina >= staminaCost;
  }

  /** Returns true when jump can start from grounded movement states. */
  canJump() {
    return this.state === PlayerStates.IDLE || this.state === PlayerStates.MOVE;
  }

  /** Returns true while the player is in the evasive airborne jump state. */
  isAirborne() {
    return this.state === PlayerStates.JUMP;
  }

  /** Returns true when the current state is an attack state. */
  isAttacking() {
    return this.state === PlayerStates.ATTACK_LIGHT || this.state === PlayerStates.ATTACK_HEAVY;
  }

  /** Returns the current attack sequence id for one-hit-per-swing tracking. */
  get attackId() {
    return this._attackId;
  }

  /** Returns the active light combo step, 1-3. */
  get lightComboStep() {
    return this._lightComboStep || 1;
  }

  /** Returns a monotonically changing key for animation state restarts. */
  get animationKey() {
    return `${this.state}:${this._lightComboStep}:${this._animationRevision}`;
  }

  /** Blinks to the far side of the target while staying inside arena bounds. */
  blinkBehind(target) {
    if (!target) return false;
    const side = target.position.x >= this.position.x ? 1 : -1;
    const bounds = target.getBodyBounds?.();
    const targetCenterY = bounds ? bounds.y + bounds.height / 2 : target.position.y;
    this.position.x = target.position.x + side * 0.9;
    this.position.y = targetCenterY - PLAYER_HEIGHT / 2;
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

  /** Applies a temporary movement speed multiplier. */
  setSpeedMultiplier(multiplier, seconds) {
    this._speedMultiplier = multiplier;
    this._speedMultiplierTimer = Math.max(this._speedMultiplierTimer, seconds);
  }

  /** Adds temporary invincibility independent of dodge i-frames. */
  setInvincible(seconds) {
    this._bonusInvincibleTimer = Math.max(this._bonusInvincibleTimer, seconds);
  }

  /** Enables Sereisa's Storm Surge movement and damaging dash window. */
  setStormSurge(seconds) {
    this._stormSurgeTimer = Math.max(this._stormSurgeTimer, seconds);
    this.setSpeedMultiplier(2, seconds);
    this.setInvincible(seconds);
  }

  /** Returns true while Storm Surge is active. */
  isStormSurging() {
    return this._stormSurgeTimer > 0;
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

    this._applyMoveVector(dt, moveVector);
    this.state = moveVector.x !== 0 || moveVector.y !== 0 ? PlayerStates.MOVE : PlayerStates.IDLE;
  }

  _applyMoveVector(dt, moveVector) {
    const speed = this.moveSpeed * this._speedMultiplier;
    this.position.x += moveVector.x * speed * dt;
    this.position.y += moveVector.y * speed * dt * BASE_Y_SCALE;
  }

  _updateJump(dt, moveVector) {
    if (moveVector.x !== 0) this.facing = Math.sign(moveVector.x);
    this._applyMoveVector(dt, moveVector);

    const progress = this._stateDuration > 0
      ? Math.min(1, this._stateElapsed / this._stateDuration)
      : 0;
    this._jumpLift = Math.sin(progress * Math.PI) * JUMP_HEIGHT;
  }

  _updateDodge(dt) {
    const speed = this._dodgeSpeed * this._speedMultiplier;
    this.position.x += this._dodgeDirection.x * speed * dt;
    this.position.y += this._dodgeDirection.y * speed * dt * BASE_Y_SCALE;
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

  _isCommittedState() {
    return this.state === PlayerStates.ATTACK_LIGHT ||
      this.state === PlayerStates.ATTACK_HEAVY ||
      this.state === PlayerStates.SPELL_MINOR ||
      this.state === PlayerStates.SPELL_ADVANCED ||
      this.state === PlayerStates.ULTIMATE;
  }

  _enterDowned() {
    this.isDown = true;
    this.downTimer = DOWNED_SECONDS;
    this.isEliminated = false;
    this.resources.health = 0;
    this.state = PlayerStates.DOWNED;
    this._stateElapsed = 0;
    this._stateDuration = 0;
    this._dodgeIFrameTimer = 0;
    this._jumpLift = 0;
    this._knockback.x = 0;
    this._knockback.y = 0;
    this._animationRevision += 1;
  }

  _clampToArena() {
    clampBottomToVisibleArena(this.position, PLAYER_WIDTH, PLAYER_HEIGHT);
  }

  _syncMesh() {
    this.mesh.position.x = this.position.x;
    this.mesh.position.y = this.position.y;
    this.mesh.position.z = -this.position.y * 0.01;
    this.mesh.scale.set(1, 1, 1);
    this.mesh.rotation.z = 0;
    if (this._visualBody) this._visualBody.scale.x = this.facing;
    this._setVisualColor(this.hunterConfig.auraColor);

    if (this.state === PlayerStates.IDLE) {
      this.mesh.position.y += Math.sin(this._visualTime * Math.PI * 2) * 0.05;
    } else if (this.state === PlayerStates.MOVE) {
      this.mesh.rotation.z = this.facing * -0.08;
    } else if (this.state === PlayerStates.ATTACK_LIGHT) {
      this.mesh.scale.x = this._attackScale(1.3);
      this._setVisualColor(0xffffff);
    } else if (this.state === PlayerStates.ATTACK_HEAVY) {
      const scale = this._attackScale(1.5);
      this.mesh.scale.set(scale, scale, 1);
      this._setVisualColor(0xffe066);
    } else if (
      this.state === PlayerStates.SPELL_MINOR ||
      this.state === PlayerStates.SPELL_ADVANCED ||
      this.state === PlayerStates.ULTIMATE
    ) {
      const scale = this._attackScale(this.state === PlayerStates.ULTIMATE ? 1.6 : 1.25);
      this.mesh.scale.set(scale, scale, 1);
      this._setVisualColor(this.hunterConfig.auraColor);
    } else if (this.state === PlayerStates.JUMP) {
      this.mesh.position.y += this._jumpLift;
      this.mesh.scale.set(0.96, 1.04, 1);
      this._setVisualColor(0x9fe8ff);
    } else if (this.state === PlayerStates.DODGE) {
      this.mesh.rotation.z = this._dodgeDirection.x * -0.25;
      this.mesh.scale.set(1.15, 0.85, 1);
      this._setVisualColor(0x48f7ff);
    } else if (this.state === PlayerStates.HURT) {
      const shake = Math.sin(this._stateElapsed * 220) * 0.1;
      this.mesh.position.x += shake;
      this._setVisualColor(0xff5555);
    } else if (this.state === PlayerStates.DEAD) {
      const t = Math.min(1, this._stateElapsed / STATE_DURATIONS[PlayerStates.DEAD]);
      this.mesh.scale.y = Math.max(0.05, 1 - t);
      this._setVisualColor(0x333333);
    } else if (this.state === PlayerStates.DOWNED) {
      this.mesh.rotation.z = this.facing * -0.35;
      this.mesh.scale.set(1, 0.55, 1);
      this._setVisualColor(0x772222);
    } else if (this.state === PlayerStates.REVIVE) {
      this.mesh.scale.set(1.05, 1.05, 1);
      this._setVisualColor(0x7dff9b);
    }

    ySortHunterMesh(this.mesh, this.position.y);
  }

  _attackScale(maxScale) {
    const progress = this._stateDuration > 0
      ? Math.min(1, this._stateElapsed / this._stateDuration)
      : 0;
    const pulse = 1 - Math.abs(progress * 2 - 1);
    return 1 + (maxScale - 1) * pulse;
  }

  _createFallbackMesh() {
    const geo = new THREE.BoxGeometry(PLAYER_WIDTH, PLAYER_HEIGHT, 0.4);
    const mat = new THREE.MeshLambertMaterial({ color: this.hunterConfig.auraColor });
    return new THREE.Mesh(geo, mat);
  }

  _setVisualColor(hex) {
    if (!this._baseMaterial?.color || this._baseMaterial.map) return;
    this._baseMaterial.color.setHex(hex);
  }
}
