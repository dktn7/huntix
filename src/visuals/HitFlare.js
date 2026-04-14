import * as THREE from 'three';

/**
 * Impact burst ring — caller advances uniforms.uTime each frame.
 * No wall-clock APIs in this module.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;

  void main() {
    float s = 1.0 + sin(uTime * 18.0) * 0.06;
    vec3 p = position * s;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColour;
  uniform float uTime;

  void main() {
    float a = exp(-uTime * 7.0) * 0.75;
    gl_FragColor = vec4(uColour, a);
  }
`;

/**
 * @param {number|string|THREE.Color} colour
 * @returns {THREE.Mesh} Ring mesh with ShaderMaterial (transparent, DoubleSide).
 */
export function createImpactBurstMesh(colour) {
  const geometry = new THREE.RingGeometry(0.15, 0.55, 24);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColour: { value: new THREE.Color(colour) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(geometry, material);
}
