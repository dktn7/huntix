import * as THREE from 'three';
import { ORTHO_WIDTH, ORTHO_HEIGHT } from './Renderer.js';

// ─── SceneManager ─────────────────────────────────────────────────────────
// Owns the Three.js Scene and the orthographic camera.
// All game objects live inside this scene.

export class SceneManager {
  constructor(renderer) {
    this.scene  = new THREE.Scene();
    this.camera = renderer.createCamera();

    this._setupLighting();
    this._setupTestScene();
  }

  // ─── Lighting (2.5D: flat ambient + directional for mild depth) ──────────
  _setupLighting() {
    // Bright ambient so sprites stay readable
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambient);

    // Subtle directional from top-left for a hint of 3D depth
    const dir = new THREE.DirectionalLight(0xffeedd, 0.6);
    dir.position.set(-3, 5, 10);
    this.scene.add(dir);
  }

  // ─── Test scene: shows the 2.5D setup is working ─────────────────────────
  _setupTestScene() {
    // Ground plane (the "lane" — X axis is movement)
    const groundGeo = new THREE.PlaneGeometry(ORTHO_WIDTH, 2);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
    const ground    = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -3, 0);
    this.scene.add(ground);

    // Placeholder player (box — replace with sprite/model in Phase 2)
    const playerGeo = new THREE.BoxGeometry(0.8, 1.2, 0.4);
    const playerMat = new THREE.MeshLambertMaterial({ color: 0x9b59b6 });
    this._playerMesh = new THREE.Mesh(playerGeo, playerMat);
    this._playerMesh.position.set(0, -2.2, 0);
    this.scene.add(this._playerMesh);

    // Some background depth boxes (parallax layer simulation)
    const bgColors = [0x16213e, 0x0f3460, 0x16213e];
    bgColors.forEach((color, i) => {
      const geo = new THREE.BoxGeometry(ORTHO_WIDTH, 3, 0.1);
      const mat = new THREE.MeshLambertMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, 2 + i * 2, -(i + 1) * 2);
      this.scene.add(mesh);
    });

    // Player state for test movement
    this._playerPos  = { x: 0, y: -2.2 };
    this._playerSpeed = 5; // world units/sec
  }

  // ─── Update (called every fixed tick) ───────────────────────────────────
  update(dt, input) {
    input.poll();

    const mv = input.moveVector;
    this._playerPos.x += mv.x * this._playerSpeed * dt;
    this._playerPos.y += mv.y * this._playerSpeed * dt * 0.4; // Y movement is compressed (2.5D feel)

    // Clamp to visible area
    const hw = ORTHO_WIDTH  / 2 - 0.5;
    const hh = ORTHO_HEIGHT / 2 - 0.5;
    this._playerPos.x = Math.max(-hw, Math.min(hw, this._playerPos.x));
    this._playerPos.y = Math.max(-hh, Math.min(hh, this._playerPos.y));

    this._playerMesh.position.x = this._playerPos.x;
    this._playerMesh.position.y = this._playerPos.y;

    // Y-sort: objects further down (lower Y) render in front
    this._playerMesh.position.z = -this._playerPos.y * 0.01;
  }

  getScene()  { return this.scene; }
  getCamera() { return this.camera; }
}
