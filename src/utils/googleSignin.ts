import { Platform, NativeModules, TurboModuleRegistry } from 'react-native';

let googleSigninConfigured = false;

interface GoogleSigninLike {
  GoogleSignin?: {
    configure: (opts: {
      webClientId: string;
      scopes: string[];
      offlineAccess: boolean;
    }) => void;
    hasPlayServices: (opts?: { showPlayServicesUpdateDialog?: boolean }) => Promise<boolean>;
    signIn: () => Promise<{ data?: { idToken?: string | null }; idToken?: string | null }>;
    signOut: () => Promise<void>;
    isSignedIn?: () => Promise<boolean>;
  };
  statusCodes?: Record<string, string>;
}

export function getGoogleSigninModule(): GoogleSigninLike | null {
  try {
    if (Platform.OS === 'web') return null;

    // Check if the native binary actually has RNGoogleSignin registered
    // to avoid triggering TurboModuleRegistry.getEnforcing invariant crash
    const hasTurbo =
      typeof TurboModuleRegistry?.get === 'function' &&
      TurboModuleRegistry.get('RNGoogleSignin') != null;
    const hasNative =
      typeof NativeModules !== 'undefined' && NativeModules?.RNGoogleSignin != null;

    if (!hasTurbo && !hasNative) {
      // Native module is not in the current APK binary (e.g. Expo Go or dev client without rebuild)
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const googleSigninModule = require('@react-native-google-signin/google-signin') as GoogleSigninLike;
    if (!googleSigninConfigured && googleSigninModule?.GoogleSignin) {
      googleSigninModule.GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
        scopes: ['email', 'profile'],
        offlineAccess: false,
      });
      googleSigninConfigured = true;
    }
    return googleSigninModule;
  } catch (err) {
    console.warn('[Auth] Native Google Sign-In module is not linked in current APK:', err);
    return null;
  }
}
