import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { storage } from '@/utils/storage';

// Custom storage adapter that hooks Supabase Auth session persistence into our existing SecureStore/localStorage utility
const customStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return await storage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await storage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await storage.deleteItem(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
