import * as THREE from 'three';

// ─── Constants ───────────────────────────────────────────────────────────────
// 2.5D viewport: 16:9 logical resolution
export const GAME_WIDTH  = 1280;
export const GAME_HEIGHT = 720;

// Orthographic frustum half-size (world units visible vertically)
export const ORTHO_HEIGHT = 10;
export const ORTHO_WIDTH  = ORTHO_HEIGHT * (GAME_WIDTH / GAME_HEIGHT);
export const DEFAULT_ORTHO_OBLIQUE_DEGREES = 11;
export function obliqueDegreesToCameraTiltX(obliqueDegrees = DEFAULT_ORTHO_OBLIQUE_DEGREES) {
  // Small oblique tilt restores 2.5D depth without pushing the arena out of view.
  return -THREE.MathUtils.degToRad(obliqueDegrees);
}
export const DEFAULT_ORTHO_CAMERA_TILT_X = obliqueDegreesToCameraTiltX(DEFAULT_ORTHO_OBLIQUE_DEGREES);
export const ORTHO_CAMERA_TILT_X = DEFAULT_ORTHO_CAMERA_TILT_X;
export const ORTHO_CAMERA_DISTANCE_Z = 100;

export function setCameraFocus(camera, focusX = 0, focusY = 0) {
  const distanceZ = Math.abs(camera?.userData?.distanceZ ?? ORTHO_CAMERA_DISTANCE_Z);

  camera.userData.focusX = focusX;
  camera.userData.focusY = focusY;
  camera.position.set(focusX, focusY, distanceZ);
}

export function setCameraTiltX(camera, tiltX = DEFAULT_ORTHO_CAMERA_TILT_X) {
  camera.rotation.set(tiltX, 0, 0);
  camera.userData.tiltX = tiltX;
}

export function getCameraTiltX(camera) {
  return Number.isFinite(camera?.userData?.tiltX) ? camera.userData.tiltX : DEFAULT_ORTHO_CAMERA_TILT_X;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;

    // WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // keep crisp for 2.5D sprites
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false; // disabled for perf — add later if needed
    this.renderer.setClearColor(0x101a2b);

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  // ─── Fixed orthographic camera for 2.5D ─────────────────────────────────
  createCamera() {
    const cam = new THREE.OrthographicCamera(
      -ORTHO_WIDTH  / 2,  // left
       ORTHO_WIDTH  / 2,  // right
       ORTHO_HEIGHT / 2,  // top
      -ORTHO_HEIGHT / 2,  // bottom
      0.1,                // near
      1000                // far
    );
    cam.userData.distanceZ = ORTHO_CAMERA_DISTANCE_Z;
    setCameraTiltX(cam, ORTHO_CAMERA_TILT_X);
    setCameraFocus(cam, 0, 0); // Initialize camera position
    return cam;
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
  }

  // ─── Letterbox / pillarbox to maintain aspect ratio ─────────────────────
  _resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const targetAspect = GAME_WIDTH / GAME_HEIGHT;
    const windowAspect = w / h;

    let renderW, renderH;
    if (windowAspect > targetAspect) {
      renderH = h;
      renderW = Math.floor(h * targetAspect);
    } else {
      renderW = w;
      renderH = Math.floor(w / targetAspect);
    }

    this.renderer.setSize(renderW, renderH, false);
    this.canvas.style.width  = renderW + 'px';
    this.canvas.style.height = renderH + 'px';
  }

  // Scale factor: world units → CSS pixels (useful for UI positioning)
  get worldScale() {
    return parseFloat(this.canvas.style.height) / ORTHO_HEIGHT;
  }
}
