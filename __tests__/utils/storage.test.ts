import { storage } from '../../src/utils/storage';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

describe('storage utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
  });

  describe('setItem and getItem for normal keys', () => {
    test('setItem and getItem normal key stores and retrieves string value', async () => {
      await storage.setItem('test_normal_key', 'hello_walletly');
      const val = await storage.getItem('test_normal_key');
      expect(val).toBe('hello_walletly');
    });

    test('getItem non-existent key returns null', async () => {
      const val = await storage.getItem('non_existent_random_key');
      expect(val).toBeNull();
    });

    test('deleteItem normal key removes item from storage', async () => {
      await storage.setItem('key_to_delete', 'value123');
      await storage.deleteItem('key_to_delete');
      const val = await storage.getItem('key_to_delete');
      expect(val).toBeNull();
    });
  });

  describe('sensitive keys (SecureStore)', () => {
    test('setItem sensitive key stores in SecureStore and AsyncStorage backup', async () => {
      const sensitiveKey = 'cbudget_auth_token';
      await storage.setItem(sensitiveKey, 'secret-jwt-token');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'cbudget_auth_token',
        'secret-jwt-token'
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        sensitiveKey,
        'secret-jwt-token'
      );
    });

    test('getItem sensitive key reads from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (k: string) => {
        if (k === 'cbudget_auth_token') return 'my-secure-token';
        return null;
      });
      const val = await storage.getItem('cbudget_auth_token');
      expect(val).toBe('my-secure-token');
    });

    test('getItem sensitive key falls back to AsyncStorage if SecureStore returns null', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('backup-token-from-async');

      const val = await storage.getItem('cbudget_user');
      expect(val).toBe('backup-token-from-async');
    });

    test('deleteItem sensitive key deletes from both SecureStore and AsyncStorage', async () => {
      await storage.deleteItem('cbudget_auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cbudget_auth_token');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cbudget_auth_token');
    });
  });

  describe('chunked storage for large values', () => {
    test('setItem large value exceeding 1500 chars splits into chunks in SecureStore', async () => {
      const largeValue = 'x'.repeat(3500); // 3 chunks
      await storage.setItem('cbudget_user_preferences', largeValue);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'cbudget_user_preferences__chunk_0',
        expect.any(String)
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'cbudget_user_preferences__chunk_1',
        expect.any(String)
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'cbudget_user_preferences__chunk_2',
        expect.any(String)
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'cbudget_user_preferences__chunks_count',
        '3'
      );
    });
  });

  describe('web platform localStorage', () => {
    let originalLocalStorage: any;

    beforeAll(() => {
      originalLocalStorage = global.localStorage;
      const store: Record<string, string> = {};
      (global as any).localStorage = {
        getItem: jest.fn((k: string) => store[k] ?? null),
        setItem: jest.fn((k: string, v: string) => {
          store[k] = v;
        }),
        removeItem: jest.fn((k: string) => {
          delete store[k];
        }),
      };
    });

    afterAll(() => {
      (global as any).localStorage = originalLocalStorage;
    });

    test('web platform setItem, getItem, deleteItem delegates to localStorage', async () => {
      Platform.OS = 'web';
      await storage.setItem('web_key', 'web_value');
      expect(global.localStorage.setItem).toHaveBeenCalledWith('web_key', 'web_value');

      const val = await storage.getItem('web_key');
      expect(global.localStorage.getItem).toHaveBeenCalledWith('web_key');

      await storage.deleteItem('web_key');
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('web_key');
    });
  });
});
