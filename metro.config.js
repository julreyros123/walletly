const { getDefaultConfig } = require('expo/metro-config');
const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Running automatic mascot background remover...');
  execSync('node scripts/remove-background.js', { stdio: 'inherit' });
} catch (err) {
  console.error('Failed to run automatic mascot background removal:', err);
}

const config = getDefaultConfig(__dirname);

module.exports = config;
