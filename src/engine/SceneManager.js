import { TitleScreen } from '../screens/TitleScreen.js';
import { HunterSelectScreen } from '../screens/HunterSelectScreen.js';
import { HubScreen } from '../screens/HubScreen.js';
import { ZoneScreen } from '../screens/ZoneScreen.js';
import { BossScreen } from '../screens/BossScreen.js';
import { EndScreen } from '../screens/EndScreen.js';
import { RunState } from '../core/RunState.js';
import { HunterController } from '../gameplay/HunterController.js';
import { CombatController } from '../gameplay/CombatController.js';
import { EnemySpawner } from '../gameplay/EnemySpawner.js';
import { AudioManager } from './AudioManager.js';
import { HUD } from '../gameplay/HUD.js';
import { ZoneManager } from '../gameplay/ZoneManager.js';

export class SceneManager {
  constructor(renderer) {
    this.scene = new THREE.Scene();
    this.camera = renderer.createCamera();
    this.audio = new AudioManager();
    this.hud = new HUD(document.getElementById('ui-overlay'));
    this.zoneManager = new ZoneManager(this.scene);
    this.hunters = new HunterController(this.scene, RunState.players);
    this.spawner = new EnemySpawner(this.scene, this.hunters.activePlayerCount);
    this.combat = new CombatController();

    this.scenes = {
      title: new TitleScreen(),
      hunterSelect: new HunterSelectScreen(),
      hub: new HubScreen(),
      zone: new ZoneScreen(),
      boss: new BossScreen(),
      end: new EndScreen()
    };
    
    this.currentScene = 'title';
    this.scenes.title.initialize?.();
  }
  
  transition(sceneName) {
    if (this.scenes[this.currentScene]) {
      this.scenes[this.currentScene].destroy?.();
    }
    
    this.currentScene = sceneName;
    
    if (this.scenes[sceneName]) {
      this.scenes[sceneName].initialize?.();
    }
  }

  update(dt, input) {
    input.poll();
    if (input.anyJustPressed()) {
      this.audio.init();
    }
    // Scene update logic will call current scene's update()
  }
}
