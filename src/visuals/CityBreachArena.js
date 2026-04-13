import * as THREE from 'three';

/** Radial gradient: centre #1a1a2e, darker toward edges. No external files. */
function createGroundEdgeTexture() {
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

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/** City Breach lane: ground, bounds, back wall, three columns. No lights. */
export function createCityBreachArena() {
  const root = new THREE.Group();

  const groundTex = createGroundEdgeTexture();
  const groundMat = new THREE.MeshBasicMaterial({ map: groundTex });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 8), groundMat);
  ground.position.set(0, 0, 0);
  // Default PlaneGeometry lies in X/Y (normal +Z); already flat in the gameplay plane.
  ground.rotation.set(0, 0, 0);
  root.add(ground);

  const wallMat = new THREE.MeshBasicMaterial({ color: 0x252538 });
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 2), wallMat);
  leftWall.position.set(-20, 2, 0);
  root.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 2), wallMat);
  rightWall.position.set(20, 2, 0);
  root.add(rightWall);

  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(40, 4, 0.5),
    new THREE.MeshBasicMaterial({ color: 0x0d0d1a })
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
