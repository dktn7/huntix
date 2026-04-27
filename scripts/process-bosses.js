const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { packAsync } = require('free-tex-packer-core');

const ROOT = path.resolve(__dirname, '..');
const BOSS_ROOT = path.join(ROOT, 'assets', 'sprites', 'bosses');
const PROCESSED_ROOT = path.join(BOSS_ROOT, 'processed');

const CHROMA = { r: 0, g: 255, b: 0 };
const CHROMA_TOLERANCE = 50;

const BOSS_CONFIGS = [
  {
    id: 'vrael',
    targetSize: { width: 320, height: 320 },
    sources: [
      { state: 'idle', kind: 'sequence', dir: 'vrael/individual sprites/01_demon_idle' },
      { state: 'walk', kind: 'sequence', dir: 'vrael/individual sprites/02_demon_walk' },
      { state: 'attack', kind: 'sequence', dir: 'vrael/individual sprites/03_demon_cleave' },
      { state: 'hurt', kind: 'sequence', dir: 'vrael/individual sprites/04_demon_take_hit' },
      { state: 'dead', kind: 'sequence', dir: 'vrael/individual sprites/05_demon_death' },
    ],
  },
  {
    id: 'zarth',
    targetSize: { width: 320, height: 320 },
    sources: [
      { state: 'idle', kind: 'gridRow', file: 'zarth/PNG sheet/Character_sheet.png', cols: 5, rows: 5, row: 0, startCol: 0, count: 4 },
      { state: 'walk', kind: 'gridRow', file: 'zarth/PNG sheet/Character_sheet.png', cols: 5, rows: 5, row: 1, startCol: 0, count: 5 },
      { state: 'attack', kind: 'gridRow', file: 'zarth/PNG sheet/Character_sheet.png', cols: 5, rows: 5, row: 2, startCol: 0, count: 4 },
      { state: 'hurt', kind: 'gridRow', file: 'zarth/PNG sheet/Character_sheet.png', cols: 5, rows: 5, row: 3, startCol: 0, count: 5 },
      { state: 'dead', kind: 'gridRow', file: 'zarth/PNG sheet/Character_sheet.png', cols: 5, rows: 5, row: 4, startCol: 0, count: 2 },
    ],
  },
  {
    id: 'thyxis',
    targetSize: { width: 320, height: 320 },
    sources: [
      { state: 'idle', kind: 'strip', file: 'thyxis-p1/Red_Werewolf/Idle.png' },
      { state: 'walk', kind: 'strip', file: 'thyxis-p1/Red_Werewolf/Walk.png' },
      { state: 'run', kind: 'strip', file: 'thyxis-p1/Red_Werewolf/Run.png' },
      { state: 'telegraph', kind: 'strip', file: 'thyxis-p1/Red_Werewolf/Run+Attack.png' },
      { state: 'attack', kind: 'strip', file: 'thyxis-p1/Red_Werewolf/Attack_1.png' },
      { state: 'attack', kind: 'strip', file: 'thyxis-p1/Red_Werewolf/Attack_2.png' },
      { state: 'attack', kind: 'strip', file: 'thyxis-p1/Red_Werewolf/Attack_3.png' },
      { state: 'hurt', kind: 'strip', file: 'thyxis-p1/Red_Werewolf/Hurt.png' },
      { state: 'dead', kind: 'strip', file: 'thyxis-p1/Red_Werewolf/Dead.png' },
      { state: 'phase3', kind: 'single', file: 'thyxis-p3/were17.png' },
    ],
  },
  {
    id: 'kibad',
    targetSize: { width: 320, height: 320 },
    sources: [],
    placeholderColor: '#f6f6ff',
  },
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function clearDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const entry of fs.readdirSync(dirPath)) {
    const full = path.join(dirPath, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) fs.rmSync(full, { recursive: true, force: true });
    else fs.rmSync(full, { force: true });
  }
}

function numericAwareSort(a, b) {
  const an = trailingNumber(a);
  const bn = trailingNumber(b);
  if (an !== null && bn !== null && an !== bn) return an - bn;
  return a.localeCompare(b);
}

function trailingNumber(value) {
  const match = String(value).match(/(\d+)(?!.*\d)/);
  if (!match) return null;
  const num = Number.parseInt(match[1], 10);
  return Number.isFinite(num) ? num : null;
}

async function applyChromaKey(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - CHROMA.r;
    const dg = data[i + 1] - CHROMA.g;
    const db = data[i + 2] - CHROMA.b;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);
    if (distance <= CHROMA_TOLERANCE) {
      data[i + 3] = 0;
    } else if (data[i + 1] > data[i] && data[i + 1] > data[i + 2]) {
      data[i + 1] = Math.floor((data[i] + data[i + 2]) / 2);
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  }).png().toBuffer();
}

async function normalizeFrame(buffer, targetSize) {
  let pipeline = sharp(buffer).ensureAlpha();
  try {
    pipeline = pipeline.trim();
  } catch {
    // Keep original bounds when trim cannot resolve a non-empty area.
  }

  return pipeline
    .resize(targetSize.width, targetSize.height, {
      fit: 'contain',
      position: 'south',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.nearest,
    })
    .png()
    .toBuffer();
}

async function hasVisiblePixels(buffer) {
  const { data } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let nonTransparent = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 8) nonTransparent += 1;
    if (nonTransparent > 80) return true;
  }
  return false;
}

async function processFrameBuffer(buffer, targetSize) {
  const keyed = await applyChromaKey(buffer);
  return normalizeFrame(keyed, targetSize);
}

async function collectFramesForSource(source, targetSize) {
  if (source.kind === 'sequence') return collectSequenceFrames(source, targetSize);
  if (source.kind === 'strip') return collectStripFrames(source, targetSize);
  if (source.kind === 'gridRow') return collectGridRowFrames(source, targetSize);
  if (source.kind === 'single') return collectSingleFrame(source, targetSize);
  return [];
}

async function collectSequenceFrames(source, targetSize) {
  const dirPath = path.join(BOSS_ROOT, source.dir);
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath)
    .filter((name) => name.toLowerCase().endsWith('.png'))
    .sort(numericAwareSort);

  const frames = [];
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const buffer = fs.readFileSync(fullPath);
    const frame = await processFrameBuffer(buffer, targetSize);
    if (await hasVisiblePixels(frame)) frames.push(frame);
  }
  return frames;
}

async function collectStripFrames(source, targetSize) {
  const filePath = path.join(BOSS_ROOT, source.file);
  if (!fs.existsSync(filePath)) return [];

  const meta = await sharp(filePath).metadata();
  if (!meta.width || !meta.height) return [];

  const frameCount = source.frames || Math.max(1, Math.round(meta.width / meta.height));
  const frameWidth = Math.max(1, Math.floor(meta.width / frameCount));
  const frameHeight = meta.height;

  const frames = [];
  for (let i = 0; i < frameCount; i += 1) {
    const left = i * frameWidth;
    if (left + frameWidth > meta.width) break;
    const extracted = await sharp(filePath)
      .extract({ left, top: 0, width: frameWidth, height: frameHeight })
      .png()
      .toBuffer();
    const frame = await processFrameBuffer(extracted, targetSize);
    if (await hasVisiblePixels(frame)) frames.push(frame);
  }
  return frames;
}

async function collectGridRowFrames(source, targetSize) {
  const filePath = path.join(BOSS_ROOT, source.file);
  if (!fs.existsSync(filePath)) return [];

  const meta = await sharp(filePath).metadata();
  if (!meta.width || !meta.height) return [];
  const cols = source.cols || 1;
  const rows = source.rows || 1;
  const cellWidth = Math.floor(meta.width / cols);
  const cellHeight = Math.floor(meta.height / rows);
  const row = source.row || 0;
  const startCol = source.startCol || 0;
  const count = source.count || cols;

  const frames = [];
  for (let i = 0; i < count; i += 1) {
    const col = startCol + i;
    if (col >= cols) break;
    const left = col * cellWidth;
    const top = row * cellHeight;
    const extracted = await sharp(filePath)
      .extract({ left, top, width: cellWidth, height: cellHeight })
      .png()
      .toBuffer();
    const frame = await processFrameBuffer(extracted, targetSize);
    if (await hasVisiblePixels(frame)) frames.push(frame);
  }
  return frames;
}

async function collectSingleFrame(source, targetSize) {
  const filePath = path.join(BOSS_ROOT, source.file);
  if (!fs.existsSync(filePath)) return [];
  const buffer = fs.readFileSync(filePath);
  const frame = await processFrameBuffer(buffer, targetSize);
  return (await hasVisiblePixels(frame)) ? [frame] : [];
}

async function createPlaceholderFrame(targetSize, colorHex = '#ffffff') {
  const width = targetSize.width;
  const height = targetSize.height;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"/>
  <ellipse cx="${Math.round(width / 2)}" cy="${Math.round(height * 0.84)}" rx="${Math.round(width * 0.22)}" ry="${Math.round(height * 0.08)}" fill="rgba(0,0,0,0.36)"/>
  <path d="M ${Math.round(width * 0.5)} ${Math.round(height * 0.15)} L ${Math.round(width * 0.66)} ${Math.round(height * 0.48)} L ${Math.round(width * 0.58)} ${Math.round(height * 0.82)} L ${Math.round(width * 0.42)} ${Math.round(height * 0.82)} L ${Math.round(width * 0.34)} ${Math.round(height * 0.48)} Z" fill="${colorHex}"/>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function packBossAtlas(bossId, packedFrames) {
  const options = {
    textureName: `${bossId}-atlas`,
    width: 2048,
    height: 2048,
    padding: 2,
    extrude: 1,
    allowTrim: true,
    exporter: 'PhaserHash',
  };

  const packed = await packAsync(packedFrames, options);
  const jsonPath = path.join(BOSS_ROOT, `${bossId}-atlas.json`);
  const webpPath = path.join(BOSS_ROOT, `${bossId}-atlas.webp`);
  fs.rmSync(jsonPath, { force: true });
  fs.rmSync(webpPath, { force: true });

  for (const artifact of packed) {
    const content = artifact.buffer || Buffer.from(artifact.content);
    if (artifact.name.endsWith('.json')) {
      fs.writeFileSync(jsonPath, content);
    } else if (artifact.name.endsWith('.png')) {
      await sharp(content).webp({ quality: 90 }).toFile(webpPath);
    }
  }

  return {
    json: fs.existsSync(jsonPath),
    webp: fs.existsSync(webpPath),
  };
}

async function processBosses() {
  ensureDir(PROCESSED_ROOT);
  const manifest = {
    generated_at: new Date().toISOString(),
    atlases: {},
    details: {},
  };

  for (const config of BOSS_CONFIGS) {
    const outDir = path.join(PROCESSED_ROOT, config.id);
    ensureDir(outDir);
    clearDir(outDir);

    const packedFrames = [];
    const stateCounts = {};
    let placeholder = false;
    let stateCursor = 0;

    for (const source of config.sources) {
      const frames = await collectFramesForSource(source, config.targetSize);
      if (!frames.length) continue;

      if (!stateCounts[source.state]) stateCounts[source.state] = 0;
      for (const frame of frames) {
        const index = stateCounts[source.state];
        stateCounts[source.state] += 1;
        const frameName = `${source.state}_${String(index).padStart(2, '0')}.png`;
        fs.writeFileSync(path.join(outDir, frameName), frame);
        packedFrames.push({ path: frameName, contents: frame });
        stateCursor += 1;
      }
    }

    if (!packedFrames.length) {
      placeholder = true;
      const fallback = await createPlaceholderFrame(config.targetSize, config.placeholderColor || '#ffffff');
      const frameName = 'idle_00.png';
      fs.writeFileSync(path.join(outDir, frameName), fallback);
      packedFrames.push({ path: frameName, contents: fallback });
      stateCounts.idle = 1;
      stateCursor = 1;
    }

    let atlasStatus = { json: false, webp: false };
    try {
      atlasStatus = await packBossAtlas(config.id, packedFrames);
      manifest.atlases[config.id] = atlasStatus.json && atlasStatus.webp;
      console.log(`packed ${config.id} atlas with ${stateCursor} frame(s)`);
    } catch (error) {
      manifest.atlases[config.id] = false;
      console.error(`failed to pack ${config.id}: ${error.message}`);
    }

    manifest.details[config.id] = {
      frame_count: stateCursor,
      states: stateCounts,
      placeholder,
      atlas_json: atlasStatus.json,
      atlas_webp: atlasStatus.webp,
    };
  }

  fs.writeFileSync(path.join(BOSS_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const failures = Object.entries(manifest.atlases).filter(([, ok]) => ok !== true);
  if (failures.length) {
    console.warn(`boss processing completed with ${failures.length} incomplete atlas(es)`);
  } else {
    console.log('boss processing completed successfully');
  }
}

processBosses().catch((error) => {
  console.error(error);
  process.exit(1);
});
