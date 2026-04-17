export const HitboxShapes = {
  AABB: 'AABB',
  ARC: 'ARC',
};

export const HitboxOwners = {
  PLAYER: 'player',
  ENEMY: 'enemy',
};

export class Hitbox {
  /** Creates a gameplay hitbox on the X/Y combat plane. */
  constructor({
    shape = HitboxShapes.AABB,
    x = 0,
    y = 0,
    width = 1,
    height = 1,
    centerX = x + width / 2,
    centerY = y + height / 2,
    radius = 1,
    facing = 1,
    arcCos = 0,
    damage = 0,
    knockbackX = 0,
    knockbackY = 0,
    owner = null,
    ownerTag = null,
    targetTag = null,
    lifetime = 0,
    attackId = 0,
    attackType = '',
    statusType = null,
  } = {}) {
    this.shape = shape;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.facing = facing >= 0 ? 1 : -1;
    this.arcCos = arcCos;
    this.damage = damage;
    this.knockbackX = knockbackX;
    this.knockbackY = knockbackY;
    this.owner = owner;
    this.ownerTag = ownerTag;
    this.targetTag = targetTag;
    this.lifetime = lifetime;
    this.attackId = attackId;
    this.attackType = attackType;
    this.statusType = statusType;
    this._hitIds = new Set();
  }

  /** Advances lifetime and returns true while this hitbox remains active. */
  update(dt) {
    if (this.lifetime <= 0) return false;
    this.lifetime = Math.max(0, this.lifetime - dt);
    return this.lifetime > 0;
  }

  /** Returns true when this hitbox overlaps a target hurtbox. */
  intersects(other) {
    if (!other) return false;
    if (this.shape === HitboxShapes.ARC) return this._arcIntersects(other);

    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }

  /** Returns true if this hitbox has already hit the supplied target id. */
  hasHit(targetId) {
    return this._hitIds.has(targetId);
  }

  /** Marks the supplied target id as already hit by this hitbox. */
  markHit(targetId) {
    this._hitIds.add(targetId);
  }

  /** Applies damage and knockback to a target that supports takeDamage(). */
  applyHit(target, source = this.owner, hitMeta = {}) {
    if (!target || typeof target.takeDamage !== 'function') return false;

    const knockback = this._resolveKnockback(target, source);
    target.takeDamage(this.damage, knockback, {
      attackType: this.attackType,
      attackId: this.attackId,
      ownerTag: this.ownerTag,
      statusType: this.statusType,
      ...hitMeta,
    });
    return true;
  }

  /** Returns a copy of this hitbox moved by dx/dy. */
  translated(dx, dy) {
    return new Hitbox({
      shape: this.shape,
      x: this.x + dx,
      y: this.y + dy,
      width: this.width,
      height: this.height,
      centerX: this.centerX + dx,
      centerY: this.centerY + dy,
      radius: this.radius,
      facing: this.facing,
      arcCos: this.arcCos,
      damage: this.damage,
      knockbackX: this.knockbackX,
      knockbackY: this.knockbackY,
      owner: this.owner,
      ownerTag: this.ownerTag,
      targetTag: this.targetTag,
      lifetime: this.lifetime,
      attackId: this.attackId,
      attackType: this.attackType,
      statusType: this.statusType,
    });
  }

  _arcIntersects(other) {
    const targetX = other.x + other.width / 2;
    const targetY = other.y + other.height / 2;
    const dx = targetX - this.centerX;
    const dy = targetY - this.centerY;
    const distance = Math.hypot(dx, dy);
    const reach = this.radius + Math.max(other.width, other.height) * 0.3;
    if (distance > reach) return false;

    const len = distance || 1;
    const forwardDot = (dx / len) * this.facing;
    return forwardDot >= this.arcCos;
  }

  _resolveKnockback(target, source) {
    if (this.knockbackX !== 0 || this.knockbackY !== 0) {
      return { x: this.knockbackX, y: this.knockbackY };
    }

    const targetX = target.combatCenterX ?? target.position?.x ?? this.x;
    const targetY = target.combatCenterY ?? target.position?.y ?? this.y;
    const sourceX = source?.combatCenterX ?? source?.position?.x ?? this.x;
    const sourceY = source?.combatCenterY ?? source?.position?.y ?? this.y;
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const len = Math.hypot(dx, dy) || 1;

    return {
      x: (dx / len) * 2.5,
      y: (dy / len) * 1.2,
    };
  }
}
