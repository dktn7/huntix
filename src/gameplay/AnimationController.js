import { PlayerStates } from './PlayerState.js';

const STATE_MAP = {
  [PlayerStates.IDLE]: { name: 'idle', loop: true },
  [PlayerStates.MOVE]: { name: 'run', loop: true },
  [PlayerStates.ATTACK_LIGHT]: { name: 'attack_light_1', loop: false },
  [PlayerStates.ATTACK_HEAVY]: { name: 'attack_heavy', loop: false },
  [PlayerStates.JUMP]: { name: 'jump', loop: false },
  [PlayerStates.JUMP_RISE]: { names: ['jump_rise', 'jump'], loop: false },
  [PlayerStates.JUMP_FALL]: { names: ['jump_fall', 'jump'], loop: false },
  [PlayerStates.LAND]: { names: ['land', 'jump'], loop: false },
  [PlayerStates.DODGE]: { name: 'dodge', loop: false },
  [PlayerStates.WEAPON_SWAP]: { name: 'weapon_swap', loop: false },
  [PlayerStates.SPELL_MINOR]: { name: 'spell_minor', loop: false },
  [PlayerStates.SPELL_ADVANCED]: { name: 'spell_advanced', loop: false },
  [PlayerStates.ULTIMATE]: { name: 'spell_ultimate', loop: false },
  [PlayerStates.HURT]: { name: 'hurt', loop: false },
  [PlayerStates.DEAD]: { name: 'dead', loop: false },
  [PlayerStates.DOWNED]: { name: 'downed', loop: true },
  [PlayerStates.REVIVE]: { name: 'revive', loop: false },
};

export class AnimationController {
  /** Connects PlayerState transitions to a SpriteAnimator instance. */
  constructor(playerState, animator = null) {
    this.playerState = playerState;
    this.animator = animator;
    this._lastKey = null;
  }

  /** Replaces the bound SpriteAnimator and restarts state sync. */
  setAnimator(animator) {
    this.animator = animator;
    this._lastKey = null;
  }

  /** Advances animation state and sprite UV stepping. */
  update(dt) {
    if (!this.animator) return;

    const mapped = this._mapState();
    const animationName = this._resolveAnimationName(mapped);
    const key = this.playerState.animationKey || this.playerState.state;
    if (this._lastKey !== key) {
      this.animator.play(animationName, mapped.loop);
      this._lastKey = key;
    }

    this.animator.update(dt);
  }

  _mapState() {
    if (this.playerState.state === PlayerStates.ATTACK_LIGHT) {
      const step = String(this.playerState.lightComboStep).padStart(2, '0');
      return { name: `attack_light_${step}`, loop: false };
    }
    return STATE_MAP[this.playerState.state] || STATE_MAP[PlayerStates.IDLE];
  }

  _resolveAnimationName(mapped) {
    if (mapped.name) return mapped.name;
    const candidates = mapped.names || ['idle'];
    if (typeof this.animator.hasState !== 'function') return candidates[0];
    return candidates.find(name => this.animator.hasState(name)) || candidates[candidates.length - 1];
  }
}
