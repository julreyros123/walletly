import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// In-memory fallback cache
const memoryCache = new Map<string, string>();

// Safely obtain AsyncStorage without throwing if native binary lacks RCTAsyncStorage
let asyncStorage: any = null;
try {
  const mod = require('@react-native-async-storage/async-storage');
  asyncStorage = mod?.default || mod;
} catch (e) {
  console.warn('[Storage] Native AsyncStorage unavailable, using memory fallback:', e);
}

// Keys that should be encrypted in hardware keystore (e.g. auth tokens)
const SENSITIVE_STORAGE_KEYS = new Set<string>(['cbudget_auth_token']);

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_STORAGE_KEYS.has(key);
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
        return await SecureStore.getItemAsync(key);
      } catch (e) {
        console.warn('[Storage] SecureStore.getItemAsync failed:', e);
        return null;
      }
    }

    if (asyncStorage) {
      try {
        const val = await asyncStorage.getItem(key);
        if (val !== null && val !== undefined) return val;
      } catch (e) {
        // Fall through to memoryCache / SecureStore
      }
    }

    if (memoryCache.has(key)) {
      return memoryCache.get(key) || null;
    }

    // Try reading from SecureStore as fallback
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
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
        await SecureStore.setItemAsync(key, value);
      } catch (e) {
        console.warn('[Storage] SecureStore.setItemAsync failed:', e);
      }
      return;
    }

    memoryCache.set(key, value);

    if (asyncStorage) {
      try {
        await asyncStorage.setItem(key, value);
        return;
      } catch (e) {
        // Fallback to SecureStore
      }
    }

    // Backup to SecureStore if payload is small (< 1800 bytes)
    if (value.length < 1800) {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch {
        // Ignore size limits
      }
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
        await SecureStore.deleteItemAsync(key);
      } catch (e) {
        console.warn('[Storage] SecureStore.deleteItemAsync failed:', e);
      }
      return;
    }

    memoryCache.delete(key);

    if (asyncStorage) {
      try {
        await asyncStorage.removeItem(key);
      } catch {
        // Ignore
      }
    }

    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore
    }
  },
};
