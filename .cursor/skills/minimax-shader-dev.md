---
name: shader-dev
description: GLSL shader techniques for elemental aura effects, outline shaders, hit flash, depth-faking, and particle systems in Three.js. Use when building visual effects for hunters or bosses.
source: https://officialskills.sh/MiniMax-AI/skills/shader-dev
---

# Shader Dev for Huntix

Write GLSL shaders for elemental visual effects in Three.js.

## Integrating Custom Shaders in Three.js

```js
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0xff4400) },
    uIntensity: { value: 1.0 }
  },
  vertexShader: `...`,
  fragmentShader: `...`,
  transparent: true,
  depthWrite: false
});

// Update in game loop
material.uniforms.uTime.value = clock.getElapsedTime();
```

## Elemental Aura Fragment Shader Template

```glsl
uniform float uTime;
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;

void main() {
  float dist = distance(vUv, vec2(0.5));
  float alpha = smoothstep(0.5, 0.3, dist);
  alpha *= (0.7 + 0.3 * sin(uTime * 4.0 + dist * 20.0)) * uIntensity;
  gl_FragColor = vec4(uColor, alpha);
}
```

## Hit Flash Shader

```glsl
// Add to character material on hit
uniform float uHitFlash; // 0.0 to 1.0, decays over ~0.1s
void main() {
  vec4 base = texture2D(uTexture, vUv);
  gl_FragColor = mix(base, vec4(1.0, 1.0, 1.0, base.a), uHitFlash);
}
```

## Elemental Colour Reference

| Hunter | Primary | Secondary |
|--------|---------|-----------|
| Dabik (Shadow) | `#6a0dad` | `#1a1a2e` |
| Benzu (Earth/Thunder) | `#8b6914` | `#f4d03f` |
| Sereisa (Lightning) | `#00d4ff` | `#ffffff` |
| Vesol (Flame) | `#ff4500` | `#ff8c00` |

## Performance Rules

- Avoid `discard` in fragment shaders — use alpha blending instead
- Minimise texture samples per fragment
- Use `mediump` precision where colour quality allows
- Share a single `ShaderMaterial` instance across multiple aura meshes using `material.clone()` only when uniforms differ
