import { Actions } from '../engine/InputManager.js';

export class TitleScreen {
  constructor(overlay, onPlay, onCoop) {
    this.overlay = overlay;
    this.onPlay = onPlay;
    this.onCoop = onCoop;
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
          background:
            radial-gradient(ellipse 80% 60% at 50% 110%, #1a0530 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 80%,  #0d1a3a 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%,  #1a0a0a 0%, transparent 60%),
            linear-gradient(180deg, #06050d 0%, #0c0618 40%, #14061a 100%);
          pointer-events: none;
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
          margin-bottom: 0.4rem;
          animation: logoReveal 1.2s cubic-bezier(0.16,1,0.3,1) both;
          animation-delay: 300ms;
        }
        @keyframes logoReveal {
          from { opacity: 0; transform: translateY(-18px) scale(0.94); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    filter: blur(0);   }
        }
        .ts-logo {
          width: clamp(240px, 36vw, 520px);
          height: auto;
          display: block;
          filter:
            drop-shadow(0 0 20px rgba(170,80,255,0.7))
            drop-shadow(0 0 50px rgba(100,30,180,0.5));
          animation: logoPulse 5s ease-in-out infinite;
          animation-delay: 1.5s;
        }
        @keyframes logoPulse {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(170,80,255,0.7)) drop-shadow(0 0 50px rgba(100,30,180,0.5)); }
          50%       { filter: drop-shadow(0 0 30px rgba(200,120,255,0.9)) drop-shadow(0 0 70px rgba(140,50,220,0.7)); }
        }

        /* ── Lore tagline ── */
        .ts-lore {
          position: relative;
          z-index: 2;
          font-size: clamp(0.6rem, 1.1vw, 0.78rem);
          font-weight: 700;
          letter-spacing: 0.45em;
          text-transform: uppercase;
          color: rgba(180,140,255,0.65);
          margin-bottom: 0.3rem;
          animation: fadeSlideUp 1s ease both;
          animation-delay: 800ms;
        }
        .ts-subtitle {
          position: relative;
          z-index: 2;
          font-size: clamp(0.55rem, 0.9vw, 0.7rem);
          font-style: italic;
          letter-spacing: 0.2em;
          color: rgba(130,100,180,0.5);
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

        /* ── Hunter silhouettes ── */
        .ts-hunters {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 32%;
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          padding: 0 8%;
          pointer-events: none;
          z-index: 1;
        }
        .ts-hunter {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: hunterFloat 5s ease-in-out infinite;
        }
        .ts-hunter:nth-child(1) { animation-delay: 0s; }
        .ts-hunter:nth-child(2) { animation-delay: 1.3s; }
        .ts-hunter:nth-child(3) { animation-delay: 2.6s; }
        .ts-hunter:nth-child(4) { animation-delay: 3.9s; }
        @keyframes hunterFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-7px); }
        }
        .ts-hunter-body {
          width: clamp(36px, 5vw, 64px);
          height: clamp(72px, 10vw, 128px);
          background: #06050d;
          clip-path: polygon(30% 0%, 70% 0%, 90% 15%, 100% 40%, 85% 100%, 15% 100%, 0% 40%, 10% 15%);
          position: relative;
        }
        .ts-hunter-aura {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 200%;
          height: 40px;
          border-radius: 50%;
          filter: blur(8px);
          opacity: 0.6;
          animation: auraFlicker 2s ease-in-out infinite;
        }
        @keyframes auraFlicker {
          0%, 100% { opacity: 0.45; transform: translateX(-50%) scaleX(1);   }
          50%       { opacity: 0.75; transform: translateX(-50%) scaleX(1.15); }
        }
        .ts-hunter-name {
          margin-top: 8px;
          font-size: clamp(0.5rem, 0.8vw, 0.65rem);
          letter-spacing: 0.3em;
          text-transform: uppercase;
          opacity: 0.4;
          color: #fff;
        }

        /* ── Version / jam badge ── */
        .ts-badge {
          position: absolute;
          bottom: 14px;
          right: 18px;
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          color: rgba(150,120,200,0.35);
          z-index: 3;
          text-transform: uppercase;
        }
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
      <div class="ts-bg-gate"></div>
      <div class="ts-rift"></div>
      <div class="ts-floor-glow"></div>

      <div class="ts-logo-wrap">
        <img
          class="ts-logo"
          src="./assets/huntix-logo-hd.png"
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

      <div class="ts-hunters" aria-hidden="true">
        <div class="ts-hunter">
          <div class="ts-hunter-body"></div>
          <div class="ts-hunter-aura" style="background:#7722cc"></div>
          <span class="ts-hunter-name">Dabik</span>
        </div>
        <div class="ts-hunter">
          <div class="ts-hunter-body"></div>
          <div class="ts-hunter-aura" style="background:#cc5500"></div>
          <span class="ts-hunter-name">Benzu</span>
        </div>
        <div class="ts-hunter">
          <div class="ts-hunter-body"></div>
          <div class="ts-hunter-aura" style="background:#ccaa00"></div>
          <span class="ts-hunter-name">Sereisa</span>
        </div>
        <div class="ts-hunter">
          <div class="ts-hunter-body"></div>
          <div class="ts-hunter-aura" style="background:#1166cc"></div>
          <span class="ts-hunter-name">Vesol</span>
        </div>
      </div>

      <div class="ts-badge">Vibe Jam 2026 &nbsp;&#x2014;&nbsp; v0.1</div>
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
  }
}
