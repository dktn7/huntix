import { Actions } from '../engine/InputManager.js';
import { PlayerStates } from './PlayerState.js';

const BUFFER_MAX_FRAMES = 15;
const BUFFER_MAX_ACTIONS = 3;
const MELEE_ATTACK_RANGE = 1.65;
const RANGED_ATTACK_RANGE = 4.8;
const FOLLOW_RANGE = 1.4;
const BUFFERED_ACTIONS = [Actions.LIGHT, Actions.HEAVY, Actions.JUMP, Actions.DODGE];

export class CompanionAIController {
  constructor() {
    this._snapshots = new Map();
    this._brains = new Map();
  }

  /** Builds an input snapshot for an AI hunter for this fixed tick. */
  update(dt, player, enemies, players, flow = null) {
    const input = this._snapshotFor(player.playerIndex);
    const brain = this._brainFor(player.playerIndex);
    input.beginFrame();

    brain.attackTimer = Math.max(0, brain.attackTimer - dt);
    brain.dodgeTimer = Math.max(0, brain.dodgeTimer - dt);
    brain.jumpTimer = Math.max(0, brain.jumpTimer - dt);

    if (!player || player.state === PlayerStates.DEAD || player.state === PlayerStates.DOWNED) {
      input.updateBuffer();
      return input;
    }

    const role = this._roleFor(player);
    const target = this._selectTarget(player, enemies, players, role, flow);
    if (!target) {
      this._handleNoTarget(input, player, players, role, flow);
      input.updateBuffer();
      return input;
    }

    this._faceTarget(player, target);
    const dx = target.position.x - player.position.x;
    const dy = target.position.y - player.position.y;
    const distance = Math.hypot(dx, dy);

    if (this._shouldEvade(player, target, distance, brain)) {
      this._moveAway(input, dx, dy);
      if (target.isTelegraphing && player.canJump?.()) {
        input.press(Actions.JUMP);
        brain.jumpTimer = 1.0;
      } else if (player.canDodge?.(0)) {
        input.press(Actions.DODGE);
        brain.dodgeTimer = 1.2;
      }
      input.updateBuffer();
      return input;
    }

    this._positionForRole(input, player, target, dx, dy, distance, role, players, flow);
    this._attackForRole(input, player, target, distance, role, brain, flow);

    input.updateBuffer();
    return input;
  }

  _snapshotFor(playerIndex) {
    let snapshot = this._snapshots.get(playerIndex);
    if (!snapshot) {
      snapshot = createAiInputSnapshot(playerIndex);
      this._snapshots.set(playerIndex, snapshot);
    }
    return snapshot;
  }

  _brainFor(playerIndex) {
    let brain = this._brains.get(playerIndex);
    if (!brain) {
      brain = {
        attackTimer: 0,
        dodgeTimer: 0,
        jumpTimer: 0,
        comboStep: 0,
      };
      this._brains.set(playerIndex, brain);
    }
    return brain;
  }

  _roleFor(player) {
    if (player.hunterConfig.id === 'benzu') return 'guardian';
    if (player.hunterConfig.id === 'sereisa') return 'skirmisher';
    if (player.hunterConfig.id === 'vesol') return 'controller';
    return 'assassin';
  }

  _selectTarget(player, enemies, players, role, flow) {
    let best = null;
    let bestScore = -Infinity;
    const vulnerableAlly = this._mostThreatenedAlly(players);

    for (const enemy of enemies) {
      if (!enemy || enemy.isDead?.()) continue;
      const dx = enemy.position.x - player.position.x;
      const dy = enemy.position.y - player.position.y;
      const distance = Math.hypot(dx, dy);
      const score = this._targetScore(enemy, distance, role, vulnerableAlly, flow);
      if (score > bestScore) {
        best = enemy;
        bestScore = score;
      }
    }
    return best;
  }

  _targetScore(enemy, distance, role, vulnerableAlly, flow) {
    let score = 100 - distance * 9;
    if (enemy.kind === 'boss') score += flow?.bossActive ? 55 : 30;
    if (enemy.type === 'RANGED') score += role === 'assassin' || role === 'skirmisher' ? 45 : 18;
    if (enemy.type === 'BRUISER' || enemy.type === 'FIRE_BRUISER') score += role === 'guardian' ? 40 : 8;
    if (enemy.hp <= 90) score += role === 'assassin' ? 35 : 12;
    if (enemy.isTelegraphing) score += role === 'guardian' ? 25 : 10;
    if (vulnerableAlly) {
      const ax = enemy.position.x - vulnerableAlly.position.x;
      const ay = enemy.position.y - vulnerableAlly.position.y;
      const allyDistance = Math.hypot(ax, ay);
      if (allyDistance < 2.8) score += role === 'guardian' ? 65 : 15;
    }
    if (role === 'controller' && distance < 1.6) score -= 35;
    return score;
  }

  _handleNoTarget(input, player, players, role, flow) {
    if (flow?.routeGateOpen) {
      this._moveToward(input, flow.routeGateX - player.position.x, flow.routeGateY - player.position.y);
      return;
    }

    const anchor = this._anchorForRole(player, players, role);
    const dx = anchor.x - player.position.x;
    const dy = anchor.y - player.position.y;
    if (Math.hypot(dx, dy) > FOLLOW_RANGE) this._moveToward(input, dx, dy);
  }

  _faceTarget(player, target) {
    const dx = target.position.x - player.position.x;
    if (dx !== 0) player.facing = Math.sign(dx);
  }

  _shouldEvade(player, target, distance, brain) {
    if (player.state === PlayerStates.DODGE || player.isAirborne?.()) return false;
    if (target.isTelegraphing && distance < 3.2) {
      return brain.dodgeTimer <= 0 || brain.jumpTimer <= 0;
    }
    return player.resources.health < player.resources.maxHealth * 0.28 &&
      distance < 1.4 &&
      brain.dodgeTimer <= 0;
  }

  _canAttack(player) {
    return player.state === PlayerStates.IDLE || player.state === PlayerStates.MOVE;
  }

  _positionForRole(input, player, target, dx, dy, distance, role, players, flow) {
    if (role === 'controller') {
      const desired = flow?.bossActive ? 4.2 : 3.4;
      if (distance < desired - 0.5) {
        this._moveAway(input, dx, dy);
      } else if (distance > desired + 0.8) {
        this._moveToward(input, dx, dy);
      } else {
        this._strafe(input, player, target, 1);
      }
      return;
    }

    if (role === 'skirmisher') {
      const desired = flow?.bossActive ? 2.8 : 2.1;
      if (distance > desired + 0.35) this._moveToward(input, dx, dy);
      if (distance < desired - 0.35) this._moveAway(input, dx, dy);
      this._strafe(input, player, target, player.playerIndex % 2 === 0 ? 1 : -1);
      return;
    }

    if (role === 'guardian') {
      const threatened = this._mostThreatenedAlly(players);
      if (threatened && threatened !== player) {
        const guardX = (target.position.x + threatened.position.x) * 0.5;
        const guardY = (target.position.y + threatened.position.y) * 0.5;
        if (Math.hypot(guardX - player.position.x, guardY - player.position.y) > 0.8) {
          this._moveToward(input, guardX - player.position.x, guardY - player.position.y);
          return;
        }
      }
      if (distance > 1.35) this._moveToward(input, dx, dy);
      return;
    }

    const flankX = target.position.x - Math.sign(target.position.x - player.position.x || player.facing) * 0.9;
    const flankY = target.position.y + (player.playerIndex % 2 === 0 ? 0.55 : -0.55);
    const fx = flankX - player.position.x;
    const fy = flankY - player.position.y;
    if (distance > 1.25 || Math.hypot(fx, fy) > 0.6) this._moveToward(input, fx, fy);
  }

  _attackForRole(input, player, target, distance, role, brain, flow) {
    if (brain.attackTimer > 0 || !this._canAttack(player)) return;

    const range = role === 'controller' || role === 'skirmisher' ? RANGED_ATTACK_RANGE : MELEE_ATTACK_RANGE;
    if (distance > range) return;

    if ((role === 'controller' || role === 'skirmisher') && player.resources.mana > 20 && brain.comboStep % 3 === 1) {
      input.press(Actions.SPECIAL);
      brain.attackTimer = role === 'controller' ? 0.9 : 0.7;
      brain.comboStep += 1;
      return;
    }

    const heavy = role === 'guardian' || (role === 'assassin' && target.hp <= 90) || (flow?.bossActive && brain.comboStep % 4 === 3);
    input.press(heavy ? Actions.HEAVY : Actions.LIGHT);
    brain.comboStep += 1;
    brain.attackTimer = heavy ? 0.68 : 0.38;
  }

  _mostThreatenedAlly(players) {
    let best = null;
    let bestRatio = 1;
    for (const player of players) {
      if (!player || player.state === PlayerStates.DEAD || player.state === PlayerStates.DOWNED) continue;
      const ratio = player.resources.maxHealth > 0 ? player.resources.health / player.resources.maxHealth : 1;
      if (ratio < bestRatio) {
        best = player;
        bestRatio = ratio;
      }
    }
    return bestRatio < 0.55 ? best : null;
  }

  _anchorForRole(player, players, role) {
    const leader = players[0] || player;
    if (role === 'guardian') return { x: leader.position.x + 0.65, y: leader.position.y - 0.1 };
    if (role === 'skirmisher') return { x: leader.position.x - 1.4, y: leader.position.y + 0.7 };
    if (role === 'controller') return { x: leader.position.x - 2.1, y: leader.position.y + 0.2 };
    return { x: leader.position.x + 1.2, y: leader.position.y + 0.45 };
  }

  _strafe(input, player, target, direction) {
    const dy = target.position.y - player.position.y;
    if (Math.abs(dy) < 0.6) {
      input.press(direction > 0 ? Actions.MOVE_UP : Actions.MOVE_DOWN);
    } else {
      this._pressVertical(input, dy);
    }
  }

  _moveToward(input, dx, dy) {
    if (Math.abs(dx) > 0.2) input.press(dx > 0 ? Actions.MOVE_RIGHT : Actions.MOVE_LEFT);
    this._pressVertical(input, dy);
  }

  _moveAway(input, dx, dy) {
    if (Math.abs(dx) > 0.1) input.press(dx > 0 ? Actions.MOVE_LEFT : Actions.MOVE_RIGHT);
    if (Math.abs(dy) > 0.1) input.press(dy > 0 ? Actions.MOVE_DOWN : Actions.MOVE_UP);
  }

  _pressVertical(input, dy) {
    if (Math.abs(dy) <= 0.35) return;
    input.press(dy > 0 ? Actions.MOVE_UP : Actions.MOVE_DOWN);
  }
}

function createAiInputSnapshot(playerIndex) {
  return {
    playerIndex,
    pressed: new Set(),
    _prevFrame: new Set(),
    _buffer: [],

    beginFrame() {
      this._prevFrame = new Set(this.pressed);
      this.pressed.clear();
    },

    press(action) {
      this.pressed.add(action);
    },

    isDown(action) {
      return this.pressed.has(action);
    },

    justPressed(action) {
      return this.pressed.has(action) && !this._prevFrame.has(action);
    },

    justReleased(action) {
      return !this.pressed.has(action) && this._prevFrame.has(action);
    },

    consumeBuffered(action, maxFrames = BUFFER_MAX_FRAMES) {
      const index = this._buffer.findIndex(entry => entry.action === action && entry.age <= maxFrames);
      if (index === -1) return false;
      this._buffer.splice(index, 1);
      return true;
    },

    clearBuffer() {
      this._buffer.length = 0;
    },

    updateBuffer() {
      this._buffer = this._buffer
        .map(entry => ({ action: entry.action, age: entry.age + 1 }))
        .filter(entry => entry.age <= BUFFER_MAX_FRAMES);

      for (const action of BUFFERED_ACTIONS) {
        if (this.justPressed(action)) this._pushBuffered(action);
      }
    },

    _pushBuffered(action) {
      this._buffer = this._buffer.filter(entry => entry.action !== action);
      this._buffer.unshift({ action, age: 0 });
      if (this._buffer.length > BUFFER_MAX_ACTIONS) this._buffer.length = BUFFER_MAX_ACTIONS;
    },

    get moveVector() {
      const x = (this.isDown(Actions.MOVE_RIGHT) ? 1 : 0)
        - (this.isDown(Actions.MOVE_LEFT) ? 1 : 0);
      const y = (this.isDown(Actions.MOVE_UP) ? 1 : 0)
        - (this.isDown(Actions.MOVE_DOWN) ? 1 : 0);
      const len = Math.hypot(x, y);
      return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
    },
  };
}
