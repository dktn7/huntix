#!/usr/bin/env node
/**
 * scripts/update-readme.js
 * Run: node scripts/update-readme.js
 *
 * Reads src/ file tree via the same PHASES definition used by check-phase.js,
 * then rewrites the 18-Day Build Plan table in README.md with live checkboxes:
 *   ✅  = all files for that phase are present (phase complete)
 *   🔄  = phase is currently in progress (lowest incomplete)
 *   ⬜  = phase not yet started (locked)
 *
 * Safe to run repeatedly — only the table rows between the sentinel comments
 * are touched. Everything else in README.md is left exactly as-is.
 *
 * Usage:
 *   node scripts/update-readme.js
 *   # or as a git pre-push hook / CI step
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const README = resolve(root, 'README.md');

const exists = (p) => existsSync(resolve(root, p));

// ── Same PHASES definition as check-phase.js ──────────────────────────────
const PHASES = [
  {
    number: 1,
    name: 'Core Engine',
    days: '1–3',
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
    days: '4–6',
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
    days: '7–9',
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
    days: '10–12',
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
    days: '13–15',
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
    name: 'Audio, Polish & Deploy',
    days: '16–18',
    focus: 'Audio, onboarding, 60fps target, deploy to domain',
    milestone: 'Playable jam entry',
    files: [
      'src/engine/AudioManager.js',
      'src/gameplay/OnboardingFlow.js',
      'src/gameplay/PerfMonitor.js',
    ],
  },
];

// ── Evaluate phases ────────────────────────────────────────────────────────
const results = PHASES.map((phase) => {
  const missing = phase.files.filter((f) => !exists(f));
  return { ...phase, missing, complete: missing.length === 0 };
});

const currentIdx = results.findIndex((p) => !p.complete);

function statusIcon(phase, idx) {
  if (phase.complete)         return '✅';
  if (idx === currentIdx)     return '🔄';
  return '⬜';
}

function progressBar(phase) {
  if (phase.complete) return '█████ 100%';
  const done = phase.files.length - phase.missing.length;
  const total = phase.files.length;
  const pct = Math.round((done / total) * 100);
  const filled = Math.round((done / total) * 5);
  return '█'.repeat(filled) + '░'.repeat(5 - filled) + ` ${pct}%`;
}

// ── Build replacement table ────────────────────────────────────────────────
const header = `| Phase | Days | Focus | Progress | Milestone |\n|-------|------|-------|----------|-----------|`;

const rows = results.map((p, i) => {
  const icon = statusIcon(p, i);
  return `| ${icon} **${p.number} — ${p.name}** | ${p.days} | ${p.focus} | \`${progressBar(p)}\` | ${p.milestone} |`;
}).join('\n');

const newTable = `${header}\n${rows}`;

// ── Splice into README between sentinel comments ───────────────────────────
const START = '<!-- PHASE-TABLE-START -->';
const END   = '<!-- PHASE-TABLE-END -->';

let readme = readFileSync(README, 'utf8');

if (!readme.includes(START) || !readme.includes(END)) {
  console.error(`❌  Sentinels ${START} / ${END} not found in README.md`);
  console.error('    Add them around the 18-Day Build Plan table and re-run.');
  process.exit(1);
}

const before = readme.slice(0, readme.indexOf(START) + START.length);
const after  = readme.slice(readme.indexOf(END));
readme = `${before}\n${newTable}\n${after}`;

writeFileSync(README, readme, 'utf8');

// ── Summary ───────────────────────────────────────────────────────────────
console.log('\n✅  README.md phase table updated:\n');
results.forEach((p, i) => {
  const done = p.files.length - p.missing.length;
  console.log(`  ${statusIcon(p, i)} Phase ${p.number} — ${p.name}: ${done}/${p.files.length} files`);
});
console.log('');
