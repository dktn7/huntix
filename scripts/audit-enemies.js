const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'experiments', 'fal-image', 'enemy-gen-config.json');
const ENEMY_ROOT = path.join(ROOT, 'assets', 'sprites', 'enemies');
const PROCESSED_ROOT = path.join(ENEMY_ROOT, 'processed');
const PACKED_ROOT = path.join(ENEMY_ROOT, 'packed');
const MANIFEST_PATH = path.join(ENEMY_ROOT, 'manifest.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
        });
      }
    }
  }
  return entries;
}

function hasEqualSpacing(width, frameCount) {
  return Number.isInteger(width / frameCount);
}

async function frameHasAlpha(filePath) {
  const { data } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) return true;
  }
  return false;
}

async function auditFolder(folderName, folderEntries) {
  const expectedKeys = [];
  const stripChecks = [];
  const processedChecks = [];
  let folderPass = true;

  for (const entry of folderEntries) {
    const stripPath = path.join(ENEMY_ROOT, folderName, `${entry.stateId}-strip.png`);
    const stripExists = fs.existsSync(stripPath);
    let dimensions = null;
    let spacingOk = false;

    if (stripExists) {
      const meta = await sharp(stripPath).metadata();
      dimensions = { width: meta.width || 0, height: meta.height || 0 };
      spacingOk = !!meta.width && hasEqualSpacing(meta.width, entry.frameCount);
    }

    if (!stripExists || !spacingOk) folderPass = false;

    stripChecks.push({
      state: entry.stateId,
      frames_expected: entry.frameCount,
      strip_path: path.relative(ROOT, stripPath).replace(/\\/g, '/'),
      strip_exists: stripExists,
      dimensions,
      equal_spacing: spacingOk,
    });

    for (let i = 0; i < entry.frameCount; i += 1) {
      const key = `${entry.stateId}_${i}.png`;
      expectedKeys.push(key);
      const framePath = path.join(PROCESSED_ROOT, folderName, key);
      const exists = fs.existsSync(framePath);
      let alphaOk = false;
      if (exists) alphaOk = await frameHasAlpha(framePath);
      if (!exists || !alphaOk) folderPass = false;
      processedChecks.push({
        frame: key,
        exists,
        alpha_non_empty: alphaOk,
      });
    }
  }

  const atlasJsonPath = path.join(PACKED_ROOT, folderName, `${folderName}-atlas.json`);
  const atlasWebpPath = path.join(PACKED_ROOT, folderName, `${folderName}-atlas.webp`);

  const atlasJsonExists = fs.existsSync(atlasJsonPath);
  const atlasWebpExists = fs.existsSync(atlasWebpPath);
  if (!atlasJsonExists || !atlasWebpExists) folderPass = false;

  let atlasFrameKeys = [];
  let atlasMissing = [];
  let atlasExtra = [];
  if (atlasJsonExists) {
    const atlas = readJson(atlasJsonPath);
    atlasFrameKeys = Object.keys(atlas.frames || {});
    const expectedSet = new Set(expectedKeys);
    const atlasSet = new Set(atlasFrameKeys);
    atlasMissing = expectedKeys.filter((k) => !atlasSet.has(k));
    atlasExtra = atlasFrameKeys.filter((k) => !expectedSet.has(k));
    if (atlasMissing.length || atlasExtra.length) folderPass = false;
  }

  return {
    folder: folderName,
    pass: folderPass,
    expected_frame_total: expectedKeys.length,
    strip_checks: stripChecks,
    processed_checks: processedChecks,
    atlas: {
      json_exists: atlasJsonExists,
      webp_exists: atlasWebpExists,
      atlas_frame_count: atlasFrameKeys.length,
      missing_in_atlas: atlasMissing,
      extra_in_atlas: atlasExtra,
    },
  };
}

async function runAudit() {
  const config = readJson(CONFIG_PATH);
  const entries = buildEntries(config);

  const byFolder = new Map();
  for (const entry of entries) {
    if (!byFolder.has(entry.folder)) byFolder.set(entry.folder, []);
    byFolder.get(entry.folder).push(entry);
  }

  const folderReports = [];
  let allPass = true;
  for (const [folder, folderEntries] of byFolder.entries()) {
    const report = await auditFolder(folder, folderEntries);
    folderReports.push(report);
    if (!report.pass) allPass = false;
  }

  const manifest = {
    generated_at: new Date().toISOString(),
    pass: allPass,
    folder_count: folderReports.length,
    folders: folderReports,
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  if (!allPass) {
    console.error('enemy audit failed');
    for (const folder of folderReports) {
      if (!folder.pass) console.error(` - ${folder.folder}`);
    }
    process.exit(1);
  }

  console.log('enemy audit passed');
}

runAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
