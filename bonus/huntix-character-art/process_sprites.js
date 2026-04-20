#!/usr/bin/env node
/**
 * Huntix Sprite Pipeline — Green Screen Keyer + TexturePacker Automation
 *
 * Usage:
 *   node process_sprites.js
 *
 * Expects this input folder structure:
 *   flow_output/
 *     dabik/
 *       idle/           <- PNG or JPG frames from Google Flow
 *       run/
 *       attack_light/
 *       ... (all 13 states)
 *     benzu/
 *     sereisa/
 *     vesol/
 *
 * Outputs keyed transparent PNGs to:
 *   assets/hunters/{hunter}/{state}/
 *
 * Optionally runs TexturePacker CLI to pack per-hunter atlases.
 * Set PACK_ATLAS = true below if TexturePacker is installed.
 *
 * Requirements:
 *   npm install sharp
 *   (Optional) TexturePacker CLI — https://www.codeandweb.com/texturepacker
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const INPUT_ROOT = path.resolve('flow_output');
const OUTPUT_ROOT = path.resolve('assets/hunters');

const HUNTERS = ['dabik', 'benzu', 'sereisa', 'vesol'];

const STATES = [
  'idle',
  'run',
  'attack_light',
  'attack_heavy',
  'dodge',
  'spell_minor',
  'spell_advanced',
  'weapon_swap',
  'hurt',
  'dead',
  'downed',
  'revive',
  'ultimate',
];

// Green screen colour from all prompts: #00FF00
// Threshold: how close to pure green a pixel must be to get keyed out.
// Lower = stricter (only exact green). Higher = catches edge fringing.
// Recommended: 40. Increase to 60 if you see green fringing on edges.
const THRESHOLD = 40;

// Set to true if TexturePacker CLI is installed and on your PATH.
// Download from https://www.codeandweb.com/texturepacker
const PACK_ATLAS = false;

// TexturePacker output format. Options: json-array, json-hash, xml, phaser3, etc.
const ATLAS_FORMAT = 'json-array';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

// ─── GREEN KEY ───────────────────────────────────────────────────────────────

/**
 * Keys the #00FF00 green background from a single image.
 * Uses Sharp to read raw pixel data, zeroes alpha on green pixels, saves as PNG.
 */
async function keyGreenScreen(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels = 4 (RGBA)
  const buf = Buffer.from(data);

  for (let i = 0; i < buf.length; i += channels) {
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    const gap = g - 200;
    if (g > 200 && r < THRESHOLD + gap && b < THRESHOLD + gap) {
      buf[i + 3] = 0; // zero alpha
    }
  }

  await sharp(buf, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);
}

// ─── FOLDER PROCESSING ───────────────────────────────────────────────────────

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function getImageFiles(dirPath) {
  return fs
    .readdirSync(dirPath)
    .filter(f => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort();
}

async function processState(inputDir, outputDir) {
  if (!fs.existsSync(inputDir)) return 0;

  const files = getImageFiles(inputDir);
  if (files.length === 0) return 0;

  ensureDir(outputDir);
  let count = 0;

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, path.basename(file, path.extname(file)) + '.png');
    try {
      await keyGreenScreen(inputPath, outputPath);
      console.log(`  ✓ ${file} → ${outputPath}`);
      count++;
    } catch (err) {
      console.error(`  ✗ ${file} — ERROR: ${err.message}`);
    }
  }

  return count;
}

async function processHunter(hunter) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  HUNTER: ${hunter.toUpperCase()}`);
  console.log('─'.repeat(50));

  let total = 0;

  for (const state of STATES) {
    const inputDir = path.join(INPUT_ROOT, hunter, state);
    const outputDir = path.join(OUTPUT_ROOT, hunter, state);

    if (!fs.existsSync(inputDir)) {
      console.log(`  — ${state.padEnd(20)} (no input folder, skipping)`);
      continue;
    }

    console.log(`  Processing: ${state}`);
    const count = await processState(inputDir, outputDir);
    console.log(`  → ${count} frame(s) keyed`);
    total += count;
  }

  console.log(`\n  ${hunter.toUpperCase()} done — ${total} total frames processed`);
  return total;
}

// ─── TEXTUREPACKER ───────────────────────────────────────────────────────────

function packAtlas(hunter) {
  const hunterDir = path.join(OUTPUT_ROOT, hunter);
  const sheetPath = path.join(hunterDir, 'atlas.png');
  const dataPath = path.join(hunterDir, 'atlas.json');

  const stateFolders = STATES
    .map(state => path.join(hunterDir, state))
    .filter(dir => fs.existsSync(dir) && fs.readdirSync(dir).length > 0);

  if (stateFolders.length === 0) {
    console.log(`  No state folders found for ${hunter} — skipping atlas pack`);
    return;
  }

  const cmd = [
    'TexturePacker',
    '--format', ATLAS_FORMAT,
    '--sheet', sheetPath,
    '--data', dataPath,
    '--trim-mode', 'Trim',
    '--extrude', '1',
    '--algorithm', 'MaxRects',
    '--pack-mode', 'Best',
    '--filename-strip-extension',
    ...stateFolders,
  ].join(' ');

  console.log(`\n  Packing atlas for ${hunter.toUpperCase()}...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`  ✓ Atlas packed → ${sheetPath}`);
    console.log(`  ✓ Data file   → ${dataPath}`);
  } catch (err) {
    console.error('  ✗ TexturePacker error — is it installed and on your PATH?');
    console.error('    https://www.codeandweb.com/texturepacker');
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   HUNTIX SPRITE PIPELINE                     ║');
  console.log('║   Green Screen Keyer + TexturePacker          ║');
  console.log('╚══════════════════════════════════════════════╝');

  if (!fs.existsSync(INPUT_ROOT)) {
    console.error(`\n✗ Input folder '${INPUT_ROOT}' not found.`);
    console.error('  Create it and drop your Flow outputs in:');
    console.error('  flow_output/{hunter}/{state}/*.png');
    process.exit(1);
  }

  let grandTotal = 0;

  for (const hunter of HUNTERS) {
    const hunterInput = path.join(INPUT_ROOT, hunter);
    if (!fs.existsSync(hunterInput)) {
      console.log(`\n— ${hunter.toUpperCase()}: no input folder found, skipping`);
      continue;
    }
    const total = await processHunter(hunter);
    grandTotal += total;

    if (PACK_ATLAS) {
      packAtlas(hunter);
    }
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  ALL DONE — ${grandTotal} total frames keyed across all hunters`);
  if (PACK_ATLAS) {
    console.log('  Atlas files written to assets/hunters/{hunter}/atlas.png + .json');
  } else {
    console.log('  Tip: set PACK_ATLAS = true to auto-pack atlases after keying');
  }
  console.log('═'.repeat(50) + '\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
