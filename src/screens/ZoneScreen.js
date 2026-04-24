import { RunState } from '../core/RunState.js';

export class ZoneScreen {
  constructor(overlay, onBossReady, onBack) {
    this.overlay = overlay;
    this.onBossReady = onBossReady;
    this.onBack = onBack;
    this.container = null;
    this._active = false;
    this._ctx = null;
    this._zoneId = null;
    this._bossReadyNotified = false;
    this._routeLine = '';
  }

  bindContext(sceneManager) {
    this._ctx = sceneManager;
  }

  show(zoneId) {
    if (!this._ctx) return;
    this._active = true;
    this._bossReadyNotified = false;
    this._zoneId = zoneId || this._ctx._getDefaultZoneId();

    this._ctx._enterZone(this._zoneId, this._ctx._lastInputManager || null);

    this.container = document.createElement('div');
    this.container.id = 'zone-screen';
    this.container.innerHTML = `
      <style>
        #zone-screen {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 55;
          opacity: 0;
          transition: opacity 180ms ease;
          font-family: 'Inter', sans-serif;
        }
        #zone-screen.visible { opacity: 1; }
        .zone-panel {
          position: absolute;
          top: 18px;
          right: 18px;
          min-width: 220px;
          background: rgba(8, 9, 16, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #f0f0f5;
          padding: 10px 12px;
          font-size: 12px;
          line-height: 1.4;
        }
        .zone-title {
          font-family: 'Rajdhani', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          margin-bottom: 6px;
        }
        .zone-help {
          color: rgba(255, 255, 255, 0.62);
          margin-top: 6px;
        }
      </style>
      <div class="zone-panel">
        <div class="zone-title">Zone Combat</div>
        <div data-role="wave">Wave 1</div>
        <div data-role="route">Clear enemies to advance</div>
        <div class="zone-help">Move right to advance to the next encounter</div>
      </div>
    `;

    this.overlay.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('visible'));
    this._waveEl = this.container.querySelector('[data-role="wave"]');
    this._routeEl = this.container.querySelector('[data-role="route"]');
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
    this._waveEl = null;
    this._routeEl = null;
  }

  update(input, dt) {
    if (!this._active || !this._ctx) return;

    this._ctx._updateZone(dt, input, {
      autoAdvanceBossGate: false,
    });

    this._syncHud();
    const route = this._ctx.spawner.getRouteState?.() || null;
    const bossStarted = route?.zoneState === 'boss' || !!RunState.activeBossName;
    if (!this._bossReadyNotified && bossStarted) {
      this._bossReadyNotified = true;
      this.onBossReady?.();
    }
  }

  _syncHud() {
    const route = this._ctx?.spawner?.getRouteState?.() || null;
    if (!route) return;

    if (this._waveEl) {
      const wave = Math.max(1, (route.waveIndex ?? 0) + 1);
      this._waveEl.textContent = `Wave ${wave}`;
    }

    if (this._routeEl) {
      const gateText = route.gateOpen
        ? (route.gateKind === 'boss' ? 'Move right to boss' : 'Move right to next wave')
        : 'Combat in progress';
      this._routeEl.textContent = gateText;
    }
  }
}
