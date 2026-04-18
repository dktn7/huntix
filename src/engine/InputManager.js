// src/engine/InputManager.js
// ... (previous content) ...

// Add pause handling for Escape key
if (this.justPressedKey('Escape')) {
  // Toggle pause state
  SceneManager.instance.togglePause();
}

// ... (rest of the file) ...