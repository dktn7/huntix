const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { packAsync } = require('free-tex-packer-core');

// Updated map based on actual filenames present in the directories
const ENEMY_CONFIGS = {
  grunt: {
    animations: { 
      idle: ['idle', 'idle-2'], 
      walk: ['walk', 'walk-2'], 
      attack: ['attack-1', 'attack-2', 'attack-3'], 
      hurt: ['hurt', 'hurt-2'],
      dead: ['dead'] 
    }
  },
  // Need to investigate others or assume same logic
};

async function chromaKey(inputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const tolerance = 45;
  for (let i = 0; i < data.length; i += 4) {
    const diff = Math.sqrt(Math.pow(data[i] - 0, 2) + Math.pow(data[i+1] - 255, 2) + Math.pow(data[i+2] - 0, 2));
    if (diff < tolerance) data[i+3] = 0;
    else if (data[i+1] > data[i] && data[i+1] > data[i+2]) data[i+1] = (data[i] + data[i+2]) / 2;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function processEnemies() {
  for (const [enemyType, config] of Object.entries(ENEMY_CONFIGS)) {
    const inputDir = path.join('assets', 'sprites', 'enemies', enemyType);
    const outputDir = path.join('assets', 'sprites', 'enemies', 'packed', enemyType);
    fs.mkdirSync(outputDir, { recursive: true });

    const imagesToPack = [];
    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.jpeg'));

    for (const [animName, patterns] of Object.entries(config.animations)) {
      for (const pattern of patterns) {
        const match = files.find(f => f.toLowerCase().includes(pattern.toLowerCase()));
        if (!match) continue;

        const inputPath = path.join(inputDir, match);
        const frameBuffer = await chromaKey(inputPath);
        imagesToPack.push({ path: `${animName}_${pattern}.png`, contents: frameBuffer });
      }
    }

    if (imagesToPack.length > 0) {
      const options = { textureName: `${enemyType}-atlas`, width: 4096, height: 4096, padding: 2, extrude: 1, allowTrim: true, exporter: 'PhaserHash' };
      const files = await packAsync(imagesToPack, options);
      for (const file of files) {
        const out = path.join(outputDir, file.name);
        if (file.name.endsWith('.png')) {
          await sharp(file.buffer || Buffer.from(file.content)).webp({ quality: 90 }).toFile(out.replace('.png', '.webp'));
        } else {
          fs.writeFileSync(out, file.buffer || Buffer.from(file.content));
        }
      }
      console.log(`✓ Packed ${enemyType}`);
    }
  }
}

processEnemies().catch(console.error);
