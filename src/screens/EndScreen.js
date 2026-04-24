import { Actions } from '../engine/InputManager.js';

export class EndScreen {
  constructor(overlay, onContinue, onRestart) {
    this.overlay = overlay;
    this.onContinue = onContinue;
    this.onRestart = onRestart;
    this.container = null;
    this._active = false;
    this._ctx = null;
    this._summary = null;
    this._selection = 0;
  }

  bindContext(sceneManager) {
    this._ctx = sceneManager;
  }

  show(runSummary) {
    this._active = true;
    this._summary = runSummary || {};
    this._selection = 0;

    this.container = document.createElement('div');
    this.container.id = 'end-screen';

    const canContinue = !this._summary.runComplete;
    this.container.innerHTML = `
      <style>
        #end-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(6, 6, 10, 0.88);
          z-index: 120;
          opacity: 0;
          transition: opacity 220ms ease;
          pointer-events: auto;
          color: #f0f0f5;
          font-family: 'Inter', sans-serif;
        }
        #end-screen.visible { opacity: 1; }
        .end-panel {
          width: min(580px, 92vw);
          background: rgba(10, 11, 18, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.16);
          padding: 20px;
        }
        .end-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 30px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .end-sub {
          color: rgba(255, 255, 255, 0.74);
          margin-bottom: 14px;
          font-size: 13px;
        }
        .end-summary {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          line-height: 1.55;
          margin-bottom: 16px;
        }
        .end-actions {
          display: grid;
          gap: 8px;
        }
        .end-action {
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.05);
          color: #f0f0f5;
          text-align: left;
          padding: 10px 12px;
          font-size: 13px;
          cursor: pointer;
        }
        .end-action.selected {
          border-color: #f0f0f5;
          box-shadow: 0 0 0 1px rgba(240, 240, 245, 0.5) inset;
        }
      </style>
      <div class="end-panel">
        <div class="end-title">${this._summary.runComplete ? 'Gate Closed' : (this._summary.runWiped ? 'Hunter Down' : 'Zone Cleared')}</div>
        <div class="end-sub">Run Summary</div>
        <div class="end-summary" data-role="summary"></div>
        <div class="end-actions" data-role="actions">
          ${canContinue ? '<button class="end-action selected" data-index="0" type="button">Continue</button>' : ''}
          <button class="end-action ${canContinue ? '' : 'selected'}" data-index="${canContinue ? 1 : 0}" type="button">Play Again</button>
        </div>
      </div>
    `;

    this.overlay.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('visible'));

    this._summaryEl = this.container.querySelector('[data-role="summary"]');
    this._actionEls = [...this.container.querySelectorAll('.end-action')];
    this._actionEls.forEach((el) => {
      el.addEventListener('click', () => {
        this._selection = parseInt(el.dataset.index || '0', 10);
        this._renderSelection();
        this._confirm();
      });
    });

    this._renderSummary();
    this._renderSelection();
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

  update(input) {
    if (!this._active) return;

    const maxIndex = Math.max(0, (this._actionEls?.length || 1) - 1);
    if (input.justPressed(Actions.MOVE_UP) || input.justPressed(Actions.MOVE_LEFT)) {
      this._selection = (this._selection - 1 + maxIndex + 1) % (maxIndex + 1);
      this._renderSelection();
    }
    if (input.justPressed(Actions.MOVE_DOWN) || input.justPressed(Actions.MOVE_RIGHT)) {
      this._selection = (this._selection + 1) % (maxIndex + 1);
      this._renderSelection();
    }

    if (
      input.justPressed(Actions.INTERACT)
      || input.justPressed(Actions.LIGHT)
      || input.justPressedKey('Enter')
      || input.justPressed(Actions.PAUSE)
    ) {
      this._confirm();
    }
  }

  _renderSummary() {
    if (!this._summaryEl) return;
    const summary = this._summary || {};
    const lines = [
      `Zones Cleared: ${summary.zonesCleared ?? 0} / 4`,
      `XP Gained: ${summary.xpGained ?? 0}`,
      `Essence Gained: ${summary.essenceGained ?? 0}`,
      `Result: ${summary.runComplete ? 'Run Complete' : (summary.runWiped ? 'Wipe' : 'Continue')}`,
    ];
    this._summaryEl.innerHTML = lines.join('<br>');
  }

  _renderSelection() {
    if (!this._actionEls) return;
    this._actionEls.forEach((el, index) => {
      el.classList.toggle('selected', index === this._selection);
    });
  }

  _confirm() {
    const selectionCount = this._actionEls?.length || 1;
    const canContinue = selectionCount === 2;

    if (canContinue) {
      if (this._selection === 0) {
        this.onContinue?.();
      } else {
        this.onRestart?.();
      }
      return;
    }

    this.onRestart?.();
  }
}
