import { Renderer } from './engine/Renderer.js';
import { InputManager } from './engine/InputManager.js';
import { GameLoop } from './engine/GameLoop.js';
import { SceneManager } from './engine/SceneManager.js';

const canvas = document.getElementById('game-canvas');

const renderer = new Renderer(canvas);
const input = new InputManager();
const scene = new SceneManager(renderer);
const loop = new GameLoop();

loop.start((dt) => {
  scene.update(dt, input);
  renderer.render(scene.getScene(), scene.getCamera());

  const panel = document.getElementById('debug-panel');
  if (panel && document.body.classList.contains('debug')) {
    const debug = scene.getDebugInfo();
    panel.innerHTML = [
      `FPS: ${loop.fps.toFixed(0)}`,
      `dt: ${(dt * 1000).toFixed(2)}ms`,
      `Mode: ${debug.mode}`,
      `Player: ${debug.playerState}`,
      `HP: ${debug.health.toFixed(0)} / ${debug.maxHealth}`,
      `Mana: ${debug.mana.toFixed(0)} / ${debug.maxMana}`,
      `Surge: ${debug.surge.toFixed(0)} / ${debug.maxSurge}`,
      `Stamina: ${debug.stamina.toFixed(0)} / ${debug.maxStamina}`,
      `Enemies: ${debug.enemies}`,
      `Combo: ${debug.combo}`,
      `Hitstop: ${(debug.hitstop * 1000).toFixed(0)}ms`,
      `Input: ${[...input.pressed].join(', ') || 'none'}`,
    ].join('<br>');
  }
});

window.__huntix = { renderer, input, scene, loop };
