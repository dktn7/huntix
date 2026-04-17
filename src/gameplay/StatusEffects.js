export const StatusTypes = {
  BLEED: 'BLEED',
  STUN: 'STUN',
  SLOW: 'SLOW',
  BURN: 'BURN',
};

const STATUS_CONFIG = {
  [StatusTypes.BLEED]: {
    duration: 3,
    interval: 0.5,
    damage: 18,
    color: 0xb00020,
  },
  [StatusTypes.STUN]: {
    duration: 1.2,
    interval: 0,
    damage: 0,
    color: 0xfff066,
  },
  [StatusTypes.SLOW]: {
    duration: 2,
    interval: 0,
    damage: 0,
    color: 0x48f7ff,
  },
  [StatusTypes.BURN]: {
    duration: 3,
    interval: 0.5,
    damage: 22,
    color: 0xff6a00,
  },
};

const MAX_STACKS = 3;

export class StatusEffects {
  /** Creates a deterministic status-effect container for one enemy. */
  constructor() {
    this._effects = new Map();
    this._pulse = 0;
  }

  /** Applies a capped stack of the supplied status, refreshing duration at max stacks. */
  apply(type, stacks = 1) {
    const config = STATUS_CONFIG[type];
    if (!config) return false;

    const current = this._effects.get(type);
    const nextStacks = Math.min(MAX_STACKS, (current?.stacks || 0) + stacks);
    this._effects.set(type, {
      type,
      stacks: nextStacks,
      remaining: config.duration,
      intervalRemaining: current?.intervalRemaining ?? config.interval,
    });
    return true;
  }

  /** Advances statuses and returns deterministic damage/status events. */
  update(dt, target) {
    const events = [];
    this._pulse += dt * 8;

    for (const [type, effect] of this._effects) {
      effect.remaining = Math.max(0, effect.remaining - dt);

      if (STATUS_CONFIG[type].interval > 0) {
        effect.intervalRemaining -= dt;
        while (effect.intervalRemaining <= 0 && effect.remaining > 0) {
          effect.intervalRemaining += STATUS_CONFIG[type].interval;
          const damage = this._damageFor(type);
          if (typeof target.applyStatusDamage === 'function') {
            target.applyStatusDamage(damage, type);
          }
          events.push({
            type: 'statusDamage',
            statusType: type,
            damage,
            x: target.position.x,
            y: target.position.y,
          });
        }
      }

      if (effect.remaining <= 0) {
        this._effects.delete(type);
      }
    }

    return events;
  }

  /** Returns true when the status is currently active. */
  has(type) {
    return this._effects.has(type);
  }

  /** Returns the movement speed multiplier from active statuses. */
  getSpeedMultiplier() {
    const slow = this._effects.get(StatusTypes.SLOW);
    if (!slow) return 1;
    return Math.max(0.4, 1 - slow.stacks * 0.2);
  }

  /** Returns true when the owner should be frozen by stun. */
  isStunned() {
    return this.has(StatusTypes.STUN);
  }

  /** Returns a display color for the most important active status. */
  getDisplayColor() {
    if (this.has(StatusTypes.STUN)) return STATUS_CONFIG[StatusTypes.STUN].color;
    if (this.has(StatusTypes.BURN)) return STATUS_CONFIG[StatusTypes.BURN].color;
    if (this.has(StatusTypes.BLEED)) return STATUS_CONFIG[StatusTypes.BLEED].color;
    if (this.has(StatusTypes.SLOW)) return STATUS_CONFIG[StatusTypes.SLOW].color;
    return null;
  }

  /** Returns a pulsing intensity for status point-light feedback. */
  getPulseIntensity() {
    if (!this.getDisplayColor()) return 0;
    return 0.6 + Math.sin(this._pulse) * 0.25 + (this.getHighestStackCount() - 1) * 0.15;
  }

  /** Returns the active stack count for the supplied status. */
  getStackCount(type) {
    return this._effects.get(type)?.stacks || 0;
  }

  /** Returns the highest active status stack count. */
  getHighestStackCount() {
    let count = 0;
    for (const effect of this._effects.values()) {
      count = Math.max(count, effect.stacks || 0);
    }
    return count;
  }

  _damageFor(type) {
    const base = STATUS_CONFIG[type].damage;
    const stacks = this.getStackCount(type) || 1;
    const damage = base * stacks;
    if (type === StatusTypes.BLEED && this.has(StatusTypes.SLOW)) return Math.ceil(damage * 1.5);
    return damage;
  }
}
