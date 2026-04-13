// ─── InputManager ─────────────────────────────────────────────────────────
// Supports keyboard (P1) and basic gamepad (up to 4 controllers).
// All checks are done via .isDown(action) or .justPressed(action).

export const Actions = {
  // Movement
  MOVE_LEFT:   'MOVE_LEFT',
  MOVE_RIGHT:  'MOVE_RIGHT',
  MOVE_UP:     'MOVE_UP',
  MOVE_DOWN:   'MOVE_DOWN',
  // Combat
  LIGHT:       'LIGHT',
  HEAVY:       'HEAVY',
  DODGE:       'DODGE',
  SPECIAL:     'SPECIAL',
  // Meta
  INTERACT:    'INTERACT',
  PAUSE:       'PAUSE',
  DEBUG:       'DEBUG',
};

// Keyboard bindings → actions (P1 default)
const KEY_MAP = {
  'KeyA': Actions.MOVE_LEFT,
  'ArrowLeft': Actions.MOVE_LEFT,
  'KeyD': Actions.MOVE_RIGHT,
  'ArrowRight': Actions.MOVE_RIGHT,
  'KeyW': Actions.MOVE_UP,
  'ArrowUp': Actions.MOVE_UP,
  'KeyS': Actions.MOVE_DOWN,
  'ArrowDown': Actions.MOVE_DOWN,
  'KeyJ': Actions.LIGHT,
  'KeyK': Actions.HEAVY,
  'ShiftLeft': Actions.DODGE,
  'ShiftRight': Actions.DODGE,
  'KeyE': Actions.SPECIAL,
  'KeyF': Actions.INTERACT,
  'Backquote': Actions.DEBUG,
  'Escape': Actions.PAUSE,
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

const BUFFER_MAX_FRAMES = 15;
const BUFFER_MAX_ACTIONS = 3;

export class InputManager {
  constructor() {
    this.pressed    = new Set(); // actions held this frame
    this._prevFrame = new Set(); // actions held last frame
    this._keys      = new Set(); // raw keys held
    this._mouseButtons = new Set();
    this._buffer = [];

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

  /** Polls keyboard, mouse, and gamepad state once per fixed tick. */
  poll() {
    this._prevFrame = new Set(this.pressed);
    this.pressed.clear();

    // Keyboard → actions
    for (const code of this._keys) {
      const action = KEY_MAP[code];
      if (action) this.pressed.add(action);
    }

    for (const button of this._mouseButtons) {
      const action = MOUSE_MAP[button];
      if (action) this.pressed.add(action);
    }

    // Gamepad (P1 only for now — extend to 4P later)
    const gp = navigator.getGamepads?.()[0];
    if (gp) {
      const b = gp.buttons;
      const ax = gp.axes;
      if (ax[0] < -0.3) this.pressed.add(Actions.MOVE_LEFT);
      if (ax[0] >  0.3) this.pressed.add(Actions.MOVE_RIGHT);
      if (ax[1] < -0.3) this.pressed.add(Actions.MOVE_UP);
      if (ax[1] >  0.3) this.pressed.add(Actions.MOVE_DOWN);
      if (b[0]?.pressed) this.pressed.add(Actions.INTERACT);
      if (b[1]?.pressed) this.pressed.add(Actions.DODGE);
      if (b[2]?.pressed) this.pressed.add(Actions.LIGHT);
      if (b[3]?.pressed) this.pressed.add(Actions.HEAVY);
      if (b[5]?.pressed) this.pressed.add(Actions.SPECIAL);
      if (b[9]?.pressed) this.pressed.add(Actions.PAUSE);
    }

    this._updateBuffer();
  }

  /** Returns true while an action is currently held. */
  isDown(action) {
    return this.pressed.has(action);
  }

  /** Returns true only on the first tick an action is pressed. */
  justPressed(action) {
    return this.pressed.has(action) && !this._prevFrame.has(action);
  }

  /** Returns true only on the first tick an action is released. */
  justReleased(action) {
    return !this.pressed.has(action) && this._prevFrame.has(action);
  }

  /** Returns true and consumes the newest buffered action within maxFrames. */
  consumeBuffered(action, maxFrames = BUFFER_MAX_FRAMES) {
    const index = this._buffer.findIndex(entry => entry.action === action && entry.age <= maxFrames);
    if (index === -1) return false;

    this._buffer.splice(index, 1);
    return true;
  }

  /** Clears all queued buffered actions. */
  clearBuffer() {
    this._buffer.length = 0;
  }

  /** Returns the normalized movement vector for held move actions. */
  get moveVector() {
    const x = (this.isDown(Actions.MOVE_RIGHT) ? 1 : 0)
             - (this.isDown(Actions.MOVE_LEFT)  ? 1 : 0);
    const y = (this.isDown(Actions.MOVE_UP)    ? 1 : 0)
             - (this.isDown(Actions.MOVE_DOWN)  ? 1 : 0);
    const len = Math.hypot(x, y);
    return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
  }

  _updateBuffer() {
    this._buffer = this._buffer
      .map(entry => ({ action: entry.action, age: entry.age + 1 }))
      .filter(entry => entry.age <= BUFFER_MAX_FRAMES);

    for (const action of BUFFERED_ACTIONS) {
      if (this.justPressed(action)) this._pushBuffered(action);
    }
  }

  _pushBuffered(action) {
    this._buffer = this._buffer.filter(entry => entry.action !== action);
    this._buffer.unshift({ action, age: 0 });
    if (this._buffer.length > BUFFER_MAX_ACTIONS) {
      this._buffer.length = BUFFER_MAX_ACTIONS;
    }
  }
}
