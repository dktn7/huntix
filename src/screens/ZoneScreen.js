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
        .countdown-overlay, .wave-flash-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 100;
        }
        .countdown-image, .wave-flash-overlay img {
          max-width: 80%;
          max-height: 80%;
          object-fit: contain;
          animation: popIn 400ms cubic-bezier(0.17, 0.89, 0.32, 1.27) both;
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
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
    this._lastWaveIndex = -1;
    this._syncHud();
  }

  showCountdown(onDone) {
    if (!this.container) return;
    const frames = [
      './assets/ui/ui-countdown-3.jpeg',
      './assets/ui/ui-countdown-2.jpeg',
      './assets/ui/ui-countdown-1.jpeg',
      './assets/ui/ui-countdown-go.jpeg'
    ];
    let i = 0;
    const el = document.createElement('div');
    el.className = 'countdown-overlay';
    this.container.appendChild(el);

    const nextFrame = () => {
      if (i >= frames.length) {
        el.remove();
        onDone?.();
        return;
      }
      el.innerHTML = `<img src="${frames[i]}" class="countdown-image">`;
      i++;
      setTimeout(nextFrame, 900);
    };
    nextFrame();
  }

  _flashWave(waveNum) {
    if (!this.container || waveNum > 5) return;
    const el = document.createElement('div');
    el.className = 'wave-flash-overlay';
    el.innerHTML = `<img src="./assets/ui/ui-wave-${waveNum}.jpeg">`;
    this.container.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 300ms ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, 1200);
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
      
      if (this._lastWaveIndex !== route.waveIndex) {
        this._lastWaveIndex = route.waveIndex;
        this._flashWave(wave);
      }
    }

    if (this._routeEl) {
      const gateText = route.gateOpen
        ? (route.gateKind === 'boss' ? 'Move right to boss' : 'Move right to next wave')
        : 'Combat in progress';
      this._routeEl.textContent = gateText;
    }
  }
}
