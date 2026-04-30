const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { spawnSync } = require('child_process');
const sharp = require('sharp');
const { packAsync } = require('free-tex-packer-core');

const { ANIMATION_CONFIG } = require('../src/gameplay/AnimationDefinitions.js');

const FLOW_OUTPUT = fs.existsSync('flow_output') ? 'flow_output' : path.join('assets', 'flow-output');
const PREFER_ASSETS_FLOW_OUTPUT = String(process.env.PREFER_ASSETS_FLOW_OUTPUT || '1') !== '0';
const HUNTER_SHEET_LOCK_PATH = path.join('assets', 'flow-output', 'hunter-sheet-lock.json');
const SPRITES_DIR = path.join('assets', 'sprites', 'hunters');
const HUNTERS = ['dabik', 'benzu', 'sereisa', 'vesol'];

const PACKER_MODE = String(process.env.SPRITE_PACKER || 'free').toLowerCase();
const STRICT_CONTRACT = String(process.env.STRICT_SPRITE_CONTRACT || '1') !== '0';
const STRICT_SIZE_DRIFT = String(process.env.STRICT_SIZE_DRIFT || '0') !== '0';
const TEXTUREPACKER_BIN = process.env.TEXTUREPACKER_BIN
  || 'C:\\Users\\dabakeh.tangara\\Desktop\\TexturePacker\\PFiles64\\CodeAndWeb\\TexturePacker\\bin\\TexturePacker.exe';

const ALPHA_THRESHOLD = 12;
const NORMALIZE_ALPHA_THRESHOLD = 10;
const FRAME_PADDING = 8;
const MIN_COMPONENT_PIXELS = 70;
const CELL_CROP_PADDING = 2;
const MAX_SIZE_DRIFT_PX = 24;
const MAX_MATTE_ARTIFACT_RATIO = 0.90;
const SIZE_NORMALIZE_STRENGTH = 1.0;
const SIZE_NORMALIZE_MIN_FACTOR = 0.55;
const SIZE_NORMALIZE_MAX_FACTOR = 1.6;

function normalizeAnimationName(name) {
  const normalized = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (normalized === 'attack') return 'attack_light';
  if (normalized === 'spell') return 'spell_minor';
  return normalized;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function trimmedMedian(values, trimRatio = 0.15) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const trim = Math.max(0, Math.min(Math.floor(sorted.length * trimRatio), Math.floor((sorted.length - 1) * 0.5)));
  const sliced = sorted.slice(trim, sorted.length - trim);
  return median(sliced.length ? sliced : sorted);
}

function maxAbsDeviation(values) {
  if (!values.length) return 0;
  const pivot = median(values);
  let max = 0;
  for (const value of values) max = Math.max(max, Math.abs(value - pivot));
  return max;
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

function stripExt(name) {
  return String(name || '').replace(/\.[^/.]+$/, '');
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadHunterSheetLock() {
  if (!fs.existsSync(HUNTER_SHEET_LOCK_PATH)) return { sources: {}, windows: {} };
  try {
    const data = readJson(HUNTER_SHEET_LOCK_PATH);
    return {
      sources: (data && typeof data.sources === 'object') ? data.sources : {},
      windows: (data && typeof data.windows === 'object') ? data.windows : {},
    };
  } catch {
    return { sources: {}, windows: {} };
  }
}

function parseAtlasFrames(atlasData) {
  if (!atlasData || typeof atlasData !== 'object') return [];
  if (Array.isArray(atlasData.frames)) {
    return atlasData.frames
      .map(frame => frame?.filename || frame?.name || frame?.id)
      .filter(Boolean)
      .map(stripExt);
  }
  if (atlasData.frames && typeof atlasData.frames === 'object') {
    return Object.keys(atlasData.frames).map(stripExt);
  }
  return [];
}

async function loadProfileModule() {
  const modulePath = path.resolve(__dirname, '..', 'src', 'gameplay', 'SpriteAnimationProfile.mjs');
  return import(pathToFileURL(modulePath).href);
}

async function chromaKey(input) {
  const { data, info } = await sharp(input)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a <= 0) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const sat = max === 0 ? 0 : delta / max;

    let hue = 0;
    if (delta > 0) {
      if (max === r) {
        hue = (60 * ((g - b) / delta) + 360) % 360;
      } else if (max === g) {
        hue = 60 * ((b - r) / delta + 2);
      } else {
        hue = 60 * ((r - g) / delta + 4);
      }
    }

    // Robust green detection: 
    // - Hue between 60 and 180 (yellow-green to cyan-green)
    // - Green must be dominant (g > r and g > b)
    // - Saturation can be low for noisy backgrounds
    const isGreenHue = hue >= 70 && hue <= 165;
    const isGreenDominant = g > r * 1.1 && g > b * 1.1;
    const isClearGreen = isGreenHue && isGreenDominant && (sat > 0.15 || g > 50);
    
    // Additional check for the specific green found in noisy JPEGs/videos
    // but made more conservative
    const isNoisyGreen = (g - r > 30 && g - b > 30 && g > 60);

    if (isClearGreen || isNoisyGreen) {
      data[i + 3] = 0;
      continue;
    }

    // Spill suppression for near-green pixels
    if (isGreenHue && g > Math.max(r, b)) {
      const neutral = (r + b) * 0.5;
      data[i + 1] = Math.round(g * 0.8 + neutral * 0.2);
    }
  }

  const keyed = await sharp(data, { raw: info })
    .png()
    .toBuffer();
  const cleaned = await cleanupMattePixels(keyed);
  // We disable stripBorderConnectedOpaque for hunters because they often touch the edge
  // and we don't want to erase the whole sprite.
  return cleaned;
}

async function cleanupMattePixels(buffer) {
  const { data, info } = await sharp(buffer, { limitInputPixels: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  const alpha = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i += 1) alpha[i] = data[i * channels + 3];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      const off = idx * channels;
      const a = alpha[idx];
      if (a <= 0) continue;

      const r = data[off];
      const g = data[off + 1];
      const b = data[off + 2];
      
      // Strong despill: treat any clear green dominance as contamination from chroma background.
      const isGreenish = g > r * 1.03 && g > b * 1.03;
      
      if (isGreenish) {
        // Pull green toward magenta-neutral and slightly boost R/B.
        const rb = Math.round((r + b) * 0.5);
        data[off + 1] = Math.round(rb * 0.9);
        data[off] = Math.min(255, Math.round(r * 1.12 + 6));
        data[off + 2] = Math.min(255, Math.round(b * 1.12 + 6));
      }

      // If a non-opaque pixel is green-dominant, kill it to remove fringe.
      const edgeAlpha = data[off + 3];
      if (edgeAlpha < 255 && g > r * 1.08 && g > b * 1.08) {
        data[off + 3] = 0;
      }
      if ((g - r > 18) && (g - b > 18) && edgeAlpha < 255) {
        data[off + 3] = 0;
      }

      // Hard clamp any lingering fully-opaque green cast.
      if (data[off + 3] === 255 && data[off + 1] > data[off] * 1.12 && data[off + 1] > data[off + 2] * 1.12) {
        const nr = data[off];
        const nb = data[off + 2];
        data[off + 1] = Math.round((nr + nb) * 0.45);
      }
    }
  }

  return sharp(data, { raw: info }).png().toBuffer();
}

async function stripBorderConnectedOpaque(buffer, alphaThreshold = ALPHA_THRESHOLD) {
  const { data, info } = await sharp(buffer, { limitInputPixels: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  const size = width * height;
  const visited = new Uint8Array(size);
  const queue = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    const a = data[idx * channels + 3];
    if (a <= alphaThreshold) return;
    queue.push(idx);
  };

  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }

  for (let head = 0; head < queue.length; head += 1) {
    const idx = queue[head];
    data[idx * channels + 3] = 0;
    const x = idx % width;
    const y = Math.floor(idx / width);
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  return sharp(data, { raw: info }).png().toBuffer();
}

function findBands(counts, minCount, minSize = 6) {
  const bands = [];
  let start = -1;

  for (let i = 0; i < counts.length; i += 1) {
    if (counts[i] >= minCount) {
      if (start === -1) start = i;
      continue;
    }
    if (start !== -1) {
      const size = i - start;
      if (size >= minSize) bands.push({ start, end: i - 1 });
      start = -1;
    }
  }

  if (start !== -1) {
    const size = counts.length - start;
    if (size >= minSize) bands.push({ start, end: counts.length - 1 });
  }

  return bands;
}

function buildOpaqueMask(data, width, height, channels) {
  const mask = new Uint8Array(width * height);
  const colDark = new Uint32Array(width);
  const rowDark = new Uint32Array(height);

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x += 1) {
      const idx = rowOffset + x;
      const off = idx * channels;
      const a = data[off + 3];
      if (a <= ALPHA_THRESHOLD) continue;

      mask[idx] = 1;
      const r = data[off];
      const g = data[off + 1];
      const b = data[off + 2];
      if (r < 24 && g < 24 && b < 24) {
        colDark[x] += 1;
        rowDark[y] += 1;
      }
    }
  }

  for (let x = 0; x < width; x += 1) {
    if (colDark[x] < Math.floor(height * 0.75)) continue;
    for (let y = 0; y < height; y += 1) {
      mask[y * width + x] = 0;
    }
  }
  for (let y = 0; y < height; y += 1) {
    if (rowDark[y] < Math.floor(width * 0.75)) continue;
    const rowOffset = y * width;
    for (let x = 0; x < width; x += 1) {
      mask[rowOffset + x] = 0;
    }
  }

  return mask;
}

function extractComponents(mask, width, region = null, minPixels = MIN_COMPONENT_PIXELS) {
  const height = Math.floor(mask.length / width);
  const left = region ? region.left : 0;
  const top = region ? region.top : 0;
  const right = region ? region.right : width - 1;
  const bottom = region ? region.bottom : height - 1;
  const regionWidth = right - left + 1;
  const regionHeight = bottom - top + 1;
  const visited = new Uint8Array(regionWidth * regionHeight);
  const boxes = [];

  const localIndex = (x, y) => (y - top) * regionWidth + (x - left);

  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const midx = y * width + x;
      if (!mask[midx]) continue;
      const lidx = localIndex(x, y);
      if (visited[lidx]) continue;
      visited[lidx] = 1;

      const qx = [x];
      const qy = [y];
      let head = 0;
      let pixels = 0;
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;

      while (head < qx.length) {
        const cx = qx[head];
        const cy = qy[head];
        head += 1;
        pixels += 1;

        minX = Math.min(minX, cx);
        minY = Math.min(minY, cy);
        maxX = Math.max(maxX, cx);
        maxY = Math.max(maxY, cy);

        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            if (ox === 0 && oy === 0) continue;
            const nx = cx + ox;
            const ny = cy + oy;
            if (nx < left || nx > right || ny < top || ny > bottom) continue;
            const nlidx = localIndex(nx, ny);
            if (visited[nlidx]) continue;
            visited[nlidx] = 1;
            const nmidx = ny * width + nx;
            if (!mask[nmidx]) continue;
            qx.push(nx);
            qy.push(ny);
          }
        }
      }

      if (pixels < minPixels) continue;
      boxes.push({
        x: minX,
        y: minY,
        w: maxX - minX + 1,
        h: maxY - minY + 1,
        pixels,
      });
    }
  }

  boxes.sort((a, b) => a.pixels === b.pixels ? ((a.y - b.y) || (a.x - b.x)) : (b.pixels - a.pixels));
  return boxes;
}

const FRAME_LAYOUT_TEMPLATES = {
  dead: { rows: 2, cols: 12, total: 24 },
  directional: { panels: { rows: 4, cols: 6, total: 24 } },
  idle: { rows: 2, cols: 4, total: 8 },
};

function getStrictGrid(animation) {
  return FRAME_LAYOUT_TEMPLATES[animation] || null;
}

function clusterAxis(values, maxGap) {
  if (!values.length) return [];
  const sorted = values.slice().sort((a, b) => a - b);
  const groups = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i += 1) {
    const value = sorted[i];
    const group = groups[groups.length - 1];
    const prev = group[group.length - 1];
    if (Math.abs(value - prev) <= maxGap) {
      group.push(value);
    } else {
      groups.push([value]);
    }
  }
  return groups.map(group => ({
    values: group,
    center: group.reduce((sum, value) => sum + value, 0) / group.length,
  }));
}

function filterGridComponents(components) {
  if (components.length < 2) return components.slice();
  const medW = Math.max(1, trimmedMedian(components.map(component => component.w)));
  const medH = Math.max(1, trimmedMedian(components.map(component => component.h)));
  const medPixels = Math.max(1, trimmedMedian(components.map(component => component.pixels)));

  const filtered = components.filter((component) => {
    if (component.w < medW * 0.22 || component.w > medW * 2.4) return false;
    if (component.h < medH * 0.22 || component.h > medH * 2.4) return false;
    if (component.pixels < medPixels * 0.08 || component.pixels > medPixels * 4.0) return false;
    return true;
  });

  return filtered.length >= 2 ? filtered : components.slice();
}

function pickBestComponentForCell(components, region) {
  if (!components.length) return null;
  if (components.length === 1) return components[0];

  const cx = (region.left + region.right) * 0.5;
  const cy = (region.top + region.bottom) * 0.5;
  const cellW = Math.max(1, region.right - region.left + 1);
  const cellH = Math.max(1, region.bottom - region.top + 1);

  let best = components[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const component of components) {
    const ccx = component.x + component.w * 0.5;
    const ccy = component.y + component.h * 0.5;
    const centerDist = Math.hypot((ccx - cx) / cellW, (ccy - cy) / cellH);
    const areaRatio = (component.w * component.h) / (cellW * cellH);
    const tinyPenalty = areaRatio < 0.03 ? (0.03 - areaRatio) * 20 : 0;
    const oversizePenalty = areaRatio > 0.82 ? (areaRatio - 0.82) * 16 : 0;
    const score = Math.log1p(component.pixels) - centerDist * 3.5 - tinyPenalty - oversizePenalty;
    if (score > bestScore) {
      bestScore = score;
      best = component;
    }
  }
  return best;
}

function inferGridBoxesFromComponents(components) {
  if (components.length < 2) return [];
  const source = filterGridComponents(components);
  if (source.length < 2) return [];

  const heights = source.map(component => component.h);
  const widths = source.map(component => component.w);
  const medH = Math.max(1, median(heights));
  const medW = Math.max(1, median(widths));
  const medPixels = Math.max(1, median(source.map(component => component.pixels)));
  const rowGap = Math.max(14, medH * 0.45);
  const colGap = Math.max(14, medW * 0.45);

  const rowClusters = clusterAxis(source.map(component => component.y + component.h * 0.5), rowGap)
    .sort((a, b) => a.center - b.center);
  const colClusters = clusterAxis(source.map(component => component.x + component.w * 0.5), colGap)
    .sort((a, b) => a.center - b.center);

  if (!rowClusters.length || !colClusters.length) return [];
  const cellCount = rowClusters.length * colClusters.length;
  if (cellCount < 2 || cellCount > Math.min(280, source.length * 3)) return [];

  const cellMap = new Map();
  for (const component of source) {
    const cx = component.x + component.w * 0.5;
    const cy = component.y + component.h * 0.5;

    let rowIndex = 0;
    let rowDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < rowClusters.length; i += 1) {
      const distance = Math.abs(cy - rowClusters[i].center);
      if (distance < rowDistance) {
        rowDistance = distance;
        rowIndex = i;
      }
    }

    let colIndex = 0;
    let colDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < colClusters.length; i += 1) {
      const distance = Math.abs(cx - colClusters[i].center);
      if (distance < colDistance) {
        colDistance = distance;
        colIndex = i;
      }
    }

    const key = `${rowIndex}:${colIndex}`;
    if (!cellMap.has(key)) cellMap.set(key, []);
    cellMap.get(key).push(component);
  }

  const merged = [];
  for (const [key, items] of cellMap.entries()) {
    const [rowIndex, colIndex] = key.split(':').map(Number);
    const bounded = items.filter((item) => {
      if (item.w < medW * 0.2 || item.w > medW * 2.2) return false;
      if (item.h < medH * 0.2 || item.h > medH * 2.2) return false;
      if (item.pixels < medPixels * 0.08 || item.pixels > medPixels * 3.2) return false;
      return true;
    });
    const region = {
      left: Math.round(Math.max(0, colClusters[colIndex].center - medW * 0.9)),
      right: Math.round(colClusters[colIndex].center + medW * 0.9),
      top: Math.round(Math.max(0, rowClusters[rowIndex].center - medH * 0.9)),
      bottom: Math.round(rowClusters[rowIndex].center + medH * 0.9),
    };
    const box = pickBestComponentForCell(bounded.length ? bounded : items, region);
    if (!box) continue;
    merged.push({
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      pixels: box.pixels,
      rowIndex,
      colIndex,
    });
  }

  merged.sort((a, b) => (a.rowIndex - b.rowIndex) || (a.colIndex - b.colIndex));
  return merged;
}

async function splitByPreferredGrid(buffer, mask, width, height, preferredFrames) {
  if (!Number.isFinite(preferredFrames) || preferredFrames <= 1) return null;

  const candidates = [];
  const minCells = Math.max(2, preferredFrames);
  const maxCells = Math.max(minCells, Math.ceil(preferredFrames * 1.8));
  const maxRows = Math.min(12, Math.max(2, Math.ceil(Math.sqrt(maxCells))));
  const maxCols = Math.min(20, Math.max(2, Math.ceil(maxCells / 2)));

  for (let rows = 1; rows <= maxRows; rows += 1) {
    for (let cols = 2; cols <= maxCols; cols += 1) {
      const total = rows * cols;
      if (total < minCells || total > maxCells) continue;
      const cellW = width / cols;
      const cellH = height / rows;
      if (cellW < 20 || cellH < 20) continue;

      const frames = [];
      for (let r = 0; r < rows; r += 1) {
        const top = Math.floor((r * height) / rows);
        const bottom = Math.floor(((r + 1) * height) / rows) - 1;
        for (let c = 0; c < cols; c += 1) {
          const left = Math.floor((c * width) / cols);
          const right = Math.floor(((c + 1) * width) / cols) - 1;
          const region = { left, top, right, bottom };
          const fallbackMinPixels = Math.max(18, Math.round(MIN_COMPONENT_PIXELS * 0.35));
          const components = extractComponents(mask, width, region, fallbackMinPixels);
          if (!components.length) continue;
          const best = pickBestComponentForCell(components, region);
          if (!best) continue;
          frames.push({ box: best, row: r, col: c, index: r * cols + c });
        }
      }

      if (frames.length < Math.max(2, Math.floor(preferredFrames * 0.45))) continue;

      const holes = [];
      const used = frames.map(frame => frame.index).sort((a, b) => a - b);
      const maxUsed = used.length ? used[used.length - 1] : -1;
      const usedSet = new Set(used);
      for (let i = 0; i <= maxUsed; i += 1) {
        if (!usedSet.has(i)) holes.push(i);
      }

      const avgPixels = frames.reduce((sum, frame) => sum + frame.box.pixels, 0) / frames.length;
      const aspect = cellW / cellH;
      const aspectPenalty = Math.abs(Math.log(Math.max(0.1, aspect)));
      const score = Math.abs(frames.length - preferredFrames) * 10
        + Math.abs(total - preferredFrames) * 1.5
        + holes.length * 1.1
        + aspectPenalty * 6
        - Math.log1p(avgPixels) * 0.6;

      candidates.push({
        rows,
        cols,
        total,
        frames,
        holes,
        used,
        score,
      });
    }
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => a.score - b.score);
  return candidates[0];
}

async function splitSheetDeterministic(buffer, options = {}, animation = null) {
  const template = getStrictGrid(animation);
  const preferredFrames = Number(options?.preferredFrames || 0);
  const anomalies = [];
  const { data, info } = await sharp(buffer, { limitInputPixels: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  if (template) {
    let { rows, cols } = template;

    // Some flow sheets are exported in portrait orientation (e.g. 768x1376).
    // For strict-grid states, flip grid axes in portrait mode so frame cells
    // stay close to expected proportions and do not inflate character scale.
    if (width < height && cols > rows) {
      [rows, cols] = [cols, rows];
    }

    const cellW = Math.floor(width / cols);
    const cellH = Math.floor(height / rows);
    const frames = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const crop = await sharp(buffer)
          .extract({ left: c * cellW, top: r * cellH, width: cellW, height: cellH })
          .png()
          .toBuffer();
        frames.push({ buffer: crop, sourceCell: { row: r, col: c, index: r * cols + c } });
      }
    }
    return { frames, anomalies: [], grid: { rows, cols } };
  }
  
  // Fallback to original logic if no template exists...
  const mask = buildOpaqueMask(data, width, height, channels);
  // ... (the rest of the original function logic)
  const rowCounts = new Uint32Array(height);
  const colCounts = new Uint32Array(width);

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x += 1) {
      if (!mask[rowOffset + x]) continue;
      rowCounts[y] += 1;
      colCounts[x] += 1;
    }
  }

  const frames = [];
  const usedCellIndices = [];
  const allComponents = extractComponents(mask, width, null, MIN_COMPONENT_PIXELS);
  const inferredGrid = inferGridBoxesFromComponents(allComponents);
  const minRowCount = Math.max(4, Math.floor(width * 0.012));
  const minColCount = Math.max(4, Math.floor(height * 0.012));
  const rowBands = findBands(rowCounts, minRowCount, 8);
  const colBands = findBands(colCounts, minColCount, 8);
  const bandGridDetected = rowBands.length > 0 && colBands.length > 0 && rowBands.length * colBands.length > 1;

  if (inferredGrid.length >= 2) {
    const rows = inferredGrid.length ? Math.max(...inferredGrid.map(box => box.rowIndex)) + 1 : 0;
    const cols = inferredGrid.length ? Math.max(...inferredGrid.map(box => box.colIndex)) + 1 : 0;
    const totalCells = rows * cols;
    for (const box of inferredGrid) {
      const cellIndex = box.rowIndex * cols + box.colIndex;
      const left = Math.max(0, box.x - CELL_CROP_PADDING);
      const top = Math.max(0, box.y - CELL_CROP_PADDING);
      const right = Math.min(width - 1, box.x + box.w - 1 + CELL_CROP_PADDING);
      const bottom = Math.min(height - 1, box.y + box.h - 1 + CELL_CROP_PADDING);
      const crop = await sharp(buffer)
        .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
        .png()
        .toBuffer();
      frames.push({
        buffer: crop,
        sourceCell: { row: box.rowIndex, col: box.colIndex, index: cellIndex, rows, cols },
      });
      usedCellIndices.push(cellIndex);
    }

    const maxUsed = usedCellIndices.length ? Math.max(...usedCellIndices) : -1;
    const usedSet = new Set(usedCellIndices);
    const holes = [];
    for (let i = 0; i <= maxUsed; i += 1) {
      if (!usedSet.has(i)) holes.push(i);
    }
    if (holes.length) {
      anomalies.push({
        issue: 'sparse_grid_holes',
        holes,
        used: usedCellIndices.slice(),
        total_cells: totalCells,
      });
    }
  } else if (bandGridDetected) {
    const totalCells = rowBands.length * colBands.length;
    for (let r = 0; r < rowBands.length; r += 1) {
      for (let c = 0; c < colBands.length; c += 1) {
        const row = rowBands[r];
        const col = colBands[c];
        const cellIndex = r * colBands.length + c;
        const region = { left: col.start, top: row.start, right: col.end, bottom: row.end };
        const components = extractComponents(mask, width, region, MIN_COMPONENT_PIXELS);
        if (!components.length) continue;
        const best = pickBestComponentForCell(components, region) || components[0];
        const left = Math.max(0, best.x - CELL_CROP_PADDING);
        const top = Math.max(0, best.y - CELL_CROP_PADDING);
        const right = Math.min(width - 1, best.x + best.w - 1 + CELL_CROP_PADDING);
        const bottom = Math.min(height - 1, best.y + best.h - 1 + CELL_CROP_PADDING);
        const crop = await sharp(buffer)
          .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
          .png()
          .toBuffer();
        frames.push({
          buffer: crop,
          sourceCell: { row: r, col: c, index: cellIndex, rows: rowBands.length, cols: colBands.length },
        });
        usedCellIndices.push(cellIndex);
      }
    }

    if (usedCellIndices.length) {
      const maxUsed = Math.max(...usedCellIndices);
      const usedSet = new Set(usedCellIndices);
      const holes = [];
      for (let i = 0; i <= maxUsed; i += 1) {
        if (!usedSet.has(i)) holes.push(i);
      }
      if (holes.length) {
        anomalies.push({
          issue: 'sparse_grid_holes',
          holes,
          used: usedCellIndices.slice(),
          total_cells: totalCells,
        });
      }
    }
  } else {
    const preferredGrid = await splitByPreferredGrid(buffer, mask, width, height, preferredFrames);
    if (preferredGrid && preferredGrid.frames.length >= 2) {
      for (const frame of preferredGrid.frames) {
        const box = frame.box;
        const left = Math.max(0, box.x - CELL_CROP_PADDING);
        const top = Math.max(0, box.y - CELL_CROP_PADDING);
        const right = Math.min(width - 1, box.x + box.w - 1 + CELL_CROP_PADDING);
        const bottom = Math.min(height - 1, box.y + box.h - 1 + CELL_CROP_PADDING);
        const crop = await sharp(buffer)
          .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
          .png()
          .toBuffer();
        frames.push({
          buffer: crop,
          sourceCell: { row: frame.row, col: frame.col, index: frame.index, rows: preferredGrid.rows, cols: preferredGrid.cols },
        });
      }
      anomalies.push({
        issue: 'preferred_grid_fallback',
        rows: preferredGrid.rows,
        cols: preferredGrid.cols,
        used: preferredGrid.used,
        holes: preferredGrid.holes,
        preferred_frames: preferredFrames,
      });
    } else {
      anomalies.push({ issue: 'grid_not_detected' });
      if (allComponents.length) {
        allComponents.sort((a, b) => (a.y - b.y) || (a.x - b.x));
        for (let i = 0; i < allComponents.length; i += 1) {
          const box = allComponents[i];
          const left = Math.max(0, box.x - CELL_CROP_PADDING);
          const top = Math.max(0, box.y - CELL_CROP_PADDING);
          const right = Math.min(width - 1, box.x + box.w - 1 + CELL_CROP_PADDING);
          const bottom = Math.min(height - 1, box.y + box.h - 1 + CELL_CROP_PADDING);
          const crop = await sharp(buffer)
            .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
            .png()
            .toBuffer();
          frames.push({ buffer: crop, sourceCell: { row: 0, col: i, index: i, rows: 1, cols: allComponents.length } });
        }
      } else {
        frames.push({ buffer, sourceCell: null });
        anomalies.push({ issue: 'fallback_full_sheet_used' });
      }
    }
  }

  return {
    frames,
    anomalies,
    grid: {
      rows: rowBands.length,
      cols: colBands.length,
      used_cells: usedCellIndices,
    },
  };
}

function sampleFrames(frames, targetCount) {
  if (!Array.isArray(frames)) return [];
  if (targetCount <= 0 || frames.length <= targetCount) return frames.slice();
  if (targetCount === 1) return [frames[Math.floor((frames.length - 1) * 0.5)]];

  const sampled = [];
  for (let i = 0; i < targetCount; i += 1) {
    const index = Math.floor((i * frames.length) / targetCount);
    sampled.push(frames[Math.min(frames.length - 1, index)]);
  }
  return sampled;
}

function remapFramesToCount(frames, targetCount) {
  if (!Array.isArray(frames)) return [];
  if (targetCount <= 0) return frames.slice();
  if (frames.length === 0) return [];
  if (frames.length === targetCount) return frames.slice();
  if (targetCount === 1) return [frames[Math.floor((frames.length - 1) * 0.5)]];

  const mapped = [];
  for (let i = 0; i < targetCount; i += 1) {
    const t = i / (targetCount - 1);
    const index = Math.round(t * (frames.length - 1));
    mapped.push(frames[Math.max(0, Math.min(frames.length - 1, index))]);
  }
  return mapped;
}

async function detectBounds(buffer, alphaThreshold = NORMALIZE_ALPHA_THRESHOLD) {
  const { data, info } = await sharp(buffer, { limitInputPixels: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  const mask = new Uint8Array(width * height);
  let opaqueCount = 0;
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x += 1) {
      const idx = rowOffset + x;
      const a = data[idx * channels + 3];
      if (a < alphaThreshold) continue;
      mask[idx] = 1;
      opaqueCount++;
    }
  }

  const components = extractComponents(mask, width, null, 12);
  if (!components.length) {
    // If we have some opaque pixels but no large components, 
    // it might be a very noisy frame or a very small sprite.
    // Use the whole frame if opaque pixels exist.
    if (opaqueCount > 0) {
       const fallback = { x: 0, y: 0, w: width, h: height };
       return { full: fallback, core: fallback, pixels: opaqueCount };
    }
    const fallback = { x: 0, y: 0, w: 1, h: 1 };
    return { full: fallback, core: fallback, pixels: 0 };
  }

  const main = components[0];
  let minX = main.x;
  let minY = main.y;
  let maxX = main.x + main.w - 1;
  let maxY = main.y + main.h - 1;
  let pixels = main.pixels;

  for (let i = 1; i < components.length; i += 1) {
    const item = components[i];
    if (item.pixels < Math.max(10, main.pixels * 0.05)) continue;
    const itemMinX = item.x;
    const itemMinY = item.y;
    const itemMaxX = item.x + item.w - 1;
    const itemMaxY = item.y + item.h - 1;
    const dx = Math.max(0, Math.max(minX, itemMinX) - Math.min(maxX, itemMaxX));
    const dy = Math.max(0, Math.max(minY, itemMinY) - Math.min(maxY, itemMaxY));
    const gapX = Math.max(10, Math.round(Math.min(main.w, item.w) * 0.2));
    const gapY = Math.max(10, Math.round(Math.min(main.h, item.h) * 0.2));
    if (dx > gapX || dy > gapY) continue;

    const nextMinX = Math.min(minX, itemMinX);
    const nextMinY = Math.min(minY, itemMinY);
    const nextMaxX = Math.max(maxX, itemMaxX);
    const nextMaxY = Math.max(maxY, itemMaxY);
    const mergedW = nextMaxX - nextMinX + 1;
    const mergedH = nextMaxY - nextMinY + 1;
    const baseW = Math.max(maxX - minX + 1, item.w);
    const baseH = Math.max(maxY - minY + 1, item.h);
    const suspiciousHorizontalMerge = mergedW > baseW * 1.9 && mergedH < baseH * 1.3 && item.pixels < main.pixels * 0.65;
    if (suspiciousHorizontalMerge) continue;

    minX = Math.min(minX, itemMinX);
    minY = Math.min(minY, itemMinY);
    maxX = Math.max(maxX, itemMaxX);
    maxY = Math.max(maxY, itemMaxY);
    pixels += item.pixels;
  }

  const full = {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  };

  const core = full;

  return { full, core, pixels };
}

async function computeMatteArtifactRatio(buffer) {
  const { data, info } = await sharp(buffer, { limitInputPixels: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  let opaquePixels = 0;
  let greenFringePixels = 0;

  for (let i = 0; i < info.width * info.height; i += 1) {
    const off = i * channels;
    const r = data[off];
    const g = data[off + 1];
    const b = data[off + 2];
    const a = data[off + 3];
    if (a <= NORMALIZE_ALPHA_THRESHOLD) continue;
    opaquePixels += 1;

    // Matte artifact heuristic: semi-transparent + green-dominant fringe.
    if (a < 255 && g > r * 1.1 && g > b * 1.1 && (g - r > 18) && (g - b > 18)) {
      greenFringePixels += 1;
    }
  }

  if (!opaquePixels) return 0;
  return greenFringePixels / opaquePixels;
}

async function normalizeHunterFrames(stateFrames) {
  const analyzed = [];
  for (const [state, frames] of Object.entries(stateFrames)) {
    for (let i = 0; i < frames.length; i += 1) {
      const frame = frames[i];
      const bounds = await detectBounds(frame.buffer);
      analyzed.push({
        state,
        index: i,
        buffer: frame.buffer,
        full: bounds.full,
        core: bounds.core,
        coreLong: Math.max(bounds.core.w, bounds.core.h),
      });
    }
  }

  const canvasW = 160;
  const canvasH = 240;
  const anchorY = canvasH - FRAME_PADDING;

  // Calculate a unified scale for ALL frames to preserve relative proportions
  const maxDetectedW = Math.max(...analyzed.map(item => item.full.w), 1);
  const maxDetectedH = Math.max(...analyzed.map(item => item.full.h), 1);
  const unifiedScale = Math.min(1.0, (canvasW - FRAME_PADDING * 2) / maxDetectedW, (canvasH - FRAME_PADDING * 2) / maxDetectedH);
  const targetCoreLongRaw = median(analyzed.map(item => item.coreLong));

  // Find the average foot position in the idle state to use as a global ground reference
  const idleFrames = analyzed.filter(item => item.state === 'idle');
  const globalFootOffset = idleFrames.length > 0 
    ? median(idleFrames.map(f => (f.full.y + f.full.h)))
    : median(analyzed.map(f => (f.full.y + f.full.h)));

  const normalized = {};
  const stateSamples = {};
  const sizePolicyViolations = [];

  for (const item of analyzed) {
    const metadata = await sharp(item.buffer).metadata();
    const sourceW = metadata.width;
    const sourceH = metadata.height;
    
    const hasContent = item.full.w > 1 && item.full.h > 1;
    const cropLeft = hasContent ? item.full.x : 0;
    const cropTop = hasContent ? item.full.y : 0;
    const cropWidth = hasContent ? Math.min(item.full.w, sourceW - cropLeft) : 1;
    const cropHeight = hasContent ? Math.min(item.full.h, sourceH - cropTop) : 1;

    const crop = await sharp(item.buffer)
      .extract({ 
        left: Math.max(0, Math.floor(cropLeft)), 
        top: Math.max(0, Math.floor(cropTop)), 
        width: Math.max(1, Math.floor(cropWidth)), 
        height: Math.max(1, Math.floor(cropHeight))
      })
      .png()
      .toBuffer();

    const rawLong = Math.max(item.coreLong, 1);
    const targetRatio = targetCoreLongRaw / rawLong;
    const normalizedFactor = 1 + (targetRatio - 1) * SIZE_NORMALIZE_STRENGTH;
    const scaleFactor = Math.max(SIZE_NORMALIZE_MIN_FACTOR, Math.min(SIZE_NORMALIZE_MAX_FACTOR, normalizedFactor));
    const frameScale = unifiedScale * scaleFactor;

    const scaledW = Math.max(1, Math.round(cropWidth * frameScale));
    const scaledH = Math.max(1, Math.round(cropHeight * frameScale));

    const resizedCrop = await sharp(crop)
      .resize(scaledW, scaledH, { fit: 'fill' })
      .toBuffer();

    // Horizontal centering
    const left = Math.round((canvasW - scaledW) * 0.5);
    
    // Vertical anchoring: maintain ground level relative to the bottom of the detected character
    // We use the globalFootOffset to align the bottom of every sprite to the same "ground" line.
    const footPosInSource = item.full.y + item.full.h;
    const relativeFootOffset = (footPosInSource - globalFootOffset) * frameScale;
    const top = Math.round(anchorY - scaledH + relativeFootOffset);

    const composed = await sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ 
        input: resizedCrop, 
        left: Math.max(0, Math.min(canvasW - scaledW, left)), 
        top: Math.max(0, Math.min(canvasH - scaledH, top)) 
      }])
      .png()
      .toBuffer();

    const cleaned = await cleanupMattePixels(composed);
    // We disable stripBorderConnectedOpaque for hunters here as well 
    // to prevent total sprite erasure when background removal is incomplete.
    const borderCleaned = cleaned;
    const matteRatio = await computeMatteArtifactRatio(borderCleaned);

    if (!normalized[item.state]) normalized[item.state] = [];
    normalized[item.state].push({ buffer: borderCleaned, width: canvasW, height: canvasH });

    if (!stateSamples[item.state]) stateSamples[item.state] = [];
    stateSamples[item.state].push({
      centerX: left + scaledW * 0.5,
      footY: anchorY,
      width: scaledW,
      height: scaledH,
      coreW: scaledW,
      coreH: scaledH,
      coreLong: Math.max(scaledW, scaledH),
      matteRatio,
    });
  }

  const normalizedTargetCoreLong = median(analyzed.map(item => item.coreLong)) * unifiedScale;
  const normalizedTargetCoreW = median(analyzed.map(item => item.core.w)) * unifiedScale;
  const normalizedTargetCoreH = median(analyzed.map(item => item.core.h)) * unifiedScale;

  let maxAnchorDrift = 0;
  let maxBBoxDrift = 0;
  let maxSizeDrift = 0;
  let maxMatteRatio = 0;
  const stateMetrics = {};

  for (const [state, samples] of Object.entries(stateSamples)) {
    const centerDrift = maxAbsDeviation(samples.map(sample => sample.centerX));
    const footDrift = Math.max(...samples.map(sample => Math.abs(sample.footY - anchorY)));
    const widthDrift = maxAbsDeviation(samples.map(sample => sample.width));
    const heightDrift = maxAbsDeviation(samples.map(sample => sample.height));
    const bboxDrift = Math.max(centerDrift, widthDrift, heightDrift);
    const sizeDrift = Math.max(...samples.map(sample => Math.abs(sample.coreLong - normalizedTargetCoreLong)));
    const matteRatio = Math.max(...samples.map(sample => sample.matteRatio));

    stateMetrics[state] = {
      count: samples.length,
      center_drift_px: round3(centerDrift),
      foot_drift_px: round3(footDrift),
      bbox_drift_px: round3(bboxDrift),
      size_drift_px: round3(sizeDrift),
      matte_artifact_ratio: round3(matteRatio),
    };

    maxAnchorDrift = Math.max(maxAnchorDrift, footDrift);
    maxBBoxDrift = Math.max(maxBBoxDrift, bboxDrift);
    maxSizeDrift = Math.max(maxSizeDrift, sizeDrift);
    maxMatteRatio = Math.max(maxMatteRatio, matteRatio);
  }

  const filteredOutliers = [];

  return {
    normalized,
    canvas: { w: canvasW, h: canvasH },
    metrics: {
      state: stateMetrics,
      anchor_drift_px: round3(maxAnchorDrift),
      bbox_drift_px: round3(maxBBoxDrift),
      size_drift_px: round3(maxSizeDrift),
      matte_artifact_ratio: round3(maxMatteRatio),
      target_core_size: { w: normalizedTargetCoreW, h: normalizedTargetCoreH },
      target_core_long: normalizedTargetCoreLong,
    },
    sizePolicyViolations,
    filteredOutliers,
  };
}

function buildFrameContract(stateFrames, profileStates, requiredStates, frameWindows = {}) {
  const output = {};
  const sourceStateCounts = {};
  const countMismatches = [];
  const statesRequiringRegeneration = [];
  const missingStates = [];

  for (const [state, frames] of Object.entries(stateFrames)) {
    sourceStateCounts[state] = frames.length;
    const spec = profileStates[state];
    let selected = frames.slice();
    const window = frameWindows?.[state];
    if (window && typeof window === 'object') {
      const start = Number.isFinite(window.start) ? Math.max(0, Math.floor(window.start)) : 0;
      if (start > 0 || Number.isFinite(window.limit)) {
        const limit = Number.isFinite(window.limit) ? Math.max(0, Math.floor(window.limit)) : undefined;
        selected = selected.slice(start, limit !== undefined ? start + limit : undefined);
      }
    }

    if (spec?.targetFrames && selected.length > 0 && selected.length !== spec.targetFrames) {
      selected = remapFramesToCount(selected, spec.targetFrames);
    }

    output[state] = selected;

    if (spec) {
      const required = spec.minFrames || spec.targetFrames || 1;
      if (selected.length < required) {
        statesRequiringRegeneration.push({ state, required, found: selected.length });
      }
      if (spec.targetFrames && selected.length !== spec.targetFrames) {
        countMismatches.push({ state, expected: spec.targetFrames, actual: selected.length });
      }
    }
  }

  for (const requiredState of requiredStates) {
    if (output[requiredState]?.length) continue;
    missingStates.push(requiredState);
    const spec = profileStates[requiredState];
    if (spec?.targetFrames) {
      countMismatches.push({ state: requiredState, expected: spec.targetFrames, actual: 0 });
    }
  }

  return {
    output,
    sourceStateCounts,
    countMismatches,
    statesRequiringRegeneration,
    missingStates,
  };
}

function runTexturePacker(hunterOutput, hunter) {
  const jsonName = `${hunter}-atlas.json`;
  const webpName = `${hunter}-atlas.webp`;
  const jsonPath = path.join(SPRITES_DIR, jsonName);
  const webpPath = path.join(SPRITES_DIR, webpName);

  const args = [
    '--format', 'phaser-json-hash',
    '--algorithm', 'MaxRects',
    '--sheet', webpPath,
    '--data', jsonPath,
    '--texture-format', 'webp',
    '--max-width', '8192',
    '--max-height', '8192',
    '--shape-padding', '2',
    '--border-padding', '2',
    '--extrude', '1',
    '--disable-rotation',
    '--trim-mode', 'None',
    hunterOutput,
  ];

  const result = spawnSync(TEXTUREPACKER_BIN, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    windowsHide: true,
  });

  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || 'unknown TexturePacker failure').trim();
    throw new Error(`TexturePacker failed: ${message}`);
  }

  if (!fs.existsSync(jsonPath) || !fs.existsSync(webpPath)) {
    throw new Error(`TexturePacker did not produce expected files for ${hunter}`);
  }

  return {
    atlasData: readJson(jsonPath),
    atlasImage: webpName,
    atlasDataName: jsonName,
    backend: 'texturepacker',
  };
}

async function runFreePacker(imagesToPack, hunter) {
  const options = {
    textureName: `${hunter}-atlas`,
    width: 8192,
    height: 8192,
    fixedSize: false,
    padding: 2,
    extrude: 1,
    allowRotation: false,
    detectIdentical: false,
    allowTrim: false,
    exporter: 'PhaserHash',
    removeFileExtension: true,
  };

  const packedFiles = await packAsync(imagesToPack, options);
  const atlasJsonPages = [];
  const atlasImagePages = [];
  let packedAtlasData = null;

  for (const packed of packedFiles) {
    const buffer = packed.buffer || Buffer.from(packed.content || '');
    const outputPath = path.join(SPRITES_DIR, packed.name);

    if (packed.name.endsWith('.png')) {
      const webpName = packed.name.replace(/\.png$/i, '.webp');
      const webpPath = path.join(SPRITES_DIR, webpName);
      await sharp(buffer, { limitInputPixels: false }).webp({ quality: 96 }).toFile(webpPath);
      atlasImagePages.push(webpName);
      continue;
    }

    fs.writeFileSync(outputPath, buffer);
    if (packed.name.endsWith('.json')) {
      atlasJsonPages.push(packed.name);
      const parsed = JSON.parse(buffer.toString('utf8'));
      if (packed.name === `${hunter}-atlas.json`) packedAtlasData = parsed;
    }
  }

  if (atlasJsonPages.length !== 1 || atlasImagePages.length !== 1 || !packedAtlasData) {
    throw new Error(
      `Expected a single atlas page for ${hunter} but got json=${atlasJsonPages.length}, images=${atlasImagePages.length}. ` +
      'Regenerate low-frame/outlier states before packing.'
    );
  }

  return {
    atlasData: packedAtlasData,
    atlasImage: atlasImagePages[0],
    atlasDataName: `${hunter}-atlas.json`,
    backend: 'free-tex-packer',
  };
}

async function packAtlas(imagesToPack, hunterOutput, hunter) {
  const canUseTexturePacker = fs.existsSync(TEXTUREPACKER_BIN);
  const explicitTexturePacker = PACKER_MODE === 'texturepacker';
  const autoMode = PACKER_MODE === 'auto';

  if (explicitTexturePacker || autoMode) {
    if (explicitTexturePacker && !canUseTexturePacker) {
      throw new Error(`TexturePacker not found at ${TEXTUREPACKER_BIN}`);
    }
    if (canUseTexturePacker) {
      try {
        return runTexturePacker(hunterOutput, hunter);
      } catch (error) {
        if (explicitTexturePacker) throw error;
        console.warn(`TexturePacker fallback for ${hunter}: ${error.message}`);
      }
    }
  }

  if (PACKER_MODE === 'free' || autoMode) {
    return runFreePacker(imagesToPack, hunter);
  }

  throw new Error(`Unsupported SPRITE_PACKER value: ${PACKER_MODE}`);
}

function getOrderedStates(normalizedStates, requiredStates) {
  const required = requiredStates.slice();
  const extras = Object.keys(normalizedStates)
    .filter(state => !required.includes(state))
    .sort((a, b) => a.localeCompare(b));
  return required.concat(extras);
}

async function processHunter(hunter, profileStates, requiredStates, sheetLock = { sources: {}, windows: {} }) {
  const assetsFlowPath = path.join('assets', 'flow-output', hunter);
  const legacyFlowPath = path.join('flow_output', hunter);

  let hunterInputs = [];
  if (PREFER_ASSETS_FLOW_OUTPUT && fs.existsSync(assetsFlowPath)) {
    // Default behavior: use curated flow-output sheets only.
    // This avoids accidental contamination from legacy split-frame folders.
    hunterInputs = [assetsFlowPath];
  } else {
    hunterInputs = [legacyFlowPath, assetsFlowPath].filter(p => fs.existsSync(p));
  }

  const hunterOutput = path.join(SPRITES_DIR, hunter);
  fs.rmSync(hunterOutput, { recursive: true, force: true });
  fs.mkdirSync(hunterOutput, { recursive: true });

  for (const file of fs.readdirSync(SPRITES_DIR)) {
    if (!file.startsWith(`${hunter}-atlas`)) continue;
    if (!/\.(json|png|webp)$/i.test(file)) continue;
    fs.rmSync(path.join(SPRITES_DIR, file), { force: true });
  }

  if (hunterInputs.length === 0) {
    console.log(`skip ${hunter}: missing input folders`);
    return {
      hunter,
      atlasReady: false,
      audit: {
        hunter,
        source_used: [],
        packed_count: 0,
        state_counts: {},
        missing_states: requiredStates.slice(),
      },
    };
  }

  console.log(`processing ${hunter} from ${hunterInputs.join(', ')}...`);
  const stateFrames = {};
  const sourceFiles = [];
  const frameOrderAnomalies = [];
  const directionPanelMap = [];

  for (const hunterInput of hunterInputs) {
    const entries = fs.readdirSync(hunterInput, { withFileTypes: true }).sort();

    // 1. Process legacy JPEG sheets
    // Deduplicate by animation state and use one canonical source per state.
    const candidatesByAnimation = new Map();
    const lockedSources = sheetLock?.sources?.[hunter] || {};
    for (const entry of entries) {
      if (!entry.isFile() || !/\.jpe?g$/i.test(entry.name)) continue;
      const file = entry.name;
      const match = file.match(/^([^-]+)-(.+)_(\d{12})\.jpe?g$/i);
      if (!match) continue;
      const fileHunter = String(match[1]).toLowerCase();
      if (fileHunter !== hunter) continue;

      const animation = normalizeAnimationName(match[2]);
      const timestamp = String(match[3] || '');
      const lockedFile = lockedSources?.[animation];
      if (lockedFile) {
        if (file === lockedFile) {
          candidatesByAnimation.set(animation, { file, animation, timestamp, selectedBy: 'lockfile' });
        }
        continue;
      }

      const prev = candidatesByAnimation.get(animation);
      // Prefer newest timestamp to avoid blending old and corrected generations.
      if (!prev || timestamp > prev.timestamp) {
        candidatesByAnimation.set(animation, { file, animation, timestamp, selectedBy: 'latest_timestamp' });
      }
    }

    for (const selected of candidatesByAnimation.values()) {
      const file = selected.file;
      const animation = selected.animation;

      const inputPath = path.join(hunterInput, file);
      const keyedBuffer = await chromaKey(inputPath);
      let produced = 0;
      const sourceAnomalies = [];

      if (animation === 'directional') {
        const metadata = await sharp(keyedBuffer).metadata();
        const panelWidth = Math.floor(metadata.width / 4);
        const panelHeight = metadata.height;
        const sides = ['right', 'left', 'front', 'back'];
        const panelCounts = {};
        const panelAnomalies = [];

        for (let i = 0; i < sides.length; i += 1) {
          const side = sides[i];
          const panel = await sharp(keyedBuffer)
            .extract({ left: i * panelWidth, top: 0, width: panelWidth, height: panelHeight })
            .png()
            .toBuffer();
          const panelState = `directional_${side}`;
          const split = await splitSheetDeterministic(panel, {
            preferredFrames: profileStates[panelState]?.targetFrames || 1,
          });
          const chosen = split.frames[0] || { buffer: panel };
          const state = panelState;
          if (!stateFrames[state]) stateFrames[state] = [];
          stateFrames[state].push({ buffer: chosen.buffer });
          panelCounts[side] = split.frames.length;
          produced += 1;
          for (const anomaly of split.anomalies) {
            panelAnomalies.push({ panel: side, ...anomaly });
          }
        }

        directionPanelMap.push({
          source_file: file,
          panel_order: sides.slice(),
          panel_width: panelWidth,
          panel_height: panelHeight,
          detected_frames: panelCounts,
          anomalies: panelAnomalies,
        });
        sourceAnomalies.push(...panelAnomalies);
      } else {
        const split = await splitSheetDeterministic(keyedBuffer, {
          preferredFrames: profileStates[animation]?.targetFrames || 0,
        }, animation);
        const state = animation;
        if (!stateFrames[state]) stateFrames[state] = [];
        for (const f of split.frames) {
          stateFrames[state].push({ buffer: f.buffer });
          produced += 1;
        }
        sourceAnomalies.push(...split.anomalies);
        frameOrderAnomalies.push(...split.anomalies.map(anomaly => ({ state: animation, ...anomaly })));
      }

      sourceFiles.push({
        file,
        animation,
        producedFrames: produced,
        selectedBy: selected.selectedBy || 'latest_timestamp',
      });
      console.log(`  ${animation}: ${produced} raw frame(s) from ${file}`);
    }

    // 2. Process new per-state PNG frame directories
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const state = entry.name;
      if (state === 'regenerated') continue; // Skip debug folder
      
      const statePath = path.join(hunterInput, state);
      const pngs = fs.readdirSync(statePath)
        .filter(f => /\.png$/i.test(f))
        .sort();
      
      if (pngs.length === 0) continue;
      
      // If we already have frames for this state (e.g. from a legacy sheet),
      // should we overwrite or append? Usually, we want the "new" ones to win.
      // For now, let's clear existing if we find a directory.
      if (stateFrames[state]) {
        console.log(`  found directory for ${state}, replacing legacy frames`);
        stateFrames[state] = [];
      } else {
        stateFrames[state] = [];
      }

      let produced = 0;
      for (const png of pngs) {
        const pngPath = path.join(statePath, png);
        const buffer = fs.readFileSync(pngPath);
        const keyed = await chromaKey(buffer); 
        stateFrames[state].push({ buffer: keyed });
        produced += 1;
      }

      sourceFiles.push({
        directory: state,
        animation: state,
        producedFrames: produced,
      });
      console.log(`  ${state}: ${produced} frames from ${statePath}`);
    }
  }

  const hunterWindows = sheetLock?.windows?.[hunter] || {};
  const contract = buildFrameContract(stateFrames, profileStates, requiredStates, hunterWindows);
  const normalizedPack = await normalizeHunterFrames(contract.output);
  const normalizedStates = normalizedPack.normalized;
  const imagesToPack = [];
  const stateCounts = {};
  const orderedStates = getOrderedStates(normalizedStates, requiredStates);

  for (const state of orderedStates) {
    const frames = normalizedStates[state];
    const safeFrames = Array.isArray(frames) ? frames : [];
    if (!safeFrames.length) continue;
    stateCounts[state] = safeFrames.length;

    if (safeFrames.length === 1) {
      const frameName = `${state}.png`;
      const outPath = path.join(hunterOutput, frameName);
      fs.writeFileSync(outPath, safeFrames[0].buffer);
      imagesToPack.push({ path: frameName, contents: safeFrames[0].buffer });
      continue;
    }

    for (let i = 0; i < safeFrames.length; i += 1) {
      const frameName = `${state}_${String(i + 1).padStart(2, '0')}.png`;
      const outPath = path.join(hunterOutput, frameName);
      fs.writeFileSync(outPath, safeFrames[i].buffer);
      imagesToPack.push({ path: frameName, contents: safeFrames[i].buffer });
    }
  }

  imagesToPack.sort((a, b) => a.path.localeCompare(b.path));

  const buildReport = {
    hunter,
    sourceFiles,
    states: stateCounts,
    sourceStateCounts: contract.sourceStateCounts,
    totalPackedFrames: imagesToPack.length,
    requiredStates,
    missingStates: contract.missingStates,
    countMismatches: contract.countMismatches,
    statesRequiringRegeneration: contract.statesRequiringRegeneration,
    normalizationCanvas: normalizedPack.canvas,
    targetCoreSize: normalizedPack.metrics.target_core_size,
    targetCoreLong: normalizedPack.metrics.target_core_long,
    anchor_drift_px: normalizedPack.metrics.anchor_drift_px,
    bbox_drift_px: normalizedPack.metrics.bbox_drift_px,
    size_drift_px: normalizedPack.metrics.size_drift_px,
    matte_artifact_ratio: normalizedPack.metrics.matte_artifact_ratio,
    frame_order_anomalies: frameOrderAnomalies,
    direction_panel_map: directionPanelMap,
    size_policy_violations: normalizedPack.sizePolicyViolations,
    filtered_outliers: normalizedPack.filteredOutliers,
  };

  let packedAtlasData = null;
  let packedAtlasImage = null;
  let packBackend = null;
  if (imagesToPack.length > 0) {
    console.log(`packing ${hunter} atlas (${imagesToPack.length} frames, backend=${PACKER_MODE})...`);
    const packed = await packAtlas(imagesToPack, hunterOutput, hunter);
    packedAtlasData = packed.atlasData;
    packedAtlasImage = packed.atlasImage;
    packBackend = packed.backend;
  }

  const atlasFrames = parseAtlasFrames(packedAtlasData);
  const packedCount = atlasFrames.length;
  const expectedNames = imagesToPack.map(item => stripExt(item.path));
  const expectedSet = new Set(expectedNames);
  const atlasSet = new Set(atlasFrames);
  const missingInAtlas = expectedNames.filter(name => !atlasSet.has(name));
  const extraInAtlas = atlasFrames.filter(name => !expectedSet.has(name));

  const rotatedFrames = [];
  if (Array.isArray(packedAtlasData?.frames)) {
    for (const frame of packedAtlasData.frames) {
      if (!frame?.rotated) continue;
      const key = frame.filename || frame.name || frame.id;
      rotatedFrames.push(stripExt(key));
    }
  } else if (packedAtlasData?.frames && typeof packedAtlasData.frames === 'object') {
    for (const [key, frame] of Object.entries(packedAtlasData.frames)) {
      if (!frame?.rotated) continue;
      rotatedFrames.push(stripExt(key));
    }
  }

  const audit = {
    hunter,
    source_used: sourceFiles.map(entry => entry.file),
    source_file_count: sourceFiles.length,
    packed_count: packedCount,
    state_counts: stateCounts,
    required_states: requiredStates.slice(),
    missing_states: contract.missingStates,
    count_mismatches: contract.countMismatches,
    states_requiring_regeneration: contract.statesRequiringRegeneration,
    source_to_atlas: {
      expected_count: expectedNames.length,
      atlas_count: packedCount,
      missing_in_atlas: missingInAtlas,
      extra_in_atlas: extraInAtlas,
    },
    anchor_drift_px: normalizedPack.metrics.anchor_drift_px,
    bbox_drift_px: normalizedPack.metrics.bbox_drift_px,
    size_drift_px: normalizedPack.metrics.size_drift_px,
    matte_artifact_ratio: normalizedPack.metrics.matte_artifact_ratio,
    per_state_metrics: normalizedPack.metrics.state,
    normalization_canvas: normalizedPack.canvas,
    target_core_size: normalizedPack.metrics.target_core_size,
    target_core_long: normalizedPack.metrics.target_core_long,
    frame_order_anomalies: frameOrderAnomalies,
    direction_panel_map: directionPanelMap,
    size_policy_violations: normalizedPack.sizePolicyViolations,
    filtered_outliers: normalizedPack.filteredOutliers,
    rotated_frames: rotatedFrames,
    atlas_image: packedAtlasImage,
    atlas_data: `${hunter}-atlas.json`,
    pack_backend: packBackend,
  };

  writeJson(path.join(SPRITES_DIR, `${hunter}-build-report.json`), buildReport);
  writeJson(path.join(SPRITES_DIR, `${hunter}-atlas-audit.json`), audit);

  return {
    hunter,
    atlasReady: fs.existsSync(path.join(SPRITES_DIR, `${hunter}-atlas.json`))
      && fs.existsSync(path.join(SPRITES_DIR, `${hunter}-atlas.webp`)),
    audit,
  };
}

function writeManifest(results) {
  const manifest = {
    atlases: {},
    audits: {},
  };

  for (const result of results) {
    manifest.atlases[result.hunter] = result.atlasReady === true;
    manifest.audits[result.hunter] = {
      path: `${result.hunter}-atlas-audit.json`,
      missingStates: result.audit?.missing_states?.length || 0,
      countMismatches: result.audit?.count_mismatches?.length || 0,
      regenStates: result.audit?.states_requiring_regeneration?.length || 0,
      sizeViolations: result.audit?.size_policy_violations?.length || 0,
      sourceToAtlasMismatch: (
        (result.audit?.source_to_atlas?.missing_in_atlas?.length || 0)
        + (result.audit?.source_to_atlas?.extra_in_atlas?.length || 0)
      ),
      matteArtifactRatio: result.audit?.matte_artifact_ratio || 0,
      sizeDriftPx: result.audit?.size_drift_px || 0,
    };
  }

  writeJson(path.join(SPRITES_DIR, 'manifest.json'), manifest);
}

async function processSprites() {
  const profile = await loadProfileModule();
  const sheetLock = loadHunterSheetLock();
  const profileStates = profile.GAMEPLAY_ANIMATION_PROFILE?.states || {};
  const requiredStates = typeof profile.getRequiredPipelineStates === 'function'
    ? profile.getRequiredPipelineStates()
    : [];

  const renames = [
    {
      old: path.join(FLOW_OUTPUT, 'benzu', 'benzu-ulitmate_202604250049.jpeg'),
      next: path.join(FLOW_OUTPUT, 'benzu', 'benzu-ultimate_202604250049.jpeg'),
    },
    {
      old: path.join(FLOW_OUTPUT, 'sereisa', 'sereisa-spell-advanced_202604250154.jpeg'),
      next: path.join(FLOW_OUTPUT, 'sereisa', 'sereisa-spell_advanced_202604250154.jpeg'),
    },
  ];
  for (const rename of renames) {
    if (!fs.existsSync(rename.old)) continue;
    try {
      fs.renameSync(rename.old, rename.next);
      console.log(`renamed ${path.basename(rename.old)} -> ${path.basename(rename.next)}`);
    } catch (error) {
      console.warn(`rename failed ${rename.old}: ${error.message}`);
    }
  }

  const results = [];
  for (const hunter of HUNTERS) {
    const result = await processHunter(hunter, profileStates, requiredStates, sheetLock);
    results.push(result);
  }
  writeManifest(results);

  const failures = [];
  for (const result of results) {
    const audit = result.audit || {};
    const hunter = result.hunter;
    if ((audit.missing_states || []).length) failures.push(`${hunter}:missing_states`);
    if ((audit.count_mismatches || []).length) failures.push(`${hunter}:count_mismatches`);
    if ((audit.states_requiring_regeneration || []).length) failures.push(`${hunter}:regen_required`);
    if ((audit.size_policy_violations || []).length) failures.push(`${hunter}:size_policy_violations`);
    if ((audit.source_to_atlas?.missing_in_atlas || []).length || (audit.source_to_atlas?.extra_in_atlas || []).length) {
      failures.push(`${hunter}:source_to_atlas_mismatch`);
    }
    if ((audit.rotated_frames || []).length) failures.push(`${hunter}:rotated_frames`);
    if (STRICT_SIZE_DRIFT && (audit.size_drift_px || 0) > MAX_SIZE_DRIFT_PX) failures.push(`${hunter}:size_drift`);
    if ((audit.matte_artifact_ratio || 0) > MAX_MATTE_ARTIFACT_RATIO) failures.push(`${hunter}:matte_artifact_ratio`);
  }

  if (failures.length) {
    console.warn('sprite pipeline strict failures:');
    for (const failure of failures) console.warn(`  - ${failure}`);
    if (STRICT_CONTRACT) {
      throw new Error(`Sprite contract failed (${failures.length} issue groups).`);
    }
  }
}

processSprites().catch((error) => {
  console.error('fatal error:', error);
  process.exit(1);
});
