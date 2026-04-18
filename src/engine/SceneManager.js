// src/engine/SceneManager.js
// ... (previous content) ...

// Add pause state management
this.isPaused = false;
this.pauseMenu = null;

// ... (rest of constructor) ...

// Add pause methods
this.togglePause = () => {
  if (this.isPaused) {
    this.resume();
  } else {
    this.pause();
  }
};

this.pause = () => {
  if (this.isPaused) return;
  
  this.isPaused = true;
  
  // Create pause menu if it doesn't exist
  if (!this.pauseMenu) {
    this.pauseMenu = new PauseMenu(document.getElementById('ui-overlay'));
  }
  
  // Show pause menu
  this.pauseMenu.show();
  
  // Pause game logic
  this._pauseGameLogic();
};

this.resume = () => {
  if (!this.isPaused) return;
  
  this.isPaused = false;
  
  // Hide pause menu
  this.pauseMenu.hide();
  
  // Resume game logic
  this._resumeGameLogic();
};

// ... (rest of the file) ...

// Update method to handle pause state
update(dt, input) {
  input.poll();

  // Browser audio policy: init on first interaction
  if (input.anyJustPressed()) {
    this.audio.init();
    if (this.hud.isOnboardingOpen()) {
      this.hud.hideOnboarding();
      this._onboardingDone = true;
      if (!this._characterSelectDone) {
        this.hud.showCharacterSelect(RunState.players[0]?.hunterId || 'dabik');
      }
    }
  }

  if (this.hud.isOnboardingOpen()) {
    return;
  }

  // Handle pause state
  if (this.isPaused) {
    return;
  }

  // ... (rest of update logic) ...
}

// ... (rest of the file) ...

// Add methods to pause/resume game logic
_pauseGameLogic() {
  // Pause all game systems
  this.hunters.pause();
  this.spawner.pause();
  this.combat.pause();
  this.audio.duckMusic(0.3, 200); // Duck music when paused
}

_resumeGameLogic() {
  // Resume all game systems
  this.hunters.resume();
  this.spawner.resume();
  this.combat.resume();
  this.audio.duckMusic(1.0, 200); // Restore music when resumed
}

// ... (rest of the file) ...