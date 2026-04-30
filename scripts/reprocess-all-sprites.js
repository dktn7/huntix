const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { packAsync } = require('free-tex-packer-core');

const FLOW_OUTPUT = path.join('assets', 'flow-output');
const SPRITES_ROOT = path.join('assets', 'sprites');

// Standard animation states and frame counts (fallback if not in config)
const ANIMATION_CONFIG = {
  dabik: { idle: 6, run: 12, attack_light: 8, attack_heavy: 14, dodge: 14, hurt: 8, dead: 24, revive: 18 },
  benzu: { idle: 6, run: 12, attack_light: 8, attack_heavy: 14, dodge: 14, hurt: 8, dead: 24, revive: 18 },
  sereisa: { idle: 6, run: 12, attack_light: 8, attack_heavy: 14, dodge: 14, hurt: 8, dead: 24, revive: 18 },
  vesol: { idle: 6, run: 12, attack_light: 8, attack_heavy: 14, dodge: 14, hurt: 8, dead: 24, revive: 18 },
  grunt: { idle: 6, walk: 12, attack: 8, hurt: 3, dead: 8 },
  bruiser: { idle: 6, walk: 12, attack: 14, shove: 4, hurt: 3, dead: 8 },
  ranged: { idle: 6, walk: 12, attack: 8, retreat: 4, hurt: 3, dead: 8 },
  kibad: { idle: 6, telegraph: 4, blink_exit: 3, blink_enter: 3, combo: 8, clone: 4, recover: 4, hurt: 3, dead: 8 }
};

const TARGET_SIZE = 256;
const CHROMA_GREEN = { r: 0, g: 255, b: 0 };
const CHROMA_TOLERANCE = 100; // Increased for better removal

async function applyChromaKey(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Efficient green removal
    const isGreen = g > 150 && g > r * 1.4 && g > b * 1.4;
    if (isGreen) {
      data[i + 3] = 0;
    } else {
      // Color spill removal (neutralize greenish tint on edges)
      const spill = Math.max(0, g - Math.max(r, b)) * 0.8;
      if (spill > 5) {
          data[i + 1] -= Math.round(spill);
      }
    }
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function normalizeFrame(buffer) {
  // Center and pad to TARGET_SIZE
  return sharp(buffer)
    .trim() // Remove extra transparency
    .resize(TARGET_SIZE, TARGET_SIZE, {
      fit: 'contain',
      position: 'south', // Anchored at feet
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();
}

async function processSheet(inputPath, state, character) {
  const keyed = await applyChromaKey(fs.readFileSync(inputPath));
  const meta = await sharp(keyed).metadata();
  
  // Detection logic: usually generated as 2x4 for 8 frames
  // or a horizontal strip
  let cols, rows;
  if (meta.width > meta.height * 1.5) {
      // Likely horizontal strip
      cols = 8; rows = 1;
  } else {
      // Likely grid
      cols = 2; rows = 4;
  }
  
  const cellW = Math.floor(meta.width / cols);
  const cellH = Math.floor(meta.height / rows);
  const frames = [];
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const extracted = await sharp(keyed)
        .extract({ left: c * cellW, top: r * cellH, width: cellW, height: cellH })
        .toBuffer();
      
      // Check if frame is mostly empty
      const stats = await sharp(extracted).stats();
      if (stats.channels[3].mean > 2) { // Has some content
          frames.push(await normalizeFrame(extracted));
      }
    }
  }
  return frames;
}

async function reprocessCharacter(character) {
  console.log(`\n--- Processing ${character} ---`);
  const inputDir = path.join(FLOW_OUTPUT, character);
  if (!fs.existsSync(inputDir)) return;
  
  const outputRoot = character === 'kibad' ? 'bosses' : (ANIMATION_CONFIG[character] ? 'hunters' : 'enemies');
  // Wait, I should verify the type. 
  // Character categories:
  const hunters = ['dabik', 'benzu', 'sereisa', 'vesol'];
  const bosses = ['kibad', 'thyxis', 'vrael', 'zarth'];
  const enemies = ['grunt', 'bruiser', 'ranged', 'grunt-zone-variant', 'bruiser-zone-variant', 'ranged-zone-variant'];
  
  let category = 'enemies';
  if (hunters.includes(character)) category = 'hunters';
  else if (bosses.includes(character)) category = 'bosses';
  
  const outputDir = path.join(SPRITES_ROOT, category, character);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.png'));
  const allStateFrames = {};

  for (const file of files) {
    // Detect state from filename
    // Format: character-state_timestamp.jpeg or character-state-index_timestamp.jpeg
    const match = file.toLowerCase().match(new RegExp(`^${character}-?([a-z_0-9]+)`));
    let state = match ? match[1] : 'idle';
    
    // Clean state name (remove trailing numbers/indices)
    state = state.replace(/_?\d+$/, '').replace(/-?\d+$/, '');
    
    console.log(`  Slicing ${file} as state: ${state}`);
    const frames = await processSheet(path.join(inputDir, file), state, character);
    
    if (!allStateFrames[state]) allStateFrames[state] = [];
    allStateFrames[state].push(...frames);
  }

  const packedFrames = [];
  for (const [state, frames] of Object.entries(allStateFrames)) {
    const targetCount = (ANIMATION_CONFIG[character] && ANIMATION_CONFIG[character][state]) || frames.length;
    console.log(`    State '${state}': ${frames.length} frames found, targeting ${targetCount}`);
    
    // Select frames (simple sampling)
    for (let i = 0; i < Math.min(frames.length, targetCount * 2); i++) {
        const frameName = `${state}_${String(i).padStart(2, '0')}.png`;
        const framePath = path.join(outputDir, frameName);
        fs.writeFileSync(framePath, frames[i]);
        packedFrames.push({ path: frameName, contents: frames[i] });
    }
  }

  // Pack atlas
  if (packedFrames.length > 0) {
      console.log(`  Packing ${packedFrames.length} frames into atlas...`);
      const options = {
        textureName: `${character}-atlas`,
        width: 4096,
        height: 4096,
        fixedSize: false,
        padding: 2,
        removeFileExtension: true,
        exporter: 'PhaserHash'
      };
      
      const packed = await packAsync(packedFrames, options);
      for (const item of packed) {
          const outPath = path.join(SPRITES_ROOT, category, item.name);
          fs.writeFileSync(outPath, item.buffer);
          if (item.name.endsWith('.json')) {
              console.log(`    Created ${item.name}`);
          }
      }
  }
}

async function run() {
  const characters = [
    'dabik', 'benzu', 'sereisa', 'vesol',
    'kibad', 'grunt', 'bruiser', 'ranged',
    'grunt-zone-variant', 'bruiser-zone-variant', 'ranged-zone-variant'
  ];
  
  for (const char of characters) {
    try {
        await reprocessCharacter(char);
    } catch (e) {
        console.error(`Error processing ${char}:`, e);
    }
  }
}

run();
