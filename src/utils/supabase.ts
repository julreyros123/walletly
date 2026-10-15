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

const rawUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const rawKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes('placeholder')
);

const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder-project.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'placeholder-anon-key';

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] Missing or unconfigured env vars. Operating in offline/guest mode. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY for live database operations.',
  );
} else {
  console.log('[Supabase] Successfully configured with URL:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorageAdapter,
    autoRefreshToken: isSupabaseConfigured,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
