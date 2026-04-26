const fs = require('fs');
const path = require('path');
const https = require('https');

// Simple queue-based fal client using native fetch (Node 18+)
async function falQueueRun(model, prompt, outputPath) {
  const FAL_KEY = process.env.FAL_KEY;
  if (!FAL_KEY) {
    console.error("FAL_KEY environment variable not set!");
    return;
  }

  const endpoint = `https://fal.run/openai/gpt-image-2/t2i`;
  
  // Submit
  const submitRes = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image_size: "square_hd" })
  });
  
  if (!submitRes.ok) {
    const errorText = await submitRes.text();
    console.error(`Submit failed (${submitRes.status}):`, errorText);
    return;
  }
  const { request_id } = await submitRes.json();
  console.log(`Submitted job, request_id: ${request_id}`);

  // Poll
  while (true) {
    const statusRes = await fetch(`${endpoint}/requests/${request_id}/status`, {
      headers: { 'Authorization': `Key ${FAL_KEY}` }
    });
    const { status } = await statusRes.json();
    console.log(`Status: ${status}`);
    if (status === 'COMPLETED') break;
    if (status === 'FAILED') throw new Error('Generation failed');
    await new Promise(r => setTimeout(r, 2000));
  }

  // Result
  const resultRes = await fetch(`${endpoint}/requests/${request_id}`, {
    headers: { 'Authorization': `Key ${FAL_KEY}` }
  });
  const { images } = await resultRes.json();
  
  // Download first image
  const imgUrl = images[0].url;
  const file = fs.createWriteStream(outputPath);
  https.get(imgUrl, (res) => res.pipe(file));
  console.log(`✓ Saved to ${outputPath}`);
}

async function testGen() {
  const prompt = "A fantasy game enemy, Grunt, base palette grey/brown with cracked gate energy skin, flat green background #00FF00, no text, no UI, wide readable silhouette, IDLE animation frame 0";
  const outputDir = path.join('assets', 'sprites', 'enemies', 'grunt', 'test');
  fs.mkdirSync(outputDir, { recursive: true });
  
  await falQueueRun("gpt-image-1.5-t2i", prompt, path.join(outputDir, "idle_0.jpeg"));
}

testGen().catch(console.error);
