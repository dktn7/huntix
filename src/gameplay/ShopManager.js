import { Actions } from '../engine/InputManager.js';
import { RunState } from '../core/RunState.js';
import { SHOP_ITEMS } from './ProgressionData.js';

const SHOP_SIZE = 5;
const REROLL_COST = 30;
const CATEGORY_WEIGHT = {
  power: 25,
  survival: 25,
  mobility: 20,
  spell: 18,
  utility: 15,
  cosmetic: 15,
  weapon: 20,
};

export class ShopManager {
  /** Creates the Phase 5 hub shop overlay and purchase flow controller. */
  constructor(overlay) {
    this.overlay = overlay;
    this.playerIndex = 0;
    this.zoneTier = 1;
    this.visitKey = null;
    this.offers = [];
    this.selectedIndex = 0;
    this.visible = false;
    this._purchasedOfferIds = new Set();

    this._root = document.createElement('div');
    this._root.className = 'phase-modal shop-screen';
    this._root.setAttribute('aria-hidden', 'true');
    this._root.addEventListener('mousedown', e => {
      const card = e.target.closest('.shop-card');
      if (card && card.dataset.index) {
        this.selectedIndex = parseInt(card.dataset.index, 10);
        this.purchaseSelected();
      }
    });
    overlay.appendChild(this._root);

    this._panel = document.createElement('div');
    this._panel.className = 'modal-panel shop-panel';
    this._root.appendChild(this._panel);

    this._title = document.createElement('div');
    this._title.className = 'modal-title';
    this._panel.appendChild(this._title);

    this._offerRow = document.createElement('div');
    this._offerRow.className = 'shop-row';
    this._panel.appendChild(this._offerRow);

    this._offerEls = [];
    for (let i = 0; i < SHOP_SIZE; i += 1) {
      const offer = document.createElement('div');
      offer.className = 'shop-card';
      this._offerRow.appendChild(offer);
      this._offerEls.push(offer);
    }

    this._detail = document.createElement('div');
    this._detail.className = 'shop-detail';
    this._panel.appendChild(this._detail);

    this._help = document.createElement('div');
    this._help.className = 'modal-help';
    this._help.textContent = '1-5 or Mouse: buy  |  Arrows/AD: choose  |  F/J: buy  |  K: reroll  |  Shift/Esc: close';
    this._panel.appendChild(this._help);
  }

  /** Opens the shop for a player and initializes the current visit if needed. */
  open(playerIndex = 0, zoneTier = 1) {
    this.playerIndex = playerIndex;
    this.zoneTier = Math.max(1, Math.min(4, zoneTier || 1));
    const nextVisitKey = `${RunState.runId}:${RunState.zonesCleared}:${playerIndex}`;
    if (this.visitKey !== nextVisitKey || this.offers.length === 0) {
      this.visitKey = nextVisitKey;
      this.selectedIndex = 0;
      this._purchasedOfferIds.clear();
      this._drawOffers();
    }

    this.visible = true;
    this._root.classList.add('visible');
    this._root.setAttribute('aria-hidden', 'false');
    this._render();
  }

  /** Closes the shop overlay. */
  close() {
    this.visible = false;
    this._root.classList.remove('visible');
    this._root.setAttribute('aria-hidden', 'true');
  }

  /** Returns true while the shop overlay is visible. */
  isOpen() {
    return this.visible;
  }

  /** Handles shop navigation and actions from InputManager snapshots. */
  update(input) {
    if (!this.visible || !input) return null;

    if (input.justPressed(Actions.MOVE_LEFT)) this.moveSelection(-1);
    if (input.justPressed(Actions.MOVE_RIGHT)) this.moveSelection(1);

    // Direct numeric selection (1-5)
    for (let i = 0; i < SHOP_SIZE; i += 1) {
      if (input.justPressedKey(`Digit${i + 1}`)) {
        return this.purchaseSelected(i);
      }
    }

    if (input.justPressed(Actions.HEAVY)) return this.reroll();
    if (input.justPressed(Actions.INTERACT) || input.justPressed(Actions.LIGHT)) {
      return this.purchaseSelected();
    }
    if (input.justPressed(Actions.DODGE) || input.justPressed(Actions.PAUSE) || input.justPressed(Actions.SPECIAL)) {
      this.close();
      return { ok: true, action: 'close' };
    }
    return null;
  }

  /** Moves selected shop offer. */
  moveSelection(delta) {
    if (!this.offers.length) return;
    this.selectedIndex = (this.selectedIndex + delta + this.offers.length) % this.offers.length;
    this._render();
  }

  /** Attempts to buy the selected offer for the active player. */
  purchaseSelected(index = this.selectedIndex) {
    const offer = this.offers[index];
    if (!offer || this._purchasedOfferIds.has(offer.id)) return { ok: false, reason: 'no-offer' };

    const result = RunState.applyShopItem(this.playerIndex, offer.id, { free: !!offer.free });
    if (!result.ok) {
      this._render(result.reason);
      return result;
    }

    this._purchasedOfferIds.add(offer.id);
    this._render('Purchased');
    return { ...result, action: 'purchase' };
  }

  /** Rerolls the active shop if the player can pay the reroll cost. */
  reroll() {
    const player = RunState.players[this.playerIndex];
    if (!player || player.essence < REROLL_COST) {
      this._render('Need 30 Essence');
      return { ok: false, reason: 'insufficient-essence' };
    }

    RunState.addEssence(this.playerIndex, -REROLL_COST);
    this.selectedIndex = 0;
    this._drawOffers();
    this._render('Rerolled');
    return { ok: true, action: 'reroll' };
  }

  /** Returns a compact shop state snapshot for tests. */
  getState() {
    const player = RunState.players[this.playerIndex];
    return {
      open: this.visible,
      playerIndex: this.playerIndex,
      selectedIndex: this.selectedIndex,
      essence: player?.essence ?? 0,
      purchasesThisVisit: player?.shopBuysThisVisit ?? 0,
      offers: this.offers.map(offer => ({
        id: offer.id,
        name: offer.name,
        category: offer.category,
        cost: offer.cost,
        free: !!offer.free,
        purchased: this._purchasedOfferIds.has(offer.id),
      })),
    };
  }

  _drawOffers() {
    const player = RunState.players[this.playerIndex];
    if (!player) {
      this.offers = [];
      return;
    }

    const pool = SHOP_ITEMS
      .filter(item => this._isUnlocked(item, player))
      .filter(item => item.consumable || !player.activeShopItems.includes(item.id));

    const offers = [];
    if (RunState.zonesCleared > 0) {
      const cosmetic = pool.find(item => item.cosmetic && !player.activeShopItems.includes(item.id));
      if (cosmetic) offers.push({ ...cosmetic, free: true });
    }

    const candidates = pool.filter(item => !offers.some(offer => offer.id === item.id));
    while (offers.length < SHOP_SIZE && candidates.length > 0) {
      const picked = this._drawWeighted(candidates, player);
      if (!picked) break;
      offers.push({ ...picked, free: false });
      candidates.splice(candidates.indexOf(picked), 1);
    }

    if (!offers.some(item => item.category !== 'cosmetic')) {
      const nonCosmetic = pool.find(item => item.category !== 'cosmetic');
      if (nonCosmetic) offers[0] = { ...nonCosmetic, free: false };
    }

    this.offers = offers.slice(0, SHOP_SIZE);
  }

  _drawWeighted(candidates, player) {
    let total = 0;
    for (const item of candidates) total += this._weight(item, player);
    if (total <= 0) return candidates[0] || null;

    let roll = Math.random() * total;
    for (const item of candidates) {
      roll -= this._weight(item, player);
      if (roll <= 0) return item;
    }
    return candidates[candidates.length - 1] || null;
  }

  _weight(item, player) {
    let weight = CATEGORY_WEIGHT[item.category] || 10;
    if (item.hunterAffinity === player.hunterId) weight *= 1.5;
    if (player.level >= 7 && player.upgradePath && item.category === player.upgradePath) weight *= 2.5;
    if (player.level >= 7 && player.upgradePath === 'style' && item.category === 'cosmetic') weight *= 3;
    return weight;
  }

  _isUnlocked(item, player) {
    if (item.cosmetic && RunState.zonesCleared === 0) return false;
    if (item.tier > this.zoneTier) return false;
    if (item.requiresLevel && player.level < item.requiresLevel) return false;
    if (item.category === 'spell' && player.level < 3) return false;
    return true;
  }

  _render(status = '') {
    const player = RunState.players[this.playerIndex];
    this._title.textContent = `QUARTERMASTER - Essence ${player?.essence || 0}`;

    for (let i = 0; i < this._offerEls.length; i += 1) {
      const offer = this.offers[i];
      const el = this._offerEls[i];
      el.textContent = '';
      el.className = 'shop-card';
      el.dataset.index = String(i);
      el.dataset.id = offer?.id || '';
      el.classList.toggle('selected', i === this.selectedIndex);

      if (!offer) {
        el.classList.add('disabled');
        continue;
      }

      const hotkey = document.createElement('div');
      hotkey.className = 'card-hotkey';
      hotkey.textContent = String(i + 1);
      el.appendChild(hotkey);

      const purchased = this._purchasedOfferIds.has(offer.id);
      const canAfford = offer.free || ((player?.essence || 0) >= offer.cost);
      const limitHit = !offer.free && (player?.shopBuysThisVisit || 0) >= 2;
      el.classList.toggle('disabled', purchased || !canAfford || limitHit);
      el.classList.toggle('purchased', purchased);
      el.classList.add(offer.category);

      const name = document.createElement('div');
      name.className = 'shop-name';
      name.textContent = offer.name;
      el.appendChild(name);

      const category = document.createElement('div');
      category.className = 'shop-category';
      category.textContent = offer.category.toUpperCase();
      el.appendChild(category);

      const cost = document.createElement('div');
      cost.className = 'shop-cost';
      cost.textContent = offer.free ? 'FREE' : `${offer.cost} Essence`;
      el.appendChild(cost);
    }

    const selected = this.offers[this.selectedIndex];
    if (!selected) {
      this._detail.textContent = status || 'No item selected.';
      return;
    }

    const remaining = Math.max(0, 2 - (player?.shopBuysThisVisit || 0));
    const purchased = this._purchasedOfferIds.has(selected.id) ? 'Already purchased. ' : '';
    const suffix = status ? ` ${status}.` : '';
    this._detail.textContent = `${purchased}${selected.name}: ${selected.description} Purchases remaining: ${remaining}/2. Reroll: ${REROLL_COST} Essence.${suffix}`;
  }
}
