import { Actions } from '../engine/InputManager.js';
import { RunState } from '../core/RunState.js';
import { ShopScreen } from './ShopScreen.js';

export class HubScreen {
  constructor(overlay, onEnterZone, onBack) {
    this.overlay = overlay;
    this.onEnterZone = onEnterZone;
    this.onBack = onBack;
    this.container = null;
    this._active = false;
    this._ctx = null;
    this._selection = 0;
    this.shopScreen = new ShopScreen(overlay);
  }

  bindContext(sceneManager) {
    this._ctx = sceneManager;
  }

  show() {
    this._active = true;
    this._selection = 0;
    if (this._ctx) this._ctx._switchToHub();

    this.container = document.createElement('div');
    this.container.id = 'hub-screen';
    this.container.innerHTML = `
      <style>
        #hub-screen {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 60;
          opacity: 0;
          transition: opacity 220ms ease;
          color: #f0f0f5;
          font-family: 'Inter', sans-serif;
        }
        #hub-screen.visible { opacity: 1; }
        .hub-panel {
          position: absolute;
          right: 18px;
          top: 18px;
          width: min(420px, 38vw);
          background: rgba(8, 9, 16, 0.84);
          border: 1px solid rgba(255, 255, 255, 0.14);
          padding: 14px;
          pointer-events: auto;
        }
        .hub-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 1rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .hub-summary {
          font-size: 12px;
          line-height: 1.5;
          margin-bottom: 10px;
          color: rgba(255, 255, 255, 0.84);
        }
        .hub-actions {
          display: grid;
          gap: 8px;
        }
        .hub-action {
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.04);
          color: #f0f0f5;
          text-align: left;
          padding: 8px 10px;
          font-size: 12px;
          pointer-events: auto;
          cursor: pointer;
        }
        .hub-action.selected {
          border-color: #f0f0f5;
          box-shadow: 0 0 0 1px rgba(240, 240, 245, 0.4) inset;
        }
        .hub-help {
          margin-top: 10px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
        }
      </style>
      <div class="hub-panel">
        <div class="hub-title">Hunter Hub</div>
        <div class="hub-summary" data-role="summary"></div>
        <div class="hub-actions">
          <button class="hub-action selected" data-index="0" type="button">Enter Portal</button>
          <button class="hub-action" data-index="1" type="button">Visit Shop</button>
          <button class="hub-action" data-index="2" type="button">Return to Title</button>
        </div>
        <div class="hub-help">F/J/Enter: confirm | W/S or arrows: select | Esc: pause | Shop: interact near Quartermaster</div>
      </div>
    `;

    this.overlay.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('visible'));

    this._summaryEl = this.container.querySelector('[data-role="summary"]');
    this._actionEls = [...this.container.querySelectorAll('.hub-action')];
    this._actionEls.forEach((el) => {
      el.addEventListener('click', () => {
        this._selection = parseInt(el.dataset.index || '0', 10);
        this._renderSelection();
        this._confirm();
      });
    });

    this._renderSummary();
  }

  hide() {
    if (!this.container) return;
    this._active = false;
    const node = this.container;
    node.classList.remove('visible');
    setTimeout(() => {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 220);
    this.container = null;
    this._summaryEl = null;
    this._actionEls = null;
  }

  update(input, dt = 0) {
    if (!this._active || !this._ctx) return;

    this._ctx._updateHub(dt, input, { allowPortalEnter: false });
    this._renderSummary();

    if (this.shopScreen?.isOpen?.()) return;

    const portalInteractor = this._ctx._getPortalInteractor?.(input) || null;
    if (portalInteractor) {
      const portal = this._ctx._findNearestUnlockedPortal?.(portalInteractor.position) || null;
      if (portal) {
        this.onEnterZone?.();
        return;
      }
    }

    if (input.justPressed(Actions.MOVE_UP)) {
      this._selection = (this._selection - 1 + 3) % 3;
      this._renderSelection();
    }
    if (input.justPressed(Actions.MOVE_DOWN)) {
      this._selection = (this._selection + 1) % 3;
      this._renderSelection();
    }

    if (
      input.justPressed(Actions.INTERACT)
      || input.justPressed(Actions.LIGHT)
      || input.justPressedKey('Enter')
    ) {
      this._confirm();
    }

  }

  _renderSummary() {
    if (!this._summaryEl) return;
    const players = RunState.players || [];
    if (!players.length) {
      this._summaryEl.textContent = 'No active run.';
      return;
    }

    const lines = players
      .filter(Boolean)
      .map(player => {
        const name = String(player.hunterId || 'hunter').toUpperCase();
        return `P${player.playerIndex + 1} ${name}  LVL ${player.level}  Essence ${player.essence}`;
      });

    lines.push(`Zones Cleared ${RunState.zonesCleared}/4`);
    this._summaryEl.innerHTML = lines.join('<br>');
  }

  _renderSelection() {
    if (!this._actionEls) return;
    this._actionEls.forEach((el, i) => {
      el.classList.toggle('selected', i === this._selection);
    });
  }

  _confirm() {
    if (this._selection === 0) {
      this.onEnterZone?.();
      return;
    }
    if (this._selection === 1) {
      this.shopScreen.show(0, Math.max(1, (RunState.zonesCleared || 0) + 1));
      return;
    }
    this.onBack?.();
  }
}
