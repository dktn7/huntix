import { Actions } from '../engine/InputManager.js';
import { Hitbox, HitboxOwners, HitboxShapes } from './Hitbox.js';
import { PlayerStates } from './PlayerState.js';
import { StatusTypes } from './StatusEffects.js';

const LIGHT_HITSTOP = 0.08;
const HEAVY_HITSTOP = 0.15;
const DODGE_STAMINA_COST = 25;
const MINOR_MANA_COST = 15;
const ADVANCED_MANA_COST = 40;
const ADVANCED_HOLD_SECONDS = 0.35;
const COMBO_TIMEOUT = 2;

export class CombatController {
  /** Creates the combat coordinator for input, hitboxes, spells, and hit resolution. */
  constructor(resources) {
    this.resources = resources;
    this._hitstopTimer = 0;
    this._lastSpawnedAttackId = 0;
    this._activeHitboxes = [];
    this._specialHold = 0;
    this._specialWasDown = false;
    this._nextHitBleeds = false;
    this._comboCount = 0;
    this._comboTimer = 0;
    this.hitEvents = [];
  }

  /** Reads input, drives combat transitions, and resolves active damage hitboxes. */
  update(dt, input, player, enemies, spawner = null) {
    this.hitEvents.length = 0;
    this._comboTimer = Math.max(0, this._comboTimer - dt);
    if (this._comboTimer <= 0) this._comboCount = 0;

    this._handleInput(dt, input, player, enemies, spawner);
    this._spawnPlayerAttackHitbox(player);
    this._resolveActiveHitboxes(dt, player, enemies);
    return this.hitEvents;
  }

  /** Adds an enemy-owned or system-owned hitbox to the active combat registry. */
  addHitbox(hitbox) {
    if (hitbox) this._activeHitboxes.push(hitbox);
  }

  /** Advances active hitbox lifetimes without resolving damage. */
  advanceHitboxes(dt) {
    this._activeHitboxes = this._activeHitboxes.filter(hitbox => hitbox.update(dt));
  }

  /** Advances active hitstop and returns true while simulation should pause. */
  consumeHitstop(dt) {
    if (this._hitstopTimer <= 0) return false;
    this._hitstopTimer = Math.max(0, this._hitstopTimer - dt);
    return true;
  }

  /** Requests a hitstop pause for the supplied duration in seconds. */
  requestHitstop(seconds) {
    this._hitstopTimer = Math.max(this._hitstopTimer, seconds);
  }

  /** Returns true while hitstop is actively pausing combat simulation. */
  isHitstopActive() {
    return this._hitstopTimer > 0;
  }

  /** Returns active hitboxes for debug rendering. */
  getActiveHitboxes() {
    return this._activeHitboxes;
  }

  /** Returns the active combo count. */
  get comboCount() {
    return this._comboCount;
  }

  /** Returns the remaining hitstop duration in seconds. */
  get hitstopRemaining() {
    return this._hitstopTimer;
  }

  _handleInput(dt, input, player, enemies, spawner) {
    this._handleSpecialInput(dt, input, player, enemies, spawner);
    if (player.state === PlayerStates.DEAD || player.state === PlayerStates.HURT) return;

    if (player.canDodge(DODGE_STAMINA_COST) && input.consumeBuffered(Actions.DODGE, 15)) {
      const mv = input.moveVector;
      const direction = mv.x !== 0 || mv.y !== 0 ? mv : { x: player.facing, y: 0 };
      if (this.resources.spendStamina(DODGE_STAMINA_COST)) {
        player.transitionTo(PlayerStates.DODGE, { direction, force: player.isAttacking() });
      }
      return;
    }

    if (player.state === PlayerStates.DODGE || player.isAttacking()) return;

    if (input.consumeBuffered(Actions.LIGHT, 15)) {
      player.transitionTo(PlayerStates.ATTACK_LIGHT);
      return;
    }

    if (input.consumeBuffered(Actions.HEAVY, 15)) {
      player.transitionTo(PlayerStates.ATTACK_HEAVY);
    }
  }

  _handleSpecialInput(dt, input, player, enemies, spawner) {
    const isDown = input.isDown(Actions.SPECIAL);
    if (input.justPressed(Actions.SPECIAL)) {
      this._specialHold = 0;
      this._specialWasDown = true;

      if (this.resources.consumeFullSurge()) {
        spawner?.freezeAll(4);
        player.setRapidStrike(4);
        this.hitEvents.push({ type: 'ultimate', x: player.position.x, y: player.position.y });
        this._specialWasDown = false;
        return;
      }
    }

    if (isDown && this._specialWasDown) {
      this._specialHold += dt;
    }

    if (input.justReleased(Actions.SPECIAL) && this._specialWasDown) {
      if (this._specialHold >= ADVANCED_HOLD_SECONDS) {
        this._castAdvanced(player, spawner);
      } else {
        this._castMinor(player, enemies);
      }
      this._specialHold = 0;
      this._specialWasDown = false;
    }
  }

  _castMinor(player, enemies) {
    if (!this.resources.spendMana(MINOR_MANA_COST)) return;
    const target = this._nearestEnemy(player, enemies);
    player.blinkBehind(target);
    this._nextHitBleeds = true;
    this.hitEvents.push({ type: 'spell', spell: 'minor', x: player.position.x, y: player.position.y });
  }

  _castAdvanced(player, spawner) {
    if (!this.resources.spendMana(ADVANCED_MANA_COST)) return;
    spawner?.spawnDecoy(player.position.x + player.facing * 1.2, player.position.y);
    this.hitEvents.push({ type: 'spell', spell: 'advanced', x: player.position.x, y: player.position.y });
  }

  _spawnPlayerAttackHitbox(player) {
    const spec = player.getAttackSpec();
    if (!spec || player.attackId === this._lastSpawnedAttackId) return;

    this._lastSpawnedAttackId = player.attackId;
    const statusType = this._nextHitBleeds ? StatusTypes.BLEED : StatusTypes.BLEED;
    this._nextHitBleeds = false;

    this._activeHitboxes.push(new Hitbox({
      shape: HitboxShapes.ARC,
      centerX: player.position.x,
      centerY: player.position.y,
      radius: spec.radius,
      facing: player.facing,
      arcCos: spec.arcCos,
      damage: spec.damage,
      knockbackX: player.facing * spec.knockbackX,
      knockbackY: spec.knockbackY,
      owner: player,
      ownerTag: HitboxOwners.PLAYER,
      targetTag: HitboxOwners.ENEMY,
      lifetime: spec.lifetime,
      attackId: player.attackId,
      attackType: player.state === PlayerStates.ATTACK_HEAVY ? 'heavy' : 'light',
      statusType,
    }));
  }

  _resolveActiveHitboxes(dt, player, enemies) {
    for (const hitbox of this._activeHitboxes) {
      if (hitbox.ownerTag === HitboxOwners.PLAYER) {
        this._resolvePlayerHitbox(hitbox, enemies);
      } else if (hitbox.ownerTag === HitboxOwners.ENEMY) {
        this._resolveEnemyHitbox(hitbox, player);
      }
    }

    this._activeHitboxes = this._activeHitboxes.filter(hitbox => hitbox.update(dt));
  }

  _resolvePlayerHitbox(hitbox, enemies) {
    for (const enemy of enemies) {
      if (enemy.isDead() || hitbox.hasHit(enemy.id)) continue;
      const hurtbox = enemy.getHurtbox();
      if (!hitbox.intersects(hurtbox)) continue;

      const wasDead = enemy.isDead();
      hitbox.markHit(enemy.id);
      hitbox.applyHit(enemy, hitbox.owner, { comboCount: this._comboCount + 1 });

      this._comboCount += 1;
      this._comboTimer = COMBO_TIMEOUT;
      if (hitbox.attackType === 'light') this.resources.gainMana(5);
      this.requestHitstop(hitbox.attackType === 'heavy' ? HEAVY_HITSTOP : LIGHT_HITSTOP);

      const enemyEvents = enemy.consumeEvents();
      const killed = !wasDead && enemy.isDead();
      if (killed) this.resources.gainSurge(20);

      this._pushHitEvent(enemy, hitbox.attackType === 'heavy' ? 0.5 : 0.25, {
        type: 'hit',
        damage: hitbox.damage,
        attackType: hitbox.attackType,
        combo: this._comboCount,
        killed,
      });

      for (const event of enemyEvents) this.hitEvents.push(event);
    }
  }

  _resolveEnemyHitbox(hitbox, player) {
    const hurtbox = player.getHurtbox();
    if (!hurtbox || hitbox.hasHit('player') || !hitbox.intersects(hurtbox)) return;

    hitbox.markHit('player');
    if (hitbox.applyHit(player, hitbox.owner)) {
      this.hitEvents.push({
        type: 'playerHit',
        damage: hitbox.damage,
        attackType: hitbox.attackType,
        x: player.position.x,
        y: player.position.y,
      });
    }
  }

  _nearestEnemy(player, enemies) {
    let best = null;
    let bestDistance = Infinity;
    for (const enemy of enemies) {
      if (enemy.isDead()) continue;
      const dx = enemy.position.x - player.position.x;
      const dy = enemy.position.y - player.position.y;
      const distance = Math.hypot(dx, dy);
      if (distance < bestDistance) {
        best = enemy;
        bestDistance = distance;
      }
    }
    return best;
  }

  _pushHitEvent(enemy, intensity, extra) {
    this.hitEvents.push({
      x: enemy.position.x,
      y: enemy.position.y,
      intensity,
      ...extra,
    });
  }
}
