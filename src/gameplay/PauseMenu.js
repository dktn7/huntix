// src/gameplay/PauseMenu.js
// Handles pause menu UI and audio controls

export class PauseMenu {
  constructor(overlay) {
    this.overlay = overlay;
    this.pauseMenuElement = null;
    this.createUI();
  }

  createUI() {
    // Create pause menu container
    this.pauseMenuElement = document.createElement('div');
    this.pauseMenuElement.className = 'pause-menu';
    this.pauseMenuElement.style.position = 'fixed';
    this.pauseMenuElement.style.top = '50%';
    this.pauseMenuElement.style.left = '50%';
    this.pauseMenuElement.style.transform = 'translate(-50%, -50%)';
    this.pauseMenuElement.style.background = "url('./assets/ui/bg-pause.jpeg') center/cover no-repeat";
    this.pauseMenuElement.style.padding = '30px';
    this.pauseMenuElement.style.borderRadius = '12px';
    this.pauseMenuElement.style.border = '2px solid rgba(255, 255, 255, 0.2)';
    this.pauseMenuElement.style.color = '#fff';
    this.pauseMenuElement.style.minWidth = '300px';
    this.pauseMenuElement.style.zIndex = '500';

    // Resume button
    const resumeButton = document.createElement('button');
    resumeButton.textContent = 'RESUME';
    resumeButton.style.cssText = 'display:block; width:100%; padding:10px; margin-bottom:10px; cursor:pointer; font-weight:bold;';
    resumeButton.addEventListener('click', () => this.resumeGame());
    this.pauseMenuElement.appendChild(resumeButton);

    // Settings button
    const settingsButton = document.createElement('button');
    settingsButton.textContent = 'SETTINGS';
    settingsButton.style.cssText = 'display:block; width:100%; padding:10px; margin-bottom:20px; cursor:pointer; font-weight:bold;';
    settingsButton.addEventListener('click', () => {
      if (window.__huntix?.scene?.hud) {
        this.hide();
        window.__huntix.scene.hud.showSettings(() => this.show());
      }
    });
    this.pauseMenuElement.appendChild(settingsButton);

    // Volume controls
    const createSlider = (label, defaultValue, onChange) => {
      const labelEl = document.createElement('div');
      labelEl.textContent = `${label} Volume:`;
      labelEl.style.fontSize = '12px';
      labelEl.style.marginBottom = '4px';
      this.pauseMenuElement.appendChild(labelEl);

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '1';
      slider.step = '0.01';
      slider.value = defaultValue;
      slider.style.width = '100%';
      slider.style.marginBottom = '12px';
      slider.addEventListener('input', (e) => onChange(parseFloat(e.target.value)));
      this.pauseMenuElement.appendChild(slider);
    };

    // Master volume
    createSlider('Master', 1.0, (v) => { if(window.AudioManager?.instance) window.AudioManager.instance.setMasterVolume(v); });
    // Music volume
    createSlider('Music', 0.5, (v) => { if(window.AudioManager?.instance) window.AudioManager.instance.setMusicVolume(v); });
    // SFX volume
    createSlider('SFX', 0.8, (v) => { if(window.AudioManager?.instance) window.AudioManager.instance.setSfxVolume(v); });
  }

  resumeGame() {
    if (window.__huntix?.scene?.resume) {
      window.__huntix.scene.resume();
    }
    this.hide();
  }

  show() {
    this.overlay.appendChild(this.pauseMenuElement);
  }

  hide() {
    if (this.pauseMenuElement.parentNode) {
      this.overlay.removeChild(this.pauseMenuElement);
    }
  }
}
