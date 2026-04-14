---
name: accessibility
description: Colourblind mode, adjustable screenshake, input remapping, reduced motion. What separates jam games from things people share and recommend.
---

# Accessibility for Huntix

## Settings Store

```js
// Persisted to localStorage — load on boot
const defaultSettings = {
  screenshakeIntensity: 1.0,  // 0 = off, 0.5 = reduced, 1.0 = full
  colourblindMode: 'none',    // 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia'
  reducedMotion: false,       // disables screen flash + slow-mo
  inputRemap: {}              // { action: keyCode }
};

export const settings = JSON.parse(localStorage.getItem('huntix_settings') ?? 'null') ?? { ...defaultSettings };

export function saveSetting(key, value) {
  settings[key] = value;
  localStorage.setItem('huntix_settings', JSON.stringify(settings));
}
```

## Screenshake Intensity

```js
// In ScreenShake.add():
add(amount) {
  this.trauma = Math.min(1, this.trauma + amount * settings.screenshakeIntensity);
}
// If settings.screenshakeIntensity === 0, trauma never accumulates — fully disabled
```

## Colourblind Mode — Hunter Shape Variants

Hunters are distinguished by both colour AND shape so colourblind players can read the screen:

| Hunter | Shape variant |
|--------|---------------|
| Dabik | Triangle (pointed top) |
| Benzu | Square (wide) |
| Sereisa | Diamond |
| Vesol | Circle |

```js
// Apply CSS filter for colourblind simulation
const cbFilters = {
  none:         '',
  deuteranopia: 'url(#deuteranopia)',
  protanopia:   'url(#protanopia)',
  tritanopia:   'url(#tritanopia)',
};

function applyColourblindFilter(mode) {
  document.getElementById('game-canvas').style.filter = cbFilters[mode] ?? '';
}

// SVG filters — add to index.html
// <svg style="position:absolute;width:0;height:0">
//   <filter id="deuteranopia">...(matrix values)...</filter>
// </svg>
```

## SVG Colourblind Matrices (add to index.html)

```html
<svg style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
  <defs>
    <filter id="deuteranopia">
      <feColorMatrix type="matrix" values="0.367 0.861 -0.228 0 0
                                           0.280 0.673  0.047 0 0
                                          -0.012 0.043  0.969 0 0
                                           0     0      0     1 0"/>
    </filter>
    <filter id="protanopia">
      <feColorMatrix type="matrix" values="0.152 1.053 -0.205 0 0
                                           0.115 0.786  0.099 0 0
                                          -0.004 -0.048 1.052 0 0
                                           0      0     0     1 0"/>
    </filter>
    <filter id="tritanopia">
      <feColorMatrix type="matrix" values="1.256 -0.077 -0.179 0 0
                                          -0.078  0.931  0.148 0 0
                                           0.005  0.691  0.304 0 0
                                           0      0      0     1 0"/>
    </filter>
  </defs>
</svg>
```

## Reduced Motion

```js
// Anywhere a flash or slow-mo would trigger:
if (!settings.reducedMotion) overlay.flashBlack(80);
if (!settings.reducedMotion) gameLoop.timeScale = 0.1;
```

## Input Remapping

```js
// In InputManager.js — resolve action from remap table
isDown(action) {
  const remapped = settings.inputRemap[action];
  const key = remapped ?? DEFAULT_BINDINGS[action];
  return this._keys.has(key);
}

// Settings UI saves like:
saveSetting('inputRemap', { ...settings.inputRemap, [action]: newKeyCode });
```

## Settings UI (minimal)

```html
<div id="settings-panel" style="display:none">
  <label>Screen Shake
    <input type="range" min="0" max="1" step="0.1" id="shake-slider">
  </label>
  <label>Colourblind Mode
    <select id="cb-select">
      <option value="none">None</option>
      <option value="deuteranopia">Deuteranopia</option>
      <option value="protanopia">Protanopia</option>
      <option value="tritanopia">Tritanopia</option>
    </select>
  </label>
  <label><input type="checkbox" id="reduced-motion"> Reduced Motion</label>
</div>
```

## Integration Points
- Load `settings` at boot in `main.js` before anything else
- Pass `settings` to `ScreenShake`, `TransitionOverlay`, `GameLoop`
- `applyColourblindFilter()`: call on settings change and on boot
- Input remap: inject into `InputManager.js` constructor
- Settings panel: open on Pause / Escape menu
