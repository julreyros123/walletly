import { isSupabaseConfigured, supabase } from '../../src/utils/supabase';

describe('supabase utils', () => {
  test('supabase client is initialized and defined', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });

  test('isSupabaseConfigured is a boolean flag', () => {
    expect(typeof isSupabaseConfigured).toBe('boolean');
  });
});
