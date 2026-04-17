const DEFAULT_MAX_HEALTH = 900;
const DEFAULT_MAX_MANA = 120;
const DEFAULT_MAX_SURGE = 100;
const DEFAULT_MAX_STAMINA = 100;

export class ManaBar {
  /** Creates Dabik's health, mana, surge, and stamina resources. */
  constructor({
    maxHealth = DEFAULT_MAX_HEALTH,
    maxMana = DEFAULT_MAX_MANA,
    maxSurge = DEFAULT_MAX_SURGE,
    maxStamina = DEFAULT_MAX_STAMINA,
    manaRegenPerSecond = 3,
  } = {}) {
    this.maxHealth = maxHealth;
    this.maxMana = maxMana;
    this.maxSurge = maxSurge;
    this.maxStamina = maxStamina;

    this.health = maxHealth;
    this.mana = maxMana;
    this.surge = 0;
    this.stamina = maxStamina;

    this.manaRegenPerSecond = manaRegenPerSecond;
    this.staminaRegenPerSecond = 40;
  }

  /** Applies a hunter stat block while preserving current resource ratios when requested. */
  configure({
    maxHealth = this.maxHealth,
    maxMana = this.maxMana,
    maxSurge = this.maxSurge,
    maxStamina = this.maxStamina,
    manaRegenPerSecond = this.manaRegenPerSecond,
    refill = true,
  } = {}) {
    const healthRatio = this.maxHealth > 0 ? this.health / this.maxHealth : 1;
    const manaRatio = this.maxMana > 0 ? this.mana / this.maxMana : 1;

    this.maxHealth = maxHealth;
    this.maxMana = maxMana;
    this.maxSurge = maxSurge;
    this.maxStamina = maxStamina;
    this.manaRegenPerSecond = manaRegenPerSecond;

    this.health = refill ? maxHealth : Math.min(maxHealth, Math.round(maxHealth * healthRatio));
    this.mana = refill ? maxMana : Math.min(maxMana, Math.round(maxMana * manaRatio));
    this.surge = Math.min(this.surge, maxSurge);
    this.stamina = Math.min(this.stamina, maxStamina);
  }

  /** Regenerates mana and stamina for one fixed gameplay tick. */
  update(dt) {
    this.mana = Math.min(this.maxMana, this.mana + this.manaRegenPerSecond * dt);
    this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenPerSecond * dt);
  }

  /** Syncs zone-entry resources from the authoritative run player state. */
  syncZoneEntryFromRunState(runPlayer) {
    this.maxHealth = runPlayer.hpMax;
    this.maxMana = runPlayer.manaMax;
    this.health = Math.min(runPlayer.hp, this.maxHealth);
    this.mana = this.maxMana;
    this.surge = 0;
  }

  /** Syncs live HP from the authoritative run player state after zone clear healing. */
  syncHealthFromRunState(runPlayer) {
    this.maxHealth = runPlayer.hpMax;
    this.health = Math.min(runPlayer.hp, this.maxHealth);
  }

  /** Returns true when at least amount mana is available. */
  canSpendMana(amount) {
    return this.mana >= amount;
  }

  /** Spends mana and returns true when the cost was paid. */
  spendMana(amount) {
    if (!this.canSpendMana(amount)) return false;
    this.mana -= amount;
    return true;
  }

  /** Adds mana without exceeding the maximum. */
  gainMana(amount) {
    this.mana = Math.min(this.maxMana, this.mana + amount);
  }

  /** Spends stamina and returns true when the cost was paid. */
  spendStamina(amount) {
    if (this.stamina < amount) return false;
    this.stamina -= amount;
    return true;
  }

  /** Adds surge without exceeding the maximum. */
  gainSurge(amount) {
    this.surge = Math.min(this.maxSurge, this.surge + amount);
  }

  /** Returns true when surge is full. */
  isSurgeFull() {
    return this.surge >= this.maxSurge;
  }

  /** Consumes full surge and returns true if an ultimate can start. */
  consumeFullSurge() {
    if (!this.isSurgeFull()) return false;
    this.surge = 0;
    return true;
  }

  /** Applies health damage and returns true if the owner is still alive. */
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.gainSurge(amount * 0.5);
    return this.health > 0;
  }
}
