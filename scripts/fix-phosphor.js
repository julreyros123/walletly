const fs = require('fs');
const path = require('path');

// 1. Fix phosphor-react-native package.json
try {
  const phosphorPkgPath = path.resolve(__dirname, '../node_modules/phosphor-react-native/package.json');
  if (fs.existsSync(phosphorPkgPath)) {
    const raw = fs.readFileSync(phosphorPkgPath, 'utf8');
    const pkg = JSON.parse(raw);
    let changed = false;

    if (pkg['react-native'] !== 'lib/module/index.js') {
      pkg['react-native'] = 'lib/module/index.js';
      changed = true;
    }
    if (pkg['source'] !== 'lib/module/index.js') {
      pkg['source'] = 'lib/module/index.js';
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(phosphorPkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log('[postinstall] Successfully patched phosphor-react-native package.json');
    }
  }
} catch (e) {
  console.warn('[postinstall] phosphor patch warning:', e.message);
}

// 2. Fix @react-native-async-storage/async-storage for environments where native module is not yet compiled
try {
  const patchRCT = (filePath, isCommonJS = false) => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('const memoryStore = new Map();') || content.includes('const memoryStore = new Map<string, string>();')) {
      return;
    }

    const fallbackCode = isCommonJS ? `
if (!RCTAsyncStorage) {
  const memoryStore = new Map();
  RCTAsyncStorage = {
    multiGet: function (keys, callback) {
      const res = keys.map(function (k) { return [k, memoryStore.has(k) ? memoryStore.get(k) : null]; });
      setTimeout(function () { callback(null, res); }, 0);
    },
    multiSet: function (pairs, callback) {
      pairs.forEach(function (pair) { memoryStore.set(pair[0], pair[1]); });
      setTimeout(function () { callback(null); }, 0);
    },
    multiRemove: function (keys, callback) {
      keys.forEach(function (k) { memoryStore.delete(k)); });
      setTimeout(function () { callback(null); }, 0);
    },
    clear: function (callback) {
      memoryStore.clear();
      setTimeout(function () { callback(null); }, 0);
    },
    getAllKeys: function (callback) {
      setTimeout(function () { callback(null, Array.from(memoryStore.keys())); }, 0);
    },
    multiMerge: function (pairs, callback) {
      setTimeout(function () { callback(null); }, 0);
    }
  };
}
` : `
if (!RCTAsyncStorage) {
  const memoryStore = new Map();
  RCTAsyncStorage = {
    multiGet: (keys, callback) => {
      const res = keys.map((k) => [k, memoryStore.has(k) ? memoryStore.get(k) : null]);
      setTimeout(() => callback(null, res), 0);
    },
    multiSet: (pairs, callback) => {
      pairs.forEach(([k, v]) => memoryStore.set(k, v));
      setTimeout(() => callback(null), 0);
    },
    multiRemove: (keys, callback) => {
      keys.forEach((k) => memoryStore.delete(k));
      setTimeout(() => callback(null), 0);
    },
    clear: (callback) => {
      memoryStore.clear();
      setTimeout(() => callback(null), 0);
    },
    getAllKeys: (callback) => {
      setTimeout(() => callback(null, Array.from(memoryStore.keys())), 0);
    },
    multiMerge: (pairs, callback) => {
      setTimeout(() => callback(null), 0);
    },
  };
}
`;

    if (isCommonJS) {
      content = content.replace('var _default = exports.default = RCTAsyncStorage;', fallbackCode + '\nvar _default = exports.default = RCTAsyncStorage;');
    } else {
      content = content.replace('export default RCTAsyncStorage;', fallbackCode + '\nexport default RCTAsyncStorage;');
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[postinstall] Patched ' + path.basename(filePath));
  };

  const patchNative = (filePath) => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('throw new Error(`[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null.')) {
      content = content.replace(
        /if \(!RCTAsyncStorage\w*\) \{[\s\S]*?throw new Error\([\s\S]*?\);?\s*\}/,
        `if (!RCTAsyncStorage) {\n  console.warn('[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null. Operating in fallback mode.');\n}`
      );
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('[postinstall] Removed throw in ' + path.basename(filePath));
    }
  };

  patchRCT(path.resolve(__dirname, '../node_modules/@react-native-async-storage/async-storage/src/RCTAsyncStorage.ts'), false);
  patchRCT(path.resolve(__dirname, '../node_modules/@react-native-async-storage/async-storage/lib/module/RCTAsyncStorage.js'), false);
  patchRCT(path.resolve(__dirname, '../node_modules/@react-native-async-storage/async-storage/lib/commonjs/RCTAsyncStorage.js'), true);

  patchNative(path.resolve(__dirname, '../node_modules/@react-native-async-storage/async-storage/src/AsyncStorage.native.ts'));
  patchNative(path.resolve(__dirname, '../node_modules/@react-native-async-storage/async-storage/lib/module/AsyncStorage.native.js'));
  patchNative(path.resolve(__dirname, '../node_modules/@react-native-async-storage/async-storage/lib/commonjs/AsyncStorage.native.js'));
} catch (e) {
  console.warn('[postinstall] async-storage patch warning:', e.message);
}
