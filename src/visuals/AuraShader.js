import * as THREE from 'three';

/**
 * Aura ring: caller advances uTime each frame (e.g. uniforms.uTime.value += dt).
 * No Date.now, performance.now, or THREE.Clock in this file.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;

  void main() {
    vec3 p = position;
    p.y += sin(uTime * 3.0) * 0.02;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColour;
  uniform float uTime;
  uniform float uPulseSpeed;

  void main() {
    float t = sin(uTime * uPulseSpeed) * 0.5 + 0.5;
    float a = mix(0.3, 0.8, t);
    gl_FragColor = vec4(uColour, a);
  }
`;

/**
 * @param {number|string|THREE.Color} colour
 * @param {number} pulseSpeed
 * @returns {THREE.Mesh}
 */
export function createAura(colour, pulseSpeed) {
  const geometry = new THREE.RingGeometry(0.4, 0.55, 32);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColour: { value: new THREE.Color(colour) },
      uPulseSpeed: { value: pulseSpeed },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = -0.05;
  return mesh;
}
