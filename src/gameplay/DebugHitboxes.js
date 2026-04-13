import * as THREE from 'three';

const MAX_ENEMY_BOXES = 20;
const MAX_ACTIVE_BOXES = 32;

export class DebugHitboxes {
  /** Creates reusable wireframe debug boxes for gameplay hitboxes. */
  constructor(scene) {
    this.enabled = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);

    this._playerBox = this._createBox(0x48f7ff);
    this._activeBoxes = [];
    this._enemyBoxes = [];
    this._enemyRanges = [];

    for (let i = 0; i < MAX_ACTIVE_BOXES; i += 1) {
      this._activeBoxes.push(this._createBox(0xffffff));
    }

    for (let i = 0; i < MAX_ENEMY_BOXES; i += 1) {
      this._enemyBoxes.push(this._createBox(0xff5555));
      this._enemyRanges.push(this._createBox(0xff3333));
    }
  }

  /** Enables or disables debug hitbox rendering. */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.group.visible = enabled;
  }

  /** Updates the debug boxes to match current gameplay hitboxes. */
  update(player, enemies, activeHitboxes = []) {
    if (!this.enabled) return;

    const hurtbox = player.getHurtbox?.() || player.getBounds();
    this._syncBox(this._playerBox, hurtbox);

    for (let i = 0; i < MAX_ACTIVE_BOXES; i += 1) {
      const hitbox = activeHitboxes[i];
      if (hitbox) {
        this._syncHitbox(this._activeBoxes[i], hitbox);
      } else {
        this._activeBoxes[i].visible = false;
      }
    }

    for (let i = 0; i < MAX_ENEMY_BOXES; i += 1) {
      const enemy = enemies[i];
      if (!enemy) {
        this._enemyBoxes[i].visible = false;
        this._enemyRanges[i].visible = false;
        continue;
      }

      this._syncBox(this._enemyBoxes[i], enemy.getBounds());
      this._syncRange(this._enemyRanges[i], enemy);
    }
  }

  _createBox(color) {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      depthTest: false,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    this.group.add(mesh);
    return mesh;
  }

  _syncHitbox(mesh, box) {
    if (box.shape === 'ARC') {
      mesh.visible = true;
      mesh.position.set(box.centerX + box.facing * box.radius / 2, box.centerY, 10);
      mesh.scale.set(box.radius, box.radius, 1);
      return;
    }
    this._syncBox(mesh, box);
  }

  _syncBox(mesh, box) {
    mesh.visible = true;
    mesh.position.set(box.x + box.width / 2, box.y + box.height / 2, 10);
    mesh.scale.set(box.width, box.height, 1);
  }

  _syncRange(mesh, enemy) {
    const size = enemy.attackRange * 2;
    mesh.visible = true;
    mesh.position.set(enemy.position.x, enemy.position.y, 9.9);
    mesh.scale.set(size, size, 1);
  }
}
