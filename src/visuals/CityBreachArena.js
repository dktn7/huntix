import * as THREE from 'three';
import { Base3DArena } from './Base3DArena.js';

export class CityBreachArena extends Base3DArena {
  build() {
    // City Breach uses multiple chunks to create a long scrolling street
    const chunks = [
      'Road_Chunk_5.glb',
      'road-straight.glb',
      'road-crossroad.glb',
      'road-bridge.glb'
    ];

    const promises = chunks.map((name, i) => {
        return this.loadModel(`./assets/models/world/city-breach/${name}`)
            .then(scene => {
                scene.position.set(i * 20, 0, 0); // Spaced out along the lane
                this.group.add(scene);
                return scene;
            });
    });

    return Promise.all(promises).then(() => this.group);
  }
}
