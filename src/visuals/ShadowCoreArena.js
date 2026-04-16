// ShadowCoreArena.js — Zone 3: Shadow Core
// Void dimension, floating platforms, deep violet darkness
// Parallax layers: Z=-1 floating debris, Z=-3 void tendrils, Z=-5 star-void sky
// Palette: ref Palettes.js → SHADOW_CORE
// TODO Phase 4: implement full geometry matching CityBreachArena.js pattern

export class ShadowCoreArena {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
  }

  build() {
    // Stub — Phase 4 implementation
    // Floor: 40×10 plane, near-black with void shimmer
    // Midground: floating stone platform sprites
    // Background: void tendril silhouettes, subtle pulse animation
    // Parallax: bg moves at 0.15× player speed (slower = more depth)
    // Special: ambient darkness — lower scene ambientLight intensity
    console.warn('[ShadowCoreArena] stub — not yet implemented');
  }

  dispose() {
    this.meshes.forEach(m => {
      m.geometry.dispose();
      m.material.dispose();
      this.scene.remove(m);
    });
    this.meshes = [];
  }
}
