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
  'Escape': Actions.PAUSE,
};

export class InputManager {
  constructor() {
    this.pressed    = new Set(); // actions held this frame
    this._prevFrame = new Set(); // actions held last frame
    this._keys      = new Set(); // raw keys held

    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      this._keys.add(e.code);
    });
    window.addEventListener('keyup', e => {
      this._keys.delete(e.code);
    });
    // Prevent context menu on right-click in canvas
    document.getElementById('game-canvas')
      ?.addEventListener('contextmenu', e => e.preventDefault());
  }

  // Called once per frame by GameLoop before update
  poll() {
    this._prevFrame = new Set(this.pressed);
    this.pressed.clear();

    // Keyboard → actions
    for (const code of this._keys) {
      const action = KEY_MAP[code];
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
  }

  isDown(action)      { return this.pressed.has(action); }
  justPressed(action) { return this.pressed.has(action) && !this._prevFrame.has(action); }
  justReleased(action){ return !this.pressed.has(action) && this._prevFrame.has(action); }

  // Normalised movement vector {x, y}
  get moveVector() {
    const x = (this.isDown(Actions.MOVE_RIGHT) ? 1 : 0)
             - (this.isDown(Actions.MOVE_LEFT)  ? 1 : 0);
    const y = (this.isDown(Actions.MOVE_UP)    ? 1 : 0)
             - (this.isDown(Actions.MOVE_DOWN)  ? 1 : 0);
    const len = Math.hypot(x, y);
    return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
  }
}
