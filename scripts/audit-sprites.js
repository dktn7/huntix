const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const SPRITES_DIR = path.join('assets', 'sprites', 'hunters');
const HUNTERS = ['dabik', 'benzu', 'sereisa', 'vesol'];
const MAX_ANCHOR_DRIFT_PX = 1;
const MAX_SIZE_DRIFT_PX = 24;
const MAX_MATTE_ARTIFACT_RATIO = 0.5;

async function loadProfileModule() {
  const modulePath = path.resolve(__dirname, '..', 'src', 'gameplay', 'SpriteAnimationProfile.mjs');
  return import(pathToFileURL(modulePath).href);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function stripExt(name) {
  return String(name || '').replace(/\.[^/.]+$/, '');
}

function fail(message, details = null) {
  if (details) {
    console.error(`${message}\n${JSON.stringify(details, null, 2)}`);
  } else {
    console.error(message);
  }
  process.exitCode = 1;
}

async function main() {
  const profile = await loadProfileModule();
  const requiredStates = typeof profile.getRequiredPipelineStates === 'function'
    ? profile.getRequiredPipelineStates()
    : [];

  for (const hunter of HUNTERS) {
    const auditPath = path.join(SPRITES_DIR, `${hunter}-atlas-audit.json`);
    const atlasPath = path.join(SPRITES_DIR, `${hunter}-atlas.json`);
    if (!fs.existsSync(auditPath)) {
      fail(`[${hunter}] missing audit file`, { auditPath });
      continue;
    }
    if (!fs.existsSync(atlasPath)) {
      fail(`[${hunter}] missing atlas json`, { atlasPath });
      continue;
    }

    const audit = readJson(auditPath);
    const atlas = readJson(atlasPath);
    const atlasFrames = atlas?.frames && typeof atlas.frames === 'object'
      ? Object.keys(atlas.frames).map(stripExt)
      : [];

    const missingStates = Array.isArray(audit.missing_states) ? audit.missing_states : [];
    const countMismatches = Array.isArray(audit.count_mismatches) ? audit.count_mismatches : [];
    const regenStates = Array.isArray(audit.states_requiring_regeneration) ? audit.states_requiring_regeneration : [];
    const sourceToAtlas = audit.source_to_atlas || {};
    const missingInAtlas = Array.isArray(sourceToAtlas.missing_in_atlas) ? sourceToAtlas.missing_in_atlas : [];
    const extraInAtlas = Array.isArray(sourceToAtlas.extra_in_atlas) ? sourceToAtlas.extra_in_atlas : [];
    const anchorDrift = Number(audit.anchor_drift_px || 0);
    const sizeDrift = Number(audit.size_drift_px || 0);
    const matteRatio = Number(audit.matte_artifact_ratio || 0);
    const rotated = Array.isArray(audit.rotated_frames) ? audit.rotated_frames : [];
    const sizeViolations = Array.isArray(audit.size_policy_violations) ? audit.size_policy_violations : [];
    const frameOrderAnomalies = Array.isArray(audit.frame_order_anomalies) ? audit.frame_order_anomalies : [];
    const directionPanelMap = Array.isArray(audit.direction_panel_map) ? audit.direction_panel_map : [];

    if (missingStates.length) {
      fail(`[${hunter}] missing required states`, { missingStates, requiredStates });
    }
    if (countMismatches.length) {
      fail(`[${hunter}] frame count mismatches`, { countMismatches });
    }
    if (regenStates.length) {
      fail(`[${hunter}] states queued for regeneration`, { regenStates });
    }
    if (missingInAtlas.length || extraInAtlas.length) {
      fail(`[${hunter}] source/atlas reconciliation failed`, { missingInAtlas, extraInAtlas });
    }
    if (anchorDrift > MAX_ANCHOR_DRIFT_PX) {
      fail(`[${hunter}] anchor drift too high`, { anchorDrift, maxAllowed: MAX_ANCHOR_DRIFT_PX });
    }
    if (sizeDrift > MAX_SIZE_DRIFT_PX) {
      fail(`[${hunter}] size drift too high`, { sizeDrift, maxAllowed: MAX_SIZE_DRIFT_PX });
    }
    if (sizeViolations.length) {
      fail(`[${hunter}] size policy violations`, { count: sizeViolations.length, sample: sizeViolations.slice(0, 8) });
    }
    if (matteRatio > MAX_MATTE_ARTIFACT_RATIO) {
      fail(`[${hunter}] matte artifact ratio too high`, { matteRatio, maxAllowed: MAX_MATTE_ARTIFACT_RATIO });
    }
    if (rotated.length) {
      fail(`[${hunter}] rotated frames detected`, { rotated });
    }
    if (audit.packed_count !== atlasFrames.length) {
      fail(`[${hunter}] packed_count mismatch`, { auditPacked: audit.packed_count, atlasFrames: atlasFrames.length });
    }
    if (!directionPanelMap.length) {
      fail(`[${hunter}] missing direction_panel_map in audit`);
    }
    if (!Array.isArray(frameOrderAnomalies)) {
      fail(`[${hunter}] frame_order_anomalies must be an array`);
    }

    console.log(
      `[${hunter}] OK packed=${atlasFrames.length} anchorDrift=${anchorDrift}px sizeDrift=${sizeDrift}px matte=${matteRatio}`
    );
  }

  if (process.exitCode) return;
  console.log('sprite audit passed for all hunters');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
