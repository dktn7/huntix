import * as THREE from 'three';
import { CITY_BREACH } from './Palettes.js';

/** Radial gradient ground + hand-drawn fissure strokes (no external files). */
function createCompositeGroundTexture() {
  const w = 512;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const cx = w * 0.5;
  const cy = h * 0.5;
  const r = Math.hypot(cx, cy);
  const g = ctx.createRadialGradient(cx, cy, r * 0.12, cx, cy, r);
  g.addColorStop(0, '#1a1a2e');
  g.addColorStop(0.5, '#14142a');
  g.addColorStop(1, '#06060f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(6, 6, 12, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  const seeds = [0.12, 0.28, 0.44, 0.58, 0.72, 0.86];
  for (let i = 0; i < seeds.length; i += 1) {
    const sx = seeds[i] * w;
    ctx.beginPath();
    ctx.moveTo(sx, h * 0.15);
    for (let t = 1; t <= 5; t += 1) {
      ctx.lineTo(sx + (Math.sin(i * 2.1 + t) * 14), (t / 5) * h * 0.85 + h * 0.08);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * City Breach lane: ground (gradient + fissures), gate glow, debris, neon strips, bounds, columns.
 * No lights — SceneManager owns lighting.
 */
export function createCityBreachArena() {
  const root = new THREE.Group();

  const groundTex = createCompositeGroundTexture();
  const groundMat = new THREE.MeshBasicMaterial({ map: groundTex });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 8), groundMat);
  ground.position.set(0, 0, 0);
  ground.rotation.set(0, 0, 0);
  root.add(ground);

  const gateGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 9),
    new THREE.MeshBasicMaterial({
      color: CITY_BREACH.gateFire,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  gateGlow.position.set(17, 0, -0.35);
  root.add(gateGlow);

  const debrisMat = new THREE.MeshBasicMaterial({ color: CITY_BREACH.charcoal });
  const debrisPlacements = [
    { x: -14, y: 0.12, z: 0.12, sx: 1.2, sy: 0.35, sz: 0.45 },
    { x: 4, y: -0.25, z: 0.18, sx: 0.9, sy: 0.28, sz: 0.55 },
    { x: 12, y: 0.2, z: -0.1, sx: 1.4, sy: 0.4, sz: 0.35 },
  ];
  for (const d of debrisPlacements) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(d.sx, d.sy, d.sz), debrisMat);
    m.position.set(d.x, d.y, d.z);
    root.add(m);
  }

  const neonMat = new THREE.MeshBasicMaterial({
    color: CITY_BREACH.neonCyan,
    transparent: true,
    opacity: 0.85,
  });
  const neonStripGeo = new THREE.BoxGeometry(2.2, 0.06, 0.04);
  const stripA = new THREE.Mesh(neonStripGeo, neonMat);
  stripA.position.set(8, 1.2, 0.25);
  root.add(stripA);
  const stripB = new THREE.Mesh(neonStripGeo, neonMat);
  stripB.position.set(-10, -0.8, 0.2);
  stripB.scale.set(0.85, 1, 1);
  root.add(stripB);

  const neonPinkMat = new THREE.MeshBasicMaterial({
    color: CITY_BREACH.neonMagenta,
    transparent: true,
    opacity: 0.7,
  });
  const stripC = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.04), neonPinkMat);
  stripC.position.set(15, 1.5, 0.22);
  root.add(stripC);

  const wallMat = new THREE.MeshBasicMaterial({ color: 0x252538 });
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 2), wallMat);
  leftWall.position.set(-20, 2, 0);
  root.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 2), wallMat);
  rightWall.position.set(20, 2, 0);
  root.add(rightWall);

  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(40, 4, 0.5),
    new THREE.MeshBasicMaterial({ color: CITY_BREACH.backWall })
  );
  backWall.position.set(0, 2, -1);
  root.add(backWall);

  const columnMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const columnGeo = new THREE.BoxGeometry(0.5, 2, 0.1);
  for (const x of [-8, 0, 10]) {
    const col = new THREE.Mesh(columnGeo, columnMat);
    col.position.set(x, 1, 0);
    root.add(col);
  }

  return root;
}
