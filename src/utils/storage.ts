import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// In-memory fallback cache
const memoryCache = new Map<string, string>();

// Safely obtain AsyncStorage without throwing if native binary lacks RCTAsyncStorage
let asyncStorage: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} | null = null;

try {
  const mod = require('@react-native-async-storage/async-storage');
  asyncStorage = mod?.default || mod;
} catch (e) {
  console.warn('[Storage] Native AsyncStorage unavailable, using memory fallback:', e);
}

// Keys that should be encrypted in hardware keystore (e.g. auth tokens, user credentials, personal profile)
const SENSITIVE_STORAGE_KEYS = new Set<string>([
  'cbudget_auth_token',
  'cbudget_user',
  'cbudget_user_preferences',
  'cbudget_guardian_logs',
]);

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_STORAGE_KEYS.has(key);
}

// SecureStore max limit is 2048 bytes on Android; chunk at 1500 chars for safety
const CHUNK_SIZE = 1500;
const CHUNK_COUNT_SUFFIX = '__chunks_count';
const CHUNK_PREFIX = '__chunk_';

async function setSecureStoreChunked(key: string, value: string): Promise<void> {
  if (value.length <= CHUNK_SIZE) {
    try {
      await SecureStore.setItemAsync(key, value);
      // Clean up any previously stored chunks
      const prevChunks = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`).catch(() => null);
      if (prevChunks) {
        const count = parseInt(prevChunks, 10);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}${CHUNK_PREFIX}${i}`).catch(() => {});
        }
        await SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`).catch(() => {});
      }
    } catch (e) {
      console.warn(`[Storage] SecureStore.setItemAsync direct failed for ${key}:`, e);
    }
    return;
  }

  // Value exceeds CHUNK_SIZE: split into chunks
  const numChunks = Math.ceil(value.length / CHUNK_SIZE);
  try {
    for (let i = 0; i < numChunks; i++) {
      const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await SecureStore.setItemAsync(`${key}${CHUNK_PREFIX}${i}`, chunk);
    }
    await SecureStore.setItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`, String(numChunks));
    // Remove old single key to avoid stale small value reading
    await SecureStore.deleteItemAsync(key).catch(() => {});
  } catch (e) {
    console.warn(`[Storage] SecureStore chunked write failed for ${key}:`, e);
  }
}

async function getSecureStoreChunked(key: string): Promise<string | null> {
  // 1. Check if chunk count exists
  try {
    const chunkCountStr = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
    if (chunkCountStr) {
      const count = parseInt(chunkCountStr, 10);
      if (!isNaN(count) && count > 0) {
        let assembled = '';
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}${CHUNK_PREFIX}${i}`);
          if (chunk !== null && chunk !== undefined) {
            assembled += chunk;
          }
        }
        if (assembled.length > 0) return assembled;
      }
    }
  } catch (e) {
    console.warn(`[Storage] Error reading chunked SecureStore for ${key}:`, e);
  }

  // 2. Direct key read fallback
  try {
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    console.warn(`[Storage] SecureStore.getItemAsync direct failed for ${key}:`, e);
    return null;
  }
}

async function deleteSecureStoreChunked(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.warn(`[Storage] SecureStore direct delete failed for ${key}:`, e);
  }

  try {
    const chunkCountStr = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
    if (chunkCountStr) {
      const count = parseInt(chunkCountStr, 10);
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(`${key}${CHUNK_PREFIX}${i}`).catch(() => {});
      }
      await SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`).catch(() => {});
    }
  } catch (e) {
    console.warn(`[Storage] SecureStore chunk delete failed for ${key}:`, e);
  }
}

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      } catch (e) {
        console.warn('[Storage] localStorage.getItem failed:', e);
        return null;
      }
    }

    if (isSensitiveKey(key)) {
      try {
        const val = await getSecureStoreChunked(key);
        if (val !== null && val !== undefined) return val;
      } catch (e) {
        console.warn(`[Storage] SecureStore chunked read failed for sensitive key ${key}:`, e);
      }

      // Backwards-compatibility migration check:
      // If user had existing unencrypted data in AsyncStorage before this key was marked sensitive
      if (asyncStorage) {
        try {
          const legacyVal = await asyncStorage.getItem(key);
          if (legacyVal !== null && legacyVal !== undefined) {
            // Silently migrate legacy data to encrypted SecureStore
            await setSecureStoreChunked(key, legacyVal);
            await asyncStorage.removeItem(key).catch(() => {});
            return legacyVal;
          }
        } catch (e) {
          console.warn(`[Storage] Legacy migration check failed for ${key}:`, e);
        }
      }

      return null;
    }

    if (asyncStorage) {
      try {
        const val = await asyncStorage.getItem(key);
        if (val !== null && val !== undefined) return val;
      } catch (e) {
        console.warn(`[Storage] AsyncStorage.getItem failed for ${key}, falling back:`, e);
      }
    }

    // Try reading from chunked / direct SecureStore
    const secureVal = await getSecureStoreChunked(key);
    if (secureVal !== null && secureVal !== undefined) {
      return secureVal;
    }

    if (memoryCache.has(key)) {
      return memoryCache.get(key) || null;
    }

    return null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } catch (e) {
        console.warn('[Storage] localStorage.setItem failed:', e);
      }
      return;
    }

    if (isSensitiveKey(key)) {
      try {
        await setSecureStoreChunked(key, value);
      } catch (e) {
        console.warn('[Storage] setSecureStoreChunked failed for sensitive key:', e);
      }
      return;
    }

    memoryCache.set(key, value);

    let asyncStorageSuccess = false;
    if (asyncStorage) {
      try {
        await asyncStorage.setItem(key, value);
        asyncStorageSuccess = true;
      } catch (e) {
        console.warn(`[Storage] AsyncStorage.setItem failed for ${key}, persisting to SecureStore chunks:`, e);
      }
    }

    // Always mirror to SecureStore chunked storage if AsyncStorage failed or wasn't available,
    // OR if payload is under 1800 bytes as backup
    if (!asyncStorageSuccess || value.length <= 1800) {
      await setSecureStoreChunked(key, value);
    }
  },

  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(key);
        }
      } catch (e) {
        console.warn('[Storage] localStorage.removeItem failed:', e);
      }
      return;
    }

    if (isSensitiveKey(key)) {
      try {
        await deleteSecureStoreChunked(key);
        if (asyncStorage) {
          await asyncStorage.removeItem(key).catch(() => {});
        }
      } catch (e) {
        console.warn('[Storage] deleteSecureStoreChunked failed for sensitive key:', e);
      }
      return;
    }

    memoryCache.delete(key);

    if (asyncStorage) {
      try {
        await asyncStorage.removeItem(key);
      } catch (e) {
        console.warn(`[Storage] AsyncStorage.removeItem failed for ${key}:`, e);
      }
    }

    await deleteSecureStoreChunked(key);
  },
};
