const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const inPath = path.join(root, 'assets', 'sprites', 'bosses', 'thyxis', 'were1.png');
const outDir = path.join(root, 'assets', 'sprites', 'bosses', 'thyxis', 'generated');

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

async function renderVariant(srcBuffer, width, height, opts) {
  const scale = opts.scale ?? 1;
  const rot = opts.rotate ?? 0;
  const x = Math.round(opts.x ?? 0);
  const y = Math.round(opts.y ?? 0);

  const scaledW = Math.min(width, Math.max(1, Math.round(width * scale)));
  const scaledH = Math.min(height, Math.max(1, Math.round(height * scale)));

  const transformed = await sharp(srcBuffer)
    .rotate(rot, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(scaledW, scaledH, { fit: 'contain', kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();

  const rawLeft = Math.round((width - scaledW) / 2 + x);
  const rawTop = Math.round((height - scaledH) / 2 + y);
  const left = Math.max(0, Math.min(width - scaledW, rawLeft));
  const top = Math.max(0, Math.min(height - scaledH, rawTop));

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: transformed, left, top }])
    .png()
    .toBuffer();
}

async function generate() {
  if (!fs.existsSync(inPath)) throw new Error(`Missing source: ${inPath}`);
  ensureDir(outDir);
  for (const f of fs.readdirSync(outDir)) fs.rmSync(path.join(outDir, f), { force: true });

  const src = fs.readFileSync(inPath);
  const meta = await sharp(src).metadata();
  const width = meta.width;
  const height = meta.height;

  const plans = {
    idle: Array.from({ length: 8 }, (_, i) => ({ y: Math.round(Math.sin((i / 8) * Math.PI * 2) * 4), scale: 1 + Math.sin((i / 8) * Math.PI * 2) * 0.01 })),
    walk: Array.from({ length: 8 }, (_, i) => ({ x: (i % 2 === 0 ? -3 : 3), y: (i % 2 === 0 ? 2 : -2), rotate: (i % 2 === 0 ? -2 : 2) })),
    telegraph: Array.from({ length: 6 }, (_, i) => ({ y: Math.round(i * 2), scale: 1 - i * 0.01, rotate: -i * 0.5 })),
    attack: Array.from({ length: 8 }, (_, i) => ({ x: i < 4 ? i * 5 : (8 - i) * 5, y: i < 4 ? -i : -(8 - i), rotate: i < 4 ? i * 1.5 : (8 - i) * 1.5 })),
    hurt: Array.from({ length: 4 }, (_, i) => ({ x: i < 2 ? -8 : 4, rotate: i < 2 ? -6 : 2, y: i < 2 ? 2 : -1 })),
    dead: Array.from({ length: 8 }, (_, i) => ({ y: Math.round(i * 5), rotate: -i * 7, scale: 1 - i * 0.03 })),
  };

  for (const [state, variants] of Object.entries(plans)) {
    for (let i = 0; i < variants.length; i += 1) {
      const frame = await renderVariant(src, width, height, variants[i]);
      const name = `${state}_${String(i).padStart(2, '0')}.png`;
      fs.writeFileSync(path.join(outDir, name), frame);
    }
  }

  console.log(`generated thyxis frames in ${outDir}`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
