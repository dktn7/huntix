#!/usr/bin/env node
/**
 * check-phase.js
 * Detects the current Huntix build phase from source and asset markers.
 * Run at the start of every session.
 */

import { existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const FILE_EXTS_AUDIO = ['.mp3', '.ogg', '.wav'];

function absolutePath(relativePath) {
  return resolve(root, relativePath);
}

function pathExists(relativePath) {
  return existsSync(absolutePath(relativePath));
}

function walkFiles(dirPath, out = []) {
  if (!existsSync(dirPath)) return out;
  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = resolve(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, out);
    } else {
      out.push(fullPath);
    }
  }
  return out;
}

function countFiles(relativeDir, extensions = null) {
  const dirPath = absolutePath(relativeDir);
  if (!existsSync(dirPath)) return 0;
  const files = walkFiles(dirPath);
  if (!extensions || extensions.length === 0) return files.length;
  const extLower = extensions.map((ext) => ext.toLowerCase());
  return files.filter((file) => extLower.some((ext) => file.toLowerCase().endsWith(ext))).length;
}

function requirementMet(requirement) {
  if (typeof requirement === 'string') {
    return {
      ok: pathExists(requirement),
      label: requirement,
    };
  }

  if (requirement.kind === 'dirCount') {
    const count = countFiles(requirement.dir, requirement.extensions || []);
    const label = `${requirement.dir} (${requirement.min}+ files${requirement.extensions?.length ? `: ${requirement.extensions.join(', ')}` : ''})`;
    return {
      ok: count >= requirement.min,
      label,
    };
  }

  return {
    ok: false,
    label: 'Unknown requirement',
  };
}

function phaseComplete(phase) {
  return phase.required.every((req) => requirementMet(req).ok);
}

function missingForPhase(phase) {
  return phase.required
    .map((req) => requirementMet(req))
    .filter((result) => !result.ok)
    .map((result) => result.label);
}

const phases = [
  {
    phase: 1,
    name: 'Core Engine',
    goal: 'Three.js scene, camera, loop, and player controller online.',
    required: [
      'src/engine/GameLoop.js',
      'src/engine/Renderer.js',
      'src/engine/InputManager.js',
      'src/gameplay/PlayerState.js',
      'src/gameplay/CombatController.js',
    ],
  },
  {
    phase: 2,
    name: 'Combat Basics',
    goal: 'Enemy waves, hit detection, and HUD loop working.',
    required: [
      'src/gameplay/EnemyAI.js',
      'src/gameplay/EnemySpawner.js',
      'src/gameplay/Hitbox.js',
      'src/gameplay/HUD.js',
    ],
  },
  {
    phase: 3,
    name: 'All 4 Hunters + Co-op',
    goal: 'Hunter roster and co-op foundations wired.',
    required: [
      'src/gameplay/HunterController.js',
      'src/gameplay/AnimationController.js',
      'src/visuals/HunterMeshes.js',
      'src/visuals/SpriteAnimator.js',
    ],
  },
  {
    phase: 4,
    name: 'Zones + Bosses',
    goal: 'Zone manager, portal flow, and arena stubs present.',
    required: [
      'src/gameplay/ZoneManager.js',
      'src/gameplay/PortalManager.js',
      'src/visuals/RuinDenArena.js',
      'src/visuals/ShadowCoreArena.js',
      'src/visuals/ThunderSpireArena.js',
    ],
  },
  {
    phase: 5,
    name: 'Progression + UI',
    goal: 'Shop, HUD, and progression systems wired.',
    required: [
      'src/gameplay/ShopManager.js',
      'src/gameplay/HUD.js',
      'src/gameplay/ProgressionData.js',
      'src/core/RunState.js',
    ],
  },
  {
    phase: 6,
    name: 'Screen Flow & Loop Closure',
    goal: 'Title/select flow and run loop transitions connected.',
    required: [
      'src/engine/SceneManager.js',
      'src/screens/TitleScreen.js',
      'src/screens/HunterSelectScreen.js',
      'src/engine/AudioManager.js',
    ],
  },
  {
    phase: 7,
    name: 'Hunter Sprite Pipeline',
    goal: 'All 4 hunter atlases ready and tracked in assets.',
    required: [
      'assets/sprites/hunters',
      { kind: 'dirCount', dir: 'assets/sprites/hunters', extensions: ['.webp', '.json'], min: 8 },
    ],
  },
  {
    phase: 8,
    name: 'Enemy & Boss Sprite Pipeline',
    goal: 'Enemy, boss, and FX sprite atlases ready.',
    required: [
      'assets/sprites/enemies',
      'assets/sprites/bosses',
      'assets/sprites/particles',
      { kind: 'dirCount', dir: 'assets/sprites/enemies', extensions: ['.webp', '.json'], min: 6 },
      { kind: 'dirCount', dir: 'assets/sprites/bosses', extensions: ['.webp', '.json'], min: 8 },
      { kind: 'dirCount', dir: 'assets/sprites/particles', extensions: ['.webp', '.json'], min: 2 },
    ],
  },
  {
    phase: 9,
    name: 'Zone Background Art',
    goal: 'Background layers prepared for all zones and hub.',
    required: [
      'assets/backgrounds',
      { kind: 'dirCount', dir: 'assets/backgrounds', extensions: ['.webp'], min: 15 },
    ],
  },
  {
    phase: 10,
    name: 'Animation State Machine Live',
    goal: 'Animation wiring for hunter runtime states is present.',
    required: [
      'src/gameplay/AnimationController.js',
      'src/visuals/SpriteAnimator.js',
      'src/gameplay/PlayerState.js',
      'src/visuals/HunterMeshes.js',
    ],
  },
  {
    phase: 11,
    name: 'Spells, Surge & Combat Depth',
    goal: 'Combat depth systems present in runtime modules.',
    required: [
      'src/gameplay/CombatController.js',
      'src/gameplay/StatusEffects.js',
      'src/gameplay/PlayerState.js',
    ],
  },
  {
    phase: 12,
    name: 'Zones 1-2 Full',
    goal: 'City Breach and Ruin Den battle content available.',
    required: [
      'src/gameplay/BossEncounter.js',
      'docs/zones/CITY-BREACH.md',
      'docs/zones/RUIN-DEN.md',
    ],
  },
  {
    phase: 13,
    name: 'Zones 3-4 Full',
    goal: 'Shadow Core and Thunder Spire battle content available.',
    required: [
      'src/gameplay/BossEncounter.js',
      'docs/zones/SHADOW-CORE.md',
      'docs/zones/THUNDER-SPIRE.md',
    ],
  },
  {
    phase: 14,
    name: 'Progression & Shop Live',
    goal: 'Progression economy, shop, and aura systems integrated.',
    required: [
      'src/gameplay/ShopManager.js',
      'src/gameplay/ProgressionData.js',
      'src/visuals/AuraShader.js',
    ],
  },
  {
    phase: 15,
    name: 'Audio',
    goal: 'Audio manager and content banks available.',
    required: [
      'src/engine/AudioManager.js',
      'assets/audio/sfx',
      'assets/audio/music',
      { kind: 'dirCount', dir: 'assets/audio/sfx', extensions: FILE_EXTS_AUDIO, min: 1 },
      { kind: 'dirCount', dir: 'assets/audio/music', extensions: FILE_EXTS_AUDIO, min: 1 },
    ],
  },
  {
    phase: 16,
    name: 'Deploy & Jam Submission',
    goal: 'Deploy checklist files are present.',
    required: [
      'index.html',
      'scripts/check-phase.js',
      'CHANGELOG.md',
    ],
  },
];

const docsByPhase = {
  1: ['docs/TECHSTACK.md', 'docs/RENDERING.md', 'docs/SPRITES.md'],
  2: ['docs/ENEMIES.md', 'docs/ATTACKSYSTEM.md', 'docs/HUD.md'],
  3: ['docs/HUNTERS.md', 'docs/COOP.md', 'docs/ANIMATIONS.md'],
  4: ['docs/ZONES.md', 'docs/BOSSES.md', 'docs/WAVEMANAGER.md'],
  5: ['docs/PROGRESSION.md', 'docs/SHOPMANAGER.md', 'docs/HUD.md'],
  6: ['docs/SCENEMANAGER.md', 'docs/TITLESCREEN.md', 'docs/ENDSCREEN.md'],
  7: ['docs/ASSETPIPELINE.md', 'docs/VISUAL-DESIGN.md', 'docs/SPRITES.md'],
  8: ['docs/ASSETPIPELINE.md', 'docs/ENEMIES.md', 'docs/BOSSES.md', 'docs/PARTICLES.md'],
  9: ['docs/RENDERING.md', 'docs/ASSETPIPELINE.md', 'docs/VISUAL-DESIGN.md'],
  10: ['docs/ANIMATIONS.md', 'docs/SPRITES.md', 'docs/HUNTERS.md'],
  11: ['docs/SPELLS.md', 'docs/ATTACKSYSTEM.md', 'docs/STATUSEFFECTS.md'],
  12: ['docs/zones/CITY-BREACH.md', 'docs/zones/RUIN-DEN.md', 'docs/BOSSES.md'],
  13: ['docs/zones/SHADOW-CORE.md', 'docs/zones/THUNDER-SPIRE.md', 'docs/BOSSES.md'],
  14: ['docs/PROGRESSION.md', 'docs/ESSENCEECONOMY.md', 'docs/AURASYSTEM.md'],
  15: ['docs/AUDIO.md', 'docs/PARTICLES.md'],
  16: ['docs/PERFORMANCEBUDGET.md', 'CHANGELOG.md'],
};

let completedPhase = 0;
for (const phase of phases) {
  if (phaseComplete(phase)) {
    completedPhase = phase.phase;
  } else {
    break;
  }
}

const maxPhase = phases[phases.length - 1].phase;
const allComplete = completedPhase >= maxPhase;
const currentPhase = allComplete ? maxPhase : completedPhase + 1;
const completedEntry = phases.find((phase) => phase.phase === completedPhase) || null;
const currentEntry = phases.find((phase) => phase.phase === currentPhase) || null;
const missing = currentEntry ? missingForPhase(currentEntry) : [];

console.log('\n==================================================');
console.log('  HUNTIX - Phase Detector (16-phase)');
console.log('==================================================');

if (completedEntry) {
  console.log(`  Completed : Phase ${completedEntry.phase} - ${completedEntry.name}`);
  console.log(`              "${completedEntry.goal}"`);
} else {
  console.log('  Completed : Phase 0 - Not started');
}

if (allComplete) {
  console.log('\n  Status    : All 16 phases complete. Ready for submission.');
} else if (currentEntry) {
  console.log(`\n  Current   : Phase ${currentEntry.phase} - ${currentEntry.name}`);
  console.log(`  Goal      : "${currentEntry.goal}"`);

  if (missing.length > 0) {
    console.log(`\n  Missing markers for Phase ${currentEntry.phase}:`);
    for (const label of missing) {
      console.log(`    - ${label}`);
    }
  }
}

const docs = docsByPhase[currentPhase] || docsByPhase[completedPhase] || [];
if (docs.length > 0) {
  console.log('\n  Docs to read next:');
  for (const doc of docs) {
    console.log(`    -> ${doc}`);
  }
}

console.log('==================================================\n');
