import { Actions } from '../engine/InputManager.js';
import { RunState } from '../core/RunState.js';

export class BossScreen {
  constructor(overlay, onVictory, onWipe) {
    this.overlay = overlay;
    this.onVictory = onVictory;
    this.onWipe = onWipe;
    this.container = null;
    this._active = false;
    this._ctx = null;
    this._bossId = null;
    this._victorySent = false;
    this._wipeSent = false;
  }

  bindContext(sceneManager) {
    this._ctx = sceneManager;
  }

  show(bossId = null) {
    if (!this._ctx) return;
    this._active = true;
    this._bossId = bossId;
    this._victorySent = false;
    this._wipeSent = false;

    this.container = document.createElement('div');
    this.container.id = 'boss-screen';
    this.container.innerHTML = `
      <style>
        #boss-screen {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 56;
          opacity: 0;
          transition: opacity 180ms ease;
          font-family: 'Inter', sans-serif;
        }
        #boss-screen.visible { opacity: 1; }
        .boss-panel {
          position: absolute;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          min-width: 260px;
          text-align: center;
          background: rgba(8, 9, 16, 0.86);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #f0f0f5;
          padding: 10px 14px;
          font-size: 12px;
        }
        .boss-name {
          font-family: 'Rajdhani', sans-serif;
          font-size: 18px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
      </style>
      <div class="boss-panel">
        <div class="boss-name" data-role="name">Boss</div>
        <div data-role="hp">HP 0 / 0</div>
      </div>
    `;

    this.overlay.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('visible'));
    this._nameEl = this.container.querySelector('[data-role="name"]');
    this._hpEl = this.container.querySelector('[data-role="hp"]');
    this._syncHud();
  }

  hide() {
    if (!this.container) return;
    this._active = false;
    const node = this.container;
    node.classList.remove('visible');
    setTimeout(() => {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 180);
    this.container = null;
    this._nameEl = null;
    this._hpEl = null;
  }

  update(input, dt) {
    if (!this._active || !this._ctx) return;

    this._ctx._updateZone(dt, input, {
      autoAdvanceBossGate: false,
    });

    this._syncHud();

    if (!this._victorySent && this._ctx.consumeScreenSignal('zoneCleared')) {
      this._victorySent = true;
      this.onVictory?.();
      return;
    }

    if (!this._wipeSent && this._ctx.consumeScreenSignal('wipe')) {
      this._wipeSent = true;
      this.onWipe?.();
      return;
    }

    if (input.justPressed(Actions.INTERACT) || input.justPressed(Actions.LIGHT) || input.justPressedKey('Enter')) {
      const route = this._ctx.spawner.getRouteState?.() || null;
      if (route?.gateOpen && route?.gateKind === 'boss') this._ctx.advanceZoneRoute(this._ctx._lastInputManager || null);
    }
  }

  _syncHud() {
    if (this._nameEl) {
      this._nameEl.textContent = (RunState.activeBossName || 'BOSS').toUpperCase();
    }

    if (this._hpEl && this._ctx) {
      const hp = this._ctx.getDebugInfo?.().bossHp || 0;
      const hpMax = this._ctx.getDebugInfo?.().bossHpMax || 0;
      this._hpEl.textContent = `HP ${Math.max(0, Math.round(hp))} / ${Math.max(0, Math.round(hpMax))}`;
    }
  }
}
