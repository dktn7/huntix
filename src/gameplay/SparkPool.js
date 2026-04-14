import * as THREE from 'three';
import { sparkGeometry, sparkHitMaterial, sparkEssenceMaterial } from '../visuals/SparkLook.js';

const POOL_SIZE = 48;
const SPARK_LIFE = 0.18;

export class SparkPool {
  /** Creates a reusable pool of hit spark / essence meshes (shared visuals). */
  constructor(scene) {
    this._particles = [];
    this._essence = [];
    this._cursor = 0;
    this._essenceCursor = 0;
    this._spawnPhase = 0;

    for (let i = 0; i < POOL_SIZE; i += 1) {
      const mesh = new THREE.Mesh(sparkGeometry, sparkHitMaterial);
      mesh.visible = false;
      scene.add(mesh);
      this._particles.push({
        mesh,
        life: 0,
        vx: 0,
        vy: 0,
        essence: false,
        target: null,
        ticks: 0,
      });
    }
  }

  /** Spawns a short burst of placeholder sparks at a hit position. */
  spawn(x, y, intensity = 0.25) {
    const count = intensity >= 0.5 ? 8 : 5;
    for (let i = 0; i < count; i += 1) {
      const particle = this._particles[this._cursor];
      this._cursor = (this._cursor + 1) % this._particles.length;

      const angle = this._spawnPhase + i * 2.399;
      const speed = 2.5 + intensity * 4 + (i % 3) * 0.35;
      particle.life = SPARK_LIFE;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed * 0.7;
      particle.essence = false;
      particle.target = null;
      particle.ticks = 0;
      particle.mesh.material = sparkHitMaterial;
      particle.mesh.position.set(x, y, -y * 0.01 + 0.2);
      particle.mesh.scale.setScalar(1);
      particle.mesh.visible = true;
    }

    this._spawnPhase += 0.7;
  }

  /** Spawns an essence particle that lerps toward the player over 60 ticks. */
  spawnEssence(x, y, player) {
    const particle = this._particles[this._essenceCursor];
    this._essenceCursor = (this._essenceCursor + 1) % this._particles.length;

    particle.mesh.material = sparkEssenceMaterial;
    particle.life = 1;
    particle.vx = 0;
    particle.vy = 0;
    particle.essence = true;
    particle.target = player;
    particle.ticks = 60;
    particle.mesh.position.set(x, y, -y * 0.01 + 0.25);
    particle.mesh.scale.setScalar(1.4);
    particle.mesh.visible = true;
  }

  /** Advances all active sparks for one fixed gameplay tick. */
  update(dt) {
    for (const particle of this._particles) {
      if (particle.life <= 0) continue;

      if (particle.essence) {
        this._updateEssence(particle);
        continue;
      }

      particle.life = Math.max(0, particle.life - dt);
      particle.mesh.position.x += particle.vx * dt;
      particle.mesh.position.y += particle.vy * dt;
      particle.vx *= 0.86;
      particle.vy *= 0.86;
      particle.mesh.scale.setScalar(Math.max(0.1, particle.life / SPARK_LIFE));

      if (particle.life <= 0) {
        particle.mesh.visible = false;
      }
    }
  }

  _updateEssence(particle) {
    if (!particle.target || particle.ticks <= 0) {
      particle.life = 0;
      particle.mesh.visible = false;
      particle.essence = false;
      return;
    }

    const target = particle.target.position;
    const t = 1 / particle.ticks;
    particle.mesh.position.x += (target.x - particle.mesh.position.x) * t;
    particle.mesh.position.y += (target.y - particle.mesh.position.y) * t;
    particle.mesh.position.z = -particle.mesh.position.y * 0.01 + 0.25;
    particle.ticks -= 1;
    particle.mesh.scale.setScalar(Math.max(0.2, particle.ticks / 60));

    if (particle.ticks <= 0) {
      particle.life = 0;
      particle.mesh.visible = false;
      particle.essence = false;
    }
  }
}
