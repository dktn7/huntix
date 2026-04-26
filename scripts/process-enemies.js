const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { packAsync } = require('free-tex-packer-core');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'experiments', 'fal-image', 'enemy-gen-config.json');
const ENEMY_ROOT = path.join(ROOT, 'assets', 'sprites', 'enemies');
const PROCESSED_ROOT = path.join(ENEMY_ROOT, 'processed');
const PACKED_ROOT = path.join(ENEMY_ROOT, 'packed');

const CHROMA = { r: 0, g: 255, b: 0 };
const CHROMA_TOLERANCE = 50;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function clearDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const entry of fs.readdirSync(dirPath)) {
    const full = path.join(dirPath, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      fs.rmSync(full, { recursive: true, force: true });
    } else {
      fs.rmSync(full, { force: true });
    }
  }
}

function buildEntries(config) {
  const entries = [];
  for (const enemy of config.enemies || []) {
    for (const variant of enemy.variants || []) {
      for (const state of enemy.states || []) {
        entries.push({
          enemyId: enemy.id,
          folder: variant.folder,
          stateId: state.id,
          frameCount: Number(state.frames),
          targetSize: config.archetype_sizes?.[enemy.id] || { width: 192, height: 192 },
        });
      }
    }
  }
  return entries;
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
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist <= CHROMA_TOLERANCE) {
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
  const width = Number(targetSize.width) || 192;
  const height = Number(targetSize.height) || 192;

  let pipeline = sharp(buffer).ensureAlpha();
  try {
    pipeline = pipeline.trim();
  } catch (_err) {
    // Keep frame as-is when trim cannot find a bound.
  }

  return pipeline
    .resize(width, height, {
      fit: 'contain',
      position: 'south',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.nearest,
    })
    .png()
    .toBuffer();
}

async function processState(entry, packedFrames, folderOutDir) {
  const stripPath = path.join(ENEMY_ROOT, entry.folder, `${entry.stateId}-strip.png`);
  if (!fs.existsSync(stripPath)) {
    return { ok: false, reason: `missing strip ${stripPath}` };
  }

  const meta = await sharp(stripPath).metadata();
  if (!meta.width || !meta.height) {
    return { ok: false, reason: `invalid strip metadata ${stripPath}` };
  }

  if (meta.width % entry.frameCount !== 0) {
    return {
      ok: false,
      reason: `strip width ${meta.width} not divisible by frame count ${entry.frameCount} for ${stripPath}`,
    };
  }

  const frameWidth = Math.floor(meta.width / entry.frameCount);
  const frameHeight = meta.height;

  for (let i = 0; i < entry.frameCount; i += 1) {
    const extracted = await sharp(stripPath)
      .extract({ left: i * frameWidth, top: 0, width: frameWidth, height: frameHeight })
      .png()
      .toBuffer();

    const keyed = await applyChromaKey(extracted);
    const normalized = await normalizeFrame(keyed, entry.targetSize);
    const frameName = `${entry.stateId}_${i}.png`;
    const framePath = path.join(folderOutDir, frameName);

    fs.writeFileSync(framePath, normalized);
    packedFrames.push({ path: frameName, contents: normalized });
  }

  return { ok: true, stripPath };
}

async function packFolder(folderName, packedFrames) {
  const outDir = path.join(PACKED_ROOT, folderName);
  ensureDir(outDir);

  for (const fileName of fs.readdirSync(outDir)) {
    if (fileName.startsWith(`${folderName}-atlas`)) {
      fs.rmSync(path.join(outDir, fileName), { force: true });
    }
  }

  const options = {
    textureName: `${folderName}-atlas`,
    width: 2048,
    height: 2048,
    padding: 2,
    extrude: 1,
    allowTrim: true,
    exporter: 'PhaserHash',
  };

  const packed = await packAsync(packedFrames, options);
  for (const artifact of packed) {
    const outPath = path.join(outDir, artifact.name);
    const content = artifact.buffer || Buffer.from(artifact.content);
    if (artifact.name.endsWith('.png')) {
      const webpPath = outPath.replace(/\.png$/i, '.webp');
      await sharp(content).webp({ quality: 90 }).toFile(webpPath);
    } else {
      fs.writeFileSync(outPath, content);
    }
  }
}

async function processEnemies() {
  const config = readJson(CONFIG_PATH);
  const entries = buildEntries(config);

  const byFolder = new Map();
  for (const entry of entries) {
    if (!byFolder.has(entry.folder)) byFolder.set(entry.folder, []);
    byFolder.get(entry.folder).push(entry);
  }

  ensureDir(PROCESSED_ROOT);
  ensureDir(PACKED_ROOT);

  const failures = [];
  for (const [folderName, folderEntries] of byFolder.entries()) {
    const processedOutDir = path.join(PROCESSED_ROOT, folderName);
    ensureDir(processedOutDir);
    clearDir(processedOutDir);

    const packedFrames = [];
    console.log(`processing ${folderName} (${folderEntries.length} states)`);

    for (const entry of folderEntries) {
      const result = await processState(entry, packedFrames, processedOutDir);
      if (!result.ok) failures.push(`${folderName}/${entry.stateId}: ${result.reason}`);
    }

    if (failures.some(msg => msg.startsWith(`${folderName}/`))) {
      console.warn(`skipping atlas pack for ${folderName} because states failed`);
      continue;
    }

    await packFolder(folderName, packedFrames);
    console.log(`packed ${folderName} atlas with ${packedFrames.length} frames`);
  }

  if (failures.length > 0) {
    console.error('enemy processing failed:');
    for (const failure of failures) console.error(` - ${failure}`);
    process.exit(1);
  }

  console.log('enemy processing completed successfully');
}

processEnemies().catch((err) => {
  console.error(err);
  process.exit(1);
});
