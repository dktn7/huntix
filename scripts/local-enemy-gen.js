const { pipeline, env } = require('@xenova/transformers');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

env.allowLocalModels = true;
env.useBrowserCache = false;

const MODEL_NAME = 'Xenova/stable-diffusion-2-1-base';

async function generateFrame(prompt, outputPath, targetSize = { width: 256, height: 256 }) {
  console.log(`Generating frame: ${outputPath}`);
  const generator = await pipeline('text-to-image', MODEL_NAME);
  
  const result = await generator(prompt, {
    num_inference_steps: 20,
    guidance_scale: 7.5,
  });

  const imageBuffer = Buffer.from(result[0].data);
  
  await sharp(imageBuffer, { raw: { width: 512, height: 512, channels: 4 } })
    .resize(targetSize.width, targetSize.height)
    .ensureAlpha()
    .png()
    .toFile(outputPath);
    
  console.log(`✓ Saved to ${outputPath}`);
}

async function runBatchGen(config) {
  console.log("Initializing local generation pipeline...");
  
  for (const { enemyType, state, frameCount, prompt, targetSize } of config) {
    const outputDir = path.join('assets', 'sprites', 'enemies', enemyType.toLowerCase());
    fs.mkdirSync(outputDir, { recursive: true });

    for (let i = 0; i < frameCount; i++) {
      const outputPath = path.join(outputDir, `${state}_${i}.png`);
      if (!fs.existsSync(outputPath)) {
        await generateFrame(`${prompt}, frame ${i}`, outputPath, targetSize);
      }
    }
  }
}

// Huntix 2.5D Brawler Enemy Config
const generationConfig = [
  // GRUNT: Base palette: grey/brown, cracked gate energy skin
  { enemyType: 'grunt', state: 'idle', frameCount: 4, prompt: 'Fantasy brawler enemy Grunt, grey and brown palette, cracked gate energy, side-scroll, clean silhouette, idle pose, flat green background', targetSize: { width: 210, height: 245 } },
  { enemyType: 'grunt', state: 'walk', frameCount: 4, prompt: 'Fantasy brawler enemy Grunt, grey and brown palette, cracked gate energy, side-scroll, clean silhouette, walking pose, flat green background', targetSize: { width: 210, height: 245 } },
  
  // RANGED: Dark body, white-blue crystal glow focal point
  { enemyType: 'ranged', state: 'idle', frameCount: 4, prompt: 'Fantasy brawler enemy Ranged Unit, dark body, white-blue crystal glow, side-scroll, clean silhouette, idle pose, flat green background', targetSize: { width: 211, height: 226 } },
  { enemyType: 'ranged', state: 'walk', frameCount: 6, prompt: 'Fantasy brawler enemy Ranged Unit, dark body, white-blue crystal glow, side-scroll, clean silhouette, walking pose, flat green background', targetSize: { width: 211, height: 226 } },
  
  // BRUISER: Dark stone and metal ore plating, 2x player height
  { enemyType: 'bruiser', state: 'idle', frameCount: 4, prompt: 'Fantasy brawler enemy Bruiser, dark stone and metal ore plating, 2x height, side-scroll, clean silhouette, idle pose, flat green background', targetSize: { width: 223, height: 352 } },
  { enemyType: 'bruiser', state: 'walk', frameCount: 4, prompt: 'Fantasy brawler enemy Bruiser, dark stone and metal ore plating, 2x height, side-scroll, clean silhouette, walking pose, flat green background', targetSize: { width: 223, height: 352 } }
];

runBatchGen(generationConfig).catch(err => {
  console.error("Pipeline failed:", err);
});
