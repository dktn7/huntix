const PUSH_SLOP = 0.02;
const MAX_PUSH_PER_PAIR = 0.24;

export class CollisionResolver {
  /** Softly separates active gameplay bodies without applying combat damage. */
  resolve(player, enemies) {
    if (!player || !Array.isArray(enemies)) return;

    const liveEnemies = enemies.filter(enemy => enemy && !enemy.isDead?.());
    for (const enemy of liveEnemies) {
      this._resolvePair(player, enemy, 0.65, 0.35);
    }

    for (let i = 0; i < liveEnemies.length; i += 1) {
      for (let j = i + 1; j < liveEnemies.length; j += 1) {
        this._resolvePair(liveEnemies[i], liveEnemies[j], 0.5, 0.5);
      }
    }
  }

  _resolvePair(a, b, aWeight, bWeight) {
    const aBox = a.getBodyBounds?.();
    const bBox = b.getBodyBounds?.();
    if (!aBox || !bBox) return;

    const overlapX = Math.min(aBox.x + aBox.width, bBox.x + bBox.width) - Math.max(aBox.x, bBox.x);
    const overlapY = Math.min(aBox.y + aBox.height, bBox.y + bBox.height) - Math.max(aBox.y, bBox.y);
    if (overlapX <= 0 || overlapY <= 0) return;

    const amount = Math.min((overlapX < overlapY ? overlapX : overlapY) + PUSH_SLOP, MAX_PUSH_PER_PAIR);
    if (overlapX < overlapY) {
      const sign = this._separationSign(aBox.x + aBox.width / 2, bBox.x + bBox.width / 2, a, b);
      this._displace(a, sign * amount * aWeight, 0);
      this._displace(b, -sign * amount * bWeight, 0);
      return;
    }

    const sign = this._separationSign(aBox.y + aBox.height / 2, bBox.y + bBox.height / 2, a, b);
    this._displace(a, 0, sign * amount * aWeight);
    this._displace(b, 0, -sign * amount * bWeight);
  }

  _separationSign(aCenter, bCenter, a, b) {
    if (aCenter < bCenter) return -1;
    if (aCenter > bCenter) return 1;
    return this._stableId(a) <= this._stableId(b) ? -1 : 1;
  }

  _stableId(body) {
    return typeof body.id === 'number' ? body.id : 0;
  }

  _displace(body, dx, dy) {
    if (typeof body.displace === 'function') body.displace(dx, dy);
  }
}
