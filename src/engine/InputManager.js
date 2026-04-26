// --- InputManager -----------------------------------------------------------
// Supports P1 keyboard/mouse plus gamepads 0-3 with per-player snapshots.

import { GameSettings } from '../ui/GameSettings.js';

export const Actions = {
  MOVE_LEFT: 'MOVE_LEFT',
  MOVE_RIGHT: 'MOVE_RIGHT',
  MOVE_UP: 'MOVE_UP',
  MOVE_DOWN: 'MOVE_DOWN',
  JUMP: 'JUMP',
  LIGHT: 'LIGHT',
  HEAVY: 'HEAVY',
  DODGE: 'DODGE',
  SPECIAL: 'SPECIAL',
  INTERACT: 'INTERACT',
  PAUSE: 'PAUSE',
  DEBUG: 'DEBUG',
  DEBUG_SURGE: 'DEBUG_SURGE',
  JOIN_P2: 'JOIN_P2',
  JOIN_P3: 'JOIN_P3',
  JOIN_P4: 'JOIN_P4',
};

const ACTION_LABELS = {
  [Actions.MOVE_LEFT]: 'Move Left',
  [Actions.MOVE_RIGHT]: 'Move Right',
  [Actions.MOVE_UP]: 'Move Up',
  [Actions.MOVE_DOWN]: 'Move Down',
  [Actions.JUMP]: 'Jump',
  [Actions.LIGHT]: 'Light Attack',
  [Actions.HEAVY]: 'Heavy Attack',
  [Actions.DODGE]: 'Dodge',
  [Actions.SPECIAL]: 'Special',
  [Actions.INTERACT]: 'Interact',
  [Actions.PAUSE]: 'Pause',
};

const PLAYER_COUNT = 4;
const DEADZONE = 0.3;
const BUFFER_MAX_FRAMES = 15;
const BUFFER_MAX_ACTIONS = 3;

const P1_ACTION_ORDER = [
  Actions.MOVE_LEFT,
  Actions.MOVE_RIGHT,
  Actions.MOVE_UP,
  Actions.MOVE_DOWN,
  Actions.JUMP,
  Actions.LIGHT,
  Actions.HEAVY,
  Actions.DODGE,
  Actions.SPECIAL,
  Actions.INTERACT,
  Actions.PAUSE,
];

const KEY_ALIAS_MAP = {
  [Actions.MOVE_LEFT]: ['ArrowLeft'],
  [Actions.MOVE_RIGHT]: ['ArrowRight'],
  [Actions.MOVE_UP]: ['ArrowUp'],
  [Actions.MOVE_DOWN]: ['ArrowDown'],
};

const FIXED_KEY_MAP_P1 = {
  Backquote: Actions.DEBUG,
  Digit0: Actions.DEBUG_SURGE,
  Digit2: Actions.JOIN_P2,
  Digit3: Actions.JOIN_P3,
  Digit4: Actions.JOIN_P4,
};

const KEY_MAP_P2 = {
  Numpad4: Actions.MOVE_LEFT,
  Numpad6: Actions.MOVE_RIGHT,
  Numpad8: Actions.MOVE_UP,
  Numpad5: Actions.MOVE_DOWN,
  Numpad1: Actions.LIGHT,
  Numpad2: Actions.HEAVY,
  Numpad3: Actions.DODGE,
  Numpad0: Actions.SPECIAL,
  NumpadDecimal: Actions.INTERACT,
};

const DEFAULT_MOUSE_MAP = {
  0: Actions.LIGHT,
  2: Actions.HEAVY,
};

const BUFFERED_ACTIONS = [
  Actions.JUMP,
  Actions.LIGHT,
  Actions.HEAVY,
  Actions.DODGE,
  Actions.SPECIAL,
];

function codeToLabel(code) {
  if (!code) return '-';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
  if (code === 'ArrowLeft') return 'Arrow Left';
  if (code === 'ArrowRight') return 'Arrow Right';
  if (code === 'ArrowUp') return 'Arrow Up';
  if (code === 'ArrowDown') return 'Arrow Down';
  if (code === 'ShiftLeft') return 'L-Shift';
  if (code === 'ShiftRight') return 'R-Shift';
  if (code === 'Space') return 'Space';
  if (code === 'Escape') return 'Escape';
  return code;
}

export class InputManager {
  constructor() {
    this.players = [];
    for (let i = 0; i < PLAYER_COUNT; i += 1) {
      this.players.push(createInputSnapshot(i));
    }

    this.pressed = this.players[0].pressed;
    this._keys = new Set();
    this._keysPrev = new Set();
    this._justPressedKeys = new Set();
    this._mouseButtons = new Set();

    this._keyboardBindings = {};
    this._gamepadBindings = {};
    this._keyMapP1 = {};

    this._settingsUnsubscribe = GameSettings.subscribe((settings) => {
      this._applyBindingSettings(settings);
    });

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this._keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this._keys.delete(e.code);
    });

    const canvas = document.getElementById('game-canvas');
    canvas?.addEventListener('mousedown', (e) => {
      const action = DEFAULT_MOUSE_MAP[e.button];
      if (!action) return;
      e.preventDefault();
      this._mouseButtons.add(e.button);
    });
    window.addEventListener('mouseup', (e) => {
      this._mouseButtons.delete(e.button);
    });
    canvas?.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** Polls keyboard, mouse, and gamepads once per fixed tick. */
  poll() {
    this._justPressedKeys.clear();
    for (const code of this._keys) {
      if (!this._keysPrev.has(code)) this._justPressedKeys.add(code);
    }
    this._keysPrev = new Set(this._keys);

    for (const snapshot of this.players) {
      snapshot.beginFrame();
    }

    this._pollKeyboardForPlayer(this._keyMapP1, 0);
    this._pollKeyboardForPlayer(KEY_MAP_P2, 1);
    this._pollMouseForP1();
    this._pollGamepads();

    for (const snapshot of this.players) {
      snapshot.updateBuffer();
    }
  }

  /** Returns the input snapshot for a player index. */
  getPlayerInput(playerIndex = 0) {
    return this.players[playerIndex] || this.players[0];
  }

  /** Returns true while a P1 action is held. */
  isDown(action) {
    return this.players[0].isDown(action);
  }

  /** Returns true only on the first tick a P1 action is pressed. */
  justPressed(action) {
    return this.players[0].justPressed(action);
  }

  /** Returns true only on the first tick a P1 action is released. */
  justReleased(action) {
    return this.players[0].justReleased(action);
  }

  /** Returns true when a physical key was first pressed this frame. */
  justPressedKey(code) {
    return this._justPressedKeys.has(code);
  }

  /** Returns true when any physical key or mapped action was first pressed this frame. */
  anyJustPressed() {
    if (this._justPressedKeys.size > 0) return true;
    for (const snapshot of this.players) {
      for (const action of snapshot.pressed) {
        if (!snapshot._prevFrame.has(action)) return true;
      }
    }
    return false;
  }

  /** Returns true and consumes the newest buffered P1 action within maxFrames. */
  consumeBuffered(action, maxFrames = BUFFER_MAX_FRAMES) {
    return this.players[0].consumeBuffered(action, maxFrames);
  }

  /** Clears every player input buffer. */
  clearBuffer() {
    for (const snapshot of this.players) snapshot.clearBuffer();
  }

  /** Returns P1 movement for legacy callers. */
  get moveVector() {
    return this.players[0].moveVector;
  }

  /** Returns the currently active keybind maps and display labels. */
  getBindings() {
    const keyboard = { ...this._keyboardBindings };
    const gamepad = { ...this._gamepadBindings };
    const rows = P1_ACTION_ORDER.map((action) => {
      return {
        action,
        label: ACTION_LABELS[action] || action,
        keyboard: keyboard[action],
        keyboardLabel: codeToLabel(keyboard[action]),
        gamepad: gamepad[action],
      };
    });

    return {
      keyboard,
      gamepad,
      rows,
    };
  }

  /** Persists and applies one keyboard binding override through settings state. */
  setKeyboardBinding(action, code) {
    if (!action || typeof code !== 'string' || !code) return this.getBindings();
    GameSettings.setKeyboardBinding(action, code);
    return this.getBindings();
  }

  /** Persists and applies one gamepad binding override through settings state. */
  setGamepadBinding(action, buttonIndex) {
    if (!action) return this.getBindings();
    GameSettings.setGamepadBinding(action, buttonIndex);
    return this.getBindings();
  }

  /** Resets keyboard and gamepad bindings to defaults. */
  resetBindings() {
    GameSettings.resetKeybinds();
    return this.getBindings();
  }

  _applyBindingSettings(settings) {
    const keybinds = settings?.keybinds || {};
    this._keyboardBindings = { ...(keybinds.keyboard || {}) };
    this._gamepadBindings = { ...(keybinds.gamepad || {}) };
    this._rebuildP1Map();
  }

  _rebuildP1Map() {
    this._keyMapP1 = { ...FIXED_KEY_MAP_P1 };

    for (const action of P1_ACTION_ORDER) {
      const code = this._keyboardBindings[action];
      if (typeof code === 'string' && code.length > 0) {
        this._keyMapP1[code] = action;
      }

      const aliases = KEY_ALIAS_MAP[action] || [];
      for (const aliasCode of aliases) {
        if (!this._keyMapP1[aliasCode]) this._keyMapP1[aliasCode] = action;
      }
    }
  }

  _pollKeyboardForPlayer(keyMap, playerIndex) {
    const input = this.players[playerIndex];
    for (const code of this._keys) {
      const action = keyMap[code];
      if (action) input.pressed.add(action);
    }
  }

  _pollMouseForP1() {
    const p1 = this.players[0];
    for (const button of this._mouseButtons) {
      const action = DEFAULT_MOUSE_MAP[button];
      if (action) p1.pressed.add(action);
    }
  }

  _pollGamepads() {
    const gamepads = navigator.getGamepads?.() || [];
    for (let playerIndex = 0; playerIndex < PLAYER_COUNT; playerIndex += 1) {
      const gp = gamepads[playerIndex];
      if (!gp) continue;

      const input = this.players[playerIndex];
      const buttons = gp.buttons;
      const axes = gp.axes;

      if (axes[0] < -DEADZONE) input.pressed.add(Actions.MOVE_LEFT);
      if (axes[0] > DEADZONE) input.pressed.add(Actions.MOVE_RIGHT);
      if (axes[1] < -DEADZONE) input.pressed.add(Actions.MOVE_UP);
      if (axes[1] > DEADZONE) input.pressed.add(Actions.MOVE_DOWN);

      for (const [action, buttonIndex] of Object.entries(this._gamepadBindings)) {
        if (this._isGamepadButtonPressed(buttons, buttonIndex)) {
          input.pressed.add(action);
        }
      }
    }
  }

  _isGamepadButtonPressed(buttons, index) {
    if (!Array.isArray(buttons)) return false;
    const numericIndex = Number(index);
    if (!Number.isInteger(numericIndex) || numericIndex < 0 || numericIndex >= buttons.length) {
      return false;
    }
    return !!buttons[numericIndex]?.pressed;
  }
}

function createInputSnapshot(playerIndex) {
  return {
    playerIndex,
    pressed: new Set(),
    _prevFrame: new Set(),
    _buffer: [],

    beginFrame() {
      this._prevFrame = new Set(this.pressed);
      this.pressed.clear();
    },

    isDown(action) {
      return this.pressed.has(action);
    },

    justPressed(action) {
      return this.pressed.has(action) && !this._prevFrame.has(action);
    },

    justReleased(action) {
      return !this.pressed.has(action) && this._prevFrame.has(action);
    },

    consumeBuffered(action, maxFrames = BUFFER_MAX_FRAMES) {
      const index = this._buffer.findIndex((entry) => entry.action === action && entry.age <= maxFrames);
      if (index === -1) return false;
      this._buffer.splice(index, 1);
      return true;
    },

    clearBuffer() {
      this._buffer.length = 0;
    },

    updateBuffer() {
      this._buffer = this._buffer
        .map((entry) => ({ action: entry.action, age: entry.age + 1 }))
        .filter((entry) => entry.age <= BUFFER_MAX_FRAMES);

      for (const action of BUFFERED_ACTIONS) {
        if (this.justPressed(action)) this._pushBuffered(action);
      }
    },

    _pushBuffered(action) {
      this._buffer = this._buffer.filter((entry) => entry.action !== action);
      this._buffer.unshift({ action, age: 0 });
      if (this._buffer.length > BUFFER_MAX_ACTIONS) this._buffer.length = BUFFER_MAX_ACTIONS;
    },

    get moveVector() {
      const x = (this.isDown(Actions.MOVE_RIGHT) ? 1 : 0)
        - (this.isDown(Actions.MOVE_LEFT) ? 1 : 0);
      const y = (this.isDown(Actions.MOVE_UP) ? 1 : 0)
        - (this.isDown(Actions.MOVE_DOWN) ? 1 : 0);
      const len = Math.hypot(x, y);
      return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
    },
  };
}
