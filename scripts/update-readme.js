#!/usr/bin/env node
/**
 * scripts/update-readme.js
 * Run: node scripts/update-readme.js
 *
 * Reads src/ file tree, evaluates each phase, then rewrites the
 * 18-Day Build Plan table in README.md between the sentinel comments:
 *   <!-- PHASE-TABLE-START -->  ...  <!-- PHASE-TABLE-END -->
 *
 * Icons:
 *   ✅  = all files present (phase complete)
 *   🔄  = lowest incomplete phase (currently in progress)
 *   ⬜  = not yet started (locked)
 *
 * Safe to run repeatedly — only the table rows are touched.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const README = resolve(root, 'README.md');

const exists = (p) => existsSync(resolve(root, p));

// ── Phase definitions (keep in sync with check-phase.js) ──────────────────
const PHASES = [
  {
    number: 1,
    name: 'Core Engine',
    dates: 'Apr 15–17',
    focus: 'Three.js 2.5D setup, player controller, fixed timestep, input',
    milestone: 'Solo hunter moves',
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
    dates: 'Apr 18–20',
    focus: 'Enemy AI, hit detection, status effects, combos, juice',
    milestone: 'Fight grunt waves',
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
    dates: 'Apr 21–23',
    focus: 'All 4 hunters, 1–4P input, AI companions',
    milestone: '4P hub + combat',
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
    dates: 'Apr 24–26',
    focus: '3 zones, portals, boss phases, Essence drops, screen transitions',
    milestone: 'Full run clearable',
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
    dates: 'Apr 27–29',
    focus: 'Shop, weapons, levelling, HUD, combo UI',
    milestone: 'Buy + upgrade loop',
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
    name: 'Polish & Deploy',
    dates: 'Apr 30 – May 1',
    focus: 'Audio, onboarding, 60fps target, deploy — SHIP by 13:37 UTC May 1',
    milestone: '🚢 Ship it',
    files: [
      'src/engine/AudioManager.js',
      'src/gameplay/OnboardingFlow.js',
      'src/gameplay/PerfMonitor.js',
    ],
  },
];

// ── Evaluate ──────────────────────────────────────────────────────────────────
const results = PHASES.map((phase) => {
  const missing = phase.files.filter((f) => !exists(f));
  return { ...phase, missing, complete: missing.length === 0 };
});

const currentIdx = results.findIndex((p) => !p.complete);

function icon(phase, idx) {
  if (phase.complete)     return '✅';
  if (idx === currentIdx) return '🔄';
  return '⬜';
}

function bar(phase) {
  if (phase.complete) return '`█████ 100%`';
  const done  = phase.files.length - phase.missing.length;
  const total = phase.files.length;
  const pct   = Math.round((done / total) * 100);
  const filled = Math.round((done / total) * 5);
  return '`' + '█'.repeat(filled) + '░'.repeat(5 - filled) + ` ${pct}%` + '`';
}

// ── Build table ───────────────────────────────────────────────────────────────
const header = `| Phase | Dates | Focus | Progress | Milestone |\n|-------|-------|-------|----------|-----------|`;

const rows = results.map((p, i) =>
  `| ${icon(p, i)} **${p.number} \u2014 ${p.name}** | ${p.dates} | ${p.focus} | ${bar(p, i)} | ${p.milestone} |`
).join('\n');

const newTable = `${header}\n${rows}`;

// ── Splice into README ──────────────────────────────────────────────────────────────
const START = '<!-- PHASE-TABLE-START -->';
const END   = '<!-- PHASE-TABLE-END -->';

let readme = readFileSync(README, 'utf8');

if (!readme.includes(START) || !readme.includes(END)) {
  console.error(`❌  Sentinels not found in README.md.`);
  process.exit(1);
}

const before = readme.slice(0, readme.indexOf(START) + START.length);
const after  = readme.slice(readme.indexOf(END));
readme = `${before}\n${newTable}\n${after}`;

writeFileSync(README, readme, 'utf8');

console.log('\n✅  README.md phase table updated:\n');
results.forEach((p, i) => {
  const done = p.files.length - p.missing.length;
  console.log(`  ${icon(p, i)} Phase ${p.number} (${p.dates}) — ${p.name}: ${done}/${p.files.length} files`);
});
console.log('');
