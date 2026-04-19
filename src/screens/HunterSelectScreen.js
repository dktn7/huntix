import { Actions } from '../engine/InputManager.js';
import { RunState } from '../core/RunState.js';

export class HunterSelectScreen {
  constructor(overlay, onConfirm, onBack) {
    this.overlay = overlay;
    this.onConfirm = onConfirm;
    this.onBack = onBack;
    this.container = null;
    this._active = false;
    
    this.hunters = [
      {
        id: 'dabik',
        name: 'Dabik',
        title: 'Shadow Striker',
        element: 'Shadow',
        status: 'Bleed',
        stats: { hp: 3, spd: 9, dmg: 6, def: 3 },
        quote: '“Silence is the last thing you hear.”',
        aura: 'var(--aura-dabik)'
      },
      {
        id: 'benzu',
        name: 'Benzu',
        title: 'Iron Breaker',
        element: 'Thunder/Earth',
        status: 'Stun',
        stats: { hp: 10, spd: 4, dmg: 10, def: 9 },
        quote: '“I don’t dodge. I don’t need to.”',
        aura: 'var(--aura-benzu)'
      },
      {
        id: 'sereisa',
        name: 'Sereisa',
        title: 'Storm Chaser',
        element: 'Lightning',
        status: 'Slow',
        stats: { hp: 6, spd: 8, dmg: 7, def: 5 },
        quote: '“You blinked. That’s why you lost.”',
        aura: 'var(--aura-sereisa)'
      },
      {
        id: 'vesol',
        name: 'Vesol',
        title: 'Ember Mage',
        element: 'Flame',
        status: 'Burn',
        stats: { hp: 5, spd: 6, dmg: 8, def: 4 },
        quote: '“The gate burns. So does everything in it.”',
        aura: 'var(--aura-vesol)'
      }
    ];

    this.playerSelections = [0, -1, -1, -1]; // -1 means no player/AI
    this.cursorIndex = 0;
    this.isCoop = false;
  }

  setCoop(enabled) {
    this.isCoop = enabled;
    if (enabled) {
      // Default co-op setup: P1 selected, others waiting
      this.playerSelections = [0, -1, -1, -1];
    } else {
      // Single player
      this.playerSelections = [0, -1, -1, -1];
    }
  }

  show() {
    this._active = true;
    this.container = document.createElement('div');
    this.container.id = 'hunter-select';
    this.container.innerHTML = `
      <style>
        #hunter-select {
          position: fixed;
          inset: 0;
          background: var(--color-void);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 100;
          opacity: 0;
          transition: opacity 300ms ease;
          pointer-events: auto;
          color: var(--color-text-primary);
        }
        #hunter-select.visible { opacity: 1; }

        .select-header {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          font-size: clamp(1.2rem, 2.5vw, 1.8rem);
          letter-spacing: 0.3em;
          text-transform: uppercase;
          margin-bottom: 3rem;
          color: var(--color-text-primary);
        }

        .cards-container {
          display: flex;
          gap: clamp(12px, 2vw, 24px);
          margin-bottom: 4rem;
        }

        .hunter-card {
          width: min(220px, 22vw);
          background: var(--color-surface-card);
          border: 1px solid var(--color-border-faint);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          transition: all 150ms ease;
          position: relative;
        }
        .hunter-card.hovered {
          transform: scale(1.02);
          background: var(--color-surface-card-hover);
          border-color: var(--color-border-hover);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
        }
        .hunter-card.selected {
          transform: scale(1.04);
          background: var(--color-surface-card-hover);
          border-width: 2px;
          box-shadow: 0 0 32px var(--card-aura-half);
        }

        .hunter-art {
          height: 160px;
          border-radius: 4px;
          margin-bottom: 1rem;
          background: #111;
        }
        .hunter-art-dabik { background: linear-gradient(180deg, #1a0a2e 0%, #3d1560 60%, #08080f 100%); }
        .hunter-art-benzu { background: linear-gradient(180deg, #2e0a00 0%, #7a2e00 60%, #08080f 100%); }
        .hunter-art-sereisa { background: linear-gradient(180deg, #2e2000 0%, #7a5e00 60%, #08080f 100%); }
        .hunter-art-vesol { background: linear-gradient(180deg, #001a2e 0%, #0d3a5c 60%, #08080f 100%); }

        .hunter-name {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: 1.3rem;
          margin-bottom: 0.1rem;
        }
        .hunter-title {
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 0.8rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.8rem;
        }

        .stats-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 1rem;
        }
        .stat-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .stat-label {
          width: 30px;
          font-family: 'Inter', sans-serif;
          font-size: 0.72rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }
        .stat-bar {
          flex: 1;
          height: 4px;
          background: var(--color-stat-track);
          position: relative;
        }
        .stat-fill {
          height: 100%;
          background: var(--stat-color);
        }

        .quote {
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          font-style: italic;
          font-size: 0.75rem;
          color: var(--color-text-faint);
          margin-top: auto;
          line-height: 1.4;
        }

        .confirm-btn {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 12px 48px;
          border: 1px solid var(--color-text-muted);
          color: var(--color-text-muted);
          background: transparent;
          cursor: pointer;
          transition: all 150ms ease;
        }
        .confirm-btn.active {
          border-color: var(--aura-color);
          color: white;
          background: var(--aura-color);
          box-shadow: 0 0 24px var(--aura-color);
        }

        .player-indicator {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--player-color);
          color: black;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 10px;
          z-index: 5;
        }
      </style>
      <h2 class="select-header">Select Your Hunter</h2>
      <div class="cards-container">
        ${this.hunters.map((h, i) => `
          <div class="hunter-card ${i === this.cursorIndex ? 'hovered' : ''} ${this.playerSelections.includes(i) ? 'selected' : ''}" 
               data-index="${i}" 
               style="--card-aura: ${h.aura}; --card-aura-half: ${h.aura}80">
            <div class="hunter-art hunter-art-${h.id}"></div>
            <div class="hunter-name">${h.name}</div>
            <div class="hunter-title">${h.title}</div>
            <div class="stats-container">
              ${this._renderStatRow('HP', h.stats.hp, 'var(--color-stat-hp)')}
              ${this._renderStatRow('SPD', h.stats.spd, 'var(--color-stat-speed)')}
              ${this._renderStatRow('DMG', h.stats.dmg, 'var(--color-stat-damage)')}
              ${this._renderStatRow('DEF', h.stats.def, 'var(--color-stat-defense)')}
            </div>
            <div class="quote">${h.quote}</div>
            ${this._renderPlayerIndicators(i)}
          </div>
        `).join('')}
      </div>
      <button class="confirm-btn active" style="--aura-color: ${this.hunters[this.cursorIndex].aura}">Enter the Gate</button>
    `;

    this.overlay.appendChild(this.container);
    requestAnimationFrame(() => this.container.classList.add('visible'));

    // Update tokens
    this.container.style.setProperty('--color-void', '#08080f');
    this.container.style.setProperty('--color-surface-card', '#10101a');
    this.container.style.setProperty('--color-surface-card-hover', '#16162a');
    this.container.style.setProperty('--color-border-faint', '#1e1c2e');
    this.container.style.setProperty('--color-border-hover', '#2e2a4a');
    this.container.style.setProperty('--color-text-primary', '#f0f0f5');
    this.container.style.setProperty('--color-text-muted', '#8a8aa0');
    this.container.style.setProperty('--color-text-faint', '#5a5870');
    this.container.style.setProperty('--color-stat-track', '#1e1c2e');
    this.container.style.setProperty('--color-stat-hp', '#e74c3c');
    this.container.style.setProperty('--color-stat-speed', '#f1c40f');
    this.container.style.setProperty('--color-stat-damage', '#e67e22');
    this.container.style.setProperty('--color-stat-defense', '#3498db');
    this.container.style.setProperty('--aura-dabik', '#9b59b6');
    this.container.style.setProperty('--aura-benzu', '#e67e22');
    this.container.style.setProperty('--aura-sereisa', '#f1c40f');
    this.container.style.setProperty('--aura-vesol', '#2980b9');
  }

  _renderStatRow(label, value, color) {
    return `
      <div class="stat-row">
        <span class="stat-label">${label}</span>
        <div class="stat-bar">
          <div class="stat-fill" style="width: ${value * 10}%; --stat-color: ${color}"></div>
        </div>
      </div>
    `;
  }

  _renderPlayerIndicators(hunterIndex) {
    let indicators = '';
    this.playerSelections.forEach((sel, i) => {
      if (sel === hunterIndex) {
        const color = [`var(--p1-colour)`, `var(--p2-colour)`, `var(--p3-colour)`, `var(--p4-colour)`][i];
        indicators += `<div class="player-indicator" style="--player-color: ${color}">P${i + 1}</div>`;
      }
    });
    return indicators;
  }

  hide() {
    if (!this.container) return;
    this._active = false;
    this.container.classList.remove('visible');
    setTimeout(() => {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.container = null;
    }, 300);
  }

  update(input) {
    if (!this._active) return;

    if (input.justPressed(Actions.MOVE_LEFT)) {
      this.cursorIndex = (this.cursorIndex - 1 + this.hunters.length) % this.hunters.length;
      if (!this.isCoop) this.playerSelections[0] = this.cursorIndex;
      this._updateUI();
    }
    if (input.justPressed(Actions.MOVE_RIGHT)) {
      this.cursorIndex = (this.cursorIndex + 1) % this.hunters.length;
      if (!this.isCoop) this.playerSelections[0] = this.cursorIndex;
      this._updateUI();
    }
    if (input.justPressed(Actions.INTERACT) || input.justPressed(Actions.LIGHT) || input.justPressedKey('Enter')) {
      this._confirm();
    }
  }

  _updateUI() {
    const cards = this.container.querySelectorAll('.hunter-card');
    cards.forEach((card, i) => {
      card.classList.toggle('hovered', i === this.cursorIndex);
      card.classList.toggle('selected', this.playerSelections.includes(i));
      
      const indicators = card.querySelector('.player-indicator');
      if (indicators) indicators.remove();
      card.insertAdjacentHTML('beforeend', this._renderPlayerIndicators(i));
    });

    const btn = this.container.querySelector('.confirm-btn');
    btn.style.setProperty('--aura-color', this.hunters[this.cursorIndex].aura);
  }

  _confirm() {
    const configs = [];
    this.playerSelections.forEach((sel, i) => {
      if (sel !== -1) {
        configs.push({
          hunterId: this.hunters[sel].id,
          playerIndex: i,
          isAI: false
        });
      }
    });
    
    // If co-op is off, ensure P1 is selected
    if (configs.length === 0) {
      configs.push({ hunterId: this.hunters[this.cursorIndex].id, playerIndex: 0, isAI: false });
    }

    this.onConfirm(configs);
  }
}
