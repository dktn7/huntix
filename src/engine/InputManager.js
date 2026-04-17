// ─── InputManager ─────────────────────────────────────────────────────────
// Supports P1 keyboard/mouse plus gamepads 0-3 with per-player snapshots.

export const Actions = {
  MOVE_LEFT: 'MOVE_LEFT',
  MOVE_RIGHT: 'MOVE_RIGHT',
  MOVE_UP: 'MOVE_UP',
  MOVE_DOWN: 'MOVE_DOWN',
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

const PLAYER_COUNT = 4;
const DEADZONE = 0.3;
const BUFFER_MAX_FRAMES = 15;
const BUFFER_MAX_ACTIONS = 3;

const KEY_MAP_P1 = {
  KeyA: Actions.MOVE_LEFT,
  ArrowLeft: Actions.MOVE_LEFT,
  KeyD: Actions.MOVE_RIGHT,
  ArrowRight: Actions.MOVE_RIGHT,
  KeyW: Actions.MOVE_UP,
  ArrowUp: Actions.MOVE_UP,
  KeyS: Actions.MOVE_DOWN,
  ArrowDown: Actions.MOVE_DOWN,
  KeyJ: Actions.LIGHT,
  KeyK: Actions.HEAVY,
  ShiftLeft: Actions.DODGE,
  ShiftRight: Actions.DODGE,
  KeyE: Actions.SPECIAL,
  KeyF: Actions.INTERACT,
  Backquote: Actions.DEBUG,
  Digit0: Actions.DEBUG_SURGE,
  Digit2: Actions.JOIN_P2,
  Digit3: Actions.JOIN_P3,
  Digit4: Actions.JOIN_P4,
  Escape: Actions.PAUSE,
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

const MOUSE_MAP = {
  0: Actions.LIGHT,
  2: Actions.HEAVY,
};

const BUFFERED_ACTIONS = [
  Actions.LIGHT,
  Actions.HEAVY,
  Actions.DODGE,
  Actions.SPECIAL,
];

export class InputManager {
  constructor() {
    this.players = [];
    for (let i = 0; i < PLAYER_COUNT; i += 1) {
      this.players.push(createInputSnapshot(i));
    }

    this.pressed = this.players[0].pressed;
    this._keys = new Set();
    this._mouseButtons = new Set();

    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      this._keys.add(e.code);
    });
    window.addEventListener('keyup', e => {
      this._keys.delete(e.code);
    });

    const canvas = document.getElementById('game-canvas');
    canvas?.addEventListener('mousedown', e => {
      const action = MOUSE_MAP[e.button];
      if (!action) return;
      e.preventDefault();
      this._mouseButtons.add(e.button);
    });
    window.addEventListener('mouseup', e => {
      this._mouseButtons.delete(e.button);
    });
    canvas?.addEventListener('contextmenu', e => e.preventDefault());
  }

  /** Polls keyboard, mouse, and gamepads once per fixed tick. */
  poll() {
    for (const snapshot of this.players) {
      snapshot.beginFrame();
    }

    this._pollKeyboardForPlayer(KEY_MAP_P1, 0);
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
      const action = MOUSE_MAP[button];
      if (action) p1.pressed.add(action);
    }
  }

  _pollGamepads() {
    const gamepads = navigator.getGamepads?.() || [];
    for (let playerIndex = 0; playerIndex < PLAYER_COUNT; playerIndex += 1) {
      const gp = gamepads[playerIndex];
      if (!gp) continue;

      const input = this.players[playerIndex];
      const b = gp.buttons;
      const ax = gp.axes;
      if (ax[0] < -DEADZONE) input.pressed.add(Actions.MOVE_LEFT);
      if (ax[0] > DEADZONE) input.pressed.add(Actions.MOVE_RIGHT);
      if (ax[1] < -DEADZONE) input.pressed.add(Actions.MOVE_UP);
      if (ax[1] > DEADZONE) input.pressed.add(Actions.MOVE_DOWN);
      if (b[0]?.pressed) input.pressed.add(Actions.INTERACT);
      if (b[1]?.pressed) input.pressed.add(Actions.DODGE);
      if (b[2]?.pressed) input.pressed.add(Actions.LIGHT);
      if (b[3]?.pressed) input.pressed.add(Actions.HEAVY);
      if (b[5]?.pressed) input.pressed.add(Actions.SPECIAL);
      if (b[9]?.pressed) input.pressed.add(Actions.PAUSE);
    }
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
      const index = this._buffer.findIndex(entry => entry.action === action && entry.age <= maxFrames);
      if (index === -1) return false;
      this._buffer.splice(index, 1);
      return true;
    },

    clearBuffer() {
      this._buffer.length = 0;
    },

    updateBuffer() {
      this._buffer = this._buffer
        .map(entry => ({ action: entry.action, age: entry.age + 1 }))
        .filter(entry => entry.age <= BUFFER_MAX_FRAMES);

      for (const action of BUFFERED_ACTIONS) {
        if (this.justPressed(action)) this._pushBuffered(action);
      }
    },

    _pushBuffered(action) {
      this._buffer = this._buffer.filter(entry => entry.action !== action);
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
