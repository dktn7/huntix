// RuinDenArena.js — Zone 2: Ruin Den
// Earthen ruins, collapsed stone arches, amber dust haze
// Parallax layers: Z=-1 midground rubble, Z=-3 broken walls, Z=-5 sky
// Palette: ref Palettes.js → RUIN_DEN
// TODO Phase 4: implement full geometry matching CityBreachArena.js pattern

export class RuinDenArena {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
  }

  build() {
    // Stub — Phase 4 implementation
    // Floor: 40×10 plane, earthy brown
    // Midground: collapsed arch sprites, rubble clusters
    // Background: broken wall silhouettes
    // Parallax: bg moves at 0.2× player speed, mid at 0.5×
    console.warn('[RuinDenArena] stub — not yet implemented');
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
