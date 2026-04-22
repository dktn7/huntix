import * as THREE from 'three';

/**
 * Portal rift fill (inner CircleGeometry) and floor glow (PlaneGeometry).
 * Caller advances uTime each frame: mesh.material.uniforms.uTime.value += dt
 * Matches AuraShader.js pattern — no performance.now / Date.now.
 */

// --- Swirling rift fill ---
const riftVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const riftFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColour;
  varying vec2  vUv;

  float swirl(vec2 uv, float t) {
    vec2 c = uv - 0.5;
    float angle = atan(c.y, c.x) + t * 1.8;
    float r = length(c);
    float rings = sin(r * 18.0 - t * 3.5) * 0.5 + 0.5;
    float spoke = sin(angle * 5.0 + t * 2.2) * 0.5 + 0.5;
    float center = smoothstep(0.5, 0.0, r);
    return rings * spoke * center;
  }

  void main() {
    float s = swirl(vUv, uTime);
    float alpha = s * 0.22 + 0.04;
    gl_FragColor = vec4(uColour, alpha);
  }
`;

// --- Floor glow pool ---
const glowVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColour;
  varying vec2  vUv;

  void main() {
    vec2 c = vUv - 0.5;
    float r = length(c) * 2.0;
    float pulse = 0.7 + sin(uTime * 2.4) * 0.3;
    float alpha = (1.0 - smoothstep(0.0, 1.0, r)) * 0.55 * pulse;
    gl_FragColor = vec4(uColour, alpha);
  }
`;

/**
 * Inner swirling rift fill — place inside the torus ring.
 * @param {number} colour  hex colour matching the zone palette
 * @returns {{ mesh: THREE.Mesh, material: THREE.ShaderMaterial }}
 */
export function createPortalRift(colour) {
  const geo = new THREE.CircleGeometry(0.82, 48);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:   { value: 0 },
      uColour: { value: new THREE.Color(colour) },
    },
    vertexShader:   riftVertexShader,
    fragmentShader: riftFragmentShader,
    transparent: true,
    depthWrite:  false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, material: mat };
}

/**
 * Soft elliptical floor glow pool below the portal.
 * @param {number} colour  hex colour matching the zone palette
 * @returns {{ mesh: THREE.Mesh, material: THREE.ShaderMaterial }}
 */
export function createPortalFloorGlow(colour) {
  const geo = new THREE.PlaneGeometry(2.8, 0.9);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:   { value: 0 },
      uColour: { value: new THREE.Color(colour) },
    },
    vertexShader:   glowVertexShader,
    fragmentShader: glowFragmentShader,
    transparent: true,
    depthWrite:  false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, material: mat };
}
