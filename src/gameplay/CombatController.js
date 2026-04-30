import { Actions } from '../engine/InputManager.js';
import { RunState } from '../core/RunState.js';
import { Hitbox, HitboxOwners, HitboxShapes } from './Hitbox.js';
import { PlayerStates } from './PlayerState.js';
import { StatusTypes } from './StatusEffects.js';

const LIGHT_HITSTOP = 0.04;
const HEAVY_HITSTOP = 0.08;
const DODGE_STAMINA_COST = 25;
const ADVANCED_HOLD_SECONDS = 0.35;
const COMBO_TIMEOUT = 2;
const REVIVE_RANGE = 2;
const REVIVE_SECONDS = 1.5;

export class CombatController {
  /** Creates the combat coordinator for multi-hunter input, hitboxes, spells, and hit resolution. */
  constructor() {
    this._hitstopTimer = 0;
    this._lastSpawnedAttackIds = new Map();
    this._activeHitboxes = [];
    this._specialState = new Map();
    this._spellCooldowns = new Map();
    this._areaEffects = [];
    this._reviveProgress = new Map();
    this._comboCounts = new Map();
    this._comboTimers = new Map();
    this.hitEvents = [];
  }

  /** Reads per-player input, drives combat transitions, and resolves active damage hitboxes. */
  update(dt, playerInputs, players, enemies, spawner = null) {
    this.hitEvents.length = 0;
    this._advanceCooldowns(dt);
    this._updateAreaEffects(dt, enemies);
    this._advanceComboTimers(dt);

    this._updateRevives(dt, playerInputs, players);

    for (let i = 0; i < players.length; i += 1) {
      this._handleInput(dt, playerInputs[i], players[i], enemies, spawner, players);
      this._spawnPlayerAttackHitbox(players[i]);
    }

    this._resolveActiveHitboxes(dt, players, enemies);
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
    return this.getComboCount(0);
  }

  /** Returns the active combo count for a specific player index. */
  getComboCount(playerIndex = 0) {
    return this._comboCounts.get(playerIndex) || 0;
  }

  /** Returns combo counts for all players in index order. */
  getComboCounts() {
    const highestIndex = Math.max(
      -1,
      ...this._comboCounts.keys(),
      ...this._comboTimers.keys()
    );
    if (highestIndex < 0) return [];

    const out = [];
    for (let i = 0; i <= highestIndex; i += 1) {
      out.push(this.getComboCount(i));
    }
    return out;
  }

  /** Returns the remaining hitstop duration in seconds. */
  get hitstopRemaining() {
    return this._hitstopTimer;
  }

  /** Clears the active combo chain after the player takes damage. */
  breakCombo(playerIndex = null) {
    if (playerIndex === null || playerIndex === undefined) {
      this._comboCounts.clear();
      this._comboTimers.clear();
      return;
    }
    this._comboCounts.set(playerIndex, 0);
    this._comboTimers.set(playerIndex, 0);
  }

  _handleInput(dt, input, player, enemies, spawner, players = []) {
    if (!input || !player) return;

    if (
      player.state === PlayerStates.DEAD ||
      player.state === PlayerStates.DOWNED ||
      player.state === PlayerStates.HURT ||
      this._isCommittedCast(player.state)
    ) {
      this._cancelSpecialInput(player);
      return;
    }

    if (player.canJump?.() && input.consumeBuffered(Actions.JUMP, 15)) {
      this._cancelSpecialInput(player);
      player.transitionTo(PlayerStates.JUMP);
      return;
    }

    if (player.isAirborne?.()) {
      this._cancelSpecialInput(player);
      return;
    }

    if (
      input.justPressed(Actions.INTERACT) &&
      player.runPlayer?.slot2WeaponId &&
      !this._isNearDownedAlly(player, players)
    ) {
      player.runPlayer.activeSlot = player.runPlayer.activeSlot === 0 ? 1 : 0;
      player.transitionTo(PlayerStates.WEAPON_SWAP, { force: true });
      return;
    }

    if (this._isSpecialInputLocked(player)) {
      this._cancelSpecialInput(player);
    } else if (this._handleSpecialInput(dt, input, player, enemies, spawner)) {
      return;
    }

    if (player.canDodge(DODGE_STAMINA_COST) && input.consumeBuffered(Actions.DODGE, 15)) {
      const mv = input.moveVector;
      const direction = mv.x !== 0 || mv.y !== 0 ? mv : { x: player.facing, y: 0 };
      if (player.resources.spendStamina(DODGE_STAMINA_COST)) {
        if (player.hunterConfig.id === 'dabik') {
          const target = this._nearestEnemy(player, enemies, 4);
          if (target) player.blinkBehind(target);
        }
        player.transitionTo(PlayerStates.DODGE, { direction, force: player.isAttacking() });
        this._spawnDodgeEffect(player, direction);
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
    const state = this._getSpecialState(player);
    const isDown = input.isDown(Actions.SPECIAL);

    if (input.justPressed(Actions.SPECIAL)) {
      state.hold = 0;
      state.wasDown = true;

      if (player.resources.isSurgeFull()) {
        if (this._castUltimate(player, enemies, spawner)) {
          state.wasDown = false;
          return true;
        }
        state.wasDown = false;
        return false;
      }
    }

    if (isDown && state.wasDown) state.hold += dt;

    if (input.justReleased(Actions.SPECIAL) && state.wasDown) {
      let castStarted = false;
      if (state.hold >= ADVANCED_HOLD_SECONDS) {
        castStarted = this._castAdvanced(player, enemies, spawner);
      } else {
        castStarted = this._castMinor(player, enemies);
      }
      state.hold = 0;
      state.wasDown = false;
      return castStarted;
    }

    return false;
  }

  _castMinor(player, enemies) {
    const spell = player.hunterConfig.minor;
    if (!this._canCast(player, spell) || !player.resources.canSpendMana(spell.manaCost)) return false;
    if (!player.transitionTo(PlayerStates.SPELL_MINOR)) return false;
    if (!player.resources.spendMana(spell.manaCost)) return false;

    this._startCooldown(player, spell);
    RunState.recordSpellCast(player.playerIndex);

    if (spell.id === 'shadow-step') {
      const target = this._nearestEnemy(player, enemies, 4);
      if (target) player.blinkBehind(target);
      if (target?.statusEffects?.has(StatusTypes.SLOW)) {
        this._damageEnemy(target, Math.ceil(spell.damage * 0.75), player, 'spell', StatusTypes.BLEED);
      }
      this._activeHitboxes.push(this._pointStrike(player, 0.75, spell.damage, spell.statusType, 'spell'));
    } else if (spell.id === 'shield-bash') {
      this._activeHitboxes.push(this._arcStrike(player, 1.8, spell.damage, spell.statusType, 'spell'));
    } else if (spell.id === 'electric-dart') {
      this._activeHitboxes.push(this._lineStrike(player, 9, 0.45, spell.damage, spell.statusType, 'spell'));
    } else if (spell.id === 'flame-bolt') {
      this._activeHitboxes.push(this._lineStrike(player, 8, 0.55, spell.damage, spell.statusType, 'spell'));
    }

    this.hitEvents.push({ type: 'spell', spell: spell.id, player, x: player.position.x, y: this._combatY(player) });
    return true;
  }

  _castAdvanced(player, enemies, spawner) {
    const spell = player.hunterConfig.advanced;
    if (!this._canCast(player, spell) || !player.resources.canSpendMana(spell.manaCost)) return false;
    if (!player.transitionTo(PlayerStates.SPELL_ADVANCED)) return false;
    if (!player.resources.spendMana(spell.manaCost)) return false;

    this._startCooldown(player, spell);
    RunState.recordSpellCast(player.playerIndex);

    if (spell.id === 'shadow-clone') {
      spawner?.spawnDecoy(player.position.x + player.facing * 1.2, this._combatY(player));
    } else if (spell.id === 'seismic-slam') {
      this._activeHitboxes.push(this._radialStrike(player, 4, spell.damage, spell.statusType, 'slam', 5));
    } else if (spell.id === 'chain-shock') {
      this._chainShock(player, enemies, spell);
    } else if (spell.id === 'flame-wall') {
      this._areaEffects.push({
        id: `${player.playerIndex}:flame-wall`,
        owner: player,
        x: player.position.x + player.facing * 2.2,
        y: this._combatY(player),
        width: 4,
        height: 1.2,
        damage: spell.damage,
        statusType: spell.statusType,
        remaining: 5,
        interval: 1,
        tick: 0,
      });
    }

    this.hitEvents.push({ type: 'spell', spell: spell.id, player, x: player.position.x, y: this._combatY(player) });
    return true;
  }

  _castUltimate(player, enemies, spawner) {
    const spell = player.hunterConfig.ultimate;
    if (!player.resources.isSurgeFull()) return false;
    if (!player.transitionTo(PlayerStates.ULTIMATE)) return false;
    if (!player.resources.consumeFullSurge()) return false;
    RunState.recordSpellCast(player.playerIndex);

    player.setInvincible(spell.duration || spell.stunDuration || 5);

    if (spell.id === 'monarchs-domain') {
      spawner?.freezeAll(4);
      player.setRapidStrike(4);
    } else if (spell.id === 'titans-wrath') {
      for (const enemy of enemies) {
        if (enemy.isDead()) continue;
        enemy.applyStatus(StatusTypes.STUN);
        enemy.freeze(spell.stunDuration);
        this._damageEnemy(enemy, spell.damage, player, 'ultimate', StatusTypes.STUN);
      }
    } else if (spell.id === 'storm-surge') {
      player.setStormSurge(spell.duration);
    } else if (spell.id === 'inferno') {
      this._areaEffects.push({
        id: `${player.playerIndex}:inferno`,
        owner: player,
        fullArena: true,
        damage: spell.damagePerSecond,
        statusType: spell.statusType,
        remaining: spell.duration,
        interval: 1,
        tick: 0,
      });
    }

    this.hitEvents.push({ type: 'ultimate', spell: spell.id, player, x: player.position.x, y: this._combatY(player) });
    return true;
  }

  _spawnPlayerAttackHitbox(player) {
    const spec = player.getAttackSpec();
    const lastAttackId = this._lastSpawnedAttackIds.get(player.playerIndex);
    if (!spec || player.attackId === lastAttackId) return;

    this._lastSpawnedAttackIds.set(player.playerIndex, player.attackId);
    this._activeHitboxes.push(new Hitbox({
      shape: HitboxShapes.ARC,
      centerX: this._combatX(player),
      centerY: this._combatY(player),
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
      statusType: player.hunterConfig.statusType,
    }));
  }

  _spawnDodgeEffect(player, direction) {
    if (player.hunterConfig.id === 'benzu') {
      this._activeHitboxes.push(this._arcStrike(player, 1.5, player.hunterConfig.lightDamage, StatusTypes.STUN, 'dodge'));
    } else if (player.hunterConfig.id === 'sereisa' || player.isStormSurging()) {
      const damage = player.isStormSurging() ? player.hunterConfig.ultimate.dashDamage : 0;
      this._activeHitboxes.push(this._lineStrike(player, 2.4, 1.5, damage, StatusTypes.SLOW, 'dodge', direction));
    } else if (player.hunterConfig.id === 'vesol') {
      this._activeHitboxes.push(this._radialStrike(player, 1.6, 0, null, 'dodge', 4.2));
    }
  }

  _resolveActiveHitboxes(dt, players, enemies) {
    for (const hitbox of this._activeHitboxes) {
      if (hitbox.ownerTag === HitboxOwners.PLAYER) {
        this._resolvePlayerHitbox(hitbox, enemies);
      } else if (hitbox.ownerTag === HitboxOwners.ENEMY) {
        this._resolveEnemyHitbox(hitbox, players);
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
      const damage = this._damageForHit(hitbox, enemy);
      const ownerIndex = hitbox.owner.playerIndex;
      const nextCombo = this.getComboCount(ownerIndex) + 1;
      const originalDamage = hitbox.damage;
      hitbox.damage = damage;
      hitbox.applyHit(enemy, hitbox.owner, { comboCount: nextCombo });
      hitbox.damage = originalDamage;

      this._comboCounts.set(ownerIndex, nextCombo);
      this._comboTimers.set(ownerIndex, COMBO_TIMEOUT);
      if (hitbox.attackType === 'light') hitbox.owner.resources.gainMana(5);
      this.requestHitstop(hitbox.attackType === 'heavy' ? HEAVY_HITSTOP : LIGHT_HITSTOP);
      
      // Trigger audio ducking for heavy hits (80ms duration, 30% volume reduction)
      if (hitbox.attackType === 'heavy' && window.__huntix?.audio) {
        window.__huntix.audio.duckMusic(0.3, 80);
      }
      
      RunState.recordDamageDealt(hitbox.owner.playerIndex, damage);
      RunState.recordCombo(hitbox.owner.playerIndex, nextCombo);

      const enemyEvents = enemy.consumeEvents();
      const killed = !wasDead && enemy.isDead();
      this._applyPlayerHitProgression(hitbox.owner, damage, hitbox.attackType);
      if (killed) {
        hitbox.owner.resources.gainSurge(20 * this._surgeGainMult(hitbox.owner));
        RunState.grantKillRewards(
          hitbox.owner.playerIndex,
          enemy.getRewards?.(),
          hitbox.attackType,
          nextCombo
        );
      }

      this._pushHitEvent(enemy, hitbox.attackType === 'heavy' ? 0.5 : 0.25, {
        type: 'hit',
        player: hitbox.owner,
        damage,
        attackType: hitbox.attackType,
        combo: nextCombo,
        killed,
      });

      for (const event of enemyEvents) {
        if (event.type !== 'kill') this.hitEvents.push(event);
      }
    }
  }

  _resolveEnemyHitbox(hitbox, players) {
    for (const player of players) {
      const targetId = `player-${player.playerIndex}`;
      const hurtbox = player.getHurtbox();
      if (!hurtbox || hitbox.hasHit(targetId) || !hitbox.intersects(hurtbox)) continue;
      if (hitbox.jumpable && player.isAirborne?.()) continue;

      hitbox.markHit(targetId);
      if (hitbox.applyHit(player, hitbox.owner)) {
        this.breakCombo(player.playerIndex);
        RunState.recordDamageTaken(player.playerIndex, hitbox.damage);
        this.hitEvents.push({
          type: 'playerHit',
          player,
          damage: hitbox.damage,
          attackType: hitbox.attackType,
          x: player.position.x,
          y: this._combatY(player),
        });
      }
    }
  }

  _updateAreaEffects(dt, enemies) {
    for (const effect of this._areaEffects) {
      effect.remaining = Math.max(0, effect.remaining - dt);
      effect.tick -= dt;
      if (effect.tick > 0) continue;

      effect.tick += effect.interval;
      for (const enemy of enemies) {
        if (enemy.isDead()) continue;
        if (!effect.fullArena && !this._enemyInsideArea(enemy, effect)) continue;
        let damage = effect.damage;
        if (effect.id?.includes('flame-wall') && enemy.statusEffects?.has(StatusTypes.STUN)) {
          damage = Math.ceil(damage * 1.35);
        }
        this._damageEnemy(enemy, damage, effect.owner, 'spell', effect.statusType);
      }
    }

    this._areaEffects = this._areaEffects.filter(effect => effect.remaining > 0);
  }

  _damageEnemy(enemy, damage, player, attackType, statusType = null) {
    const wasDead = enemy.isDead();
    if (statusType) enemy.applyStatus(statusType);
    enemy.takeDamage(damage, { x: Math.sign(enemy.position.x - player.position.x || player.facing) * 2, y: 0.4 }, {
      attackType,
      ownerTag: HitboxOwners.PLAYER,
      statusType: null,
      source: player,
    });
    const killed = !wasDead && enemy.isDead();
    RunState.recordDamageDealt(player.playerIndex, damage);
    if (killed) {
      if (attackType !== 'ultimate') player.resources.gainSurge(20 * this._surgeGainMult(player));
      RunState.grantKillRewards(
        player.playerIndex,
        enemy.getRewards?.(),
        attackType,
        this.getComboCount(player.playerIndex)
      );
    }
    this.hitEvents.push({
      type: 'hit',
      player,
      x: enemy.position.x,
      y: enemy.position.y,
      intensity: 0.45,
      damage,
      attackType,
      killed,
    });
    for (const event of enemy.consumeEvents()) {
      if (event.type !== 'kill') this.hitEvents.push(event);
    }
  }

  _chainShock(player, enemies, spell) {
    const targets = this._nearestEnemies(player, enemies, 4, 8);
    for (let i = 0; i < targets.length; i += 1) {
      const damage = Math.max(100, spell.damage - i * 15);
      this._damageEnemy(targets[i], damage, player, 'spell', spell.statusType);
    }
  }

  _nearestEnemy(player, enemies, maxDistance = Infinity) {
    let best = null;
    let bestDistance = maxDistance;
    for (const enemy of enemies) {
      if (enemy.isDead()) continue;
      const dx = enemy.position.x - this._combatX(player);
      const dy = enemy.position.y - this._combatY(player);
      const distance = Math.hypot(dx, dy);
      if (distance < bestDistance) {
        best = enemy;
        bestDistance = distance;
      }
    }
    return best;
  }

  _nearestEnemies(player, enemies, count, maxDistance) {
    return enemies
      .filter(enemy => !enemy.isDead())
      .map(enemy => ({
        enemy,
        distance: Math.hypot(enemy.position.x - this._combatX(player), enemy.position.y - this._combatY(player)),
      }))
      .filter(item => item.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count)
      .map(item => item.enemy);
  }

  _pointStrike(player, radius, damage, statusType, attackType) {
    return this._radialStrike(player, radius, damage, statusType, attackType);
  }

  _arcStrike(player, radius, damage, statusType, attackType) {
    return new Hitbox({
      shape: HitboxShapes.ARC,
      centerX: this._combatX(player),
      centerY: this._combatY(player),
      radius,
      facing: player.facing,
      arcCos: 0.15,
      damage,
      knockbackX: player.facing * 3,
      knockbackY: 0.45,
      owner: player,
      ownerTag: HitboxOwners.PLAYER,
      targetTag: HitboxOwners.ENEMY,
      lifetime: 0.12,
      attackId: this._systemAttackId(player),
      attackType,
      statusType,
    });
  }

  _radialStrike(player, radius, damage, statusType, attackType, knockback = 3) {
    return new Hitbox({
      shape: HitboxShapes.ARC,
      centerX: this._combatX(player),
      centerY: this._combatY(player),
      radius,
      facing: player.facing,
      arcCos: -1,
      damage,
      knockbackX: player.facing * knockback,
      knockbackY: 0.6,
      owner: player,
      ownerTag: HitboxOwners.PLAYER,
      targetTag: HitboxOwners.ENEMY,
      lifetime: 0.12,
      attackId: this._systemAttackId(player),
      attackType,
      statusType,
    });
  }

  _lineStrike(player, length, height, damage, statusType, attackType, direction = null) {
    const dir = direction || { x: player.facing, y: 0 };
    const facing = dir.x >= 0 ? 1 : -1;
    const x = facing > 0 ? player.position.x : player.position.x - length;
    return new Hitbox({
      x,
      y: this._combatY(player) - height / 2,
      width: length,
      height,
      damage,
      knockbackX: facing * 2.5,
      knockbackY: 0.35,
      owner: player,
      ownerTag: HitboxOwners.PLAYER,
      targetTag: HitboxOwners.ENEMY,
      lifetime: 0.12,
      attackId: this._systemAttackId(player),
      attackType,
      statusType,
    });
  }

  _damageForHit(hitbox, enemy) {
    if (hitbox.attackType === 'heavy' && enemy.statusEffects?.has(StatusTypes.BURN)) {
      return Math.ceil(hitbox.damage * 1.15);
    }
    if (hitbox.attackType === 'slam' && enemy.statusEffects?.has(StatusTypes.BURN)) {
      return Math.ceil(hitbox.damage * 1.35);
    }
    return hitbox.damage;
  }

  _updateRevives(dt, inputs, players) {
    const downedPlayers = players.filter(player => player?.state === PlayerStates.DOWNED && !player.isEliminated);
    if (!downedPlayers.length) {
      this._reviveProgress.clear();
      return;
    }

    for (const downed of downedPlayers) {
      let activeReviver = null;
      for (let i = 0; i < players.length; i += 1) {
        const reviver = players[i];
        const input = inputs[i];
        if (!reviver || !input || reviver === downed) continue;
        if (reviver.state === PlayerStates.DEAD || reviver.state === PlayerStates.DOWNED) continue;
        if (!input.isDown(Actions.INTERACT)) continue;
        if (this._distanceBetween(reviver, downed) > REVIVE_RANGE) continue;
        activeReviver = reviver;
        break;
      }

      const key = downed.playerIndex;
      if (!activeReviver) {
        this._reviveProgress.delete(key);
        continue;
      }

      const next = (this._reviveProgress.get(key) || 0) + dt;
      if (next >= REVIVE_SECONDS && downed.revive(0.3)) {
        activeReviver.resources.gainSurge(10);
        RunState.recordRevive(activeReviver.playerIndex);
        this._reviveProgress.delete(key);
        this.hitEvents.push({
          type: 'revive',
          player: downed,
          reviver: activeReviver,
          x: downed.position.x,
          y: this._combatY(downed),
        });
      } else {
        this._reviveProgress.set(key, next);
      }
    }
  }

  _distanceBetween(a, b) {
    return Math.hypot(this._combatX(a) - this._combatX(b), this._combatY(a) - this._combatY(b));
  }

  _isNearDownedAlly(player, players) {
    for (let i = 0; i < players.length; i += 1) {
      const other = players[i];
      if (!other || other === player) continue;
      if (other.state !== PlayerStates.DOWNED || other.isEliminated) continue;
      if (this._distanceBetween(player, other) <= REVIVE_RANGE) return true;
    }
    return false;
  }

  _enemyInsideArea(enemy, effect) {
    const bounds = enemy.getBodyBounds();
    return (
      bounds.x < effect.x + effect.width / 2 &&
      bounds.x + bounds.width > effect.x - effect.width / 2 &&
      bounds.y < effect.y + effect.height / 2 &&
      bounds.y + bounds.height > effect.y - effect.height / 2
    );
  }

  _getSpecialState(player) {
    let state = this._specialState.get(player.playerIndex);
    if (!state) {
      state = { hold: 0, wasDown: false };
      this._specialState.set(player.playerIndex, state);
    }
    return state;
  }

  _canCast(player, spell) {
    return (this._spellCooldowns.get(this._cooldownKey(player, spell)) || 0) <= 0;
  }

  _startCooldown(player, spell) {
    this._spellCooldowns.set(this._cooldownKey(player, spell), spell.cooldown || 0);
  }

  _applyPlayerHitProgression(player, damage, attackType) {
    if (attackType !== 'light') return;

    const lifesteal = player?.hunterConfig?.modifiers?.lifesteal || 0;
    if (lifesteal > 0) {
      const heal = Math.floor(damage * lifesteal);
      if (heal <= 0) return;

      player.resources.health = Math.min(
        player.resources.maxHealth,
        player.resources.health + heal
      );
    }
  }

  _surgeGainMult(player) {
    return 1 + (player?.hunterConfig?.modifiers?.surgeGainMult || 0);
  }

  _advanceCooldowns(dt) {
    for (const [key, value] of this._spellCooldowns) {
      const next = Math.max(0, value - dt);
      if (next <= 0) {
        this._spellCooldowns.delete(key);
      } else {
        this._spellCooldowns.set(key, next);
      }
    }
  }

  _cooldownKey(player, spell) {
    return `${player.playerIndex}:${spell.id}`;
  }

  _systemAttackId(player) {
    return player.playerIndex * 100000 + Math.floor(performance.now());
  }

  _isCommittedCast(state) {
    return state === PlayerStates.SPELL_MINOR ||
      state === PlayerStates.SPELL_ADVANCED ||
      state === PlayerStates.ULTIMATE;
  }

  _isSpecialInputLocked(player) {
    return player.state === PlayerStates.DODGE || player.isAttacking();
  }

  _cancelSpecialInput(player) {
    const state = this._specialState.get(player.playerIndex);
    if (!state) return;
    state.hold = 0;
    state.wasDown = false;
  }

  _combatX(player) {
    return player.combatCenterX ?? player.position.x;
  }

  _combatY(player) {
    return player.combatCenterY ?? player.position.y;
  }

  _pushHitEvent(enemy, intensity, extra) {
    this.hitEvents.push({
      x: enemy.position.x,
      y: enemy.position.y,
      intensity,
      ...extra,
    });
  }

  _advanceComboTimers(dt) {
    for (const [playerIndex, timer] of this._comboTimers) {
      const next = Math.max(0, timer - dt);
      this._comboTimers.set(playerIndex, next);
      if (next <= 0) this._comboCounts.set(playerIndex, 0);
    }
  }
}
