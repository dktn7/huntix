#!/usr/bin/env node
/**
 * scripts/check-phase.js
 * Run: node scripts/check-phase.js
 *
 * Scans src/ and reports the current development phase based on which
 * files are present. The current phase is the lowest-numbered phase
 * that still has missing files. All output is machine-readable for
 * agents and human-readable for devs.
 */

import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const exists = (p) => existsSync(resolve(root, p));

const PHASES = [
  {
    number: 1,
    name: 'Core Engine',
    milestone: 'Solo hunter moves and attacks feel good with placeholder geometry',
    docs: ['docs/GDD.md', 'docs/TECHSTACK.md', 'docs/INPUT.md'],
    files: [
      'src/engine/GameLoop.js',
      'src/engine/Renderer.js',
      'src/engine/SceneManager.js',
      'src/engine/InputManager.js',
      'src/main.js',
      'src/gameplay/PlayerState.js',
      'src/gameplay/CombatController.js',
      'src/gameplay/Hitbox.js',
      'src/gameplay/ManaBar.js',
    ],
  },
  {
    number: 2,
    name: 'Enemy AI & Juice',
    milestone: 'Player can fight grunt waves with visible hit feedback',
    docs: ['docs/ENEMIES.md', 'docs/GDD.md'],
    files: [
      'src/gameplay/EnemyAI.js',
      'src/gameplay/EnemySpawner.js',
      'src/gameplay/StatusEffects.js',
      'src/gameplay/SparkPool.js',
      'src/engine/CameraShake.js',
    ],
  },
  {
    number: 3,
    name: '4 Hunters & Co-op',
    milestone: '4 distinct hunters playable in local co-op',
    docs: ['docs/HUNTERS.md', 'docs/COOP.md', 'docs/INPUT.md', 'docs/ANIMATIONS.md', 'docs/VISUAL-DESIGN.md'],
    files: [
      'src/gameplay/HunterController.js',
      'src/gameplay/CoopManager.js',
      'src/visuals/HunterMeshes.js',
      'src/gameplay/AICompanion.js',
      'src/gameplay/HunterDabik.js',
      'src/gameplay/HunterBenzu.js',
      'src/gameplay/HunterSereisa.js',
      'src/gameplay/HunterVesol.js',
    ],
  },
  {
    number: 4,
    name: 'Zones & Bosses',
    milestone: 'Full run clear — all 4 zones + boss defeated',
    docs: ['docs/ZONES.md', 'docs/BOSSES.md', 'docs/PORTAL-WEBRING.md'],
    files: [
      'src/gameplay/ZoneManager.js',
      'src/gameplay/PortalTransition.js',
      'src/gameplay/BossController.js',
      'src/gameplay/EssenceDrop.js',
      'src/visuals/CityBreachArena.js',
    ],
  },
  {
    number: 5,
    name: 'Hub, Shop & HUD',
    milestone: 'Buy and upgrade loop fully working',
    docs: ['docs/WEAPONS.md', 'docs/HUD.md', 'docs/CUSTOMIZATION.md'],
    files: [
      'src/gameplay/HubScene.js',
      'src/gameplay/ShopManager.js',
      'src/gameplay/LevelingSystem.js',
      'src/gameplay/ComboUI.js',
      'src/gameplay/GameplayHUD.js',
    ],
  },
  {
    number: 6,
    name: 'Audio, Polish & Deploy',
    milestone: 'Playable jam submission — ship it',
    docs: ['docs/AUDIO.md'],
    files: [
      'src/engine/AudioManager.js',
      'src/gameplay/OnboardingFlow.js',
      'src/gameplay/PerfMonitor.js',
    ],
  },
];

// --- Evaluate each phase ---

const results = PHASES.map((phase) => {
  const checked = phase.files.map((f) => ({ file: f, present: exists(f) }));
  const missing = checked.filter((c) => !c.present);
  const complete = missing.length === 0;
  return { ...phase, checked, missing, complete };
});

const currentPhase = results.find((p) => !p.complete) ?? results[results.length - 1];
const completedPhases = results.filter((p) => p.complete && p.number < currentPhase.number);

// --- Output ---

console.log('\n══════════════════════════════════════════');
console.log('  HUNTIX — Phase Detector');
console.log('══════════════════════════════════════════');

for (const phase of results) {
  const isCurrent = phase.number === currentPhase.number;
  const icon = phase.complete ? '✅' : isCurrent ? '⚡' : '🔒';
  const label = phase.complete ? 'DONE' : isCurrent ? 'IN PROGRESS' : 'LOCKED';
  console.log(`\n${icon} Phase ${phase.number} — ${phase.name}  [${label}]`);

  if (isCurrent) {
    console.log(`   Milestone: ${phase.milestone}`);
    console.log('   Files:');
    for (const c of phase.checked) {
      console.log(`     ${c.present ? '✓' : '✗'} ${c.file}`);
    }
    if (phase.missing.length > 0) {
      console.log('\n   ⬇ BUILD NEXT (in order):');
      phase.missing.forEach((m, i) => console.log(`     ${i + 1}. ${m.file}`));
    }
    console.log('\n   📚 Docs to read before building:');
    phase.docs.forEach((d) => console.log(`     - ${d}`));
  }
}

console.log('\n══════════════════════════════════════════');
console.log(`  CURRENT PHASE: ${currentPhase.number} — ${currentPhase.name}`);
if (currentPhase.missing.length > 0) {
  console.log(`  NEXT FILE TO BUILD: ${currentPhase.missing[0].file}`);
} else {
  console.log('  ALL PHASES COMPLETE — ready to ship!');
}
console.log('══════════════════════════════════════════\n');
