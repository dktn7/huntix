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
    ticks: 6,
    damage: 5,
    color: 0xb00020,
  },
  [StatusTypes.STUN]: {
    duration: 1.5,
    interval: 0,
    ticks: 0,
    damage: 0,
    color: 0xfff066,
  },
  [StatusTypes.SLOW]: {
    duration: 2,
    interval: 0,
    ticks: 0,
    damage: 0,
    color: 0x48f7ff,
  },
  [StatusTypes.BURN]: {
    duration: 3,
    interval: 0.75,
    ticks: 4,
    damage: 8,
    color: 0xff6a00,
  },
};

export class StatusEffects {
  /** Creates a deterministic status-effect container for one enemy. */
  constructor() {
    this._effects = new Map();
    this._pulse = 0;
  }

  /** Replaces any existing effect of the same type. */
  apply(type) {
    const config = STATUS_CONFIG[type];
    if (!config) return false;

    this._effects.set(type, {
      type,
      remaining: config.duration,
      intervalRemaining: config.interval,
      ticksRemaining: config.ticks,
    });
    return true;
  }

  /** Advances statuses and returns deterministic damage/status events. */
  update(dt, target) {
    const events = [];
    this._pulse += dt * 8;

    for (const [type, effect] of this._effects) {
      effect.remaining = Math.max(0, effect.remaining - dt);

      if (effect.ticksRemaining > 0) {
        effect.intervalRemaining -= dt;
        while (effect.intervalRemaining <= 0 && effect.ticksRemaining > 0) {
          effect.intervalRemaining += STATUS_CONFIG[type].interval;
          effect.ticksRemaining -= 1;
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

      if (effect.remaining <= 0 || effect.ticksRemaining < 0) {
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
    return this.has(StatusTypes.SLOW) ? 0.4 : 1;
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
    return 0.6 + Math.sin(this._pulse) * 0.25;
  }

  _damageFor(type) {
    const base = STATUS_CONFIG[type].damage;
    if (type === StatusTypes.BLEED && this.has(StatusTypes.SLOW)) return Math.ceil(base * 1.5);
    return base;
  }
}
