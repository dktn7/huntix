import * as THREE from 'three';
import { RunState } from '../core/RunState.js';
import { XP_THRESHOLDS } from './ProgressionData.js';

const DAMAGE_POOL_SIZE = 20;
const DAMAGE_LIFE_TICKS = 40;
const WAVE_FLASH_TICKS = 90;
const PLAYER_SLOTS = 4;
const HUNTER_LABELS = {
  dabik: 'Dabik',
  benzu: 'Benzu',
  sereisa: 'Sereisa',
  vesol: 'Vesol',
};
const HUNTER_IDS = ['dabik', 'benzu', 'sereisa', 'vesol'];

export class HUD {
  /** Creates Phase 5 DOM HUD and modal overlays inside the existing UI overlay. */
  constructor(overlay) {
    this.overlay = overlay;
    this._combos = new Array(PLAYER_SLOTS).fill(0);
    this._waveTicks = 0;
    this._zoneTicks = 0;
    this._bossVisible = false;
    this._bossPhaseFlash = 0;
    this._bossHp = 0;
    this._bossHpMax = 0;
    this._damageNumbers = [];
    this._projected = new THREE.Vector3();
    this._cardEntry = null;
    this._cardSelected = 0;
    this._characterSelectOpen = false;
    this._characterSelected = 0;

    this._playerSlots = [];
    for (let i = 0; i < PLAYER_SLOTS; i += 1) {
      this._playerSlots.push(this._createPlayerSlot(i));
    }

    this._waveEl = document.createElement('div');
    this._waveEl.className = 'wave-flash';
    this._waveEl.textContent = 'WAVE CLEAR';
    overlay.appendChild(this._waveEl);

    this._zoneEl = document.createElement('div');
    this._zoneEl.className = 'zone-title';
    this._zoneEl.textContent = 'CITY BREACH';
    overlay.appendChild(this._zoneEl);

    this._essenceEl = document.createElement('div');
    this._essenceEl.className = 'essence-counter';
    this._essenceEl.textContent = 'Essence 0';
    overlay.appendChild(this._essenceEl);

    this._weaponEl = document.createElement('div');
    this._weaponEl.className = 'weapon-slots';
    overlay.appendChild(this._weaponEl);
    this._weaponOneEl = document.createElement('span');
    this._weaponOneEl.className = 'weapon-slot';
    this._weaponEl.appendChild(this._weaponOneEl);
    this._weaponDividerEl = document.createElement('span');
    this._weaponDividerEl.className = 'weapon-divider';
    this._weaponDividerEl.textContent = '|';
    this._weaponEl.appendChild(this._weaponDividerEl);
    this._weaponTwoEl = document.createElement('span');
    this._weaponTwoEl.className = 'weapon-slot';
    this._weaponEl.appendChild(this._weaponTwoEl);

    this._bossWrapEl = document.createElement('div');
    this._bossWrapEl.className = 'boss-hud';
    overlay.appendChild(this._bossWrapEl);

    this._bossNameEl = document.createElement('div');
    this._bossNameEl.className = 'boss-name';
    this._bossNameEl.textContent = 'BOSS';
    this._bossWrapEl.appendChild(this._bossNameEl);

    this._bossBarEl = document.createElement('div');
    this._bossBarEl.className = 'boss-bar';
    this._bossWrapEl.appendChild(this._bossBarEl);

    this._bossFillEl = document.createElement('div');
    this._bossFillEl.className = 'boss-fill';
    this._bossBarEl.appendChild(this._bossFillEl);

    this._bossMarksEl = document.createElement('div');
    this._bossMarksEl.className = 'boss-marks';
    this._bossBarEl.appendChild(this._bossMarksEl);

    this._cardOverlay = document.createElement('div');
    this._cardOverlay.className = 'phase-modal card-screen';
    this._cardOverlay.setAttribute('aria-hidden', 'true');
    this._cardOverlay.addEventListener('mousedown', e => {
      const card = e.target.closest('.level-card');
      if (card && this._onCardClick) {
        this._cardSelected = parseInt(card.dataset.index, 10);
        this._renderCardSelection();
        this._onCardClick(card.dataset.id);
      }
    });
    overlay.appendChild(this._cardOverlay);

    this._characterOverlay = document.createElement('div');
    this._characterOverlay.className = 'phase-modal character-select';
    this._characterOverlay.setAttribute('aria-hidden', 'true');
    this._characterOverlay.addEventListener('mousedown', e => {
      const card = e.target.closest('.hunter-card');
      if (card && card.dataset.index && this._onCharacterClick) {
        this._characterSelected = parseInt(card.dataset.index, 10);
        this._renderCharacterSelect();
        this._onCharacterClick();
      }
    });
    overlay.appendChild(this._characterOverlay);

    this._onboardingOverlay = document.createElement('div');
    this._onboardingOverlay.className = 'phase-modal onboarding';
    this._onboardingOverlay.setAttribute('aria-hidden', 'true');
    overlay.appendChild(this._onboardingOverlay);

    for (let i = 0; i < DAMAGE_POOL_SIZE; i += 1) {
      const el = document.createElement('div');
      el.className = 'damage-number';
      overlay.appendChild(el);
      this._damageNumbers.push({
        el,
        ticks: 0,
        world: new THREE.Vector3(),
      });
    }
  }

  /** Advances transient HUD animations and syncs panels from RunState. */
  update(camera) {
    this._updatePlayers();
    this._updateWaveFlash();
    this._updateZoneTitle();
    this._updateBossBar();
    this._updateDamageNumbers(camera);
  }

  /** Sets P1 combo count (backward-compatible helper). */
  setCombo(count) {
    this._combos[0] = Math.max(0, count || 0);
  }

  /** Sets combo counts for all player slots by index. */
  setPlayerCombos(comboCounts = []) {
    for (let i = 0; i < PLAYER_SLOTS; i += 1) {
      this._combos[i] = Math.max(0, comboCounts[i] || 0);
    }
  }

  /** Shows a pooled floating damage number at a world position. */
  showDamageNumber(x, y, amount, kind = 'light') {
    const item = this._damageNumbers.find(entry => entry.ticks <= 0) || this._damageNumbers[0];
    item.ticks = DAMAGE_LIFE_TICKS;
    item.world.set(x, y + 0.6, 0);
    item.el.textContent = String(Math.round(amount));
    item.el.className = `damage-number ${kind}`;
    item.el.style.opacity = '1';
  }

  /** Flashes the wave-clear text. */
  showWaveClear() {
    this._waveTicks = WAVE_FLASH_TICKS;
  }

  /** Shows the zone title flash for the current zone entry. */
  showZoneTitle(zoneLabel, zoneNumber = 0) {
    const prefix = zoneNumber > 0 ? `ZONE ${zoneNumber} - ` : '';
    this._zoneEl.textContent = `${prefix}${zoneLabel}`.toUpperCase();
    this._zoneEl.style.opacity = '1';
    this._zoneTicks = 120;
  }

  /** Shows the boss bar for the active encounter. */
  setBossBar({ name, hp, hpMax, phaseThresholds = [] } = {}) {
    this._bossVisible = true;
    this._bossHp = Math.max(0, hp || 0);
    this._bossHpMax = Math.max(1, hpMax || 1);
    this._bossNameEl.textContent = (name || 'BOSS').toUpperCase();
    this._bossMarksEl.textContent = '';

    const widths = phaseThresholds
      .filter(value => value > 0 && value < 1)
      .map(value => `${(value * 100).toFixed(1)}%`);
    for (const width of widths) {
      const mark = document.createElement('span');
      mark.style.left = width;
      this._bossMarksEl.appendChild(mark);
    }

    this._bossWrapEl.classList.add('visible');
  }

  /** Updates the boss bar from live boss state. */
  updateBossBar(hp, hpMax, phase = 0) {
    if (!this._bossVisible) return;
    this._bossHp = Math.max(0, hp || 0);
    this._bossHpMax = Math.max(1, hpMax || 1);
    if (phase > 0) this._bossPhaseFlash = 14;
  }

  /** Hides the boss bar. */
  clearBossBar() {
    this._bossVisible = false;
    this._bossHp = 0;
    this._bossHpMax = 0;
    this._bossWrapEl.classList.remove('visible');
  }

  /** Opens a level-up card choice overlay from a queued RunState entry. */
  showCardScreen(entry) {
    if (!entry) return false;
    this._cardEntry = entry;
    this._cardSelected = 0;
    this._renderCardScreen();
    this._cardOverlay.classList.add('visible');
    this._cardOverlay.setAttribute('aria-hidden', 'false');
    return true;
  }

  /** Moves the selected level-up card. */
  moveCardSelection(delta) {
    if (!this._cardEntry?.choices?.length) return;
    const count = this._cardEntry.choices.length;
    this._cardSelected = (this._cardSelected + delta + count) % count;
    this._renderCardSelection();
  }

  /** Returns the currently selected card metadata for application by RunState. */
  confirmCardSelection() {
    if (!this._cardEntry?.choices?.length) return null;
    const choice = this._cardEntry.choices[this._cardSelected] || this._cardEntry.choices[0];
    return {
      playerIndex: this._cardEntry.playerIndex,
      level: this._cardEntry.level,
      cardId: choice.id,
    };
  }

  /** Hides the card overlay. */
  hideCardScreen() {
    this._cardEntry = null;
    this._cardOverlay.classList.remove('visible');
    this._cardOverlay.setAttribute('aria-hidden', 'true');
  }

  /** Returns true while a level-up card overlay is active. */
  isCardOpen() {
    return !!this._cardEntry;
  }

  /** Returns compact card overlay state for tests. */
  getCardState() {
    return {
      open: this.isCardOpen(),
      selectedIndex: this._cardSelected,
      playerIndex: this._cardEntry?.playerIndex ?? null,
      level: this._cardEntry?.level ?? null,
      choices: (this._cardEntry?.choices || []).map(card => ({
        id: card.id,
        name: card.name,
        category: card.category,
      })),
    };
  }

  /** Opens the first-load character select overlay. */
  showCharacterSelect(currentHunterId = 'dabik') {
    this._characterSelected = Math.max(0, HUNTER_IDS.indexOf(currentHunterId));
    this._characterSelectOpen = true;
    this._renderCharacterSelect();
    this._characterOverlay.classList.add('visible');
    this._characterOverlay.setAttribute('aria-hidden', 'false');
  }

  /** Moves the highlighted hunter in the character select overlay. */
  moveCharacterSelection(delta) {
    if (!this._characterSelectOpen) return;
    this._characterSelected = (this._characterSelected + delta + HUNTER_IDS.length) % HUNTER_IDS.length;
    this._renderCharacterSelect();
  }

  /** Confirms the selected hunter and closes the character select overlay. */
  confirmCharacterSelection() {
    if (!this._characterSelectOpen) return null;
    const hunterId = HUNTER_IDS[this._characterSelected] || HUNTER_IDS[0];
    this.hideCharacterSelect();
    return hunterId;
  }

  /** Hides the character select overlay without changing the selected hunter. */
  hideCharacterSelect() {
    this._characterSelectOpen = false;
    this._characterOverlay.classList.remove('visible');
    this._characterOverlay.setAttribute('aria-hidden', 'true');
  }

  /** Returns true while character select is blocking hub input. */
  isCharacterSelectOpen() {
    return this._characterSelectOpen;
  }

  /** Opens the first-load onboarding controls overlay. */
  showOnboarding() {
    this._onboardingOpen = true;
    this._renderOnboarding();
    this._onboardingOverlay.classList.add('visible');
    this._onboardingOverlay.setAttribute('aria-hidden', 'false');
  }

  /** Hides the onboarding overlay. */
  hideOnboarding() {
    this._onboardingOpen = false;
    this._onboardingOverlay.classList.remove('visible');
    this._onboardingOverlay.setAttribute('aria-hidden', 'true');
  }

  /** Returns true while onboarding is blocking hub input. */
  isOnboardingOpen() {
    return this._onboardingOpen;
  }

  /** Returns a compact HUD state snapshot for tests. */
  getState() {
    return {
      players: RunState.players.map(player => ({
        playerIndex: player.playerIndex,
        hp: player.hp,
        hpMax: player.hpMax,
        mana: player.mana,
        manaMax: player.manaMax,
        surge: player.surge,
        xp: player.xp,
        level: player.level,
        essence: player.essence,
        slot1WeaponId: player.slot1WeaponId,
        slot2WeaponId: player.slot2WeaponId,
        activeSlot: player.activeSlot,
      })),
      card: this.getCardState(),
      combos: [...this._combos],
      bossVisible: this._bossVisible,
      characterSelectOpen: this._characterSelectOpen,
      onboardingOpen: this._onboardingOpen,
    };
  }

  _createPlayerSlot(index) {
    const wrap = document.createElement('div');
    wrap.className = `player-hud p${index + 1}`;
    this.overlay.appendChild(wrap);

    const label = document.createElement('div');
    label.className = 'player-label';
    wrap.appendChild(label);

    const hpFill = this._createBar(wrap, 'hp');
    const manaFill = this._createBar(wrap, 'mana');
    const surgeFill = this._createBar(wrap, 'surge');

    const xpRow = document.createElement('div');
    xpRow.className = 'xp-row';
    wrap.appendChild(xpRow);

    const xpBar = document.createElement('div');
    xpBar.className = 'xp-bar';
    xpRow.appendChild(xpBar);

    const xpFill = document.createElement('div');
    xpFill.className = 'xp-fill';
    xpBar.appendChild(xpFill);

    const level = document.createElement('div');
    level.className = 'level-label';
    xpRow.appendChild(level);

    const spells = document.createElement('div');
    spells.className = 'spell-slots';
    wrap.appendChild(spells);
    const minor = this._createSpellSlot(spells, 'Minor');
    const advanced = this._createSpellSlot(spells, 'Adv');
    const ultimate = this._createSpellSlot(spells, 'Ult');

    const combo = document.createElement('div');
    combo.className = 'player-combo';
    combo.textContent = '';
    wrap.appendChild(combo);

    return { wrap, label, hpFill, manaFill, surgeFill, xpFill, level, minor, advanced, ultimate, combo };
  }

  _createBar(parent, kind) {
    const bar = document.createElement('div');
    bar.className = `resource-bar ${kind}`;
    parent.appendChild(bar);

    const fill = document.createElement('div');
    fill.className = 'resource-fill';
    bar.appendChild(fill);
    return fill;
  }

  _createSpellSlot(parent, label) {
    const slot = document.createElement('div');
    slot.className = 'spell-slot';
    slot.textContent = label;
    parent.appendChild(slot);
    return slot;
  }

  _updatePlayers() {
    for (let i = 0; i < PLAYER_SLOTS; i += 1) {
      const player = RunState.players[i];
      const slot = this._playerSlots[i];
      slot.wrap.classList.toggle('visible', !!player);
      if (!player) continue;

      slot.wrap.classList.toggle('downed', !!player.isDown);
      slot.label.textContent = `P${i + 1} ${HUNTER_LABELS[player.hunterId] || player.hunterId}`;
      slot.hpFill.style.width = `${this._pct(player.hp, player.hpMax)}%`;
      slot.manaFill.style.width = `${this._pct(player.mana, player.manaMax)}%`;
      slot.surgeFill.style.width = `${this._pct(player.surge, 100)}%`;
      slot.xpFill.style.width = `${this._xpPct(player)}%`;
      slot.level.textContent = `LVL ${player.level}`;
      slot.minor.classList.toggle('locked', !player.minorSpellId);
      slot.advanced.classList.toggle('locked', !player.advancedSpellId);
      slot.ultimate.classList.toggle('locked', !player.ultimateSpellId);
      slot.ultimate.classList.toggle('ready', player.surge >= 100 && !!player.ultimateSpellId);
      this._updatePlayerCombo(slot, this._combos[i] || 0);
    }

    const primary = RunState.players[0];
    this._essenceEl.textContent = `Essence ${primary?.essence || 0}`;
    this._renderWeaponSlots(primary);
  }

  _renderWeaponSlots(player) {
    if (!player) {
      this._weaponOneEl.textContent = '';
      this._weaponTwoEl.textContent = '';
      return;
    }

    const slot2 = player.slot2WeaponId || 'Empty';
    this._weaponOneEl.textContent = `S1 ${player.slot1WeaponId}`;
    this._weaponTwoEl.textContent = `S2 ${slot2}`;
    this._weaponOneEl.classList.toggle('active', player.activeSlot === 0);
    this._weaponTwoEl.classList.toggle('active', player.activeSlot === 1);
  }

  _updateWaveFlash() {
    if (this._waveTicks <= 0) {
      this._waveEl.style.opacity = '0';
      return;
    }

    this._waveTicks -= 1;
    const t = this._waveTicks / WAVE_FLASH_TICKS;
    this._waveEl.style.opacity = String(Math.min(1, t * 2));
    this._waveEl.style.transform = `translate(-50%, -50%) scale(${(1 + (1 - t) * 0.15).toFixed(2)})`;
  }

  _updateZoneTitle() {
    if (this._zoneTicks <= 0) {
      this._zoneEl.style.opacity = '0';
      return;
    }

    this._zoneTicks -= 1;
    const t = this._zoneTicks / 120;
    this._zoneEl.style.opacity = String(Math.min(1, t * 2));
    this._zoneEl.style.transform = `translate(-50%, -50%) scale(${(1 + (1 - t) * 0.08).toFixed(2)})`;
  }

  _updateBossBar() {
    if (!this._bossVisible) {
      this._bossWrapEl.classList.remove('visible');
      return;
    }

    const pct = this._bossHpMax > 0 ? this._bossHp / this._bossHpMax : 0;
    this._bossFillEl.style.width = `${Math.max(0, Math.min(1, pct)) * 100}%`;
    this._bossWrapEl.classList.add('visible');

    if (this._bossPhaseFlash > 0) {
      this._bossPhaseFlash -= 1;
      this._bossBarEl.classList.add('phase-flash');
    } else {
      this._bossBarEl.classList.remove('phase-flash');
    }
  }

  _updateDamageNumbers(camera) {
    for (const item of this._damageNumbers) {
      if (item.ticks <= 0) {
        item.el.style.opacity = '0';
        continue;
      }

      item.ticks -= 1;
      item.world.y += 0.015;
      this._projected.copy(item.world).project(camera);
      const x = (this._projected.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-this._projected.y * 0.5 + 0.5) * window.innerHeight;
      const opacity = item.ticks / DAMAGE_LIFE_TICKS;

      item.el.style.left = `${x.toFixed(1)}px`;
      item.el.style.top = `${y.toFixed(1)}px`;
      item.el.style.opacity = String(opacity);
    }
  }

  _renderCardScreen() {
    const entry = this._cardEntry;
    if (!entry) return;

    const player = RunState.players[entry.playerIndex];
    this._cardOverlay.textContent = '';

    const panel = document.createElement('div');
    panel.className = 'modal-panel card-panel';
    this._cardOverlay.appendChild(panel);

    const title = document.createElement('div');
    title.className = 'modal-title';
    title.textContent = `LEVEL ${entry.level} REACHED - P${entry.playerIndex + 1}`;
    panel.appendChild(title);

    const row = document.createElement('div');
    row.className = 'card-row';
    panel.appendChild(row);

    for (let i = 0; i < entry.choices.length; i += 1) {
      const card = entry.choices[i];
      const el = document.createElement('div');
      el.className = `level-card ${card.category}`;
      el.dataset.index = String(i);
      el.dataset.id = card.id;
      row.appendChild(el);

      const hotkey = document.createElement('div');
      hotkey.className = 'card-hotkey';
      hotkey.textContent = String.fromCharCode(65 + i);
      el.appendChild(hotkey);

      const name = document.createElement('div');
      name.className = 'card-name';
      name.textContent = card.name;
      el.appendChild(name);

      const category = document.createElement('div');
      category.className = 'card-category';
      category.textContent = card.category.toUpperCase();
      el.appendChild(category);

      const desc = document.createElement('div');
      desc.className = 'card-description';
      desc.textContent = card.description;
      el.appendChild(desc);
    }

    const build = document.createElement('div');
    build.className = 'build-panel';
    build.textContent = player
      ? `Build: ${player.ownedCards.join(', ') || 'No cards yet'} | Shop: ${player.activeShopItems.join(', ') || 'No items yet'} | Path: ${player.upgradePath || 'none'}`
      : '';
    panel.appendChild(build);

    const help = document.createElement('div');
    help.className = 'modal-help';
    help.textContent = 'A/B/C or Mouse: click card  |  Arrows/AD: choose  |  F/J: confirm';
    panel.appendChild(help);

    this._renderCardSelection();
  }

  _renderCardSelection() {
    const cards = this._cardOverlay.querySelectorAll('.level-card');
    for (let i = 0; i < cards.length; i += 1) {
      cards[i].classList.toggle('selected', i === this._cardSelected);
    }
  }

  _renderCharacterSelect() {
    this._characterOverlay.textContent = '';

    const panel = document.createElement('div');
    panel.className = 'modal-panel character-panel';
    this._characterOverlay.appendChild(panel);

    const title = document.createElement('div');
    title.className = 'modal-title';
    title.textContent = 'CHOOSE YOUR HUNTER';
    panel.appendChild(title);

    const row = document.createElement('div');
    row.className = 'hunter-row';
    panel.appendChild(row);

    for (let i = 0; i < HUNTER_IDS.length; i += 1) {
      const hunterId = HUNTER_IDS[i];
      const el = document.createElement('div');
      el.className = `hunter-card ${hunterId}`;
      el.dataset.index = String(i);
      el.classList.toggle('selected', i === this._characterSelected);
      
      const hotkey = document.createElement('div');
      hotkey.className = 'card-hotkey';
      hotkey.textContent = String(i + 1);
      el.appendChild(hotkey);

      const name = document.createElement('div');
      name.textContent = HUNTER_LABELS[hunterId];
      el.appendChild(name);

      row.appendChild(el);
    }

    const selected = HUNTER_IDS[this._characterSelected] || HUNTER_IDS[0];
    const detail = document.createElement('div');
    detail.className = 'character-detail';
    detail.textContent = `${HUNTER_LABELS[selected]} selected. Confirm to enter the base.`;
    panel.appendChild(detail);

    const help = document.createElement('div');
    help.className = 'modal-help';
    help.textContent = '1-4 or Mouse: select  |  Arrows/AD: choose  |  F/J: confirm';
    panel.appendChild(help);
  }

  _renderOnboarding() {
    this._onboardingOverlay.textContent = '';

    const panel = document.createElement('div');
    panel.className = 'modal-panel onboarding-panel';
    this._onboardingOverlay.appendChild(panel);

    const title = document.createElement('div');
    title.className = 'modal-title';
    title.textContent = 'HOW TO PLAY';
    panel.appendChild(title);

    const content = document.createElement('div');
    content.className = 'character-detail';
    content.style.fontSize = '14px';
    content.style.lineHeight = '1.6';
    content.innerHTML = `
      <strong>MOVEMENT:</strong> WASD or Arrow Keys<br>
      <strong>JUMP:</strong> Space Bar<br>
      <strong>DODGE:</strong> Left Shift<br>
      <strong>LIGHT ATTACK:</strong> J (or Left Click)<br>
      <strong>HEAVY ATTACK:</strong> K (or Right Click)<br>
      <strong>SPECIAL:</strong> E (Tap for Minor, Hold for Advanced)<br>
      <strong>ULTIMATE:</strong> E (When Surge bar is 100%)<br>
      <strong>INTERACT / SHOP:</strong> F or J
    `;
    panel.appendChild(content);

    const help = document.createElement('div');
    help.className = 'modal-help';
    help.textContent = 'Press any key to start your hunt.';
    panel.appendChild(help);
  }

  _updatePlayerCombo(slot, comboCount) {
    if (!slot?.combo) return;

    if (!comboCount || comboCount <= 0) {
      slot.combo.textContent = '';
      slot.combo.classList.remove('mid', 'high');
      return;
    }

    slot.combo.textContent = `Combo x${comboCount}`;
    slot.combo.classList.toggle('mid', comboCount >= 8 && comboCount < 16);
    slot.combo.classList.toggle('high', comboCount >= 16);
  }

  _pct(value, max) {
    if (!max || max <= 0) return 0;
    return Math.max(0, Math.min(100, (value / max) * 100));
  }

  _xpPct(player) {
    if (player.level >= 10) return 100;
    const currentThreshold = XP_THRESHOLDS[player.level] || 0;
    const nextThreshold = XP_THRESHOLDS[player.level + 1] || currentThreshold + 1;
    return this._pct(player.xp - currentThreshold, nextThreshold - currentThreshold);
  }
}
