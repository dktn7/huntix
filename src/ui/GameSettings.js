const STORAGE_KEY = 'huntix.settings.v1';

const ACTIONS = {
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
};

const DEFAULT_KEYBOARD_BINDINGS = {
  [ACTIONS.MOVE_LEFT]: 'KeyA',
  [ACTIONS.MOVE_RIGHT]: 'KeyD',
  [ACTIONS.MOVE_UP]: 'KeyW',
  [ACTIONS.MOVE_DOWN]: 'KeyS',
  [ACTIONS.JUMP]: 'Space',
  [ACTIONS.LIGHT]: 'KeyJ',
  [ACTIONS.HEAVY]: 'KeyK',
  [ACTIONS.DODGE]: 'ShiftLeft',
  [ACTIONS.SPECIAL]: 'KeyE',
  [ACTIONS.INTERACT]: 'KeyF',
  [ACTIONS.PAUSE]: 'Escape',
};

const ONE_HANDED_PRESET_BINDINGS = {
  [ACTIONS.MOVE_LEFT]: 'KeyJ',
  [ACTIONS.MOVE_RIGHT]: 'KeyL',
  [ACTIONS.MOVE_UP]: 'KeyI',
  [ACTIONS.MOVE_DOWN]: 'KeyK',
  [ACTIONS.JUMP]: 'KeyU',
  [ACTIONS.LIGHT]: 'KeyO',
  [ACTIONS.HEAVY]: 'KeyP',
  [ACTIONS.DODGE]: 'Semicolon',
  [ACTIONS.SPECIAL]: 'BracketLeft',
  [ACTIONS.INTERACT]: 'Quote',
  [ACTIONS.PAUSE]: 'Escape',
};

const DEFAULT_GAMEPAD_BINDINGS = {
  [ACTIONS.INTERACT]: 0,
  [ACTIONS.DODGE]: 1,
  [ACTIONS.LIGHT]: 2,
  [ACTIONS.HEAVY]: 3,
  [ACTIONS.JUMP]: 4,
  [ACTIONS.SPECIAL]: 5,
  [ACTIONS.PAUSE]: 9,
};

const DEFAULT_SETTINGS = Object.freeze({
  audio: {
    masterVolume: 100,
    musicVolume: 50,
    sfxVolume: 80,
    monoAudio: false,
    visualAudioCues: false,
  },
  display: {
    brightness: 50,
    contrast: 50,
    colourblindMode: 'off',
    highContrastMode: false,
    reduceParticles: false,
    reduceScreenShake: false,
    uiScale: 100,
  },
  accessibility: {
    screenReader: false,
    autoPickupEssence: false,
    toggleHoldInputs: false,
    slowCoopCardTimer: false,
    visualAudioCues: false,
    oneHandedPreset: false,
  },
  keybinds: {
    keyboard: DEFAULT_KEYBOARD_BINDINGS,
    gamepad: DEFAULT_GAMEPAD_BINDINGS,
  },
  gamepad: {
    vibration: true,
    vibrationIntensity: 70,
  },
});

let currentSettings = null;
let initialized = false;
const subscribers = new Set();

function cloneSettings(settings) {
  return JSON.parse(JSON.stringify(settings));
}

function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return patch === undefined ? base : patch;
  }

  const output = Array.isArray(base) ? [...base] : { ...(base || {}) };
  for (const [key, value] of Object.entries(patch)) {
    const nextBase = output[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = deepMerge(nextBase, value);
    } else if (value !== undefined) {
      output[key] = value;
    }
  }
  return output;
}

function clamp(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric < min) return min;
  if (numeric > max) return max;
  return numeric;
}

function normalizeBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function normalizeSettings(candidate) {
  const merged = deepMerge(cloneSettings(DEFAULT_SETTINGS), candidate || {});
  const normalized = cloneSettings(DEFAULT_SETTINGS);

  normalized.audio.masterVolume = clamp(merged.audio.masterVolume, 0, 100, DEFAULT_SETTINGS.audio.masterVolume);
  normalized.audio.musicVolume = clamp(merged.audio.musicVolume, 0, 100, DEFAULT_SETTINGS.audio.musicVolume);
  normalized.audio.sfxVolume = clamp(merged.audio.sfxVolume, 0, 100, DEFAULT_SETTINGS.audio.sfxVolume);
  normalized.audio.monoAudio = normalizeBoolean(merged.audio.monoAudio, DEFAULT_SETTINGS.audio.monoAudio);
  normalized.audio.visualAudioCues = normalizeBoolean(merged.audio.visualAudioCues, DEFAULT_SETTINGS.audio.visualAudioCues);

  normalized.display.brightness = clamp(merged.display.brightness, 0, 100, DEFAULT_SETTINGS.display.brightness);
  normalized.display.contrast = clamp(merged.display.contrast, 0, 100, DEFAULT_SETTINGS.display.contrast);
  normalized.display.colourblindMode = normalizeEnum(merged.display.colourblindMode, ['off', 'deuteranopia', 'protanopia', 'tritanopia'], DEFAULT_SETTINGS.display.colourblindMode);
  normalized.display.highContrastMode = normalizeBoolean(merged.display.highContrastMode, DEFAULT_SETTINGS.display.highContrastMode);
  normalized.display.reduceParticles = normalizeBoolean(merged.display.reduceParticles, DEFAULT_SETTINGS.display.reduceParticles);
  normalized.display.reduceScreenShake = normalizeBoolean(merged.display.reduceScreenShake, DEFAULT_SETTINGS.display.reduceScreenShake);
  normalized.display.uiScale = clamp(merged.display.uiScale, 75, 150, DEFAULT_SETTINGS.display.uiScale);

  normalized.accessibility.screenReader = normalizeBoolean(merged.accessibility.screenReader, DEFAULT_SETTINGS.accessibility.screenReader);
  normalized.accessibility.autoPickupEssence = normalizeBoolean(merged.accessibility.autoPickupEssence, DEFAULT_SETTINGS.accessibility.autoPickupEssence);
  normalized.accessibility.toggleHoldInputs = normalizeBoolean(merged.accessibility.toggleHoldInputs, DEFAULT_SETTINGS.accessibility.toggleHoldInputs);
  normalized.accessibility.slowCoopCardTimer = normalizeBoolean(merged.accessibility.slowCoopCardTimer, DEFAULT_SETTINGS.accessibility.slowCoopCardTimer);
  normalized.accessibility.visualAudioCues = normalizeBoolean(
    merged.accessibility.visualAudioCues,
    normalized.audio.visualAudioCues
  );
  normalized.accessibility.oneHandedPreset = normalizeBoolean(merged.accessibility.oneHandedPreset, DEFAULT_SETTINGS.accessibility.oneHandedPreset);

  const keyboard = merged.keybinds?.keyboard || {};
  const gamepad = merged.keybinds?.gamepad || {};
  normalized.keybinds.keyboard = { ...DEFAULT_KEYBOARD_BINDINGS };
  normalized.keybinds.gamepad = { ...DEFAULT_GAMEPAD_BINDINGS };

  for (const action of Object.keys(DEFAULT_KEYBOARD_BINDINGS)) {
    const code = keyboard[action];
    if (typeof code === 'string' && code.length > 0) normalized.keybinds.keyboard[action] = code;
  }
  for (const action of Object.keys(DEFAULT_GAMEPAD_BINDINGS)) {
    const button = clamp(gamepad[action], 0, 16, DEFAULT_GAMEPAD_BINDINGS[action]);
    normalized.keybinds.gamepad[action] = Math.round(button);
  }

  normalized.gamepad.vibration = normalizeBoolean(merged.gamepad.vibration, DEFAULT_SETTINGS.gamepad.vibration);
  normalized.gamepad.vibrationIntensity = clamp(merged.gamepad.vibrationIntensity, 0, 100, DEFAULT_SETTINGS.gamepad.vibrationIntensity);

  // Keep duplicated audio cue toggles in sync.
  if (normalized.accessibility.visualAudioCues !== normalized.audio.visualAudioCues) {
    normalized.audio.visualAudioCues = normalized.accessibility.visualAudioCues;
  }

  if (normalized.accessibility.oneHandedPreset) {
    normalized.keybinds.keyboard = { ...ONE_HANDED_PRESET_BINDINGS };
  }

  return normalized;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneSettings(DEFAULT_SETTINGS);
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return cloneSettings(DEFAULT_SETTINGS);
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
  } catch {
    // Ignore storage failures (private mode/quota).
  }
}

function applyCssSideEffects(settings) {
  if (typeof document === 'undefined') return;

  const body = document.body;
  if (body) {
    body.classList.toggle('ui-high-contrast', !!settings.display.highContrastMode);
    body.classList.toggle('ui-reduce-screen-shake', !!settings.display.reduceScreenShake);
    body.classList.toggle('ui-colourblind-deuteranopia', settings.display.colourblindMode === 'deuteranopia');
    body.classList.toggle('ui-colourblind-protanopia', settings.display.colourblindMode === 'protanopia');
    body.classList.toggle('ui-colourblind-tritanopia', settings.display.colourblindMode === 'tritanopia');
  }

  const overlay = document.getElementById('ui-overlay');
  const scale = clamp(settings.display.uiScale / 100, 0.75, 1.5, 1);
  document.documentElement.style.setProperty('--huntix-ui-scale', scale.toFixed(2));
  if (overlay) {
    overlay.style.transformOrigin = 'top left';
    overlay.style.transform = `scale(${scale})`;
    overlay.style.width = `${(100 / scale).toFixed(4)}%`;
    overlay.style.height = `${(100 / scale).toFixed(4)}%`;
  }
}

function ensureInitialized() {
  if (initialized) return;
  currentSettings = loadFromStorage();
  applyCssSideEffects(currentSettings);
  initialized = true;
}

function emit() {
  applyCssSideEffects(currentSettings);
  for (const callback of subscribers) {
    callback(cloneSettings(currentSettings));
  }
}

export const GameSettings = {
  defaults() {
    return cloneSettings(DEFAULT_SETTINGS);
  },

  get() {
    ensureInitialized();
    return cloneSettings(currentSettings);
  },

  subscribe(callback) {
    ensureInitialized();
    if (typeof callback !== 'function') return () => {};
    subscribers.add(callback);
    callback(cloneSettings(currentSettings));
    return () => {
      subscribers.delete(callback);
    };
  },

  update(patch) {
    ensureInitialized();
    currentSettings = normalizeSettings(deepMerge(currentSettings, patch || {}));
    saveToStorage();
    emit();
    return this.get();
  },

  set(path, value) {
    const keys = String(path || '').split('.').filter(Boolean);
    if (!keys.length) return this.get();

    const patch = {};
    let cursor = patch;
    for (let i = 0; i < keys.length - 1; i += 1) {
      cursor[keys[i]] = {};
      cursor = cursor[keys[i]];
    }
    cursor[keys[keys.length - 1]] = value;

    if (path === 'audio.visualAudioCues') {
      patch.accessibility = patch.accessibility || {};
      patch.accessibility.visualAudioCues = !!value;
    } else if (path === 'accessibility.visualAudioCues') {
      patch.audio = patch.audio || {};
      patch.audio.visualAudioCues = !!value;
    }

    return this.update(patch);
  },

  setKeyboardBinding(action, code) {
    if (!action || typeof code !== 'string' || !code) return this.get();
    return this.update({
      keybinds: {
        keyboard: {
          [action]: code,
        },
      },
      accessibility: {
        oneHandedPreset: false,
      },
    });
  },

  setGamepadBinding(action, buttonIndex) {
    if (!action) return this.get();
    const button = clamp(buttonIndex, 0, 16, 0);
    return this.update({
      keybinds: {
        gamepad: {
          [action]: Math.round(button),
        },
      },
    });
  },

  resetKeybinds() {
    return this.update({
      keybinds: {
        keyboard: { ...DEFAULT_KEYBOARD_BINDINGS },
        gamepad: { ...DEFAULT_GAMEPAD_BINDINGS },
      },
      accessibility: {
        oneHandedPreset: false,
      },
    });
  },

  applyOneHandedPreset() {
    return this.update({
      accessibility: {
        oneHandedPreset: true,
      },
      keybinds: {
        keyboard: { ...ONE_HANDED_PRESET_BINDINGS },
      },
    });
  },

  resetAll() {
    ensureInitialized();
    currentSettings = cloneSettings(DEFAULT_SETTINGS);
    saveToStorage();
    emit();
    return this.get();
  },
};

export const SettingsActions = Object.freeze({ ...ACTIONS });
export const DefaultKeyboardBindings = Object.freeze({ ...DEFAULT_KEYBOARD_BINDINGS });
export const DefaultGamepadBindings = Object.freeze({ ...DEFAULT_GAMEPAD_BINDINGS });
