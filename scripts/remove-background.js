const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Ensure jimp is installed
try {
  require.resolve('jimp');
} catch (e) {
  console.log('Installing jimp for image background removal...');
  try {
    execSync('npm install jimp@0.22.12', { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to install jimp automatically:', err);
  }
}

let Jimp;
try {
  Jimp = require('jimp');
} catch (e) {
  console.error('Jimp is not loaded. Cannot process images.');
}

const srcDir = 'C:\\Users\\acer laptop\\.gemini\\antigravity-ide\\brain\\3064e3c0-83da-49d7-a0cf-107753304a1d';
const destDir = path.join(__dirname, '..', 'assets', 'images');

const filesToProcess = {
  'wally_smiling_1781342489584.png': 'pouchy_smiling.png',
  'wally_happy_1781342597073.png': 'pouchy_happy.png',
  'wally_sad_1781342636814.png': 'pouchy_sad.png',
  'wally_mad_1781342668728.png': 'pouchy_mad.png'
};

async function processImages() {
  if (!Jimp) return;
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  for (const [srcName, destName] of Object.entries(filesToProcess)) {
    const srcPath = path.join(srcDir, srcName);
    const destPath = path.join(destDir, destName);

    if (!fs.existsSync(srcPath)) {
      console.error(`Source image not found: ${srcPath}`);
      continue;
    }

    console.log(`Processing ${srcName} -> ${destName}...`);
    try {
      const image = await Jimp.read(srcPath);
      const width = image.bitmap.width;
      const height = image.bitmap.height;

      // Flood fill background removal from corners
      const visited = new Set();
      const queue = [];

      // Add 4 corners
      const corners = [
        { x: 0, y: 0 },
        { x: width - 1, y: 0 },
        { x: 0, y: height - 1 },
        { x: width - 1, y: height - 1 }
      ];

      for (const corner of corners) {
        const key = `${corner.x},${corner.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(corner);
        }
      }

      // We'll treat a pixel as background if:
      // - It is close to white (R,G,B > 200)
      // - It is close to light grey (R,G,B between 180 and 220, and similar to each other)
      // - Or if it's very close to the corner pixel color
      const isBackgroundPixel = (r, g, b, a) => {
        if (a < 10) return true; // Already transparent
        
        // Check if white
        if (r > 200 && g > 200 && b > 200) return true;
        
        // Check if grey checkerboard pattern square
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(b - r));
        if (maxDiff < 15 && r > 150 && r < 235) return true;

        return false;
      };

      while (queue.length > 0) {
        const { x, y } = queue.shift();

        // Get pixel color
        const pixelColor = image.getPixelColor(x, y);
        const { r, g, b, a } = Jimp.intToRGBA(pixelColor);

        if (isBackgroundPixel(r, g, b, a)) {
          // Set to transparent
          image.setPixelColor(0x00000000, x, y);

          // Add neighbors
          const neighbors = [
            { x: x + 1, y },
            { x: x - 1, y },
            { x, y: y + 1 },
            { x, y: y - 1 }
          ];

          for (const n of neighbors) {
            if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
              const nKey = `${n.x},${n.y}`;
              if (!visited.has(nKey)) {
                visited.add(nKey);
                queue.push(n);
              }
            }
          }
        }
      }

      await image.writeAsync(destPath);
      console.log(`Successfully processed and saved transparent mascot to ${destPath}`);
    } catch (err) {
      console.error(`Failed to process image ${srcName}:`, err);
    }
  }
}

processImages().catch(console.error);
