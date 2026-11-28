import type * as GoogleSigninPackage from '@react-native-google-signin/google-signin';

export type GoogleSigninModule = typeof GoogleSigninPackage;

/**
 * Web stub for native Google Sign-In.
 * Web OAuth uses Supabase's browser OAuth flow, so the native-only
 * @react-native-google-signin/google-signin package must never be bundled on web.
 */
export function getGoogleSigninModule(): GoogleSigninModule | null {
  return null;
}
