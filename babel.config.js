const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\acer laptop\\.gemini\\antigravity-ide\\brain\\3064e3c0-83da-49d7-a0cf-107753304a1d';
const destDir = path.join(__dirname, 'assets', 'images');

const filesToCopy = {
  'wally_smiling_1781342489584.png': 'pouchy_smiling.png',
  'wally_happy_1781342597073.png': 'pouchy_happy.png',
  'wally_sad_1781342636814.png': 'pouchy_sad.png',
  'wally_mad_1781342668728.png': 'pouchy_mad.png'
};

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  for (const [srcName, destName] of Object.entries(filesToCopy)) {
    const srcPath = path.join(srcDir, srcName);
    const destPath = path.join(destDir, destName);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
} catch (err) {
  console.error('Failed to copy Wally mascot images:', err);
}

module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: ['@tamagui/babel-plugin'],
  }
}

