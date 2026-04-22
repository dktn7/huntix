#!/usr/bin/env node
/**
 * Huntix Sprite Pipeline — Green Screen Keyer + Grid Splitter + TexturePacker Automation
 *
 * NORMAL MODE:
 *   node process_sprites.js
 *   Processes all hunters in flow_output/ — keys green screen, saves frames.
 *
 * GRID SPLIT MODE:
 *   node process_sprites.js --split <hunter> <state> <image> <cols> <rows>
 *
 *   Examples:
 *     node process_sprites.js --split dabik jump sheet.png 6 2
 *     node process_sprites.js --split vesol run vesol_run.jpg 6 2
 *     node process_sprites.js --split benzu dodge benzu_dodge.png 4 3
 *
 *   - Splits the image into cols×rows frames
 *   - Keys the green screen on each frame
 *   - Saves frames to flow_output/{hunter}/{state}/frame_0001.webp etc.
 *   - Ready to process with normal mode immediately after
 *
 * SIMPLE MODE (recommended for normal mode):
 *   Dump all Flow outputs for a hunter into one flat folder.
 *   The script reads the state name from the filename automatically.
 *
 *   flow_output/
 *     dabik/    ← e.g. dabik_idle_001.png, run_02.jpg, attack_light.png
 *     benzu/
 *     sereisa/
 *     vesol/
 *
 * ORGANISED MODE (also works):
 *   Pre-sort into state subfolders if you prefer:
 *   flow_output/dabik/idle/, flow_output/dabik/run/, etc.
 *
 * Files MUST contain the state name somewhere in the filename, e.g.:
 *   dabik_idle_001.png  |  idle_01.png  |  IDLE.PNG  |  attack_light_frame3.jpg
 *
 * Output location (matches RENDERING.md spec exactly):
 *   assets/sprites/hunters/{hunter}/{state}/{state}_0001.webp
 *
 * Atlas output (matches RENDERING.md spec exactly):
 *   assets/sprites/hunters/{hunter}-atlas.webp
 *   assets/sprites/hunters/{hunter}-atlas.json
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

const INPUT_ROOT  = path.resolve('flow_output');
const OUTPUT_ROOT = path.resolve('assets/sprites/hunters'); // matches RENDERING.md

const HUNTERS = ['dabik', 'benzu', 'sereisa', 'vesol'];

const STATES = [
  'idle',
  'run',
  'jump',
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
// Lower = stricter. Increase to 60 if edges still look green after keying.
const THRESHOLD = 40;

// Set to true if TexturePacker CLI is installed and on your PATH.
// https://www.codeandweb.com/texturepacker
const PACK_ATLAS = false;

// Must match what SpriteAnimator.js expects. json-array is the default.
const ATLAS_FORMAT = 'json-array';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

// ─── STATE DETECTION ─────────────────────────────────────────────────────────

// Sort longest first so 'attack_light' matches before 'attack', 'downed' before 'dead'
const STATES_BY_LENGTH = [...STATES].sort((a, b) => b.length - a.length);

function detectState(filename) {
  const lower = filename.toLowerCase();
  for (const state of STATES_BY_LENGTH) {
    if (lower.includes(state)) return state;
  }
  return null;
}

function groupFilesByState(hunterDir) {
  const groups = {};
  for (const state of STATES) groups[state] = [];

  const entries = fs.readdirSync(hunterDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(hunterDir, entry.name);

    if (entry.isDirectory()) {
      const folderState = STATES.includes(entry.name) ? entry.name : detectState(entry.name);
      if (!folderState) {
        console.log(`  — Subfolder '${entry.name}' doesn't match any state, skipping`);
        continue;
      }
      const subFiles = fs.readdirSync(fullPath)
        .filter(f => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
        .sort()
        .map(f => path.join(fullPath, f));
      groups[folderState].push(...subFiles);

    } else if (entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      const state = detectState(entry.name);
      if (state) {
        groups[state].push(fullPath);
      } else {
        console.log(`  ⚠ '${entry.name}' — no state name found in filename, skipping`);
        console.log(`    Rename to include the state, e.g. idle_${entry.name}`);
      }
    }
  }

  for (const state of STATES) groups[state].sort();
  return groups;
}

// ─── GREEN KEY ───────────────────────────────────────────────────────────────

async function keyGreenScreen(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const buf = Buffer.from(data);

  for (let i = 0; i < buf.length; i += channels) {
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    const gap = g - 200;
    if (g > 200 && r < THRESHOLD + gap && b < THRESHOLD + gap) {
      buf[i + 3] = 0;
    }
  }

  // Output as WebP with alpha — matches RENDERING.md sprite atlas format
  await sharp(buf, { raw: { width, height, channels } })
    .webp({ lossless: true })
    .toFile(outputPath);
}

async function keyGreenScreenFromBuffer(buf, width, height, channels, outputPath) {
  const out = Buffer.from(buf);
  for (let i = 0; i < out.length; i += channels) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const gap = g - 200;
    if (g > 200 && r < THRESHOLD + gap && b < THRESHOLD + gap) {
      out[i + 3] = 0;
    }
  }
  await sharp(out, { raw: { width, height, channels } })
    .webp({ lossless: true })
    .toFile(outputPath);
}

// ─── GRID SPLITTER ───────────────────────────────────────────────────────────

async function splitGrid(hunter, state, imagePath, cols, rows) {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   HUNTIX SPRITE PIPELINE — GRID SPLITTER     ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  const resolvedImage = path.resolve(imagePath);

  if (!fs.existsSync(resolvedImage)) {
    console.error(`✗ Image not found: ${resolvedImage}`);
    process.exit(1);
  }

  if (!HUNTERS.includes(hunter)) {
    console.error(`✗ Unknown hunter '${hunter}'. Valid: ${HUNTERS.join(', ')}`);
    process.exit(1);
  }

  if (!STATES.includes(state)) {
    console.error(`✗ Unknown state '${state}'. Valid: ${STATES.join(', ')}`);
    process.exit(1);
  }

  const totalFrames = cols * rows;
  console.log(`  Hunter  : ${hunter}`);
  console.log(`  State   : ${state}`);
  console.log(`  Image   : ${resolvedImage}`);
  console.log(`  Grid    : ${cols} cols × ${rows} rows = ${totalFrames} frames`);

  const outputDir = path.join(INPUT_ROOT, hunter, state);
  ensureDir(outputDir);
  console.log(`  Output  : ${outputDir}\n`);

  const { data, info } = await sharp(resolvedImage)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const frameW = Math.floor(width / cols);
  const frameH = Math.floor(height / rows);

  console.log(`  Sheet size : ${width}×${height}px`);
  console.log(`  Frame size : ${frameW}×${frameH}px\n`);

  let count = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const frameIndex = row * cols + col + 1;
      const frameNum = String(frameIndex).padStart(4, '0');
      const outputPath = path.join(outputDir, `frame_${frameNum}.webp`);

      // Extract frame pixels from the raw buffer
      const frameBuf = Buffer.alloc(frameW * frameH * channels);
      for (let y = 0; y < frameH; y++) {
        const srcY = row * frameH + y;
        for (let x = 0; x < frameW; x++) {
          const srcX = col * frameW + x;
          const srcOffset = (srcY * width + srcX) * channels;
          const dstOffset = (y * frameW + x) * channels;
          data.copy(frameBuf, dstOffset, srcOffset, srcOffset + channels);
        }
      }

      await keyGreenScreenFromBuffer(frameBuf, frameW, frameH, channels, outputPath);
      console.log(`  ✓ Frame ${frameNum} (row ${row + 1}, col ${col + 1}) → ${path.basename(outputPath)}`);
      count++;
    }
  }

  console.log(`\n  ✓ ${count} frames saved to flow_output/${hunter}/${state}/`);
  console.log(`\n  Next step — run normal mode to process into assets/:`);
  console.log(`    node process_sprites.js\n`);
}

// ─── PROCESSING ───────────────────────────────────────────────────────────────

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function processHunter(hunter) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  HUNTER: ${hunter.toUpperCase()}`);
  console.log('─'.repeat(50));

  const hunterDir = path.join(INPUT_ROOT, hunter);
  const groups = groupFilesByState(hunterDir);
  let total = 0;

  for (const state of STATES) {
    const files = groups[state];

    if (files.length === 0) {
      console.log(`  — ${state.padEnd(20)} (no files found)`);
      continue;
    }

    const outputDir = path.join(OUTPUT_ROOT, hunter, state);
    ensureDir(outputDir);

    console.log(`  Processing: ${state} (${files.length} file(s))`);

    let count = 0;
    for (let i = 0; i < files.length; i++) {
      const inputPath = files[i];
      const frameNum = String(i + 1).padStart(4, '0');
      const outputPath = path.join(outputDir, `${state}_${frameNum}.webp`);
      try {
        await keyGreenScreen(inputPath, outputPath);
        console.log(`  ✓ ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
        count++;
      } catch (err) {
        console.error(`  ✗ ${path.basename(inputPath)} — ERROR: ${err.message}`);
      }
    }

    console.log(`  → ${count} frame(s) → assets/sprites/hunters/${hunter}/${state}/`);
    total += count;
  }

  console.log(`\n  ${hunter.toUpperCase()} done — ${total} total frames processed`);
  return total;
}

// ─── TEXTUREPACKER ───────────────────────────────────────────────────────────

function packAtlas(hunter) {
  const hunterDir = path.join(OUTPUT_ROOT, hunter);
  // Atlas naming matches RENDERING.md: {hunter}-atlas.webp + {hunter}-atlas.json
  const sheetPath = path.join(OUTPUT_ROOT, `${hunter}-atlas.webp`);
  const dataPath  = path.join(OUTPUT_ROOT, `${hunter}-atlas.json`);

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
    console.log(`  ✓ ${hunter}-atlas.webp → assets/sprites/hunters/`);
    console.log(`  ✓ ${hunter}-atlas.json → assets/sprites/hunters/`);
  } catch (err) {
    console.error('  ✗ TexturePacker error — is it installed and on your PATH?');
    console.error('    https://www.codeandweb.com/texturepacker');
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // GRID SPLIT MODE: node process_sprites.js --split <hunter> <state> <image> <cols> <rows>
  if (args[0] === '--split') {
    const [, hunter, state, imagePath, colsStr, rowsStr] = args;

    if (!hunter || !state || !imagePath || !colsStr || !rowsStr) {
      console.error('Usage: node process_sprites.js --split <hunter> <state> <image> <cols> <rows>');
      console.error('Example: node process_sprites.js --split dabik jump sheet.png 6 2');
      process.exit(1);
    }

    const cols = parseInt(colsStr, 10);
    const rows = parseInt(rowsStr, 10);

    if (isNaN(cols) || isNaN(rows) || cols < 1 || rows < 1) {
      console.error(`✗ cols and rows must be positive integers. Got: cols=${colsStr} rows=${rowsStr}`);
      process.exit(1);
    }

    await splitGrid(hunter, state, imagePath, cols, rows);
    return;
  }

  // NORMAL MODE
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   HUNTIX SPRITE PIPELINE                     ║');
  console.log('║   Green Screen Keyer + TexturePacker          ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('  Output format : WebP (lossless, transparent)');
  console.log('  Output path   : assets/sprites/hunters/');
  console.log('  Atlas naming  : {hunter}-atlas.webp + {hunter}-atlas.json');
  console.log('');
  console.log('  Files sorted by state name in filename.');
  console.log('  e.g. dabik_idle_001.png  run_02.jpg  attack_light.png');
  console.log('');
  console.log('  TIP: Got a grid sheet? Split it first:');
  console.log('  node process_sprites.js --split dabik jump sheet.png 6 2');

  if (!fs.existsSync(INPUT_ROOT)) {
    console.error(`\n✗ Input folder '${INPUT_ROOT}' not found.`);
    console.error('  Create flow_output/ at the repo root.');
    console.error('  Drop Flow outputs into flow_output/{hunter}/');
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
    if (PACK_ATLAS) packAtlas(hunter);
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  ALL DONE — ${grandTotal} total frames keyed`);
  if (PACK_ATLAS) {
    console.log('  Atlases → assets/sprites/hunters/{hunter}-atlas.webp + .json');
  } else {
    console.log('  Tip: set PACK_ATLAS = true to auto-pack atlases after keying');
  }
  console.log('═'.repeat(50) + '\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
