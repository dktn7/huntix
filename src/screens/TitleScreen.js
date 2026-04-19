import { Actions } from '../engine/InputManager.js';

export class TitleScreen {
  constructor(overlay, onPlay, onCoop) {
    this.overlay = overlay;
    this.onPlay = onPlay;
    this.onCoop = onCoop;
    this.container = null;
    this.selectedIndex = 0;
    this.menuItems = [
      { label: 'Play', action: 'play' },
      { label: 'Co-op', action: 'coop' },
      { label: 'Settings', action: 'settings' },
      { label: 'Credits', action: 'credits' }
    ];
    this._active = false;
  }

  show() {
    this._active = true;
    this.container = document.createElement('div');
    this.container.id = 'title-screen';
    this.container.innerHTML = `
      <style>
        #title-screen {
          position: fixed;
          inset: 0;
          background: var(--color-void);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 100;
          opacity: 0;
          transition: opacity 400ms ease;
          pointer-events: auto;
          font-family: 'Inter', sans-serif;
        }
        #title-screen.visible { opacity: 1; }
        
        .gate-rift {
          position: absolute;
          top: 15%;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 40%;
          background: var(--color-gate-crack);
          box-shadow: 0 0 12px var(--color-gate-crack), 0 0 24px var(--color-gate-edge);
          filter: blur(1px);
          animation: riftPulse 3s ease-in-out infinite;
        }
        @keyframes riftPulse {
          0%, 100% { transform: translateX(-50%) scaleX(0.8); opacity: 0.6; }
          50% { transform: translateX(-50%) scaleX(1.2); opacity: 1; }
        }

        .logo-container {
          position: relative;
          margin-bottom: 0.5rem;
          z-index: 2;
        }
        .logo {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: clamp(3.5rem, 8vw, 7rem);
          color: white;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          animation: auraCycle 4s ease-in-out infinite;
        }
        @keyframes auraCycle {
          0%   { filter: drop-shadow(0 0 18px var(--aura-dabik)) drop-shadow(0 0 40px var(--aura-dabik-dark)); }
          25%  { filter: drop-shadow(0 0 18px var(--aura-benzu)) drop-shadow(0 0 40px var(--aura-benzu-dark)); }
          50%  { filter: drop-shadow(0 0 18px var(--aura-sereisa)) drop-shadow(0 0 40px var(--aura-sereisa-dark)); }
          75%  { filter: drop-shadow(0 0 18px var(--aura-vesol)) drop-shadow(0 0 40px var(--aura-vesol-dark)); }
          100% { filter: drop-shadow(0 0 18px var(--aura-dabik)) drop-shadow(0 0 40px var(--aura-dabik-dark)); }
        }

        .tagline {
          color: var(--color-text-muted);
          font-weight: 300;
          font-style: italic;
          font-size: 0.9rem;
          letter-spacing: 0.3em;
          margin-bottom: 3rem;
          text-transform: uppercase;
        }

        .menu {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          align-items: center;
        }
        .menu-item {
          color: var(--color-text-muted);
          font-size: 1.1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 150ms ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .menu-item.selected {
          color: var(--color-text-primary);
          text-shadow: 0 0 8px var(--color-gate-crack);
        }
        .menu-item .chevron {
          width: 0;
          overflow: hidden;
          transition: width 150ms ease;
          font-family: monospace;
        }
        .menu-item.selected .chevron {
          width: 1rem;
        }

        .silhouettes {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 35%;
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          padding: 0 10%;
          pointer-events: none;
        }
        .silhouette {
          width: 120px;
          height: 180px;
          background: rgba(8, 8, 15, 0.8);
          position: relative;
          animation: float 4s ease-in-out infinite;
        }
        .silhouette.dabik { animation-delay: 0s; }
        .silhouette.benzu { animation-delay: 1s; }
        .silhouette.sereisa { animation-delay: 2s; }
        .silhouette.vesol { animation-delay: 3s; }
        
        .silhouette::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: -20%;
          right: -20%;
          height: 60%;
          background: radial-gradient(circle at bottom, var(--aura-color) 0%, transparent 70%);
          opacity: 0.6;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      </style>
      <div class="gate-rift"></div>
      <div class="logo-container">
        <h1 class="logo">HUNTIX</h1>
      </div>
      <div class="tagline">Hunt. Enter. Survive.</div>
      <div class="menu">
        ${this.menuItems.map((item, i) => `
          <div class="menu-item ${i === this.selectedIndex ? 'selected' : ''}" data-index="${i}">
            <span class="chevron">></span>
            ${item.label}
          </div>
        `).join('')}
      </div>
      <div class="silhouettes">
        <div class="silhouette dabik" style="--aura-color: var(--aura-dabik)"></div>
        <div class="silhouette benzu" style="--aura-color: var(--aura-benzu)"></div>
        <div class="silhouette sereisa" style="--aura-color: var(--aura-sereisa)"></div>
        <div class="silhouette vesol" style="--aura-color: var(--aura-vesol)"></div>
      </div>
    `;

    this.overlay.appendChild(this.container);
    requestAnimationFrame(() => this.container.classList.add('visible'));

    // Update colors for title screen since they might not be in root
    this.container.style.setProperty('--color-void', '#08080f');
    this.container.style.setProperty('--color-text-primary', '#f0f0f5');
    this.container.style.setProperty('--color-text-muted', '#8a8aa0');
    this.container.style.setProperty('--color-gate-crack', '#aa44ff');
    this.container.style.setProperty('--color-gate-edge', '#220044');
    this.container.style.setProperty('--aura-dabik', '#9b59b6');
    this.container.style.setProperty('--aura-dabik-dark', '#3d1560');
    this.container.style.setProperty('--aura-benzu', '#e67e22');
    this.container.style.setProperty('--aura-benzu-dark', '#7a2e00');
    this.container.style.setProperty('--aura-sereisa', '#f1c40f');
    this.container.style.setProperty('--aura-sereisa-dark', '#7a5e00');
    this.container.style.setProperty('--aura-vesol', '#2980b9');
    this.container.style.setProperty('--aura-vesol-dark', '#0d3a5c');
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
    }, 400);
  }

  update(input) {
    if (!this._active) return;

    if (input.justPressed(Actions.MOVE_UP)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
      this._updateMenuSelection();
    }
    if (input.justPressed(Actions.MOVE_DOWN)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
      this._updateMenuSelection();
    }
    if (input.justPressed(Actions.INTERACT) || input.justPressed(Actions.LIGHT) || input.justPressedKey('Enter')) {
      this._confirmSelection();
    }
  }

  _updateMenuSelection() {
    const items = this.container.querySelectorAll('.menu-item');
    items.forEach((item, i) => {
      item.classList.toggle('selected', i === this.selectedIndex);
    });
  }

  _confirmSelection() {
    const action = this.menuItems[this.selectedIndex].action;
    if (action === 'play') {
      this.onPlay();
    } else if (action === 'coop') {
      this.onCoop();
    }
  }
}
