import { Actions } from '../engine/InputManager.js';
import { HUNTER_CONFIGS } from '../gameplay/HunterController.js';

const HUNTER_ORDER = ['dabik', 'benzu', 'sereisa', 'vesol'];

const HUNTER_META = {
  dabik: {
    title: 'Shadow Striker',
    element: 'Shadow',
    status: 'Bleed',
    quote: '"Silence is the last thing you hear."',
    aura: 'var(--aura-dabik)',
  },
  benzu: {
    title: 'Iron Breaker',
    element: 'Thunder/Earth',
    status: 'Stun',
    quote: '"I do not dodge. I do not need to."',
    aura: 'var(--aura-benzu)',
  },
  sereisa: {
    title: 'Storm Chaser',
    element: 'Lightning',
    status: 'Slow',
    quote: '"You blinked. That is why you lost."',
    aura: 'var(--aura-sereisa)',
  },
  vesol: {
    title: 'Ember Mage',
    element: 'Flame',
    status: 'Burn',
    quote: '"The gate burns. So does everything in it."',
    aura: 'var(--aura-vesol)',
  },
};

const STAT_KEYS = ['hp', 'speed', 'lightDamage', 'heavyDamage', 'dodgeIFrames'];

function buildHunterCards() {
  return HUNTER_ORDER.map((id) => {
    const config = HUNTER_CONFIGS[id] || HUNTER_CONFIGS.dabik;
    const meta = HUNTER_META[id] || HUNTER_META.dabik;

    return {
      id,
      name: config.label,
      title: meta.title,
      element: meta.element,
      status: meta.status,
      quote: meta.quote,
      aura: meta.aura,
      portrait: `./assets/ui/characters/portrait-${id}.jpeg`,
      stats: {
        hp: config.hp,
        speed: config.speed,
        lightDamage: config.lightDamage,
        heavyDamage: config.heavyDamage,
        dodgeIFrames: config.dodgeIFrames,
      },
    };
  });
}

function computeStatMax(hunters) {
  const max = {};
  for (const key of STAT_KEYS) max[key] = 1;
  for (const hunter of hunters) {
    for (const key of STAT_KEYS) {
      max[key] = Math.max(max[key], hunter.stats[key] || 0);
    }
  }
  return max;
}

export class HunterSelectScreen {
  constructor(overlay, onConfirm, onBack) {
    this.overlay = overlay;
    this.onConfirm = onConfirm;
    this.onBack = onBack;
    this.container = null;
    this._active = false;

    this.hunters = buildHunterCards();
    this.statMax = computeStatMax(this.hunters);

    this.playerSelections = [0, -1, -1, -1];
    this.cursorIndex = 0;
    this.isCoop = false;
  }

  setCoop(enabled) {
    this.isCoop = enabled;
    this.playerSelections = [0, -1, -1, -1];
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
          background:
            linear-gradient(0deg, rgba(8, 8, 15, 0.88), rgba(8, 8, 15, 0.75)),
            url('./assets/ui/characters/select-bg.jpeg') center/cover no-repeat;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 100;
          opacity: 0;
          transition: opacity 300ms ease;
          pointer-events: auto;
          color: var(--color-text-primary);
          padding: 24px;
          box-sizing: border-box;
        }
        #hunter-select.visible { opacity: 1; }

        .select-header {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: clamp(1.2rem, 2.5vw, 1.9rem);
          letter-spacing: 0.24em;
          text-transform: uppercase;
          margin-bottom: 2rem;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
        }

        .cards-container {
          display: grid;
          width: min(1100px, 96vw);
          grid-template-columns: repeat(4, minmax(170px, 1fr));
          gap: clamp(8px, 1.4vw, 16px);
          margin-bottom: 1.5rem;
        }

        .hunter-card {
          background: rgba(16, 16, 26, 0.86);
          border: 1px solid var(--color-border-faint);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          transition: all 150ms ease;
          position: relative;
          cursor: pointer;
          min-height: 420px;
          backdrop-filter: blur(1px);
        }
        .hunter-card.hovered {
          transform: translateY(-2px);
          border-color: var(--color-border-hover);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
        }
        .hunter-card.selected {
          transform: translateY(-3px) scale(1.01);
          border-width: 2px;
          border-color: var(--card-aura);
          box-shadow: 0 0 20px var(--card-aura-half);
        }

        .hunter-art {
          width: 100%;
          aspect-ratio: 4 / 5;
          object-fit: cover;
          border-radius: 4px;
          margin-bottom: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(0, 0, 0, 0.2);
        }

        .hunter-name {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: 1.2rem;
          margin-bottom: 0.1rem;
        }
        .hunter-title {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 0.72rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.32rem;
        }
        .hunter-affinity {
          font-family: 'Inter', sans-serif;
          font-size: 0.72rem;
          color: var(--color-text-faint);
          margin-bottom: 0.6rem;
        }

        .stats-container {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 0.6rem;
        }
        .stat-row {
          display: grid;
          grid-template-columns: 34px minmax(60px, 1fr) 42px;
          align-items: center;
          gap: 6px;
        }
        .stat-label {
          font-family: 'Inter', sans-serif;
          font-size: 0.68rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }
        .stat-bar {
          height: 4px;
          background: var(--color-stat-track);
          position: relative;
          overflow: hidden;
        }
        .stat-fill {
          height: 100%;
          background: var(--stat-color);
        }
        .stat-value {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--color-text-primary);
          text-align: right;
        }

        .quote {
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          font-style: italic;
          font-size: 0.72rem;
          color: var(--color-text-faint);
          margin-top: auto;
          line-height: 1.35;
          min-height: 2.2em;
        }

        .actions-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .back-btn,
        .confirm-btn {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 10px 24px;
          border: 1px solid var(--color-text-muted);
          color: var(--color-text-muted);
          background: rgba(16, 16, 26, 0.62);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .back-btn:hover {
          color: var(--color-text-primary);
          border-color: var(--color-text-primary);
        }

        .confirm-btn.active {
          border-color: var(--aura-color);
          color: white;
          background: var(--aura-color);
          box-shadow: 0 0 20px var(--aura-color);
        }

        .player-indicator {
          position: absolute;
          top: -11px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--player-color);
          color: #000;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 10px;
          z-index: 5;
        }

        @media (max-width: 960px) {
          .cards-container {
            grid-template-columns: repeat(2, minmax(140px, 1fr));
            max-height: 62vh;
            overflow-y: auto;
            padding-right: 2px;
          }
          .hunter-card {
            min-height: 380px;
          }
        }
      </style>
      <h2 class="select-header">Select Your Hunter</h2>
      <div class="cards-container">
        ${this.hunters.map((hunter, index) => `
          <div
            class="hunter-card ${index === this.cursorIndex ? 'hovered' : ''} ${this.playerSelections.includes(index) ? 'selected' : ''}"
            data-index="${index}"
            style="--card-aura: ${hunter.aura}; --card-aura-half: ${hunter.aura}80"
          >
            <img class="hunter-art" src="${hunter.portrait}" alt="${hunter.name} portrait" />
            <div class="hunter-name">${hunter.name}</div>
            <div class="hunter-title">${hunter.title}</div>
            <div class="hunter-affinity">${hunter.element} | ${hunter.status}</div>
            <div class="stats-container">
              ${this._renderStatRow('HP', hunter.stats.hp, this.statMax.hp, 'var(--color-stat-hp)')}
              ${this._renderStatRow('SPD', hunter.stats.speed, this.statMax.speed, 'var(--color-stat-speed)')}
              ${this._renderStatRow('LGT', hunter.stats.lightDamage, this.statMax.lightDamage, 'var(--color-stat-damage)')}
              ${this._renderStatRow('HVY', hunter.stats.heavyDamage, this.statMax.heavyDamage, 'var(--color-stat-damage)')}
              ${this._renderStatRow('IFR', hunter.stats.dodgeIFrames, this.statMax.dodgeIFrames, 'var(--color-stat-defense)')}
            </div>
            <div class="quote">${hunter.quote}</div>
            ${this._renderPlayerIndicators(index)}
          </div>
        `).join('')}
      </div>
      <div class="actions-row">
        <button class="back-btn" type="button">Back</button>
        <button class="confirm-btn active" type="button" style="--aura-color: ${this.hunters[this.cursorIndex].aura}">Enter the Gate</button>
      </div>
    `;

    this.overlay.appendChild(this.container);
    requestAnimationFrame(() => this.container?.classList.add('visible'));
    this._wireMouseHandlers();
    this._setThemeTokens();
  }

  _setThemeTokens() {
    if (!this.container) return;
    this.container.style.setProperty('--color-text-primary', '#f0f0f5');
    this.container.style.setProperty('--color-text-muted', '#9a99b0');
    this.container.style.setProperty('--color-text-faint', '#6f6d84');
    this.container.style.setProperty('--color-border-faint', '#2a2738');
    this.container.style.setProperty('--color-border-hover', '#484367');
    this.container.style.setProperty('--color-stat-track', '#2a2738');
    this.container.style.setProperty('--color-stat-hp', '#e74c3c');
    this.container.style.setProperty('--color-stat-speed', '#f1c40f');
    this.container.style.setProperty('--color-stat-damage', '#ff9f43');
    this.container.style.setProperty('--color-stat-defense', '#6ab0ff');
    this.container.style.setProperty('--aura-dabik', '#7f56d9');
    this.container.style.setProperty('--aura-benzu', '#d94841');
    this.container.style.setProperty('--aura-sereisa', '#f1c40f');
    this.container.style.setProperty('--aura-vesol', '#2f7de1');
  }

  _wireMouseHandlers() {
    if (!this.container) return;

    const cards = this.container.querySelectorAll('.hunter-card');
    cards.forEach((card, index) => {
      card.addEventListener('mouseenter', () => this._setCursor(index));
      card.addEventListener('click', () => this._selectHunter(index));
    });

    const confirmBtn = this.container.querySelector('.confirm-btn');
    confirmBtn?.addEventListener('click', () => this._confirm());

    const backBtn = this.container.querySelector('.back-btn');
    backBtn?.addEventListener('click', () => this._back());
  }

  _renderStatRow(label, value, maxValue, color) {
    const pct = Math.max(0, Math.min(100, (value / Math.max(1, maxValue)) * 100));
    return `
      <div class="stat-row">
        <span class="stat-label">${label}</span>
        <div class="stat-bar">
          <div class="stat-fill" style="width: ${pct}%; --stat-color: ${color}"></div>
        </div>
        <span class="stat-value">${value}</span>
      </div>
    `;
  }

  _renderPlayerIndicators(hunterIndex) {
    let indicators = '';
    this.playerSelections.forEach((selection, playerIndex) => {
      if (selection === hunterIndex) {
        const color = ['var(--p1-colour)', 'var(--p2-colour)', 'var(--p3-colour)', 'var(--p4-colour)'][playerIndex];
        indicators += `<div class="player-indicator" style="--player-color: ${color}">P${playerIndex + 1}</div>`;
      }
    });
    return indicators;
  }

  hide() {
    if (!this.container) return;
    this._active = false;
    this.container.classList.remove('visible');
    setTimeout(() => {
      if (this.container?.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.container = null;
    }, 300);
  }

  update(input) {
    if (!this._active) return;

    if (input.justPressed(Actions.PAUSE) || input.justPressedKey('Escape')) {
      this._back();
      return;
    }

    if (input.justPressed(Actions.MOVE_LEFT)) this._selectHunter(this.cursorIndex - 1);
    if (input.justPressed(Actions.MOVE_RIGHT)) this._selectHunter(this.cursorIndex + 1);

    if (
      input.justPressed(Actions.INTERACT)
      || input.justPressed(Actions.LIGHT)
      || input.justPressedKey('Enter')
    ) {
      this._confirm();
    }
  }

  _setCursor(index) {
    if (!this.container) return;
    const normalized = ((index % this.hunters.length) + this.hunters.length) % this.hunters.length;
    this.cursorIndex = normalized;
    this._updateUI();
  }

  _selectHunter(index) {
    const normalized = ((index % this.hunters.length) + this.hunters.length) % this.hunters.length;
    this.cursorIndex = normalized;
    this.playerSelections[0] = normalized;
    this._updateUI();
  }

  _updateUI() {
    if (!this.container) return;

    const cards = this.container.querySelectorAll('.hunter-card');
    cards.forEach((card, index) => {
      card.classList.toggle('hovered', index === this.cursorIndex);
      card.classList.toggle('selected', this.playerSelections.includes(index));
      card.querySelectorAll('.player-indicator').forEach((indicator) => indicator.remove());
      card.insertAdjacentHTML('beforeend', this._renderPlayerIndicators(index));
    });

    const confirmBtn = this.container.querySelector('.confirm-btn');
    confirmBtn?.style.setProperty('--aura-color', this.hunters[this.cursorIndex].aura);
  }

  _confirm() {
    const configs = [];
    this.playerSelections.forEach((selection, playerIndex) => {
      if (selection !== -1) {
        configs.push({
          hunterId: this.hunters[selection].id,
          playerIndex,
          isAI: false,
        });
      }
    });

    if (configs.length === 0) {
      configs.push({
        hunterId: this.hunters[this.cursorIndex].id,
        playerIndex: 0,
        isAI: false,
      });
    }

    if (typeof this.onConfirm === 'function') this.onConfirm(configs);
  }

  _back() {
    if (typeof this.onBack === 'function') this.onBack();
  }
}
