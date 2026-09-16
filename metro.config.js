const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix phosphor-react-native entry point for Metro bundler
const originalResolveRequest = config.resolver?.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'phosphor-react-native') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/phosphor-react-native/lib/module/index.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
