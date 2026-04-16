// ThunderSpireArena.js — Zone 4: Thunder Spire
// Sky-high storm tower, crackling lightning, electric blue atmosphere
// Parallax layers: Z=-1 storm clouds (fast), Z=-3 spire walls, Z=-5 open sky
// Palette: ref Palettes.js → THUNDER_SPIRE
// TODO Phase 4: implement full geometry matching CityBreachArena.js pattern

export class ThunderSpireArena {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
  }

  build() {
    // Stub — Phase 4 implementation
    // Floor: 40×10 plane, stone tile with electric pulse
    // Midground: spire column sprites, lightning rod props
    // Background: storm cloud layers (animated scroll)
    // Parallax: clouds move at 0.8× player speed (fast = wind feel)
    // Special: periodic lightning flash — full-screen white overlay, opacity 0.15, 80ms
    console.warn('[ThunderSpireArena] stub — not yet implemented');
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
