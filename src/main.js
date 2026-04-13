import { Renderer } from './engine/Renderer.js';
import { InputManager } from './engine/InputManager.js';
import { GameLoop } from './engine/GameLoop.js';
import { SceneManager } from './engine/SceneManager.js';

// ─── Bootstrap ───────────────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas');

const renderer = new Renderer(canvas);
const input    = new InputManager();
const scene    = new SceneManager(renderer);
const loop     = new GameLoop();

// Debug toggle (press ` to enable)
document.addEventListener('keydown', e => {
  if (e.key === '`') document.body.classList.toggle('debug');
});

// ─── Main tick ───────────────────────────────────────────────────────────────
loop.start((dt) => {
  scene.update(dt, input);
  renderer.render(scene.getScene(), scene.getCamera());

  // Debug panel
  const panel = document.getElementById('debug-panel');
  if (panel && document.body.classList.contains('debug')) {
    panel.innerHTML = [
      `FPS: ${loop.fps.toFixed(0)}`,
      `dt:  ${(dt * 1000).toFixed(2)}ms`,
      `Input: ${[...input.pressed].join(', ') || 'none'}`,
    ].join('<br>');
  }
});

// Expose globals for debugging in console
window.__huntix = { renderer, input, scene, loop };
