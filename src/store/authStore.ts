import { Platform, NativeModules } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { create } from 'zustand';
import { storage } from '@/utils/storage';
import { supabase } from '@/utils/supabase';

WebBrowser.maybeCompleteAuthSession();

let googleSigninConfigured = false;

function getGoogleSigninModule() {
  try {
    if (Platform.OS === 'web') return null;

    // Check if the native binary actually has RNGoogleSignin registered
    // to avoid triggering TurboModuleRegistry.getEnforcing invariant crash
    const globalObj = globalThis as Record<string, unknown>;
    const turboRegistry = globalObj.TurboModuleRegistry as { get?: (name: string) => unknown } | undefined;
    const hasTurbo = typeof turboRegistry?.get === 'function' && turboRegistry.get('RNGoogleSignin') != null;
    const hasNative = typeof NativeModules !== 'undefined' && NativeModules?.RNGoogleSignin != null;

    if (!hasTurbo && !hasNative) {
      // Native module is not in the current APK binary (e.g. Expo Go or dev client without rebuild)
      return null;
    }

    const googleSigninModule = require('@react-native-google-signin/google-signin');
    if (!googleSigninConfigured && googleSigninModule?.GoogleSignin) {
      googleSigninModule.GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
        scopes: ['email', 'profile'],
        offlineAccess: true,
      });
      googleSigninConfigured = true;
    }
    return googleSigninModule;
  } catch (err) {
    console.warn('[Auth] Native Google Sign-In module is not linked in current APK:', err);
    return null;
  }
}

// ── Storage key constants (avoid magic strings) ──────────────────────
const AUTH_TOKEN_KEY = 'cbudget_auth_token';
const USER_KEY = 'cbudget_user';
const PREMIUM_KEY = 'cbudget_is_premium';
const MOCK_GUEST_TOKEN = 'mock-guest-token-56789';

// Track the Supabase auth subscription so we can unsubscribe before re-registering
let authSubscription: { unsubscribe: () => void } | null = null;

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor?: string;
  avatarEmoji?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPremium: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  hydrate: () => Promise<void>;
  setPremium: (premium: boolean) => Promise<void>;
  updateProfile: (name: string, email: string, avatarColor?: string, avatarEmoji?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isPremium: false,

  login: async (email, password) => {
    // Clear any local guest state before logging in
    await storage.deleteItem(AUTH_TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    await storage.deleteItem(PREMIUM_KEY);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  loginWithGoogle: async () => {
    // Clear any local guest state before OAuth
    await storage.deleteItem(AUTH_TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    await storage.deleteItem(PREMIUM_KEY);

    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
      return;
    }

    // 1. Native Google One-Tap Sign-In (Direct Android/iOS native popup)
    const googleModule = getGoogleSigninModule();
    if (googleModule?.GoogleSignin) {
      const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = googleModule;
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const response = await GoogleSignin.signIn();

        if (isSuccessResponse(response)) {
          const idToken = response.data?.idToken ?? (response as any).idToken;
          if (!idToken) {
            throw new Error(
              'No ID token returned from Google. Please verify EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file.'
            );
          }
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          });
          if (error) throw error;
          return;
        } else {
          console.log('[Auth] Google sign in did not return success response:', response);
          return;
        }
      } catch (error: unknown) {
        if (isErrorWithCode && isErrorWithCode(error)) {
          const errWithCode = error as { code: string };
          if (errWithCode.code === statusCodes.SIGN_IN_CANCELLED) {
            console.log('[Auth] User cancelled Google sign in flow');
            return;
          }
          if (errWithCode.code === statusCodes.IN_PROGRESS) {
            console.log('[Auth] Google sign in operation in progress');
            return;
          }
          if (errWithCode.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            throw new Error('Google Play Services is not available or outdated on this device.');
          }
        }
        console.error('[Auth] Native Google Sign-In failed:', error);
        throw error;
      }
    }

    // 2. Browser OAuth fallback for Web / Expo Go
    const redirectUrl = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (result.type === 'success' && result.url) {
        const url = result.url;
        let params: Record<string, string> = {};
        if (url.includes('#')) {
          const fragment = url.split('#')[1];
          params = Object.fromEntries(new URLSearchParams(fragment));
        } else if (url.includes('?')) {
          const query = url.split('?')[1];
          params = Object.fromEntries(new URLSearchParams(query));
        }

        if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sessionError) throw sessionError;
        }
      }
      return;
    }
  },

  signUp: async (email, password) => {
    // Clear any local guest state before signing up
    await storage.deleteItem(AUTH_TOKEN_KEY);
    await storage.deleteItem('cbudget_user');
    await storage.deleteItem('cbudget_is_premium');

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  loginAsGuest: async () => {
    try {
      // 1. Try to sign in anonymously with Supabase
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      // If successful, onAuthStateChange will automatically handle the session and update public profiles.
    } catch (e) {
      console.warn('Supabase anonymous sign-in failed, falling back to local guest mode:', e);
      // 2. Fallback to purely local mock guest session if anonymous sign-ins are disabled in Supabase console
      const mockUser: User = {
        id: 'guest',
        name: 'Guest Explorer',
        email: 'guest@cbudget.com',
        avatarColor: '#14B8A6',
        avatarEmoji: '💼',
      };
      await storage.setItem(AUTH_TOKEN_KEY, MOCK_GUEST_TOKEN);
      await storage.setItem(USER_KEY, JSON.stringify(mockUser));
      await storage.setItem(PREMIUM_KEY, 'false');

      set({
        token: MOCK_GUEST_TOKEN,
        user: mockUser,
        isAuthenticated: true,
        isPremium: false,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    const currentUser = get().user;

    // Clear local guest storage
    await storage.deleteItem(AUTH_TOKEN_KEY);
    await storage.deleteItem('cbudget_user');
    await storage.deleteItem('cbudget_is_premium');

    if (currentUser && currentUser.id !== 'guest') {
      await supabase.auth.signOut();
    }

    set({ token: null, user: null, isAuthenticated: false, isPremium: false });
  },

  deleteAccount: async () => {
    const currentUser = get().user;

    // Clear local guest storage
    await storage.deleteItem(AUTH_TOKEN_KEY);
    await storage.deleteItem('cbudget_user');
    await storage.deleteItem('cbudget_is_premium');

    if (currentUser && currentUser.id !== 'guest') {
      // Call the database RPC function to delete the auth user (which cascades to profiles)
      const { error } = await supabase.rpc('delete_user');
      if (error) {
        // Fallback: delete profiles directly and sign out
        await supabase.from('profiles').delete().eq('id', currentUser.id);
        await supabase.auth.signOut();
      }
    }

    set({ token: null, user: null, isAuthenticated: false, isPremium: false });
  },

  hydrate: async () => {
    try {
      // Check if a local guest session is active
      const guestToken = await storage.getItem(AUTH_TOKEN_KEY);
      if (guestToken === MOCK_GUEST_TOKEN) {
        const userStr = await storage.getItem(USER_KEY);
        const storedPremium = await storage.getItem(PREMIUM_KEY);
        const isPremium = storedPremium === 'true';
        let user: User = {
          id: 'guest',
          name: 'Guest Explorer',
          email: 'guest@cbudget.com',
          avatarColor: '#14B8A6',
          avatarEmoji: '💼',
        };
        if (userStr) {
          try {
            user = JSON.parse(userStr);
          } catch (e) {
            console.warn('[Auth] Failed to parse stored user JSON:', e);
          }
        }
        set({
          token: guestToken,
          user,
          isAuthenticated: true,
          isPremium,
          isLoading: false,
        });
        return;
      }

      // Unsubscribe any previous listener to prevent leaks on re-hydration / hot-reload
      if (authSubscription) {
        authSubscription.unsubscribe();
        authSubscription = null;
      }

      // Initialize Supabase session listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          const initialUser: User = {
            id: session.user.id,
            name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split('@')[0] ||
              'User',
            email: session.user.email || '',
            avatarColor: '#0EA5E9',
            avatarEmoji: '💼',
          };

          // 1. INSTANTLY authenticate the user (0ms delay to navigate)
          set({
            token: session.access_token,
            user: initialUser,
            isAuthenticated: true,
            isPremium: false,
            isLoading: false,
          });

          // 2. Concurrently fetch or create user profile in background
          (async () => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

              if (!profile) {
                await supabase.from('profiles').upsert({
                  id: session.user.id,
                  email: session.user.email,
                  name: initialUser.name,
                  avatar_color: initialUser.avatarColor,
                  avatar_emoji: initialUser.avatarEmoji,
                  is_premium: false,
                });
              } else {
                set((state) => ({
                  user: state.user
                    ? {
                        ...state.user,
                        name: profile.name || state.user.name,
                        avatarColor: profile.avatar_color || state.user.avatarColor,
                        avatarEmoji: profile.avatar_emoji || state.user.avatarEmoji,
                      }
                    : state.user,
                  isPremium: profile.is_premium || false,
                }));
              }
            } catch (err) {
              console.warn('[Auth] Background profile sync warning:', err);
            }
          })();
        } else {
          // If we had a local guest session, don't clear it. Otherwise, clean up auth state
          if (get().token !== MOCK_GUEST_TOKEN) {
            set({
              token: null,
              user: null,
              isAuthenticated: false,
              isPremium: false,
              isLoading: false,
            });
          }
        }
      });

      // Store subscription for cleanup on next hydrate call
      authSubscription = subscription;
    } catch (error) {
      console.error('Failed to hydrate auth state:', error);
      set({ isLoading: false });
    }
  },

  setPremium: async (premium: boolean) => {
    const currentUser = get().user;
    if (!currentUser) return;

    if (currentUser.id === 'guest') {
      await storage.setItem(PREMIUM_KEY, premium ? 'true' : 'false');
      set({ isPremium: premium });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: premium })
      .eq('id', currentUser.id);

    if (error) throw error;

    set({ isPremium: premium });
  },

  updateProfile: async (name: string, email: string, avatarColor?: string, avatarEmoji?: string) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedFields = {
      name,
      email,
      avatarColor: avatarColor !== undefined ? avatarColor : currentUser.avatarColor,
      avatarEmoji: avatarEmoji !== undefined ? avatarEmoji : currentUser.avatarEmoji,
    };

    if (currentUser.id === 'guest') {
      const updatedUser = {
        ...currentUser,
        ...updatedFields,
      };
      await storage.setItem(USER_KEY, JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        name,
        email,
        avatar_color: updatedFields.avatarColor,
        avatar_emoji: updatedFields.avatarEmoji,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentUser.id);

    if (error) throw error;

    set({
      user: {
        id: currentUser.id,
        ...updatedFields,
      },
    });
  },

  sendPasswordReset: async (email: string) => {
    // sends link for password resets to user email redirecting back
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'cbudget://reset-password',
    });
    if (error) throw error;
  },
}));
