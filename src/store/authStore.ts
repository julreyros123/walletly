import { Platform, NativeModules } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { create } from 'zustand';
import { storage } from '@/utils/storage';
import { supabase } from '@/utils/supabase';
import {
  useGamificationStore,
  setActiveGamificationUser,
  flushCloudSnapshot,
  cancelCloudSnapshot,
} from '@/store/gamificationStore';
import { syncQueue } from '@/utils/syncQueue';

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
const GUEST_TOKEN_PREFIX = 'guest-session-';
const LEGACY_MOCK_GUEST_TOKEN = 'mock-guest-token-56789';

export function isGuestToken(token: string | null | undefined): boolean {
  if (!token) return false;
  return token.startsWith(GUEST_TOKEN_PREFIX) || token === LEGACY_MOCK_GUEST_TOKEN;
}

function generateGuestToken(): string {
  const randomPart = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  return `${GUEST_TOKEN_PREFIX}${Date.now()}-${randomPart}`;
}

// Track the Supabase auth subscription so we can unsubscribe before re-registering
let authSubscription: { unsubscribe: () => void } | null = null;

/** Removes locally stored session keys and any pending (guest) sync items. */
async function clearLocalSessionData(): Promise<void> {
  await storage.deleteItem(AUTH_TOKEN_KEY);
  await storage.deleteItem(USER_KEY);
  await storage.deleteItem(PREMIUM_KEY);
  await syncQueue.clear();
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor?: string;
  avatarEmoji?: string;
  phone?: string;
  city?: string;
  schoolGrade?: string;
  age?: number;
  isOnboarded?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPremium: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  hydrate: () => Promise<void>;
  setPremium: (premium: boolean) => Promise<void>;
  updateProfile: (
    name: string,
    email: string,
    avatarColor?: string,
    avatarEmoji?: string,
    phone?: string,
    city?: string,
    schoolGrade?: string,
    age?: number,
    isOnboarded?: boolean
  ) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isPremium: false,

  login: async (email, password) => {
    // Local guest state is cleared by the auth listener only after sign-in succeeds,
    // so a failed login never wipes guest data.
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  loginWithGoogle: async () => {
    // Local guest state is cleared by the auth listener only after sign-in succeeds
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
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

        // Ensure previous native session is cleared so the account chooser dialog is always presented
        try {
          await GoogleSignin.signOut();
        } catch (signOutErr) {
          console.log('[Auth] GoogleSignin.signOut before login notice:', signOutErr);
        }

        const response = await GoogleSignin.signIn();

        if (isSuccessResponse(response)) {
          const idToken = response.data?.idToken ?? ('idToken' in response ? (response as { idToken?: string }).idToken : undefined);
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
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
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

  loginWithFacebook: async () => {
    const redirectUrl = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
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
    }
  },

  signUp: async (email, password) => {
    // Local guest state is cleared by the auth listener once a session is issued
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  loginAsGuest: async () => {
    // 100% Offline-ready local guest session with unique session token
    const guestToken = generateGuestToken();
    const mockUser: User = {
      id: 'guest',
      name: 'Guest Explorer',
      email: 'guest@cbudget.com',
      avatarColor: '#14B8A6',
      avatarEmoji: '💼',
    };
    await storage.setItem(AUTH_TOKEN_KEY, guestToken);
    await storage.setItem(USER_KEY, JSON.stringify(mockUser));
    await storage.setItem(PREMIUM_KEY, 'false');

    setActiveGamificationUser('guest');
    set({
      token: guestToken,
      user: mockUser,
      isAuthenticated: true,
      isPremium: false,
      isLoading: false,
    });
    useGamificationStore.getState().hydrate('guest');
  },

  logout: async () => {
    const currentUser = get().user;

    // Push any unsynced changes to Supabase BEFORE dropping the session,
    // otherwise pending items in the offline queue are lost forever.
    if (currentUser && currentUser.id !== 'guest') {
      try {
        await flushCloudSnapshot();
        await syncQueue.process();
      } catch (err) {
        console.warn('[Auth] Failed to flush pending data before logout:', err);
      }
    }

    // Clear local session keys and remaining sync items
    await storage.deleteItem(AUTH_TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    await storage.deleteItem(PREMIUM_KEY);
    await syncQueue.clear();

    // Also sign out of Native Google Sign-In so future sign-in prompts for account selection
    const googleModule = getGoogleSigninModule();
    if (googleModule?.GoogleSignin) {
      try {
        await googleModule.GoogleSignin.signOut();
      } catch (err) {
        console.warn('[Auth] Error signing out from GoogleSignin during logout:', err);
      }
    }

    if (currentUser && currentUser.id !== 'guest') {
      await supabase.auth.signOut();
    }

    setActiveGamificationUser(null);
    useGamificationStore.getState().resetAllData(0);
    set({ token: null, user: null, isAuthenticated: false, isPremium: false });
    useGamificationStore.getState().hydrate('guest');
  },

  deleteAccount: async () => {
    const currentUser = get().user;

    // Make sure no pending cloud backup re-creates data after deletion
    cancelCloudSnapshot();

    // Clear local guest storage and flush pending sync items
    await storage.deleteItem(AUTH_TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    await storage.deleteItem(PREMIUM_KEY);
    await syncQueue.clear();

    // Also sign out of Native Google Sign-In so future sign-in prompts for account selection
    const googleModule = getGoogleSigninModule();
    if (googleModule?.GoogleSignin) {
      try {
        await googleModule.GoogleSignin.signOut();
      } catch (err) {
        console.warn('[Auth] Error signing out from GoogleSignin during deleteAccount:', err);
      }
    }

    if (currentUser && currentUser.id !== 'guest') {
      await storage.deleteItem(`cbudget_gamification_state_${currentUser.id}`);
      // Call the database RPC function to delete the auth user (which cascades to profiles)
      const { error } = await supabase.rpc('delete_user');
      if (error) {
        console.warn('[Auth] delete_user RPC call failed, falling back to direct profile delete:', error);
        // Fallback: delete profiles directly and sign out
        await supabase.from('profiles').delete().eq('id', currentUser.id);
        await supabase.from('user_app_state').delete().eq('user_id', currentUser.id);
        await supabase.auth.signOut();
      } else {
        await supabase.auth.signOut();
      }
    }

    setActiveGamificationUser(null);
    useGamificationStore.getState().resetAllData(0);
    set({ token: null, user: null, isAuthenticated: false, isPremium: false });
    useGamificationStore.getState().hydrate('guest');
  },

  hydrate: async () => {
    try {
      // Check if a local guest session is active (dynamic or legacy token)
      const guestToken = await storage.getItem(AUTH_TOKEN_KEY);
      if (isGuestToken(guestToken)) {
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
        setActiveGamificationUser('guest');
        set({
          token: guestToken,
          user,
          isAuthenticated: true,
          isPremium,
          isLoading: false,
        });
        useGamificationStore.getState().hydrate('guest');
        // Fall through: guests still need the listener so a later sign-in is picked up
      }

      // Unsubscribe any previous listener to prevent leaks on re-hydration / hot-reload
      if (authSubscription) {
        authSubscription.unsubscribe();
        authSubscription = null;
      }

      // Initialize Supabase session listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          const current = get();

          // Token refreshes / repeat events for the same signed-in user: only update the token.
          // Re-running the full sign-in path would reset isPremium and re-hydrate gamification.
          if (current.isAuthenticated && current.user?.id === session.user.id) {
            set({ token: session.access_token, isLoading: false });
            return;
          }

          // A real sign-in just succeeded: now it's safe to drop any local guest session
          if (isGuestToken(current.token)) {
            try {
              await clearLocalSessionData();
            } catch (err) {
              console.warn('[Auth] Failed to clear guest session after sign-in:', err);
            }
          }

          const meta = session.user.user_metadata || {};
          const initialUser: User = {
            id: session.user.id,
            name:
              meta.nickname ||
              meta.full_name ||
              meta.name ||
              session.user.email?.split('@')[0] ||
              'User',
            email: session.user.email || '',
            avatarColor: '#0EA5E9',
            avatarEmoji: '💼',
            age: meta.age ? Number(meta.age) : undefined,
            isOnboarded: Boolean(meta.is_onboarded),
          };

          setActiveGamificationUser(session.user.id);

          // 1. INSTANTLY authenticate the user (0ms delay to navigate)
          set({
            token: session.access_token,
            user: initialUser,
            isAuthenticated: true,
            isPremium: false,
            isLoading: false,
          });

          // 2. Hydrate user-specific gamification state (activities & allocations from Supabase)
          useGamificationStore.getState().hydrate(session.user.id);

          // 3. Concurrently fetch or create user profile in background
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
                const profileAny = profile as Record<string, unknown>;
                const resolvedAge = profileAny.age ? Number(profileAny.age) : initialUser.age;
                const resolvedOnboarded =
                  profileAny.is_onboarded !== undefined
                    ? Boolean(profileAny.is_onboarded)
                    : Boolean(initialUser.isOnboarded || (profile.name && profile.name !== 'User' && resolvedAge));

                set((state) => ({
                  user: state.user
                    ? {
                        ...state.user,
                        name: profile.name || state.user.name,
                        avatarColor: profile.avatar_color || state.user.avatarColor,
                        avatarEmoji: profile.avatar_emoji || state.user.avatarEmoji,
                        age: resolvedAge,
                        isOnboarded: resolvedOnboarded,
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
          if (!isGuestToken(get().token)) {
            setActiveGamificationUser(null);
            useGamificationStore.getState().resetAllData(0);
            set({
              token: null,
              user: null,
              isAuthenticated: false,
              isPremium: false,
              isLoading: false,
            });
            useGamificationStore.getState().hydrate('guest');
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

  updateProfile: async (
    name: string,
    email: string,
    avatarColor?: string,
    avatarEmoji?: string,
    phone?: string,
    city?: string,
    schoolGrade?: string,
    age?: number,
    isOnboarded?: boolean
  ) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedFields = {
      name,
      email,
      avatarColor: avatarColor !== undefined ? avatarColor : currentUser.avatarColor,
      avatarEmoji: avatarEmoji !== undefined ? avatarEmoji : currentUser.avatarEmoji,
      phone: phone !== undefined ? phone : currentUser.phone,
      city: city !== undefined ? city : currentUser.city,
      schoolGrade: schoolGrade !== undefined ? schoolGrade : currentUser.schoolGrade,
      age: age !== undefined ? age : currentUser.age,
      isOnboarded: isOnboarded !== undefined ? isOnboarded : (currentUser.isOnboarded ?? true),
    };

    const updatedUser = {
      ...currentUser,
      ...updatedFields,
    };
    await storage.setItem(USER_KEY, JSON.stringify(updatedUser));
    set({ user: updatedUser });

    if (currentUser.id === 'guest') {
      return;
    }

    // 1. Update Supabase auth user metadata (always supports arbitrary keys like age, nickname, is_onboarded)
    try {
      await supabase.auth.updateUser({
        data: {
          nickname: name,
          full_name: name,
          name,
          age: updatedFields.age,
          is_onboarded: updatedFields.isOnboarded,
        },
      });
    } catch (authMetaErr) {
      console.warn('[Auth] Update auth metadata warning:', authMetaErr);
    }

    // 2. Best-effort update to public.profiles table
    try {
      const profilePayload: Record<string, unknown> = {
        name,
        email,
        avatar_color: updatedFields.avatarColor,
        avatar_emoji: updatedFields.avatarEmoji,
        phone: updatedFields.phone,
        city: updatedFields.city,
        school_grade: updatedFields.schoolGrade,
        updated_at: new Date().toISOString(),
      };
      if (updatedFields.age !== undefined) {
        profilePayload.age = updatedFields.age;
      }
      if (updatedFields.isOnboarded !== undefined) {
        profilePayload.is_onboarded = updatedFields.isOnboarded;
      }

      const { error: profileErr } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', currentUser.id);

      if (profileErr) {
        // Fallback retry without age / is_onboarded if table columns are not present
        await supabase
          .from('profiles')
          .update({
            name,
            email,
            avatar_color: updatedFields.avatarColor,
            avatar_emoji: updatedFields.avatarEmoji,
            phone: updatedFields.phone,
            city: updatedFields.city,
            school_grade: updatedFields.schoolGrade,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentUser.id);
      }
    } catch (e) {
      console.warn('[Auth] Supabase profile update error, saved locally:', e);
    }
  },

  sendPasswordReset: async (email: string) => {
    // sends link for password resets to user email redirecting back
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'cbudget://reset-password',
    });
    if (error) throw error;
  },

  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
}));
