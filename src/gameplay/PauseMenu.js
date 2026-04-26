import { Actions } from '../engine/InputManager.js';

const FULL_ZONE_MENU_ITEMS = [
  { id: 'resume', label: 'Resume' },
  { id: 'run-stats', label: 'Run Stats' },
  { id: 'controls', label: 'Controls' },
  { id: 'settings', label: 'Settings' },
  { id: 'abandon-run', label: 'Abandon Run' },
  { id: 'quit-title', label: 'Quit to Title' },
];

const HUB_MENU_ITEMS = [
  { id: 'resume', label: 'Resume' },
  { id: 'controls', label: 'Controls' },
  { id: 'settings', label: 'Settings' },
  { id: 'quit-title', label: 'Quit to Title' },
];

const MINIMAL_MENU_ITEMS = [
  { id: 'resume', label: 'Resume' },
  { id: 'settings', label: 'Settings' },
  { id: 'quit-title', label: 'Quit to Title' },
];

function clampChannel(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}

function normalizeHexColor(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `#${Math.max(0, Math.min(0xffffff, value)).toString(16).padStart(6, '0')}`;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return null;
}

function hexToRgb(hex) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function mixRgb(from, to, t) {
  const ratio = Math.max(0, Math.min(1, Number(t) || 0));
  return {
    r: clampChannel(from.r + (to.r - from.r) * ratio),
    g: clampChannel(from.g + (to.g - from.g) * ratio),
    b: clampChannel(from.b + (to.b - from.b) * ratio),
  };
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export class PauseMenu {
  constructor(overlay, options = {}) {
    this.overlay = overlay;

    this.settingsPanel = options.settingsPanel || null;
    this.onResume = options.onResume || (() => {});
    this.onAbandonRun = options.onAbandonRun || (() => {});
    this.onQuitToTitle = options.onQuitToTitle || (() => {});
    this.getRunStats = options.getRunStats || (() => null);

    this.mode = 'none';
    this.context = 'zone';
    this.zoneId = 'hub';
    this.selectedIndex = 0;
    this.statsOpen = false;
    this.confirmState = null;

    this._root = null;
    this._fullLayout = null;
    this._minimalLayout = null;
    this._menuList = null;
    this._statsPanel = null;
    this._confirmWrap = null;
    this._titleEl = null;
    this._subtitleEl = null;

    this._renderedStatsHash = '';
  }

  isOpen() {
    return this.mode !== 'none';
  }

  isFullPause() {
    return this.mode === 'full';
  }

  getMode() {
    return this.mode;
  }

  getContext() {
    return this.context;
  }

  open(config = 'full') {
    let mode = 'full';
    let context = this.context;
    let zoneId = this.zoneId;
    let accentColor = null;

    if (typeof config === 'string') {
      mode = config;
    } else if (config && typeof config === 'object') {
      mode = config.mode || 'full';
      context = config.context || context;
      zoneId = config.zoneId || zoneId;
      accentColor = config.accentColor ?? null;
    }

    this.mode = mode === 'minimal' ? 'minimal' : 'full';
    this.context = context === 'hub' ? 'hub' : 'zone';
    this.zoneId = typeof zoneId === 'string' ? zoneId : this.zoneId;
    if (this.mode === 'minimal') this.context = 'zone';
    this.selectedIndex = 0;
    this.statsOpen = false;
    this.confirmState = null;

    if (!this._root) this._createRoot();

    this._root.classList.add('visible');
    this._root.classList.toggle('mode-full', this.mode === 'full');
    this._root.classList.toggle('mode-minimal', this.mode === 'minimal');
    this._root.classList.toggle('context-hub', this.context === 'hub');
    this._root.classList.toggle('context-zone', this.context !== 'hub');

    this._applyThemeVariables({ accentColor });
    this._fullLayout.style.display = this.mode === 'full' ? 'grid' : 'none';
    this._minimalLayout.style.display = this.mode === 'minimal' ? 'flex' : 'none';

    this._syncHeaderText();
    this._renderMenu();
    this._renderStatsIfNeeded(true);
    this._renderConfirm();
  }

  close() {
    if (!this._root) return;
    this.mode = 'none';
    this.context = 'zone';
    this.zoneId = 'hub';
    this.statsOpen = false;
    this.confirmState = null;
    this._root.classList.remove('visible', 'mode-full', 'mode-minimal', 'context-hub', 'context-zone');

    if (this.settingsPanel?.isOpen()) {
      this.settingsPanel.close({ skipCallback: true });
    }
  }

  update(input) {
    if (!this.isOpen()) return;

    this._renderStatsIfNeeded();

    if (this.settingsPanel?.isOpen()) {
      if (this._isBackPressed(input)) {
        this.settingsPanel.requestBack();
      }
      return;
    }

    if (this.confirmState) {
      this._updateConfirmInput(input);
      return;
    }

    if (this.mode === 'full' && this.context === 'zone' && this.statsOpen && this._isBackPressed(input)) {
      this.statsOpen = false;
      this._renderStatsIfNeeded(true);
      return;
    }

    if (this._isBackPressed(input)) {
      this._activateResume();
      return;
    }

    if (this._isMoveUpPressed(input)) {
      this.selectedIndex = (this.selectedIndex - 1 + this._menuItems().length) % this._menuItems().length;
      this._renderMenu();
    } else if (this._isMoveDownPressed(input)) {
      this.selectedIndex = (this.selectedIndex + 1) % this._menuItems().length;
      this._renderMenu();
    }

    if (this._isConfirmPressed(input)) {
      this._activateItem(this._menuItems()[this.selectedIndex]?.id);
    }
  }

  _menuItems() {
    if (this.mode === 'minimal') return MINIMAL_MENU_ITEMS;
    return this.context === 'hub' ? HUB_MENU_ITEMS : FULL_ZONE_MENU_ITEMS;
  }

  _createRoot() {
    this._root = createElement('div', 'pause-shell');
    this._root.innerHTML = `
      <style>
        .pause-shell {
          position: fixed;
          inset: 0;
          z-index: 780;
          display: none;
          pointer-events: auto;
          font-family: 'Courier New', Courier, monospace;
          color: #f4e9ff;
          overflow: hidden;
          --pause-accent-rgb: 192, 128, 255;
          --pause-accent-soft-rgb: 211, 160, 255;
          --pause-accent-deep-rgb: 90, 40, 160;
          --pause-panel-rgb: 58, 36, 92;
        }
        .pause-shell.visible { display: block; }
        .pause-bg-far,
        .pause-bg-overlay,
        .pause-bg-gate,
        .pause-rift,
        .pause-floor-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          transition: opacity 220ms ease;
        }
        .pause-bg-far {
          background: url('./assets/ui/bg-pause.jpeg') center/cover no-repeat;
        }
        .pause-bg-overlay {
          background:
            radial-gradient(ellipse 80% 60% at 50% 110%, #1a0530 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 80%, #0d1a3a 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, #1a0a0a 0%, transparent 60%),
            linear-gradient(180deg, #06050d 0%, #0c0618 40%, #14061a 100%);
        }
        .pause-bg-gate {
          background:
            linear-gradient(90deg, transparent 20%, rgba(4,2,12,0.84) 35%, transparent 42%),
            linear-gradient(270deg, transparent 20%, rgba(4,2,12,0.84) 35%, transparent 42%);
        }
        .pause-rift {
          top: 0;
          left: 50%;
          width: 1px;
          height: 55%;
          inset: auto;
          transform: translateX(-50%);
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(var(--pause-accent-soft-rgb), 0.96) 22%,
            rgba(var(--pause-accent-rgb), 0.92) 52%,
            rgba(var(--pause-accent-deep-rgb), 0.92) 78%,
            transparent 100%
          );
          box-shadow:
            0 0 8px 2px rgba(var(--pause-accent-rgb), 0.8),
            0 0 22px 5px rgba(var(--pause-accent-deep-rgb), 0.85);
          animation: pauseRiftBreath 4s ease-in-out infinite;
        }
        .pause-floor-glow {
          bottom: 27%;
          left: 50%;
          width: 42vw;
          height: 2px;
          inset: auto;
          transform: translateX(-50%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(var(--pause-accent-deep-rgb), 0.92),
            rgba(var(--pause-accent-soft-rgb), 0.95),
            rgba(var(--pause-accent-deep-rgb), 0.92),
            transparent
          );
          box-shadow: 0 0 26px 10px rgba(var(--pause-accent-rgb), 0.25);
          animation: pauseFloorPulse 4s ease-in-out infinite;
        }
        @keyframes pauseRiftBreath {
          0%, 100% {
            opacity: 0.62;
            box-shadow: 0 0 8px 2px rgba(var(--pause-accent-rgb), 0.78), 0 0 22px 5px rgba(var(--pause-accent-deep-rgb), 0.85);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 14px 4px rgba(var(--pause-accent-soft-rgb), 0.9), 0 0 36px 9px rgba(var(--pause-accent-rgb), 0.92);
          }
        }
        @keyframes pauseFloorPulse {
          0%, 100% { opacity: 0.45; width: 32vw; }
          50% { opacity: 0.9; width: 44vw; }
        }
        .pause-shell.mode-full .pause-bg-far { opacity: 1; }
        .pause-shell.mode-full .pause-bg-overlay { opacity: 0.58; }
        .pause-shell.mode-full .pause-bg-gate { opacity: 0.72; }
        .pause-shell.mode-full .pause-rift { opacity: 0.9; }
        .pause-shell.mode-full .pause-floor-glow { opacity: 0.85; }
        .pause-shell.mode-minimal .pause-bg-overlay {
          opacity: 0.34;
        }
        .pause-shell.mode-full {
          background: rgba(5, 4, 10, 0.24);
        }
        .pause-shell.mode-minimal {
          background: rgba(4, 4, 10, 0.24);
        }
        .pause-shell.context-hub .pause-full {
          grid-template-columns: minmax(0, 1fr);
        }
        .pause-shell.context-hub .pause-left {
          max-width: 880px;
          margin: 0 auto;
        }
        .pause-shell.context-hub .pause-right {
          display: none;
        }
        .pause-full {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: minmax(320px, 0.54fr) minmax(350px, 0.46fr);
          grid-template-rows: minmax(0, 1fr);
          height: 100%;
          gap: 14px;
          padding: clamp(22px, 4vh, 44px) clamp(14px, 2.6vw, 30px) clamp(12px, 2.8vh, 24px);
          box-sizing: border-box;
        }
        .pause-left {
          padding: clamp(24px, 4vw, 38px) clamp(16px, 2.2vw, 28px);
          border: 1px solid rgba(232, 216, 255, 0.2);
          background: linear-gradient(180deg, rgba(12, 7, 26, 0.52), rgba(6, 5, 14, 0.36));
          backdrop-filter: blur(2px);
          overflow: auto;
          min-height: 0;
        }
        .pause-title {
          letter-spacing: 0.28em;
          text-transform: uppercase;
          font-size: clamp(28px, 4.5vw, 52px);
          margin-bottom: 8px;
          color: #f6e7ff;
          text-shadow:
            0 0 12px rgba(var(--pause-accent-soft-rgb), 0.75),
            0 0 28px rgba(var(--pause-accent-deep-rgb), 0.42);
          line-height: 1;
        }
        .pause-subtitle {
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: clamp(10px, 1.1vw, 12px);
          color: rgba(214, 196, 241, 0.82);
          margin-bottom: 10px;
        }
        .pause-menu-divider {
          height: 1px;
          margin-bottom: 16px;
          background: linear-gradient(90deg, transparent, rgba(var(--pause-accent-soft-rgb), 0.75), transparent);
          box-shadow: 0 0 16px rgba(var(--pause-accent-rgb), 0.24);
        }
        .pause-menu {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 0;
          padding: 0;
        }
        .pause-menu li {
          margin: 0;
          border-bottom: 1px solid rgba(232, 216, 255, 0.12);
          padding: 2px 0;
        }
        .pause-menu button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid transparent;
          background: transparent;
          color: rgba(160,130,200,0.58);
          padding: 10px 2px;
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font: inherit;
          font-size: clamp(11px, 1.15vw, 14px);
          cursor: pointer;
          transition: border-color 160ms ease, color 160ms ease, background 160ms ease, text-shadow 160ms ease;
        }
        .pause-menu button::before {
          content: '\\276F';
          font-size: 0.68em;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 150ms ease, transform 150ms ease;
        }
        .pause-menu button.selected,
        .pause-menu button:hover {
          color: #e8d8ff;
          border-color: transparent;
          background: transparent;
          text-shadow:
            0 0 10px rgba(var(--pause-accent-soft-rgb), 0.82),
            0 0 24px rgba(var(--pause-accent-deep-rgb), 0.5);
        }
        .pause-menu button.selected::before,
        .pause-menu button:hover::before {
          opacity: 1;
          transform: translateX(0);
        }
        .pause-right {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(232, 216, 255, 0.2);
          background: linear-gradient(180deg, rgba(16, 12, 29, 0.5), rgba(7, 7, 16, 0.38));
          backdrop-filter: blur(2px);
          min-height: 0;
        }
        .pause-stats {
          position: absolute;
          inset: 0;
          transform: translateX(100%);
          transition: transform 220ms ease;
          border-left: 1px solid rgba(232, 216, 255, 0.18);
          background: linear-gradient(180deg, rgba(19, 12, 36, 0.92), rgba(7, 7, 16, 0.88));
          padding: 26px 24px;
          overflow: auto;
          box-sizing: border-box;
        }
        .pause-stats.open {
          transform: translateX(0);
        }
        .pause-stats h3 {
          margin-bottom: 14px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 13px;
          color: #f3e6ff;
          text-shadow: 0 0 8px rgba(var(--pause-accent-rgb), 0.46);
        }
        .pause-stat-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 18px;
        }
        .pause-stat {
          border: 1px solid rgba(232, 216, 255, 0.14);
          background: rgba(9, 9, 20, 0.42);
          padding: 9px 10px;
        }
        .pause-stat .label {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(232, 216, 255, 0.7);
          margin-bottom: 4px;
        }
        .pause-stat .value {
          font-size: 14px;
          color: #fff;
        }
        .pause-player-strip {
          border: 1px solid rgba(232, 216, 255, 0.14);
          background: rgba(9, 9, 20, 0.42);
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .pause-player-strip th,
        .pause-player-strip td {
          border: 1px solid rgba(232, 216, 255, 0.12);
          padding: 7px 8px;
          text-align: left;
        }
        .pause-player-strip th {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(232, 216, 255, 0.78);
          font-size: 10px;
        }
        .pause-minimal {
          position: relative;
          z-index: 2;
          display: none;
          align-items: center;
          justify-content: center;
          height: 100%;
          pointer-events: auto;
        }
        .pause-minimal-card {
          width: min(460px, 92vw);
          padding: 20px 18px;
          border: 1px solid rgba(232, 216, 255, 0.3);
          background: linear-gradient(180deg, rgba(16, 11, 29, 0.84), rgba(7, 7, 16, 0.8));
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.46);
        }
        .pause-minimal-title {
          text-transform: uppercase;
          letter-spacing: 0.18em;
          margin-bottom: 10px;
          font-size: 14px;
          color: #f9efff;
          text-shadow: 0 0 10px rgba(183, 107, 255, 0.6);
        }
        .pause-minimal-subtitle {
          font-size: 11px;
          color: rgba(234, 219, 255, 0.74);
          margin-bottom: 10px;
          line-height: 1.5;
        }
        .pause-confirm {
          position: absolute;
          inset: 0;
          display: none;
          align-items: center;
          justify-content: center;
          background: rgba(4, 4, 10, 0.72);
          z-index: 4;
          padding: 12px;
          box-sizing: border-box;
        }
        .pause-confirm.open { display: flex; }
        .pause-confirm-card {
          width: min(520px, 92vw);
          border: 1px solid rgba(232, 216, 255, 0.32);
          background: linear-gradient(180deg, rgba(18, 11, 31, 0.94), rgba(8, 8, 17, 0.94));
          padding: 22px;
        }
        .pause-confirm-title {
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-size: 14px;
          margin-bottom: 8px;
          color: #fff;
          text-shadow: 0 0 9px rgba(186, 109, 255, 0.55);
        }
        .pause-confirm-message {
          font-size: 12px;
          line-height: 1.6;
          color: rgba(232, 216, 255, 0.85);
          margin-bottom: 16px;
        }
        .pause-confirm-actions {
          display: flex;
          gap: 10px;
        }
        .pause-confirm-actions button {
          flex: 1;
          border: 1px solid rgba(232, 216, 255, 0.24);
          background: rgba(9, 9, 20, 0.55);
          color: rgba(232, 216, 255, 0.95);
          padding: 10px 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font: inherit;
          font-size: 11px;
          cursor: pointer;
        }
        .pause-confirm-actions button.selected,
        .pause-confirm-actions button:hover {
          border-color: rgba(255, 160, 160, 0.72);
          background: rgba(120, 40, 40, 0.45);
          color: #fff;
        }
        body.ui-high-contrast .pause-shell.mode-full {
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.97), rgba(3, 3, 8, 0.98));
        }
        body.ui-high-contrast .pause-bg-far {
          filter: grayscale(0.25) contrast(1.15);
        }
        body.ui-high-contrast .pause-menu button {
          border-color: rgba(255, 255, 255, 0.45);
          color: #fff;
          background: rgba(0, 0, 0, 0.8);
        }
        body.ui-high-contrast .pause-menu button::before {
          color: #fff;
        }
        .pause-left,
        .pause-right,
        .pause-stats {
          scrollbar-width: thin;
          scrollbar-color: rgba(var(--pause-accent-rgb), 0.72) rgba(8, 8, 18, 0.35);
        }
        .pause-left::-webkit-scrollbar,
        .pause-right::-webkit-scrollbar,
        .pause-stats::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .pause-left::-webkit-scrollbar-track,
        .pause-right::-webkit-scrollbar-track,
        .pause-stats::-webkit-scrollbar-track {
          background: rgba(8, 8, 18, 0.34);
          border: 1px solid rgba(232, 216, 255, 0.1);
        }
        .pause-left::-webkit-scrollbar-thumb,
        .pause-right::-webkit-scrollbar-thumb,
        .pause-stats::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg,
            rgba(var(--pause-accent-soft-rgb), 0.95),
            rgba(var(--pause-accent-rgb), 0.9)
          );
          border: 1px solid rgba(var(--pause-accent-deep-rgb), 0.85);
        }
        .pause-left::-webkit-scrollbar-thumb:hover,
        .pause-right::-webkit-scrollbar-thumb:hover,
        .pause-stats::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            180deg,
            rgba(var(--pause-accent-soft-rgb), 1),
            rgba(var(--pause-accent-rgb), 1)
          );
        }
        @media (max-width: 980px) {
          .pause-full {
            grid-template-columns: 1fr;
            grid-template-rows: auto minmax(0, auto);
            gap: 10px;
            padding: 14px 10px 10px;
          }
          .pause-left { padding: 16px 12px; }
          .pause-right {
            overflow: auto;
          }
          .pause-stats {
            position: relative;
            inset: auto;
            display: none;
            transform: none;
            border-left: none;
            border-top: 1px solid rgba(232, 216, 255, 0.18);
            padding: 16px 12px;
          }
          .pause-stats.open {
            display: block;
          }
          .pause-stat-grid {
            grid-template-columns: 1fr;
          }
          .pause-player-strip {
            min-width: 560px;
          }
        }
        @media (max-width: 640px) {
          .pause-title {
            font-size: clamp(22px, 8vw, 34px);
          }
          .pause-subtitle {
            font-size: 10px;
          }
          .pause-minimal-card {
            width: min(480px, 95vw);
            padding: 16px 12px;
          }
        }
      </style>
    `;

    this._root.appendChild(createElement('div', 'pause-bg-far'));
    this._root.appendChild(createElement('div', 'pause-bg-overlay'));
    this._root.appendChild(createElement('div', 'pause-bg-gate'));
    this._root.appendChild(createElement('div', 'pause-rift'));
    this._root.appendChild(createElement('div', 'pause-floor-glow'));

    this._fullLayout = createElement('div', 'pause-full');
    this._root.appendChild(this._fullLayout);

    const left = createElement('section', 'pause-left');
    this._fullLayout.appendChild(left);

    this._titleEl = createElement('div', 'pause-title', 'Paused');
    left.appendChild(this._titleEl);
    this._subtitleEl = createElement('div', 'pause-subtitle', 'The Hunt waits for your command');
    left.appendChild(this._subtitleEl);
    left.appendChild(createElement('div', 'pause-menu-divider'));
    this._menuList = createElement('ul', 'pause-menu');
    left.appendChild(this._menuList);

    const right = createElement('section', 'pause-right');
    this._fullLayout.appendChild(right);
    this._statsPanel = createElement('aside', 'pause-stats');
    right.appendChild(this._statsPanel);

    this._minimalLayout = createElement('div', 'pause-minimal');
    this._root.appendChild(this._minimalLayout);

    const minimalCard = createElement('div', 'pause-minimal-card');
    this._minimalLayout.appendChild(minimalCard);
    minimalCard.appendChild(createElement('div', 'pause-minimal-title', 'Co-op Quick Pause'));
    minimalCard.appendChild(
      createElement(
        'div',
        'pause-minimal-subtitle',
        'Active combat keeps running. Resume, open limited settings, or leave to title.'
      )
    );
    const minimalMenu = createElement('ul', 'pause-menu');
    minimalCard.appendChild(minimalMenu);

    this._confirmWrap = createElement('div', 'pause-confirm');
    this._root.appendChild(this._confirmWrap);

    this._root.addEventListener('mousedown', (event) => {
      const button = event.target.closest('[data-pause-action]');
      if (!button) return;
      this._activateItem(button.dataset.pauseAction);
    });

    this.overlay.appendChild(this._root);
  }

  _syncHeaderText() {
    if (!this._titleEl || !this._subtitleEl) return;

    if (this.mode === 'minimal') {
      this._titleEl.textContent = 'Paused';
      this._subtitleEl.textContent = 'The Hunt waits for your command';
      return;
    }

    if (this.context === 'hub') {
      this._titleEl.textContent = 'Hunter Hub';
      this._subtitleEl.textContent = 'Safe zone controls and system options';
      return;
    }

    this._titleEl.textContent = 'Paused';
    this._subtitleEl.textContent = 'The Hunt waits for your command';
  }

  _applyThemeVariables({ accentColor = null } = {}) {
    if (!this._root) return;

    let base = null;
    if (this.context === 'zone') {
      base = hexToRgb(accentColor);
    }
    if (!base) {
      base = { r: 192, g: 128, b: 255 };
    }

    const soft = mixRgb(base, { r: 255, g: 255, b: 255 }, 0.24);
    const deep = mixRgb(base, { r: 10, g: 8, b: 24 }, 0.5);
    const panel = mixRgb(base, { r: 24, g: 18, b: 42 }, 0.78);

    this._root.style.setProperty('--pause-accent-rgb', `${base.r}, ${base.g}, ${base.b}`);
    this._root.style.setProperty('--pause-accent-soft-rgb', `${soft.r}, ${soft.g}, ${soft.b}`);
    this._root.style.setProperty('--pause-accent-deep-rgb', `${deep.r}, ${deep.g}, ${deep.b}`);
    this._root.style.setProperty('--pause-panel-rgb', `${panel.r}, ${panel.g}, ${panel.b}`);
  }

  _renderMenu() {
    const targetMenu = this.mode === 'minimal'
      ? this._minimalLayout.querySelector('.pause-menu')
      : this._menuList;

    targetMenu.textContent = '';
    const items = this._menuItems();
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const row = document.createElement('li');
      const button = createElement('button', i === this.selectedIndex ? 'selected' : '', item.label);
      button.type = 'button';
      button.dataset.pauseAction = item.id;
      row.appendChild(button);
      targetMenu.appendChild(row);
    }
  }

  _renderStatsIfNeeded(force = false) {
    if (this.mode !== 'full') return;
    if (this.context !== 'zone') {
      this.statsOpen = false;
      this._statsPanel.classList.remove('open');
      this._statsPanel.textContent = '';
      return;
    }

    this._statsPanel.classList.toggle('open', this.statsOpen);
    if (!this.statsOpen && !force) return;

    const stats = this.getRunStats?.() || null;
    const hash = JSON.stringify(stats || {});
    if (!force && hash === this._renderedStatsHash) return;
    this._renderedStatsHash = hash;

    if (!stats) {
      this._statsPanel.innerHTML = '<h3>Run Stats</h3><p>No run data available.</p>';
      return;
    }

    const statEntries = [
      ['Zone', `${stats.zoneLabel || 'Hub'}${stats.zoneNumber > 0 ? ` (${stats.zoneNumber})` : ''}`],
      ['Wave', stats.wave ?? '-'],
      ['Essence Collected', stats.essenceCollected ?? 0],
      ['Essence Held', stats.essenceHeld ?? 0],
      ['Highest Combo', stats.highestCombo ?? 0],
      ['Enemies Killed', stats.enemiesKilled ?? 0],
      ['Damage Dealt', stats.damageDealt ?? 0],
      ['Damage Taken', stats.damageTaken ?? 0],
      ['Deaths', stats.deaths ?? 0],
      ['Downs', stats.downs ?? 0],
      ['Revives', stats.revives ?? 0],
      ['Time Elapsed', formatTime(stats.timeElapsed)],
    ];

    const statHtml = statEntries.map(([label, value]) => {
      return `<div class="pause-stat"><span class="label">${label}</span><span class="value">${value}</span></div>`;
    }).join('');

    const playerRows = (stats.players || []).map((player) => {
      return `
        <tr>
          <td>P${player.playerIndex + 1}</td>
          <td>${player.hunterLabel || player.hunterId || '-'}</td>
          <td>${player.essenceHeld ?? 0}</td>
          <td>${player.highestCombo ?? 0}</td>
          <td>${player.downs ?? 0}</td>
          <td>${player.revives ?? 0}</td>
          <td>${player.deaths ?? 0}</td>
        </tr>
      `;
    }).join('');

    this._statsPanel.innerHTML = `
      <h3>Run Stats</h3>
      <div class="pause-stat-grid">${statHtml}</div>
      <h3>Per Player</h3>
      <table class="pause-player-strip">
        <thead>
          <tr>
            <th>Player</th>
            <th>Hunter</th>
            <th>Essence</th>
            <th>Combo</th>
            <th>Downs</th>
            <th>Revives</th>
            <th>Deaths</th>
          </tr>
        </thead>
        <tbody>
          ${playerRows || '<tr><td colspan="7">No active players.</td></tr>'}
        </tbody>
      </table>
    `;
  }

  _renderConfirm() {
    if (!this.confirmState) {
      this._confirmWrap.classList.remove('open');
      this._confirmWrap.textContent = '';
      return;
    }

    const isAbandon = this.confirmState.action === 'abandon-run';
    const title = isAbandon ? 'Abandon Run?' : 'Quit to Title?';
    const message = isAbandon
      ? 'End this run and return to Hunter Hub? Current zone progress will reset.'
      : 'Quit to title? Current run progress will be lost for this session.';

    this._confirmWrap.classList.add('open');
    this._confirmWrap.innerHTML = `
      <div class="pause-confirm-card">
        <div class="pause-confirm-title">${title}</div>
        <div class="pause-confirm-message">${message}</div>
        <div class="pause-confirm-actions">
          <button type="button" data-confirm="yes" class="${this.confirmState.selected === 'yes' ? 'selected' : ''}">Yes</button>
          <button type="button" data-confirm="no" class="${this.confirmState.selected === 'no' ? 'selected' : ''}">No</button>
        </div>
      </div>
    `;

    for (const button of this._confirmWrap.querySelectorAll('button[data-confirm]')) {
      button.addEventListener('click', () => {
        this.confirmState.selected = button.dataset.confirm;
        this._resolveConfirm();
      });
    }
  }

  _updateConfirmInput(input) {
    if (this._isMoveLeftPressed(input) || this._isMoveUpPressed(input)) {
      this.confirmState.selected = 'yes';
      this._renderConfirm();
      return;
    }

    if (this._isMoveRightPressed(input) || this._isMoveDownPressed(input)) {
      this.confirmState.selected = 'no';
      this._renderConfirm();
      return;
    }

    if (this._isBackPressed(input)) {
      this.confirmState = null;
      this._renderConfirm();
      return;
    }

    if (this._isConfirmPressed(input)) {
      this._resolveConfirm();
    }
  }

  _resolveConfirm() {
    if (!this.confirmState) return;

    const shouldProceed = this.confirmState.selected === 'yes';
    const action = this.confirmState.action;
    this.confirmState = null;
    this._renderConfirm();

    if (!shouldProceed) return;

    if (action === 'abandon-run') {
      this.close();
      this.onAbandonRun?.();
      return;
    }

    if (action === 'quit-title') {
      this.close();
      this.onQuitToTitle?.();
    }
  }

  _activateItem(actionId) {
    if (!actionId) return;

    const idx = this._menuItems().findIndex((item) => item.id === actionId);
    if (idx >= 0) {
      this.selectedIndex = idx;
      this._renderMenu();
    }

    if (actionId === 'resume') {
      this._activateResume();
      return;
    }

    if (actionId === 'run-stats') {
      if (this.context !== 'zone') return;
      this.statsOpen = !this.statsOpen;
      this._renderStatsIfNeeded(true);
      return;
    }

    if (actionId === 'controls') {
      this.statsOpen = false;
      this._renderStatsIfNeeded(true);
      this.settingsPanel?.open({ mode: 'full', tab: 'controls' });
      return;
    }

    if (actionId === 'settings') {
      const mode = this.mode === 'minimal' ? 'minimal' : 'full';
      this.settingsPanel?.open({ mode, tab: 'audio' });
      return;
    }

    if (actionId === 'abandon-run') {
      this.confirmState = { action: 'abandon-run', selected: 'no' };
      this._renderConfirm();
      return;
    }

    if (actionId === 'quit-title') {
      this.confirmState = { action: 'quit-title', selected: 'no' };
      this._renderConfirm();
    }
  }

  _activateResume() {
    this.close();
    this.onResume?.();
  }

  _isMoveUpPressed(input) {
    const p1 = input.getPlayerInput(0);
    return p1.justPressed(Actions.MOVE_UP) || input.justPressedKey('ArrowUp');
  }

  _isMoveDownPressed(input) {
    const p1 = input.getPlayerInput(0);
    return p1.justPressed(Actions.MOVE_DOWN) || input.justPressedKey('ArrowDown');
  }

  _isMoveLeftPressed(input) {
    const p1 = input.getPlayerInput(0);
    return p1.justPressed(Actions.MOVE_LEFT) || input.justPressedKey('ArrowLeft');
  }

  _isMoveRightPressed(input) {
    const p1 = input.getPlayerInput(0);
    return p1.justPressed(Actions.MOVE_RIGHT) || input.justPressedKey('ArrowRight');
  }

  _isConfirmPressed(input) {
    const p1 = input.getPlayerInput(0);
    return p1.justPressed(Actions.INTERACT)
      || p1.justPressed(Actions.LIGHT)
      || input.justPressedKey('Enter');
  }

  _isBackPressed(input) {
    const p1 = input.getPlayerInput(0);
    return p1.justPressed(Actions.PAUSE)
      || p1.justPressed(Actions.DODGE)
      || input.justPressedKey('Escape');
  }
}
