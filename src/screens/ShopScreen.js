import { ShopManager } from '../gameplay/ShopManager.js';

/**
 * Shop overlay screen shown from the Hunter Hub.
 * Wraps ShopManager, exposing show/hide/isOpen for HubScreen integration.
 */
export class ShopScreen {
  constructor(overlay) {
    this._manager = new ShopManager(overlay);
  }

  /** Opens the shop for the given player index and zone tier. */
  show(playerIndex = 0, zoneTier = 1) {
    this._manager.open(playerIndex, zoneTier);
  }

  /** Closes the shop overlay. */
  hide() {
    this._manager.close();
  }

  /** Returns true while the shop overlay is visible. */
  isOpen() {
    return this._manager.isOpen();
  }

  /** Forwards input to the shop manager each frame while open. */
  update(input) {
    return this._manager.update(input);
  }
}
