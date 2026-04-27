const ENTITY_IDS = [
  'hunter',
  'dabik',
  'benzu',
  'sereisa',
  'vesol',
  'grunt',
  'ranged',
  'bruiser',
  'fire-bruiser',
  'vrael',
  'zarth',
  'kibad',
  'thyxis',
  'stampede',
  'tomb-crawler'
];
const DIRECTIONS = ['left', 'right', 'front', 'back'];
const STATES = [
  'idle',
  'run',
  'walk',
  'telegraph',
  'attack',
  'recover',
  'hurt',
  'dead',
  'strafe',
  'retreat',
  'shove',
  'attacklight',
  'attackheavy',
  'dodge',
  'spellminor',
  'spelladvanced',
  'ultimate',
  'phase2',
  'phase3'
];
const EXPORT_SIZES = {
  full: null,
  game: [128, 192],
  enemy: [192, 192],
  boss: [320, 320],
  ui: [64, 96]
};

const state = {
  files: [],
  outputs: [],
  selectedId: null,
  previewTab: 'original',
  defaultMode: 'single',
  sizes: new Set(['full', 'game']),
  defaults: {
    tolerance: 40,
    manualColor: '#00ff00',
    autoColor: true,
    feather: true
  }
};

const ui = {
  dropzone: document.getElementById('dropzone'),
  fileInput: document.getElementById('fileInput'),
  fileList: document.getElementById('fileList'),
  emptyQueue: document.getElementById('emptyQueue'),
  fileCountBadge: document.getElementById('fileCountBadge'),
  processBtn: document.getElementById('processBtn'),
  globalStatus: document.getElementById('globalStatus'),
  sizeRow: document.getElementById('sizeRow'),
  globalModeRow: document.getElementById('globalModeRow'),
  defaultColor: document.getElementById('defaultColor'),
  defaultTolerance: document.getElementById('defaultTolerance'),
  defaultToleranceValue: document.getElementById('defaultToleranceValue'),
  defaultFeather: document.getElementById('defaultFeather'),
  defaultAutoColor: document.getElementById('defaultAutoColor'),
  advancedToggle: document.getElementById('advancedToggle'),
  advancedPanel: document.getElementById('advancedPanel'),
  resetAllBtn: document.getElementById('resetAllBtn'),
  downloadZipBtn: document.getElementById('downloadZipBtn'),
  emptyPreview: document.getElementById('emptyPreview'),
  previewPane: document.getElementById('previewPane'),
  mainPreviewCanvas: document.getElementById('mainPreviewCanvas'),
  selectedStatus: document.getElementById('selectedStatus'),
  selectedQuality: document.getElementById('selectedQuality'),
  selectedTrim: document.getElementById('selectedTrim'),
  resultsSection: document.getElementById('resultsSection'),
  resultsGrid: document.getElementById('resultsGrid'),
  previewTabs: [...document.querySelectorAll('[data-preview-tab]')],
  steps: [...document.querySelectorAll('.step')]
};

init();

function init() {
  bindUpload();
  bindControls();
  render();
}

function bindUpload() {
  ['dragenter', 'dragover'].forEach(type => {
    ui.dropzone.addEventListener(type, e => {
      e.preventDefault();
      ui.dropzone.classList.add('dragging');
    });
  });

  ['dragleave', 'drop'].forEach(type => {
    ui.dropzone.addEventListener(type, e => {
      e.preventDefault();
      ui.dropzone.classList.remove('dragging');
    });
  });

  ui.dropzone.addEventListener('drop', e => addFiles(e.dataTransfer.files));
  ui.fileInput.addEventListener('change', e => addFiles(e.target.files));
}

function bindControls() {
  [...ui.sizeRow.querySelectorAll('[data-size]')].forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      if (state.sizes.has(size)) {
        if (state.sizes.size === 1) return;
        state.sizes.delete(size);
      } else {
        state.sizes.add(size);
      }
      renderSizeButtons();
    });
  });

  [...ui.globalModeRow.querySelectorAll('[data-global-mode]')].forEach(btn => {
    btn.addEventListener('click', () => {
      state.defaultMode = btn.dataset.globalMode;
      renderGlobalModeButtons();
    });
  });

  ui.defaultColor.addEventListener('input', () => state.defaults.manualColor = ui.defaultColor.value);
  ui.defaultTolerance.addEventListener('input', () => {
    state.defaults.tolerance = Number(ui.defaultTolerance.value);
    ui.defaultToleranceValue.textContent = String(state.defaults.tolerance);
  });
  ui.defaultFeather.addEventListener('change', () => state.defaults.feather = ui.defaultFeather.checked);
  ui.defaultAutoColor.addEventListener('change', () => state.defaults.autoColor = ui.defaultAutoColor.checked);

  ui.advancedToggle.addEventListener('click', () => {
    const open = ui.advancedPanel.classList.toggle('hidden');
    ui.advancedToggle.setAttribute('aria-expanded', String(!open));
  });

  ui.processBtn.addEventListener('click', processAll);
  ui.resetAllBtn.addEventListener('click', clearAll);
  ui.downloadZipBtn.addEventListener('click', downloadZip);

  ui.previewTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      state.previewTab = btn.dataset.previewTab;
      renderPreviewTabs();
      renderSelectedPreview();
    });
  });
}

function addFiles(fileList) {
  const files = [...fileList].filter(file => file.type.startsWith('image/'));
  files.forEach(file => {
    const lower = file.name.toLowerCase();
    const mode = /(sheet|direction|4-panel|4panel|strip)/.test(lower) ? 'sheet' : state.defaultMode;
    const character = ENTITY_IDS.find(name => name !== 'hunter' && lower.includes(name)) || 'hunter';
    state.files.push({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      mode,
      character,
      stateName: 'idle',
      tolerance: state.defaults.tolerance,
      manualColor: state.defaults.manualColor,
      autoColor: state.defaults.autoColor,
      feather: state.defaults.feather,
      sampledColor: '#00ff00',
      sourceCanvas: null,
      processedCanvas: null,
      quality: null,
      trimBox: '-',
      outputs: [],
      loading: true,
      error: null
    });
  });

  if (!state.selectedId && state.files.length) {
    state.selectedId = state.files[0].id;
  }

  render();
  state.files.filter(file => file.loading).forEach(loadFileImage);
}

async function loadFileImage(fileEntry) {
  try {
    const img = await loadImage(fileEntry.url);
    fileEntry.sourceCanvas = imageToCanvas(img);
    fileEntry.sampledColor = autoSampleChroma(fileEntry.sourceCanvas);
    refreshProcessed(fileEntry);
    fileEntry.loading = false;
    fileEntry.error = null;
  } catch (error) {
    fileEntry.loading = false;
    fileEntry.error = 'Failed to load image';
  }
  render();
}

function refreshProcessed(fileEntry) {
  if (!fileEntry.sourceCanvas) return;
  const chroma = fileEntry.autoColor ? fileEntry.sampledColor : fileEntry.manualColor;
  fileEntry.processedCanvas = processCanvas(fileEntry.sourceCanvas, chroma, fileEntry.tolerance, fileEntry.feather);
  fileEntry.quality = detectQuality(fileEntry.processedCanvas, chroma);
  fileEntry.trimBox = fileEntry.quality.trimBox;
}

function render() {
  renderSizeButtons();
  renderGlobalModeButtons();
  renderQueue();
  renderSelectedPreview();
  renderOutputs();
  syncWorkflowState();
}

function renderSizeButtons() {
  [...ui.sizeRow.querySelectorAll('[data-size]')].forEach(btn => {
    btn.classList.toggle('active', state.sizes.has(btn.dataset.size));
  });
}

function renderGlobalModeButtons() {
  [...ui.globalModeRow.querySelectorAll('[data-global-mode]')].forEach(btn => {
    btn.classList.toggle('active', btn.dataset.globalMode === state.defaultMode);
  });
}

function renderQueue() {
  ui.fileList.innerHTML = '';
  ui.emptyQueue.classList.toggle('hidden', state.files.length > 0);
  ui.fileCountBadge.textContent = `${state.files.length} file${state.files.length === 1 ? '' : 's'}`;

  state.files.forEach(file => {
    const card = document.createElement('article');
    card.className = `queue-item ${file.id === state.selectedId ? 'selected' : ''}`;

    card.innerHTML = `
      <div class="queue-top">
        <button class="thumb-btn" type="button">
          <img src="${file.url}" alt="${escapeHtml(file.file.name)}" class="thumb" />
        </button>
        <div class="queue-headcopy">
          <strong>${escapeHtml(file.file.name)}</strong>
          <span>${Math.round(file.file.size / 1024)} KB</span>
        </div>
        <button class="icon-btn danger" data-remove="${file.id}" aria-label="Remove file">✕</button>
      </div>

      <div class="queue-fields">
        <label class="field small-field">
          <span>Entity</span>
          <select data-character>
            ${ENTITY_IDS.map(name => `<option value="${name}" ${file.character === name ? 'selected' : ''}>${name}</option>`).join('')}
          </select>
        </label>

        <label class="field small-field">
          <span>Mode</span>
          <select data-mode>
            <option value="single" ${file.mode === 'single' ? 'selected' : ''}>Single sprite</option>
            <option value="sheet" ${file.mode === 'sheet' ? 'selected' : ''}>4-panel sheet</option>
          </select>
        </label>

        <label class="field small-field">
          <span>State</span>
          <select data-state>
            ${STATES.map(name => `<option value="${name}" ${file.stateName === name ? 'selected' : ''}>${name}</option>`).join('')}
          </select>
        </label>

        <label class="field small-field">
          <span>Tolerance</span>
          <input type="range" min="0" max="180" value="${file.tolerance}" data-tolerance />
        </label>
      </div>

      <div class="queue-flags">
        <label class="checkline compact"><input type="checkbox" data-auto-color ${file.autoColor ? 'checked' : ''} /> Auto chroma</label>
        <label class="checkline compact"><input type="checkbox" data-feather ${file.feather ? 'checked' : ''} /> Feather</label>
        <label class="field inline-color">
          <span>Key</span>
          <input type="color" value="${file.manualColor}" data-color />
        </label>
      </div>

      <div class="queue-footer">
        <span class="status-pill ${file.error ? 'bad' : file.loading ? 'warn' : 'good'}">${file.error || (file.loading ? 'Loading…' : 'Ready')}</span>
        <button class="btn btn-ghost small" data-select="${file.id}">Inspect</button>
      </div>
    `;

    card.querySelector('.thumb-btn').addEventListener('click', () => selectFile(file.id));
    card.querySelector('[data-select]').addEventListener('click', () => selectFile(file.id));
    card.querySelector('[data-remove]').addEventListener('click', () => removeFile(file.id));
    card.querySelector('[data-character]').addEventListener('change', e => file.character = e.target.value);
    card.querySelector('[data-mode]').addEventListener('change', e => file.mode = e.target.value);
    card.querySelector('[data-state]').addEventListener('change', e => file.stateName = e.target.value);
    card.querySelector('[data-tolerance]').addEventListener('input', e => {
      file.tolerance = Number(e.target.value);
      refreshProcessed(file);
      if (file.id === state.selectedId) renderSelectedPreview();
    });
    card.querySelector('[data-auto-color]').addEventListener('change', e => {
      file.autoColor = e.target.checked;
      refreshProcessed(file);
      if (file.id === state.selectedId) renderSelectedPreview();
    });
    card.querySelector('[data-feather]').addEventListener('change', e => {
      file.feather = e.target.checked;
      refreshProcessed(file);
      if (file.id === state.selectedId) renderSelectedPreview();
    });
    card.querySelector('[data-color]').addEventListener('input', e => {
      file.manualColor = e.target.value;
      if (!file.autoColor) {
        refreshProcessed(file);
        if (file.id === state.selectedId) renderSelectedPreview();
      }
    });

    ui.fileList.appendChild(card);
  });
}

function renderSelectedPreview() {
  const file = state.files.find(entry => entry.id === state.selectedId);
  renderPreviewTabs();

  if (!file) {
    ui.emptyPreview.classList.remove('hidden');
    ui.previewPane.classList.add('hidden');
    return;
  }

  ui.emptyPreview.classList.add('hidden');
  ui.previewPane.classList.remove('hidden');

  const source = state.previewTab === 'processed' ? file.processedCanvas || file.sourceCanvas : file.sourceCanvas;
  if (source) drawCanvas(source, ui.mainPreviewCanvas);

  ui.selectedStatus.textContent = file.error || (file.loading ? 'Loading…' : 'Ready');
  ui.selectedQuality.textContent = file.quality ? `${file.quality.confidence} / ${file.quality.spill}` : '-';
  ui.selectedTrim.textContent = file.trimBox || '-';
}

function renderPreviewTabs() {
  ui.previewTabs.forEach(btn => btn.classList.toggle('active', btn.dataset.previewTab === state.previewTab));
}

function syncWorkflowState() {
  const count = state.files.length;
  ui.processBtn.disabled = count === 0;
  ui.downloadZipBtn.disabled = state.outputs.length === 0;
  ui.globalStatus.textContent = count === 0
    ? 'Nothing loaded yet.'
    : state.outputs.length
      ? `Processed ${state.outputs.length} output file${state.outputs.length === 1 ? '' : 's'}.`
      : `${count} file${count === 1 ? '' : 's'} queued.`;

  ui.steps.forEach(step => step.classList.remove('active'));
  if (!count) {
    ui.steps[0].classList.add('active');
  } else if (!state.outputs.length) {
    ui.steps[1].classList.add('active');
  } else {
    ui.steps[2].classList.add('active');
  }
}

async function processAll() {
  state.outputs.forEach(out => URL.revokeObjectURL(out.url));
  state.outputs = [];

  for (const file of state.files) {
    if (!file.sourceCanvas) continue;
    refreshProcessed(file);
    file.outputs = [];
    const baseName = `${file.character}-${safeName(stripExt(file.file.name))}-${file.stateName}`;

    if (file.mode === 'sheet') {
      const panels = splitIntoFour(file.processedCanvas || file.sourceCanvas);
      panels.forEach((panel, index) => exportVariants(panel, `${baseName}-${DIRECTIONS[index]}`, file));
    } else {
      exportVariants(autoTrimAndAlign(file.processedCanvas || file.sourceCanvas), baseName, file);
    }
  }

  renderOutputs();
  syncWorkflowState();
}

function exportVariants(canvas, baseName, file) {
  state.sizes.forEach(size => {
    let outputCanvas = canvas;
    let suffix = 'full';
    if (size !== 'full') {
      const [w, h] = EXPORT_SIZES[size];
      outputCanvas = resizeCanvas(canvas, w, h);
      suffix = `${w}x${h}`;
    }

    const dataUrl = outputCanvas.toDataURL('image/png');
    const blob = dataUrlToBlob(dataUrl);
    const output = {
      name: `${baseName}-${suffix}.png`,
      url: URL.createObjectURL(blob),
      blob
    };
    file.outputs.push(output);
    state.outputs.push(output);
  });
}

function renderOutputs() {
  ui.resultsGrid.innerHTML = '';
  ui.resultsSection.classList.toggle('hidden', state.outputs.length === 0);

  state.outputs.forEach(out => {
    const card = document.createElement('article');
    card.className = 'result-item';
    card.innerHTML = `
      <img src="${out.url}" alt="${escapeHtml(out.name)}" />
      <strong>${escapeHtml(out.name)}</strong>
      <button class="btn btn-ghost small">Download</button>
    `;
    card.querySelector('button').addEventListener('click', () => downloadUrl(out.url, out.name));
    ui.resultsGrid.appendChild(card);
  });
}

async function downloadZip() {
  const zip = new JSZip();
  state.outputs.forEach(out => zip.file(out.name, out.blob));
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  downloadUrl(url, 'huntix-sprite-tool-exports.zip');
}

function selectFile(id) {
  state.selectedId = id;
  render();
}

function removeFile(id) {
  const index = state.files.findIndex(file => file.id === id);
  if (index === -1) return;
  URL.revokeObjectURL(state.files[index].url);
  state.files.splice(index, 1);
  if (state.selectedId === id) state.selectedId = state.files[0]?.id || null;
  render();
}

function clearAll() {
  state.files.forEach(file => URL.revokeObjectURL(file.url));
  state.outputs.forEach(out => URL.revokeObjectURL(out.url));
  state.files = [];
  state.outputs = [];
  state.selectedId = null;
  render();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function imageToCanvas(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0);
  return canvas;
}

function drawCanvas(source, target) {
  const ratio = source.height / source.width;
  const width = Math.max(320, target.parentElement.clientWidth - 2);
  target.width = source.width;
  target.height = source.height;
  target.style.width = `${width}px`;
  target.style.height = `${Math.round(width * ratio)}px`;
  const ctx = target.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(source, 0, 0);
}

function processCanvas(source, chromaHex, tolerance, feather) {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const key = hexToRgb(chromaHex);

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - key.r;
    const dg = data[i + 1] - key.g;
    const db = data[i + 2] - key.b;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);

    if (distance <= tolerance) {
      data[i + 3] = 0;
    } else if (feather && distance < tolerance * 1.5) {
      const band = Math.max(1, tolerance * 0.5);
      const alpha = Math.max(0, Math.min(1, (distance - tolerance) / band));
      data[i + 3] = Math.round(data[i + 3] * alpha);
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

function autoSampleChroma(source) {
  const ctx = source.getContext('2d', { willReadFrequently: true });
  const points = [];
  const step = Math.max(1, Math.floor(Math.min(source.width, source.height) / 24));

  for (let x = 0; x < source.width; x += step) {
    points.push([x, 0], [x, source.height - 1]);
  }
  for (let y = 0; y < source.height; y += step) {
    points.push([0, y], [source.width - 1, y]);
  }

  let r = 0, g = 0, b = 0, count = 0;
  points.forEach(([x, y]) => {
    const px = ctx.getImageData(x, y, 1, 1).data;
    if (px[3] > 8) {
      r += px[0];
      g += px[1];
      b += px[2];
      count += 1;
    }
  });

  if (!count) return '#00ff00';
  return rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count));
}

function detectQuality(canvas, chromaHex) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const key = hexToRgb(chromaHex);
  let nonTransparent = 0;
  let greenish = 0;
  let partialAlpha = 0;

  for (let i = 0; i < image.length; i += 4) {
    const a = image[i + 3];
    if (a <= 0) continue;
    nonTransparent += 1;

    const dr = image[i] - key.r;
    const dg = image[i + 1] - key.g;
    const db = image[i + 2] - key.b;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);
    if (distance < 36) greenish += 1;
    if (a < 255) partialAlpha += 1;
  }

  const spillRate = nonTransparent ? greenish / nonTransparent : 0;
  const edgeRate = nonTransparent ? partialAlpha / nonTransparent : 0;
  const trimmed = trimCanvas(canvas, 8);
  const box = trimmed.trimBounds || { w: canvas.width, h: canvas.height, minX: 0, minY: 0 };

  return {
    confidence: spillRate < 0.02 ? 'High' : spillRate < 0.06 ? 'Medium' : 'Low',
    spill: spillRate < 0.02 ? 'Clean' : spillRate < 0.06 ? 'Some spill' : 'Needs work',
    edges: edgeRate < 0.06 ? 'Sharp' : edgeRate < 0.16 ? 'Soft' : 'Very feathered',
    trimBox: `${box.w}×${box.h} @ ${box.minX},${box.minY}`
  };
}

function trimCanvas(source, alphaThreshold = 8) {
  const ctx = source.getContext('2d', { willReadFrequently: true });
  const { width, height } = source;
  const image = ctx.getImageData(0, 0, width, height).data;
  let minX = width, minY = height, maxX = -1, maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = image[(y * width + x) * 4 + 3];
      if (alpha > alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return source;

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(source, minX, minY, w, h, 0, 0, w, h);
  canvas.trimBounds = { minX, minY, maxX, maxY, w, h };
  return canvas;
}

function autoTrimAndAlign(source) {
  const trimmed = trimCanvas(source, 8);
  const out = document.createElement('canvas');
  out.width = Math.max(source.width, trimmed.width);
  out.height = Math.max(source.height, trimmed.height);
  const ctx = out.getContext('2d');
  const x = Math.round((out.width - trimmed.width) / 2);
  const y = out.height - trimmed.height;
  ctx.drawImage(trimmed, x, y);
  return out;
}

function splitIntoFour(source) {
  const width = Math.floor(source.width / 4);
  return [0, 1, 2, 3].map(index => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = source.height;
    canvas.getContext('2d').drawImage(source, index * width, 0, width, source.height, 0, 0, width, source.height);
    return autoTrimAndAlign(canvas);
  });
}

function resizeCanvas(source, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

function dataUrlToBlob(dataUrl) {
  const [meta, content] = dataUrl.split(',');
  const mime = meta.match(/data:(.*?);base64/)[1];
  const bytes = atob(content);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) array[i] = bytes.charCodeAt(i);
  return new Blob([array], { type: mime });
}

function downloadUrl(url, name) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
}

function stripExt(name) {
  return name.replace(/\.[^.]+$/, '');
}

function safeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}
