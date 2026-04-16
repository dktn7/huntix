#!/usr/bin/env node
/**
 * check-phase.js
 * Detects the current Huntix build phase by inspecting which source files exist.
 * Run this at the start of every Codex/Cursor session.
 *
 * Usage: node scripts/check-phase.js
 */

import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const r = (p) => existsSync(resolve(root, p));

// Phase gate files — each phase requires ALL previous phase files to exist
const phases = [
  {
    phase: 1,
    name: 'Core Engine',
    goal: 'Solo hunter moves and attacks in a working Three.js scene',
    required: [
      'src/engine/GameLoop.js',
      'src/engine/Renderer.js',
      'src/engine/InputManager.js',
      'src/engine/SceneManager.js',
      'src/gameplay/PlayerState.js',
      'src/gameplay/CombatController.js',
      'src/gameplay/Hitbox.js',
    ],
  },
  {
    phase: 2,
    name: 'Combat Basics',
    goal: 'Fight grunt waves with status effects and feedback',
    required: [
      'src/gameplay/EnemyAI.js',
      'src/gameplay/EnemySpawner.js',
      'src/gameplay/ManaBar.js',
    ],
  },
  {
    phase: 3,
    name: 'All Hunters + Co-op',
    goal: '4P hub and combat working, all ultimates fire',
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
    goal: 'Full run clearable hub → final boss',
    required: [
      'src/gameplay/ZoneManager.js',
      'src/gameplay/PortalManager.js',
    ],
  },
  {
    phase: 5,
    name: 'Progression + UI',
    goal: 'Buy, upgrade, and level loop working',
    required: [
      'src/gameplay/ShopManager.js',
      'src/gameplay/HUD.js',
    ],
  },
  {
    phase: 6,
    name: 'Polish + Deploy',
    goal: 'Playable public demo. Jam submission ready.',
    required: [
      'assets/audio',
    ],
  },
];

function detectPhase() {
  let currentPhase = 0;

  for (const { phase, required } of phases) {
    const allPresent = required.every(r);
    if (allPresent) {
      currentPhase = phase;
    } else {
      break;
    }
  }

  return currentPhase;
}

function getMissingFiles(phase) {
  const entry = phases.find((p) => p.phase === phase);
  if (!entry) return [];
  return entry.required.filter((f) => !r(f));
}

const completed = detectPhase();
const next = completed + 1;
const nextEntry = phases.find((p) => p.phase === next);
const missing = nextEntry ? getMissingFiles(next) : [];

console.log('\n══════════════════════════════════════════');
console.log('  HUNTIX — Phase Detector');
console.log('══════════════════════════════════════════');

if (completed === 0) {
  console.log('  Status : Phase 0 — Project not started');
  console.log('  Next   : Phase 1 — Core Engine');
} else {
  const completedEntry = phases.find((p) => p.phase === completed);
  console.log(`  Status : Phase ${completed} COMPLETE — ${completedEntry.name}`);
  console.log(`           "${completedEntry.goal}"`);
}

if (nextEntry) {
  console.log(`\n  BUILD  : Phase ${next} — ${nextEntry.name}`);
  console.log(`  Goal   : "${nextEntry.goal}"`);
  if (missing.length > 0) {
    console.log(`\n  Missing files for Phase ${next}:`);
    missing.forEach((f) => console.log(`    ✗  ${f}`));
  } else {
    console.log(`\n  All Phase ${next} files present.`);
  }
} else {
  console.log('\n  All phases complete. Ready for deploy.');
}

console.log('\n  Docs to read for current build:');
const docMap = {
  1: ['docs/TECHSTACK.md', 'docs/RENDERING.md', 'docs/SPRITES.md', 'docs/MOVEMENT.md', 'docs/CAMERA.md'],
  2: ['docs/ENEMIES.md', 'docs/ATTACKSYSTEM.md', 'docs/COMBOSYSTEM.md', 'docs/DEBUFFS.md', 'docs/HUD.md'],
  3: ['docs/HUNTERS.md', 'docs/SPELLS.md', 'docs/SPRITES.md', 'docs/COOP.md', 'docs/ANIMATIONS.md'],
  4: ['docs/ZONES.md', 'docs/BOSSES.md', 'docs/MINIBOSS.md', 'docs/WAVEMANAGER.md', 'docs/RUNSTATE.md'],
  5: ['docs/PROGRESSION.md', 'docs/HUD.md', 'docs/CARDSCREEN.md', 'docs/HUB.md', 'docs/SHOP.md'],
  6: ['docs/AUDIO.md', 'docs/PARTICLES.md', 'docs/ENDSCREEN.md'],
};
const docsForPhase = docMap[next] || docMap[completed] || [];
docsForPhase.forEach((d) => console.log(`    →  ${d}`));

console.log('\n══════════════════════════════════════════\n');
