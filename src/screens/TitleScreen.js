import { Actions } from '../engine/InputManager.js';

export class TitleScreen {
  constructor(overlay, onPlay, onCoop, onSettings) {
    this.overlay = overlay;
    this.onPlay = onPlay;
    this.onCoop = onCoop;
    this.onSettings = onSettings;
    this.container = null;
    this.selectedIndex = 0;
    this.menuItems = [
      { label: 'Enter the Hunt', action: 'play' },
      { label: 'Hunt Together',  action: 'coop' },
      { label: 'Settings',       action: 'settings' },
      { label: 'Credits',        action: 'credits' }
    ];
    this._active = false;
    this._emberInterval = null;
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
          background: #06050d;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 100;
          opacity: 0;
          transition: opacity 600ms ease;
          pointer-events: auto;
          font-family: 'Courier New', Courier, monospace;
          overflow: hidden;
        }
        #title-screen.visible { opacity: 1; }

        /* ── Parallax background layers ── */
        .ts-bg-far {
          position: absolute;
          inset: 0;
          background: url('./assets/ui/title-bg.jpeg') center/cover no-repeat;
          pointer-events: none;
        }
        .ts-bg-overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 110%, #1a0530 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 80%,  #0d1a3a 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%,  #1a0a0a 0%, transparent 60%),
            linear-gradient(180deg, #06050d 0%, #0c0618 40%, #14061a 100%);
          pointer-events: none;
          opacity: 0.65;
        }
        .ts-bg-gate {
          position: absolute;
          inset: 0;
          pointer-events: none;
          /* Gothic arch silhouette drawn with CSS */
          background:
            /* arch shadow left */
            linear-gradient(90deg, transparent 20%, rgba(4,2,12,0.9) 35%, transparent 42%),
            /* arch shadow right */
            linear-gradient(270deg, transparent 20%, rgba(4,2,12,0.9) 35%, transparent 42%);
        }

        /* ── Central rift crack ── */
        .ts-rift {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 1px;
          height: 55%;
          background: linear-gradient(180deg,
            transparent 0%,
            #c080ff 20%,
            #8844dd 50%,
            #440088 80%,
            transparent 100%);
          box-shadow: 0 0 8px 2px #9933ff, 0 0 24px 6px #440088;
          animation: riftBreath 4s ease-in-out infinite;
          pointer-events: none;
        }
        .ts-rift::before,
        .ts-rift::after {
          content: '';
          position: absolute;
          top: 30%;
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, #9933ff, transparent);
          transform-origin: left center;
        }
        .ts-rift::before { left: 0;  transform: rotate(-25deg); }
        .ts-rift::after  { left: 0;  transform: scaleX(-1) rotate(-25deg); right: 0; left: auto; }
        @keyframes riftBreath {
          0%, 100% { opacity: 0.6; box-shadow: 0 0 8px 2px #9933ff, 0 0 24px 6px #440088; }
          50%       { opacity: 1.0; box-shadow: 0 0 14px 4px #cc66ff, 0 0 40px 10px #6600cc; }
        }

        /* ── Floor glow ── */
        .ts-floor-glow {
          position: absolute;
          bottom: 28%;
          left: 50%;
          transform: translateX(-50%);
          width: 40vw;
          height: 2px;
          background: linear-gradient(90deg, transparent, #7722cc, #aa44ff, #7722cc, transparent);
          box-shadow: 0 0 30px 12px rgba(119,34,204,0.25);
          pointer-events: none;
          animation: floorPulse 4s ease-in-out infinite;
        }
        @keyframes floorPulse {
          0%, 100% { opacity: 0.5; width: 30vw; }
          50%       { opacity: 0.9; width: 42vw; }
        }

        /* ── Ember particles ── */
        .ts-ember {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          animation: emberRise linear forwards;
        }
        @keyframes emberRise {
          0%   { opacity: 0;   transform: translateY(0)   translateX(0)   scale(1);   }
          10%  { opacity: 0.9; }
          80%  { opacity: 0.6; }
          100% { opacity: 0;   transform: translateY(-60vh) translateX(var(--drift)) scale(0.3); }
        }

        /* ── Logo ── */
        .ts-logo-wrap {
          position: relative;
          z-index: 2;
          margin-bottom: -4rem; /* Pull content up */
          margin-top: -15vh;
          animation: logoReveal 1.2s cubic-bezier(0.16,1,0.3,1) both;
          animation-delay: 300ms;
        }
        @keyframes logoReveal {
          from { opacity: 0; transform: translateY(-30px) scale(0.94); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    filter: blur(0);   }
        }
        .ts-logo {
          width: clamp(280px, 40vw, 600px);
          height: auto;
          display: block;
          filter: drop-shadow(0 0 15px rgba(255,255,255,0.3));
        }

        /* ── Lore tagline ── */
        .ts-lore {
          position: relative;
          z-index: 3; /* Ensure it is above the logo */
          font-size: clamp(0.7rem, 1.2vw, 0.9rem);
          font-weight: 700;
          letter-spacing: 0.45em;
          text-transform: uppercase;
          color: #fff;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
          margin-bottom: 0.5rem;
          animation: fadeSlideUp 1s ease both;
          animation-delay: 800ms;
        }
        .ts-subtitle {
          position: relative;
          z-index: 3; /* Ensure it is above the logo */
          font-size: clamp(0.6rem, 1vw, 0.8rem);
          font-style: italic;
          letter-spacing: 0.25em;
          color: #d1c1ff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
          margin-bottom: 3.2rem;
          animation: fadeSlideUp 1s ease both;
          animation-delay: 1s;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Menu ── */
        .ts-menu {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          animation: fadeSlideUp 1s ease both;
          animation-delay: 1.1s;
        }
        .ts-menu-item {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          font-size: clamp(0.8rem, 1.4vw, 1rem);
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(160,130,200,0.55);
          cursor: pointer;
          transition: color 150ms ease, text-shadow 150ms ease;
          user-select: none;
        }
        .ts-menu-item:hover,
        .ts-menu-item.selected {
          color: #e8d8ff;
          text-shadow: 0 0 10px rgba(180,100,255,0.8), 0 0 24px rgba(120,50,200,0.5);
        }
        .ts-menu-item .ts-chevron {
          font-size: 0.7em;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 150ms ease, transform 150ms ease;
        }
        .ts-menu-item.selected .ts-chevron {
          opacity: 1;
          transform: translateX(0);
        }

        /* ── Version badge ── */
        .ts-badge {
          position: absolute;
          top: 14px;
          left: 18px;
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          color: rgba(150,120,200,0.35);
          z-index: 3;
          text-transform: uppercase;
        }

        /* ── Controls hint ── */
        .ts-controls-hint {
          position: absolute;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          color: rgba(150,120,200,0.3);
          z-index: 3;
          text-transform: uppercase;
          white-space: nowrap;
        }
      </style>

      <div class="ts-bg-far"></div>
      <div class="ts-bg-overlay"></div>
      <div class="ts-bg-gate"></div>
      <div class="ts-rift"></div>
      <div class="ts-floor-glow"></div>

      <div class="ts-badge">Huntix v0.1</div>

      <div class="ts-logo-wrap">
        <img
          class="ts-logo"
          src="./assets/ui/Futuristic_HUNTIX_logo_202604251049-removebg-preview.png"
          alt="HUNTIX"
          width="520"
          height="auto"
          loading="eager"
          onerror="this.style.display='none';document.querySelector('.ts-logo-fallback').style.display='block'"
        />
        <h1 class="ts-logo-fallback" style="display:none;font-family:'Rajdhani',sans-serif;font-size:clamp(3rem,8vw,7rem);font-weight:700;letter-spacing:0.12em;color:#fff;text-shadow:0 0 30px #9933ff">HUNTIX</h1>
      </div>

      <p class="ts-lore">The Gate is open. The Hunt has no end.</p>
      <p class="ts-subtitle">Four hunters. Infinite rifts. One order — Huntrix.</p>

      <nav class="ts-menu" role="menu">
        ${this.menuItems.map((item, i) => `
          <div
            class="ts-menu-item ${i === 0 ? 'selected' : ''}"
            role="menuitem"
            tabindex="0"
            data-index="${i}"
          >
            <span class="ts-chevron" aria-hidden="true">&#x276F;</span>
            ${item.label}
          </div>
        `).join('')}
      </nav>

      <div class="ts-controls-hint">↑↓ Navigate &nbsp;&nbsp; Enter / Z &nbsp; Confirm</div>
    `;

    this.overlay.appendChild(this.container);
    requestAnimationFrame(() => this.container.classList.add('visible'));

    // Bind mouse clicks on menu items
    this.container.querySelectorAll('.ts-menu-item').forEach(el => {
      el.addEventListener('click', () => {
        this.selectedIndex = parseInt(el.dataset.index, 10);
        this._updateMenuSelection();
        this._confirmSelection();
      });
      el.addEventListener('mouseenter', () => {
        this.selectedIndex = parseInt(el.dataset.index, 10);
        this._updateMenuSelection();
      });
    });

    // Kick off ember particle loop
    this._spawnEmbers();
  }

  _spawnEmbers() {
    const spawn = () => {
      if (!this.container) return;
      const ember = document.createElement('div');
      ember.className = 'ts-ember';
      const size = 2 + Math.random() * 3;
      const x = 30 + Math.random() * 40; // keep near centre
      const duration = 4 + Math.random() * 5;
      const drift = (Math.random() - 0.5) * 80;
      const hue = 260 + Math.random() * 60; // purple-ish
      ember.style.cssText = [
        `width:${size}px`, `height:${size}px`,
        `left:${x}%`, `bottom:28%`,
        `background:hsl(${hue},80%,70%)`,
        `box-shadow:0 0 ${size * 2}px hsl(${hue},80%,60%)`,
        `--drift:${drift}px`,
        `animation-duration:${duration}s`
      ].join(';');
      this.container.appendChild(ember);
      setTimeout(() => ember.remove(), duration * 1000);
    };
    // initial burst
    for (let i = 0; i < 8; i++) setTimeout(spawn, i * 200);
    // continuous drip
    this._emberInterval = setInterval(spawn, 600);
  }

  hide() {
    if (!this.container) return;
    this._active = false;
    clearInterval(this._emberInterval);
    this._emberInterval = null;
    this.container.classList.remove('visible');
    setTimeout(() => {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.container = null;
    }, 600);
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
    if (
      input.justPressed(Actions.INTERACT) ||
      input.justPressed(Actions.LIGHT) ||
      input.justPressedKey('Enter')
    ) {
      this._confirmSelection();
    }
  }

  _updateMenuSelection() {
    if (!this.container) return;
    this.container.querySelectorAll('.ts-menu-item').forEach((el, i) => {
      el.classList.toggle('selected', i === this.selectedIndex);
    });
  }

  _confirmSelection() {
    const action = this.menuItems[this.selectedIndex].action;
    if (action === 'play')  this.onPlay();
    if (action === 'coop')  this.onCoop();
    if (action === 'settings') this.onSettings?.();
  }
}
