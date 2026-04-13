---
name: shader-dev
description: GLSL shaders for elemental aura effects, hit flash, outline, and depth-faking in Three.js. Use when building visual effects for hunters or bosses.
---

# Shader Dev for Huntix

## Custom Shader in Three.js

```js
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0xff4400) },
    uIntensity: { value: 1.0 }
  },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `...`,
  transparent: true,
  depthWrite: false
});
// Update in loop:
material.uniforms.uTime.value = clock.getElapsedTime();
```

## Elemental Aura Fragment Shader

```glsl
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
void main() {
  float dist = distance(vUv, vec2(0.5));
  float alpha = smoothstep(0.5, 0.3, dist);
  alpha *= 0.7 + 0.3 * sin(uTime * 4.0 + dist * 20.0);
  gl_FragColor = vec4(uColor, alpha);
}
```

## Hit Flash

```glsl
uniform float uHitFlash;
void main() {
  vec4 base = texture2D(uTexture, vUv);
  gl_FragColor = mix(base, vec4(1.0,1.0,1.0,base.a), uHitFlash);
}
```

## Performance Rules

- Avoid `discard` — use alpha blending
- Use `mediump` precision where possible
- Share one `ShaderMaterial` instance across same-type aura meshes
