import * as THREE from 'three';
import { Base3DArena } from './Base3DArena.js';

export class HubArena extends Base3DArena {
  async build() {
    // Only essential assets to establish the "Hub" vibe: stone floor, arches/walls, and a central weapon rack.
    const floorTile = 'floorFull.glb';
    const wallPiece = 'wall.glb';
    const weaponRack = 'weapon-rack.glb';

    // Neutral floor
    for (let i = -2; i <= 2; i++) {
      const floor = await this.loadModel(`./assets/models/world/hub/${floorTile}`);
      floor.position.set(i * 8, 0, 0);
      this.group.add(floor);
    }

    // Framing walls
    for (let i = -2; i <= 2; i++) {
      const wall = await this.loadModel(`./assets/models/world/hub/${wallPiece}`);
      wall.position.set(i * 8, 2, -5);
      this.group.add(wall);
    }

    // Central focal point
    const rack = await this.loadModel(`./assets/models/world/hub/${weaponRack}`);
    rack.position.set(0, 0, -2);
    this.group.add(rack);

    return this.group;
  }
}
