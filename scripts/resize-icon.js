import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Sizes needed for iOS
const sizes = [
  { name: 'apple-touch-icon.png', size: 180 },           // Default/iPhone retina
  { name: 'apple-touch-icon-180x180.png', size: 180 },  // iPhone retina
  { name: 'apple-touch-icon-167x167.png', size: 167 },  // iPad Pro
  { name: 'apple-touch-icon-152x152.png', size: 152 },  // iPad retina
];

async function resizeIcon(inputPath) {
  const image = await loadImage(inputPath);

  for (const { name, size } of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Draw image scaled to target size
    ctx.drawImage(image, 0, 0, size, size);

    const outputPath = path.join(__dirname, '..', 'public', name);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`✓ ${name} (${size}x${size})`);
  }

  console.log('\n✓ All icons generated in public/');
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/resize-icon.js <path-to-icon.png>');
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`Error: File not found: ${inputPath}`);
  process.exit(1);
}

resizeIcon(inputPath);
