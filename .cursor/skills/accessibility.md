---
name: accessibility
description: Colourblind mode, adjustable screenshake, input remapping, reduced motion. Persisted to localStorage.
---

# Accessibility (Quick Ref)

## Settings Store
```js
const defaultSettings = { screenshakeIntensity:1.0, colourblindMode:'none', reducedMotion:false, inputRemap:{} };
export const settings = JSON.parse(localStorage.getItem('huntix_settings')??'null') ?? {...defaultSettings};
export const saveSetting = (k,v) => { settings[k]=v; localStorage.setItem('huntix_settings',JSON.stringify(settings)); };
```

## Screenshake
```js
// ScreenShake.add(): amount *= settings.screenshakeIntensity
```

## Colourblind Mode
- Hunters differentiated by SHAPE too: Dabik=triangle, Benzu=square, Sereisa=diamond, Vesol=circle
- Apply SVG `feColorMatrix` filter to canvas per mode (deuteranopia/protanopia/tritanopia)
- See full matrices in `.agents/skills/accessibility.md`

## Reduced Motion
```js
if (!settings.reducedMotion) overlay.flashBlack(80);
if (!settings.reducedMotion) gameLoop.timeScale = 0.1;
```

## Input Remap
```js
// InputManager.isDown(action): resolve key via settings.inputRemap[action] ?? DEFAULT_BINDINGS[action]
```

## Integration
- Load settings in `main.js` before anything else
- Expose settings panel from Escape/Pause menu
- Pass `settings` to `ScreenShake`, `TransitionOverlay`, `GameLoop`, `InputManager`
