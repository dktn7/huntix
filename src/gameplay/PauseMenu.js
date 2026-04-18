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
    this.pauseMenuElement.style.top = '50%');
    this.pauseMenuElement.style.left = '50%');
    this.pauseMenuElement.style.transform = 'translate(-50%, -50%)';
    this.pauseMenuElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)');
    this.pauseMenuElement.style.padding = '20px';
    this.pauseMenuElement.style.borderRadius = '10px';
    this.overlay.appendChild(this.pauseMenuElement);

    // Resume button
    const resumeButton = document.createElement('button');
    resumeButton.textContent = 'Resume';
    resumeButton.style.marginBottom = '15px';
    resumeButton.addEventListener('click', () => this.resumeGame());
    this.pauseMenuElement.appendChild(resumeButton);

    // Volume controls
    const createSlider = (label, defaultValue, onChange) => {
      const labelEl = document.createElement('div');
      labelEl.textContent = `${label} Volume:`;
      this.pauseMenuElement.appendChild(labelEl);

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '1';
      slider.step = '0.01';
      slider.value = defaultValue;
      slider.addEventListener('input', (e) => onChange(parseFloat(e.target.value)));
      this.pauseMenuElement.appendChild(slider);
    };

    // Master volume
    createSlider('Master', 1.0, (v) => AudioManager.instance.setMasterVolume(v));
    // Music volume
    createSlider('Music', 0.5, (v) => AudioManager.instance.setMusicVolume(v));
    // SFX volume
    createSlider('SFX', 0.8, (v) => AudioManager.instance.setSfxVolume(v));
  }

  resumeGame() {
    // Notify SceneManager to resume game
    SceneManager.instance.resume();
  }

  show() {
    this.overlay.appendChild(this.pauseMenuElement);
  }

  hide() {
    this.overlay.removeChild(this.pauseMenuElement);
  }
}
