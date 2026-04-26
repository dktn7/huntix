import { GameSettings, SettingsActions } from './GameSettings.js';

const TAB_IDS_FULL = ['audio', 'display', 'controls', 'accessibility', 'keybinds', 'gamepad', 'how-to-play'];
const TAB_IDS_MINIMAL = ['audio', 'display'];

const TAB_LABELS = {
  audio: 'Audio',
  display: 'Display',
  controls: 'Controls',
  accessibility: 'Accessibility',
  keybinds: 'Keybinds',
  gamepad: 'Gamepad',
  'how-to-play': 'How to Play',
};

const ACTION_LABELS = {
  [SettingsActions.MOVE_LEFT]: 'Move Left',
  [SettingsActions.MOVE_RIGHT]: 'Move Right',
  [SettingsActions.MOVE_UP]: 'Move Up',
  [SettingsActions.MOVE_DOWN]: 'Move Down',
  [SettingsActions.JUMP]: 'Jump',
  [SettingsActions.LIGHT]: 'Light Attack',
  [SettingsActions.HEAVY]: 'Heavy Attack',
  [SettingsActions.DODGE]: 'Dodge',
  [SettingsActions.SPECIAL]: 'Special',
  [SettingsActions.INTERACT]: 'Interact',
  [SettingsActions.PAUSE]: 'Pause',
};

const GAMEPAD_BUTTON_OPTIONS = [
  { value: 0, label: 'Button 0 (A/Cross)' },
  { value: 1, label: 'Button 1 (B/Circle)' },
  { value: 2, label: 'Button 2 (X/Square)' },
  { value: 3, label: 'Button 3 (Y/Triangle)' },
  { value: 4, label: 'Button 4 (LB/L1)' },
  { value: 5, label: 'Button 5 (RB/R1)' },
  { value: 6, label: 'Button 6 (LT/L2)' },
  { value: 7, label: 'Button 7 (RT/R2)' },
  { value: 8, label: 'Button 8 (View/Share)' },
  { value: 9, label: 'Button 9 (Start/Options)' },
  { value: 10, label: 'Button 10 (L3)' },
  { value: 11, label: 'Button 11 (R3)' },
];

const GAMEPAD_LABELS = {
  0: 'A / Cross',
  1: 'B / Circle',
  2: 'X / Square',
  3: 'Y / Triangle',
  4: 'LB / L1',
  5: 'RB / R1',
  6: 'LT / L2',
  7: 'RT / R2',
  8: 'View / Share',
  9: 'Start / Options',
  10: 'L3',
  11: 'R3',
};

function codeToLabel(code) {
  if (!code) return '-';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
  if (code === 'ArrowUp') return 'Arrow Up';
  if (code === 'ArrowDown') return 'Arrow Down';
  if (code === 'ArrowLeft') return 'Arrow Left';
  if (code === 'ArrowRight') return 'Arrow Right';
  if (code === 'ShiftLeft') return 'L-Shift';
  if (code === 'ShiftRight') return 'R-Shift';
  if (code === 'Space') return 'Space';
  if (code === 'Escape') return 'Escape';
  return code;
}

function actionRows() {
  return [
    SettingsActions.MOVE_LEFT,
    SettingsActions.MOVE_RIGHT,
    SettingsActions.MOVE_UP,
    SettingsActions.MOVE_DOWN,
    SettingsActions.JUMP,
    SettingsActions.LIGHT,
    SettingsActions.HEAVY,
    SettingsActions.DODGE,
    SettingsActions.SPECIAL,
    SettingsActions.INTERACT,
    SettingsActions.PAUSE,
  ];
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class SettingsPanel {
  constructor(overlay, inputManager, audioManager = null) {
    this.overlay = overlay;
    this.inputManager = inputManager;
    this.audioManager = audioManager;

    this._root = null;
    this._panel = null;
    this._tabBar = null;
    this._content = null;
    this._footer = null;
    this._status = null;

    this._open = false;
    this._mode = 'full';
    this._activeTab = 'audio';
    this._onClose = null;
    this._pendingKeyboardAction = null;

    this._settings = GameSettings.get();
    this._unsubscribe = GameSettings.subscribe((settings) => {
      this._settings = settings;
      this._syncAudioVolumes();
      if (this._open) this._render();
    });

    this._handleWindowKeyDown = this._onWindowKeyDown.bind(this);
    window.addEventListener('keydown', this._handleWindowKeyDown);
  }

  destroy() {
    window.removeEventListener('keydown', this._handleWindowKeyDown);
    this._unsubscribe?.();
    this._unsubscribe = null;
    this.close({ skipCallback: true });
  }

  isOpen() {
    return this._open;
  }

  open({ mode = 'full', tab = 'audio', onClose = null } = {}) {
    this._mode = mode === 'minimal' ? 'minimal' : 'full';
    this._activeTab = this._isTabAllowed(tab) ? tab : 'audio';
    this._onClose = typeof onClose === 'function' ? onClose : null;
    this._pendingKeyboardAction = null;

    if (!this._root) this._createRoot();
    this._open = true;
    this._root.classList.add('visible');
    this._root.setAttribute('aria-hidden', 'false');
    this._render();
  }

  close({ skipCallback = false } = {}) {
    if (!this._root || !this._open) return;

    this._open = false;
    this._pendingKeyboardAction = null;
    this._root.classList.remove('visible');
    this._root.setAttribute('aria-hidden', 'true');

    if (!skipCallback && this._onClose) {
      const callback = this._onClose;
      this._onClose = null;
      callback();
    }
  }

  requestBack() {
    if (!this._open) return false;
    if (this._pendingKeyboardAction) {
      this._pendingKeyboardAction = null;
      this._setStatus('Keybind capture cancelled.');
      this._render();
      return true;
    }

    this.close();
    return true;
  }

  _createRoot() {
    this._root = createElement('div', 'settings-panel-overlay');
    this._root.setAttribute('aria-hidden', 'true');
    this._root.innerHTML = `
      <style>
        .settings-panel-overlay {
          position: fixed;
          inset: 0;
          z-index: 820;
          display: none;
          align-items: center;
          justify-content: center;
          background:
            linear-gradient(180deg, rgba(6, 5, 13, 0.26), rgba(7, 5, 14, 0.34)),
            url('./assets/ui/bg-settings.jpeg') center/cover no-repeat;
          pointer-events: auto;
          font-family: 'Courier New', Courier, monospace;
          padding: 16px;
          box-sizing: border-box;
          overflow: hidden;
        }
        .settings-panel-overlay.visible { display: flex; }
        .settings-panel-overlay::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse 80% 60% at 50% 110%, #1a0530 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 80%, #0d1a3a 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, #1a0a0a 0%, transparent 60%),
            linear-gradient(180deg, #06050d 0%, #0c0618 40%, #14061a 100%);
          opacity: 0.48;
        }
        .settings-panel-overlay::after {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 1px;
          height: 52%;
          transform: translateX(-50%);
          background: linear-gradient(180deg, transparent 0%, #c080ff 20%, #8844dd 50%, #440088 80%, transparent 100%);
          box-shadow: 0 0 8px 2px #9933ff, 0 0 24px 6px #440088;
          opacity: 0.72;
          animation: settingsRiftBreath 4s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes settingsRiftBreath {
          0%, 100% { opacity: 0.56; box-shadow: 0 0 8px 2px #9933ff, 0 0 24px 6px #440088; }
          50% { opacity: 0.92; box-shadow: 0 0 14px 4px #cc66ff, 0 0 40px 10px #6600cc; }
        }
        .settings-panel {
          width: min(1120px, 100%);
          height: min(740px, 100%);
          border: 1px solid rgba(232, 216, 255, 0.24);
          background: linear-gradient(180deg, rgba(9, 7, 20, 0.52), rgba(5, 4, 12, 0.46));
          backdrop-filter: blur(2px);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.58);
          display: flex;
          flex-direction: column;
          color: #f4e9ff;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }
        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 18px 14px;
          border-bottom: 1px solid rgba(232, 216, 255, 0.18);
          background: linear-gradient(90deg, rgba(38, 15, 61, 0.5), rgba(5, 4, 12, 0.24));
        }
        .settings-title {
          letter-spacing: 0.3em;
          text-transform: uppercase;
          font-size: clamp(16px, 2.2vw, 28px);
          font-weight: 700;
          color: #f1e6ff;
          text-shadow: 0 0 10px rgba(180,100,255,0.8), 0 0 24px rgba(120,50,200,0.5);
        }
        .settings-close {
          border: 1px solid rgba(232, 216, 255, 0.3);
          background: rgba(10, 8, 23, 0.34);
          color: #f4e9ff;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 8px 12px;
          cursor: pointer;
          font: inherit;
          font-size: 11px;
          transition: border-color 140ms ease, color 140ms ease, text-shadow 140ms ease;
        }
        .settings-close:hover,
        .settings-close:focus {
          border-color: rgba(225, 198, 255, 0.75);
          color: #fff;
          text-shadow: 0 0 9px rgba(188, 120, 255, 0.68);
        }
        .settings-tabbar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 12px 16px 10px;
          border-bottom: 1px solid rgba(232, 216, 255, 0.16);
          background: rgba(10, 8, 22, 0.36);
        }
        .settings-tab {
          border: 1px solid rgba(232, 216, 255, 0.22);
          background: rgba(9, 8, 20, 0.25);
          color: rgba(160,130,200,0.62);
          padding: 8px 12px;
          cursor: pointer;
          font: inherit;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 11px;
          transition: border-color 160ms ease, color 160ms ease, text-shadow 160ms ease;
        }
        .settings-tab:hover {
          color: #e8d8ff;
          border-color: rgba(211, 179, 246, 0.56);
          text-shadow: 0 0 10px rgba(180,100,255,0.8), 0 0 24px rgba(120,50,200,0.5);
        }
        .settings-tab.active {
          background: rgba(112, 57, 168, 0.36);
          border-color: rgba(228, 198, 255, 0.78);
          color: #e8d8ff;
          text-shadow: 0 0 10px rgba(180,100,255,0.8), 0 0 24px rgba(120,50,200,0.5);
        }
        .settings-content {
          flex: 1;
          min-height: 0;
          overflow: auto;
          padding: 16px;
        }
        .settings-footer {
          padding: 10px 16px;
          border-top: 1px solid rgba(232, 216, 255, 0.16);
          font-size: 11px;
          color: rgba(232, 216, 255, 0.76);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .settings-status {
          color: #f7d86a;
          min-height: 1em;
        }
        .settings-note {
          color: rgba(232, 216, 255, 0.62);
        }
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 12px;
        }
        .settings-field {
          border: 1px solid rgba(232, 216, 255, 0.16);
          background: rgba(8, 9, 21, 0.28);
          padding: 11px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 12px;
          min-width: 0;
        }
        .settings-field label,
        .settings-field .settings-label {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(244, 233, 255, 0.9);
        }
        .settings-field small {
          color: rgba(232, 216, 255, 0.62);
          line-height: 1.45;
        }
        .settings-field input[type='range'],
        .settings-field select,
        .settings-field button,
        .settings-field input[type='checkbox'] {
          font: inherit;
        }
        .settings-field input[type='range'] {
          width: 100%;
        }
        .settings-field select,
        .settings-field button {
          border: 1px solid rgba(232, 216, 255, 0.24);
          background: rgba(8, 8, 18, 0.3);
          color: #f4e9ff;
          padding: 6px 8px;
        }
        .settings-keybind-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          min-width: 560px;
        }
        .settings-keybind-table th,
        .settings-keybind-table td {
          border: 1px solid rgba(232, 216, 255, 0.16);
          padding: 8px 10px;
          text-align: left;
        }
        .settings-keybind-table th {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(244, 233, 255, 0.9);
          background: rgba(18, 12, 30, 0.26);
          font-size: 11px;
        }
        .settings-keybind-btn {
          border: 1px solid rgba(232, 216, 255, 0.24);
          background: rgba(8, 8, 18, 0.3);
          color: #f4e9ff;
          padding: 4px 8px;
          cursor: pointer;
        }
        .settings-howto {
          border: 1px solid rgba(232, 216, 255, 0.16);
          background: rgba(8, 9, 21, 0.28);
          padding: 14px;
          line-height: 1.6;
          font-size: 12px;
        }
        .settings-howto strong {
          color: #fff;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-size: 11px;
        }
        .settings-controls-root {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .settings-controls-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 12px;
        }
        .settings-controls-panel {
          border: 1px solid rgba(232, 216, 255, 0.16);
          background: rgba(8, 9, 21, 0.28);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
        }
        .settings-controls-panel h3 {
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 11px;
          color: rgba(244, 233, 255, 0.9);
        }
        .settings-key-cluster {
          display: grid;
          grid-template-columns: repeat(3, 50px);
          grid-template-rows: repeat(2, 42px);
          gap: 6px;
          width: max-content;
        }
        .settings-key-up { grid-column: 2; grid-row: 1; }
        .settings-key-left { grid-column: 1; grid-row: 2; }
        .settings-key-down { grid-column: 2; grid-row: 2; }
        .settings-key-right { grid-column: 3; grid-row: 2; }
        .settings-key-cap,
        .settings-pad-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 28px;
          padding: 0 12px;
          border: 1px solid rgba(232, 216, 255, 0.3);
          background: rgba(10, 10, 18, 0.5);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(244, 233, 255, 0.96);
          white-space: nowrap;
          box-sizing: border-box;
        }
        .settings-key-cap {
          border-color: rgba(211, 160, 255, 0.45);
          box-shadow: inset 0 0 0 1px rgba(188, 120, 255, 0.18);
        }
        .settings-key-cap.wide { min-width: 128px; }
        .settings-pad-chip.muted { opacity: 0.6; }
        .settings-control-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .settings-control-row {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid rgba(232, 216, 255, 0.12);
          padding-bottom: 6px;
          min-width: 0;
        }
        .settings-control-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .settings-control-desc {
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(232, 216, 255, 0.78);
        }
        .settings-pad-visual {
          display: flex;
          gap: 14px;
          align-items: center;
          justify-content: space-between;
        }
        .settings-dpad,
        .settings-face {
          position: relative;
          width: 86px;
          height: 86px;
          flex: 0 0 auto;
        }
        .settings-pad-node {
          position: absolute;
          width: 26px;
          height: 26px;
          border: 1px solid rgba(211, 160, 255, 0.68);
          background: rgba(10, 10, 18, 0.48);
          border-radius: 8px;
          box-shadow: inset 0 0 0 1px rgba(188, 120, 255, 0.16);
        }
        .settings-dpad .up { top: 0; left: 30px; }
        .settings-dpad .left { top: 30px; left: 0; }
        .settings-dpad .center { top: 30px; left: 30px; background: rgba(188, 120, 255, 0.34); }
        .settings-dpad .right { top: 30px; left: 60px; }
        .settings-dpad .down { top: 60px; left: 30px; }
        .settings-face .north { top: 0; left: 30px; border-radius: 999px; }
        .settings-face .west { top: 30px; left: 0; border-radius: 999px; }
        .settings-face .south { top: 60px; left: 30px; border-radius: 999px; background: rgba(188, 120, 255, 0.34); }
        .settings-face .east { top: 30px; left: 60px; border-radius: 999px; }
        .settings-controls-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .settings-controls-actions button {
          border: 1px solid rgba(232, 216, 255, 0.24);
          background: rgba(8, 8, 18, 0.3);
          color: #f4e9ff;
          padding: 6px 9px;
          font: inherit;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
        }
        .settings-controls-actions button:hover {
          border-color: rgba(225, 198, 255, 0.75);
          color: #fff;
          text-shadow: 0 0 9px rgba(188, 120, 255, 0.68);
        }
        body.ui-high-contrast .settings-panel-overlay {
          background:
            linear-gradient(180deg, rgba(0, 0, 0, 0.6), rgba(4, 4, 8, 0.66)),
            url('./assets/ui/bg-settings.jpeg') center/cover no-repeat;
        }
        body.ui-high-contrast .settings-panel {
          border-color: rgba(255, 255, 255, 0.5);
          background: rgba(0, 0, 0, 0.88);
        }
        .settings-content,
        .settings-tabbar,
        .settings-field {
          scrollbar-width: thin;
          scrollbar-color: rgba(188, 120, 255, 0.82) rgba(8, 8, 18, 0.35);
        }
        .settings-content::-webkit-scrollbar,
        .settings-tabbar::-webkit-scrollbar,
        .settings-field::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .settings-content::-webkit-scrollbar-track,
        .settings-tabbar::-webkit-scrollbar-track,
        .settings-field::-webkit-scrollbar-track {
          background: rgba(8, 8, 18, 0.34);
          border: 1px solid rgba(232, 216, 255, 0.1);
        }
        .settings-content::-webkit-scrollbar-thumb,
        .settings-tabbar::-webkit-scrollbar-thumb,
        .settings-field::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(211, 160, 255, 0.95), rgba(176, 102, 246, 0.92));
          border: 1px solid rgba(94, 42, 154, 0.82);
        }
        .settings-content::-webkit-scrollbar-thumb:hover,
        .settings-tabbar::-webkit-scrollbar-thumb:hover,
        .settings-field::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(224, 182, 255, 0.98), rgba(188, 120, 255, 0.96));
        }
        @media (max-width: 900px) {
          .settings-panel-overlay { padding: 8px; }
          .settings-panel { width: 100%; height: 100%; }
          .settings-header { padding: 12px; flex-wrap: wrap; }
          .settings-tabbar { gap: 6px; }
          .settings-tab { font-size: 10px; }
          .settings-content { padding: 12px; }
          .settings-grid {
            grid-template-columns: 1fr;
          }
          .settings-controls-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .settings-tabbar {
            max-height: 112px;
            overflow: auto;
          }
        }
      </style>
    `;

    this._panel = createElement('div', 'settings-panel');
    this._root.appendChild(this._panel);

    const header = createElement('div', 'settings-header');
    this._panel.appendChild(header);

    const title = createElement('div', 'settings-title', 'Settings');
    header.appendChild(title);

    const closeBtn = createElement('button', 'settings-close', 'Close');
    closeBtn.type = 'button';
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(closeBtn);

    this._tabBar = createElement('div', 'settings-tabbar');
    this._panel.appendChild(this._tabBar);

    this._content = createElement('div', 'settings-content');
    this._panel.appendChild(this._content);

    this._footer = createElement('div', 'settings-footer');
    this._status = createElement('div', 'settings-status', '');
    this._footer.appendChild(this._status);
    this._footer.appendChild(createElement('div', 'settings-note', 'Some advanced options are saved now and wired in later phases.'));
    this._panel.appendChild(this._footer);

    this._root.addEventListener('mousedown', (event) => {
      if (event.target === this._root) this.close();
    });

    this.overlay.appendChild(this._root);
  }

  _onWindowKeyDown(event) {
    if (!this._open) return;

    if (this._pendingKeyboardAction) {
      event.preventDefault();
      event.stopPropagation();
      this._commitKeyboardRebind(event.code);
    }
  }

  _render() {
    this._renderTabs();
    this._renderContent();
  }

  _renderTabs() {
    this._tabBar.textContent = '';
    const tabs = this._mode === 'minimal' ? TAB_IDS_MINIMAL : TAB_IDS_FULL;
    if (!tabs.includes(this._activeTab)) this._activeTab = tabs[0];

    for (const tabId of tabs) {
      const button = createElement('button', 'settings-tab', TAB_LABELS[tabId]);
      button.type = 'button';
      button.classList.toggle('active', tabId === this._activeTab);
      button.addEventListener('click', () => {
        this._activeTab = tabId;
        this._pendingKeyboardAction = null;
        this._render();
      });
      this._tabBar.appendChild(button);
    }
  }

  _renderContent() {
    this._content.textContent = '';

    if (this._activeTab === 'audio') {
      this._renderAudioTab();
      return;
    }
    if (this._activeTab === 'display') {
      this._renderDisplayTab();
      return;
    }
    if (this._activeTab === 'controls') {
      this._renderControlsTab();
      return;
    }
    if (this._activeTab === 'accessibility') {
      this._renderAccessibilityTab();
      return;
    }
    if (this._activeTab === 'keybinds') {
      this._renderKeybindsTab();
      return;
    }
    if (this._activeTab === 'gamepad') {
      this._renderGamepadTab();
      return;
    }
    this._renderHowToPlayTab();
  }

  _renderAudioTab() {
    const grid = createElement('div', 'settings-grid');
    this._content.appendChild(grid);

    grid.appendChild(this._createSliderField({
      label: 'Master Volume',
      value: this._settings.audio.masterVolume,
      min: 0,
      max: 100,
      onInput: (value) => GameSettings.set('audio.masterVolume', value),
      detail: 'Controls all game audio output.',
    }));

    grid.appendChild(this._createSliderField({
      label: 'Music Volume',
      value: this._settings.audio.musicVolume,
      min: 0,
      max: 100,
      onInput: (value) => GameSettings.set('audio.musicVolume', value),
      detail: 'Adjusts ambient and menu music loudness.',
    }));

    grid.appendChild(this._createSliderField({
      label: 'SFX Volume',
      value: this._settings.audio.sfxVolume,
      min: 0,
      max: 100,
      onInput: (value) => GameSettings.set('audio.sfxVolume', value),
      detail: 'Controls hit, spell, and UI sound effects.',
    }));

    grid.appendChild(this._createToggleField({
      label: 'Mono Audio',
      checked: this._settings.audio.monoAudio,
      onChange: (checked) => GameSettings.set('audio.monoAudio', checked),
      detail: 'Collapses stereo channels into mono output.',
    }));

    grid.appendChild(this._createToggleField({
      label: 'Visual Audio Cues',
      checked: this._settings.audio.visualAudioCues,
      onChange: (checked) => {
        GameSettings.set('audio.visualAudioCues', checked);
      },
      detail: 'Saved now. Full gameplay cue rendering is pending.',
    }));
  }

  _renderDisplayTab() {
    const grid = createElement('div', 'settings-grid');
    this._content.appendChild(grid);

    grid.appendChild(this._createSliderField({
      label: 'Brightness',
      value: this._settings.display.brightness,
      min: 0,
      max: 100,
      onInput: (value) => GameSettings.set('display.brightness', value),
      detail: 'Saved now. Scene post-processing hook is pending.',
    }));

    grid.appendChild(this._createSliderField({
      label: 'Contrast',
      value: this._settings.display.contrast,
      min: 0,
      max: 100,
      onInput: (value) => GameSettings.set('display.contrast', value),
      detail: 'Saved now. Scene post-processing hook is pending.',
    }));

    grid.appendChild(this._createSelectField({
      label: 'Colourblind Mode',
      value: this._settings.display.colourblindMode,
      options: [
        { value: 'off', label: 'Off' },
        { value: 'deuteranopia', label: 'Deuteranopia' },
        { value: 'protanopia', label: 'Protanopia' },
        { value: 'tritanopia', label: 'Tritanopia' },
      ],
      onChange: (value) => GameSettings.set('display.colourblindMode', value),
      detail: 'UI palette class is wired; full gameplay recolor pass is pending.',
    }));

    grid.appendChild(this._createToggleField({
      label: 'High Contrast Mode',
      checked: this._settings.display.highContrastMode,
      onChange: (checked) => GameSettings.set('display.highContrastMode', checked),
      detail: 'Pause and menu contrast updates apply immediately.',
    }));

    grid.appendChild(this._createToggleField({
      label: 'Reduce Particle Effects',
      checked: this._settings.display.reduceParticles,
      onChange: (checked) => GameSettings.set('display.reduceParticles', checked),
      detail: 'Saved now. Full particle-cap reroute is pending.',
    }));

    grid.appendChild(this._createToggleField({
      label: 'Reduce Screen Shake',
      checked: this._settings.display.reduceScreenShake,
      onChange: (checked) => GameSettings.set('display.reduceScreenShake', checked),
      detail: 'Camera shake intensity multiplier updates immediately.',
    }));

    grid.appendChild(this._createSliderField({
      label: 'UI Scale',
      value: this._settings.display.uiScale,
      min: 75,
      max: 150,
      onInput: (value) => GameSettings.set('display.uiScale', value),
      detail: 'Scales the full overlay layer in real time.',
      suffix: '%',
    }));
  }

  _renderControlsTab() {
    const bindings = this.inputManager?.getBindings?.() || null;
    const keyboardMap = bindings?.keyboard || this._settings.keybinds?.keyboard || {};
    const gamepadMap = bindings?.gamepad || this._settings.keybinds?.gamepad || {};
    const hasGamepad = this._hasConnectedGamepad();

    const keyboardFor = (action) => codeToLabel(keyboardMap[action]);
    const gamepadFor = (action) => {
      const mapped = gamepadMap[action];
      if (mapped === undefined || mapped === null) return '-';
      return GAMEPAD_LABELS[mapped] || `Button ${mapped}`;
    };

    const kbRow = (action, description, options = {}) => {
      const widthClass = options.wide ? ' wide' : '';
      return `
        <div class="settings-control-row">
          <span class="settings-key-cap${widthClass}">${escapeHtml(keyboardFor(action))}</span>
          <span class="settings-control-desc">${escapeHtml(description)}</span>
        </div>
      `;
    };

    const gpRow = (action, description, options = {}) => {
      const muted = hasGamepad ? '' : ' muted';
      const label = options.staticLabel || gamepadFor(action);
      return `
        <div class="settings-control-row">
          <span class="settings-pad-chip${muted}">${escapeHtml(label)}</span>
          <span class="settings-control-desc">${escapeHtml(description)}</span>
        </div>
      `;
    };

    const keyboardList = [
      kbRow('INTERACT', 'Interact / Confirm', { wide: true }),
      kbRow('JUMP', 'Jump'),
      kbRow('LIGHT', 'Light Attack'),
      kbRow('HEAVY', 'Heavy Attack'),
      kbRow('DODGE', 'Dodge'),
      kbRow('SPECIAL', 'Special'),
      kbRow('PAUSE', 'Pause Menu'),
    ].join('');

    const controllerList = [
      gpRow('INTERACT', 'Interact / Confirm'),
      gpRow('LIGHT', 'Light Attack'),
      gpRow('HEAVY', 'Heavy Attack'),
      gpRow('JUMP', 'Jump'),
      gpRow('SPECIAL', 'Special'),
      gpRow('DODGE', 'Dodge'),
      gpRow('PAUSE', 'Pause Menu'),
      gpRow('MOVE_UP', 'Move', { staticLabel: 'Left Stick / D-Pad' }),
    ].join('');

    const root = createElement('div', 'settings-controls-root');

    const intro = createElement('div', 'settings-field');
    intro.appendChild(createElement('div', 'settings-label', 'Current Control Layout'));
    intro.appendChild(createElement('small', '', 'This visual updates automatically after keyboard or controller rebinds.'));
    root.appendChild(intro);

    const grid = createElement('div', 'settings-controls-grid');
    root.appendChild(grid);

    const keyboardPanel = createElement('section', 'settings-controls-panel');
    keyboardPanel.innerHTML = `
      <h3>Keyboard</h3>
      <div class="settings-key-cluster">
        <span class="settings-key-cap settings-key-up">${escapeHtml(keyboardFor('MOVE_UP'))}</span>
        <span class="settings-key-cap settings-key-left">${escapeHtml(keyboardFor('MOVE_LEFT'))}</span>
        <span class="settings-key-cap settings-key-down">${escapeHtml(keyboardFor('MOVE_DOWN'))}</span>
        <span class="settings-key-cap settings-key-right">${escapeHtml(keyboardFor('MOVE_RIGHT'))}</span>
      </div>
      <div class="settings-control-list">${keyboardList}</div>
    `;
    grid.appendChild(keyboardPanel);

    const controllerPanel = createElement('section', 'settings-controls-panel');
    controllerPanel.innerHTML = `
      <h3>${hasGamepad ? 'Controller' : 'Controller (not detected)'}</h3>
      <div class="settings-pad-visual">
        <div class="settings-dpad">
          <span class="settings-pad-node up"></span>
          <span class="settings-pad-node left"></span>
          <span class="settings-pad-node center"></span>
          <span class="settings-pad-node right"></span>
          <span class="settings-pad-node down"></span>
        </div>
        <div class="settings-face">
          <span class="settings-pad-node north"></span>
          <span class="settings-pad-node west"></span>
          <span class="settings-pad-node south"></span>
          <span class="settings-pad-node east"></span>
        </div>
      </div>
      <div class="settings-control-list">${controllerList}</div>
    `;
    grid.appendChild(controllerPanel);

    const actions = createElement('div', 'settings-controls-actions');
    const keyboardBtn = createElement('button', '', 'Edit Keyboard Keybinds');
    keyboardBtn.type = 'button';
    keyboardBtn.addEventListener('click', () => {
      this._activeTab = 'keybinds';
      this._render();
    });
    actions.appendChild(keyboardBtn);

    const gamepadBtn = createElement('button', '', 'Edit Gamepad Mappings');
    gamepadBtn.type = 'button';
    gamepadBtn.addEventListener('click', () => {
      this._activeTab = 'gamepad';
      this._render();
    });
    actions.appendChild(gamepadBtn);
    root.appendChild(actions);

    this._content.appendChild(root);
  }

  _renderAccessibilityTab() {
    const grid = createElement('div', 'settings-grid');
    this._content.appendChild(grid);

    grid.appendChild(this._createToggleField({
      label: 'Screen Reader',
      checked: this._settings.accessibility.screenReader,
      onChange: (checked) => GameSettings.set('accessibility.screenReader', checked),
      detail: 'Saved now. Expanded speech coverage is pending.',
    }));

    grid.appendChild(this._createToggleField({
      label: 'Auto-pickup Essence',
      checked: this._settings.accessibility.autoPickupEssence,
      onChange: (checked) => GameSettings.set('accessibility.autoPickupEssence', checked),
      detail: 'Saved now. Gameplay hook is pending.',
    }));

    grid.appendChild(this._createToggleField({
      label: 'Toggle vs Hold Inputs',
      checked: this._settings.accessibility.toggleHoldInputs,
      onChange: (checked) => GameSettings.set('accessibility.toggleHoldInputs', checked),
      detail: 'Saved now. Ability-input runtime behavior hook is pending.',
    }));

    grid.appendChild(this._createToggleField({
      label: 'Slow Co-op Card Timer',
      checked: this._settings.accessibility.slowCoopCardTimer,
      onChange: (checked) => GameSettings.set('accessibility.slowCoopCardTimer', checked),
      detail: 'Saved now. Card timer runtime hook is pending.',
    }));

    grid.appendChild(this._createToggleField({
      label: 'Visual Audio Cues',
      checked: this._settings.accessibility.visualAudioCues,
      onChange: (checked) => GameSettings.set('accessibility.visualAudioCues', checked),
      detail: 'Mirrors the Audio tab setting.',
    }));

    const oneHanded = createElement('div', 'settings-field');
    oneHanded.appendChild(createElement('div', 'settings-label', 'One-handed Preset'));
    const button = createElement('button', '', 'Apply One-handed Keybinds');
    button.type = 'button';
    button.addEventListener('click', () => {
      const ok = window.confirm('Apply one-handed preset keybinds? Existing custom keybinds will be replaced.');
      if (!ok) return;
      GameSettings.applyOneHandedPreset();
      this._setStatus('One-handed keybind preset applied.');
    });
    oneHanded.appendChild(button);
    oneHanded.appendChild(createElement('small', '', 'Preset is applied immediately and can be edited in Keybinds.'));
    grid.appendChild(oneHanded);
  }

  _renderKeybindsTab() {
    const wrapper = createElement('div', 'settings-field');
    wrapper.style.padding = '0';
    wrapper.style.background = 'transparent';
    wrapper.style.border = 'none';
    wrapper.style.overflow = 'auto';

    const table = createElement('table', 'settings-keybind-table');
    wrapper.appendChild(table);

    const thead = document.createElement('thead');
    table.appendChild(thead);
    const headRow = document.createElement('tr');
    thead.appendChild(headRow);
    headRow.appendChild(createElement('th', '', 'Action'));
    headRow.appendChild(createElement('th', '', 'Keyboard'));
    headRow.appendChild(createElement('th', '', 'Rebind'));

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    for (const action of actionRows()) {
      const row = document.createElement('tr');
      tbody.appendChild(row);

      row.appendChild(createElement('td', '', ACTION_LABELS[action] || action));
      row.appendChild(createElement('td', '', codeToLabel(this._settings.keybinds.keyboard[action])));

      const actionCell = document.createElement('td');
      const button = createElement('button', 'settings-keybind-btn', this._pendingKeyboardAction === action ? 'Press key...' : 'Rebind');
      button.type = 'button';
      button.disabled = !!this._pendingKeyboardAction && this._pendingKeyboardAction !== action;
      button.addEventListener('click', () => this._startKeyboardRebind(action));
      actionCell.appendChild(button);
      row.appendChild(actionCell);
    }

    const controls = createElement('div', 'settings-grid');
    controls.style.marginTop = '12px';

    const resetBox = createElement('div', 'settings-field');
    resetBox.appendChild(createElement('div', 'settings-label', 'Reset Keybinds'));
    const resetBtn = createElement('button', '', 'Reset Keyboard + Gamepad Defaults');
    resetBtn.type = 'button';
    resetBtn.addEventListener('click', () => {
      const ok = window.confirm('Reset all keyboard and gamepad bindings to defaults?');
      if (!ok) return;
      GameSettings.resetKeybinds();
      this._pendingKeyboardAction = null;
      this._setStatus('All keybinds reset to defaults.');
      this._render();
    });
    resetBox.appendChild(resetBtn);
    resetBox.appendChild(createElement('small', '', 'Includes keyboard and gamepad action bindings.'));
    controls.appendChild(resetBox);

    const helpBox = createElement('div', 'settings-field');
    helpBox.appendChild(createElement('div', 'settings-label', 'Conflict Behavior'));
    helpBox.appendChild(createElement('small', '', 'If a key is already assigned, you will be asked to reassign it. Choosing yes swaps the previous action to your old key.'));
    controls.appendChild(helpBox);

    this._content.appendChild(wrapper);
    this._content.appendChild(controls);
  }

  _renderGamepadTab() {
    const grid = createElement('div', 'settings-grid');
    this._content.appendChild(grid);

    grid.appendChild(this._createToggleField({
      label: 'Vibration',
      checked: this._settings.gamepad.vibration,
      onChange: (checked) => GameSettings.set('gamepad.vibration', checked),
      detail: 'Saved now. Runtime rumble API hook is pending.',
    }));

    grid.appendChild(this._createSliderField({
      label: 'Vibration Intensity',
      value: this._settings.gamepad.vibrationIntensity,
      min: 0,
      max: 100,
      onInput: (value) => GameSettings.set('gamepad.vibrationIntensity', value),
      detail: 'Saved now. Runtime rumble API hook is pending.',
    }));

    const mappingField = createElement('div', 'settings-field');
    mappingField.style.gridColumn = '1 / -1';
    mappingField.style.overflow = 'auto';
    mappingField.appendChild(createElement('div', 'settings-label', 'Gamepad Action Mapping'));

    const mappingTable = createElement('table', 'settings-keybind-table');
    mappingField.appendChild(mappingTable);

    const head = document.createElement('thead');
    mappingTable.appendChild(head);
    const hrow = document.createElement('tr');
    head.appendChild(hrow);
    hrow.appendChild(createElement('th', '', 'Action'));
    hrow.appendChild(createElement('th', '', 'Button'));

    const body = document.createElement('tbody');
    mappingTable.appendChild(body);

    for (const action of [
      SettingsActions.INTERACT,
      SettingsActions.DODGE,
      SettingsActions.LIGHT,
      SettingsActions.HEAVY,
      SettingsActions.JUMP,
      SettingsActions.SPECIAL,
      SettingsActions.PAUSE,
    ]) {
      const row = document.createElement('tr');
      body.appendChild(row);
      row.appendChild(createElement('td', '', ACTION_LABELS[action]));

      const controlCell = document.createElement('td');
      const select = document.createElement('select');
      for (const option of GAMEPAD_BUTTON_OPTIONS) {
        const node = document.createElement('option');
        node.value = String(option.value);
        node.textContent = option.label;
        select.appendChild(node);
      }
      select.value = String(this._settings.keybinds.gamepad[action]);
      select.addEventListener('change', () => {
        GameSettings.setGamepadBinding(action, Number(select.value));
      });
      controlCell.appendChild(select);
      row.appendChild(controlCell);
    }

    mappingField.appendChild(createElement('small', '', 'Movement remains on left stick axes. Buttons are configurable per action.'));
    grid.appendChild(mappingField);
  }

  _renderHowToPlayTab() {
    const box = createElement('div', 'settings-howto');
    box.innerHTML = `
      <p><strong>Movement</strong><br>Use WASD or gamepad left stick to move. Dodge to avoid incoming attacks.</p>
      <p><strong>Combat</strong><br>Light and heavy attacks chain into combos. Special is tap/hold-based depending on hunter and settings.</p>
      <p><strong>Spells</strong><br>Minor and advanced spells share the special input. Build surge and trigger ultimate at full meter.</p>
      <p><strong>Status Effects</strong><br>Bleed, burn, stun, and slow shape encounter flow. Pair hunter effects for stronger pressure.</p>
      <p><strong>Co-op</strong><br>Revive downed allies by holding interact nearby. Coordinate portal and shop decisions between waves.</p>
      <p><strong>Progression</strong><br>Spend essence in the hub, level through combat, and lock your path for capstone cards.</p>
    `;
    this._content.appendChild(box);
  }

  _createSliderField({ label, value, min, max, onInput, detail = '', suffix = '' }) {
    const field = createElement('div', 'settings-field');
    field.appendChild(createElement('label', '', `${label}: ${Math.round(value)}${suffix}`));

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = '1';
    slider.value = String(value);
    slider.addEventListener('input', () => {
      onInput(Number(slider.value));
    });
    field.appendChild(slider);

    if (detail) field.appendChild(createElement('small', '', detail));
    return field;
  }

  _createToggleField({ label, checked, onChange, detail = '' }) {
    const field = createElement('div', 'settings-field');
    const wrap = createElement('label', 'settings-label');
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = !!checked;
    toggle.style.marginRight = '8px';
    toggle.addEventListener('change', () => onChange(toggle.checked));
    wrap.appendChild(toggle);
    wrap.appendChild(document.createTextNode(label));
    field.appendChild(wrap);
    if (detail) field.appendChild(createElement('small', '', detail));
    return field;
  }

  _createSelectField({ label, value, options, onChange, detail = '' }) {
    const field = createElement('div', 'settings-field');
    field.appendChild(createElement('div', 'settings-label', label));

    const select = document.createElement('select');
    for (const option of options) {
      const node = document.createElement('option');
      node.value = option.value;
      node.textContent = option.label;
      select.appendChild(node);
    }
    select.value = String(value);
    select.addEventListener('change', () => onChange(select.value));
    field.appendChild(select);

    if (detail) field.appendChild(createElement('small', '', detail));
    return field;
  }

  _startKeyboardRebind(action) {
    this._pendingKeyboardAction = action;
    this._setStatus(`Press a key for ${ACTION_LABELS[action]}.`);
    this._render();
  }

  _commitKeyboardRebind(code) {
    const action = this._pendingKeyboardAction;
    if (!action || !code) return;

    const currentBindings = this._settings.keybinds.keyboard;
    const oldCode = currentBindings[action];
    const conflictAction = Object.keys(currentBindings).find((entryAction) => {
      return entryAction !== action && currentBindings[entryAction] === code;
    });

    if (conflictAction) {
      const message = `${codeToLabel(code)} is already bound to ${ACTION_LABELS[conflictAction]}. Reassign?`;
      const ok = window.confirm(message);
      if (!ok) {
        this._setStatus('Rebind cancelled.');
        this._pendingKeyboardAction = null;
        this._render();
        return;
      }

      GameSettings.update({
        keybinds: {
          keyboard: {
            [action]: code,
            [conflictAction]: oldCode,
          },
        },
        accessibility: {
          oneHandedPreset: false,
        },
      });
      this._setStatus(`${ACTION_LABELS[action]} set to ${codeToLabel(code)}.`);
    } else {
      GameSettings.setKeyboardBinding(action, code);
      this._setStatus(`${ACTION_LABELS[action]} set to ${codeToLabel(code)}.`);
    }

    this._pendingKeyboardAction = null;
    this._render();
  }

  _setStatus(message) {
    this._status.textContent = message || '';
  }

  _isTabAllowed(tabId) {
    if (this._mode === 'minimal') return TAB_IDS_MINIMAL.includes(tabId);
    return TAB_IDS_FULL.includes(tabId);
  }

  _hasConnectedGamepad() {
    const pads = navigator.getGamepads?.() || [];
    return Array.from(pads).some((pad) => !!pad);
  }

  _syncAudioVolumes() {
    if (!this.audioManager) return;
    const audio = this._settings.audio;
    if (typeof this.audioManager.setMasterVolume === 'function') {
      this.audioManager.setMasterVolume(audio.masterVolume / 100);
    }
    if (typeof this.audioManager.setMusicVolume === 'function') {
      this.audioManager.setMusicVolume(audio.musicVolume / 100);
    }
    if (typeof this.audioManager.setSfxVolume === 'function') {
      this.audioManager.setSfxVolume(audio.sfxVolume / 100);
    }
  }
}
