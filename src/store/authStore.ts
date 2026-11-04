import { Platform, NativeModules, TurboModuleRegistry } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { create } from 'zustand';
import { storage } from '@/utils/storage';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import {
  useGamificationStore,
  setActiveGamificationUser,
  flushCloudSnapshot,
  cancelCloudSnapshot,
  flushPersistState,
} from '@/store/gamificationStore';
import { syncQueue } from '@/utils/syncQueue';
import { saveLocalAppState, loadLocalAppState, deleteLocalAppState } from '@/db/localRepository';

WebBrowser.maybeCompleteAuthSession();

let googleSigninConfigured = false;

function getGoogleSigninModule() {
  try {
    if (Platform.OS === 'web') return null;

    // Check if the native binary actually has RNGoogleSignin registered
    // to avoid triggering TurboModuleRegistry.getEnforcing invariant crash
    const hasTurbo = typeof TurboModuleRegistry?.get === 'function' && TurboModuleRegistry.get('RNGoogleSignin') != null;
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

// ── Storage key constants (avoid magic strings) ──────────────────────
const AUTH_TOKEN_KEY = 'cbudget_auth_token';
const USER_KEY = 'cbudget_user';
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
  await deleteLocalAppState(AUTH_TOKEN_KEY);
  await deleteLocalAppState(USER_KEY);
  await syncQueue.clear();
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor?: string;
  avatarEmoji?: string;
  avatarUrl?: string | null;
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
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  hydrate: () => Promise<void>;
  updateProfile: (
    name: string,
    email: string,
    avatarColor?: string,
    avatarEmoji?: string,
    phone?: string,
    city?: string,
    schoolGrade?: string,
    age?: number,
    isOnboarded?: boolean,
    avatarUrl?: string | null
  ) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    // Local guest state is cleared by the auth listener only after sign-in succeeds,
    // so a failed login never wipes guest data.
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  loginWithGoogle: async () => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your environment.'
      );
    }

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
          console.warn('[Auth] GoogleSignin.signOut before login notice:', signOutErr);
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
          await get().hydrate();
          return;
        } else {
          console.warn('[Auth] Google sign in did not return success response:', response);
          return;
        }
      } catch (error: unknown) {
        if (isErrorWithCode && isErrorWithCode(error)) {
          const errWithCode = error as { code: string };
          if (errWithCode.code === statusCodes.SIGN_IN_CANCELLED) {
            if (__DEV__) console.log('[Auth] User cancelled Google sign in flow');
            return;
          }
          if (errWithCode.code === statusCodes.IN_PROGRESS) {
            if (__DEV__) console.log('[Auth] Google sign in operation in progress');
            return;
          }
        }
        console.warn('[Auth] Native Google Sign-In not available or failed, falling back to browser OAuth:', error);
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

        const rawCode = params.code ? params.code.split('#')[0] : undefined;
        if (rawCode) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(rawCode);
          if (exchangeError) throw exchangeError;
        } else if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sessionError) throw sessionError;
        } else if (params.error || params.error_description) {
          throw new Error(params.error_description || params.error || 'Google authentication failed');
        }

        await get().hydrate();
      }
      return;
    }
  },

  loginWithFacebook: async () => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your environment.'
      );
    }
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

        const rawCode = params.code ? params.code.split('#')[0] : undefined;
        if (rawCode) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(rawCode);
          if (exchangeError) throw exchangeError;
        } else if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sessionError) throw sessionError;
        } else if (params.error || params.error_description) {
          throw new Error(params.error_description || params.error || 'Facebook authentication failed');
        }

        await get().hydrate();
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
    await saveLocalAppState(AUTH_TOKEN_KEY, guestToken);
    await saveLocalAppState(USER_KEY, JSON.stringify(mockUser));

    setActiveGamificationUser('guest');
    set({
      token: guestToken,
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
    });
    useGamificationStore.getState().hydrate('guest');
  },

  logout: async () => {
    const currentUser = get().user;

    // Flush any pending debounced state writes and cloud backups before dropping the session
    try {
      await flushPersistState();
    } catch (err) {
      console.warn('[Auth] Failed to flush persist state before logout:', err);
    }

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

    // Clear local auth session credentials (keeps user's gamification data intact on disk)
    await storage.deleteItem(AUTH_TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    await deleteLocalAppState(AUTH_TOKEN_KEY);
    await deleteLocalAppState(USER_KEY);

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

    // Transition cleanly to guest state without destroying the user's saved data
    setActiveGamificationUser('guest');
    set({ token: null, user: null, isAuthenticated: false });
    await useGamificationStore.getState().hydrate('guest');
  },

  deleteAccount: async () => {
    const currentUser = get().user;

    // Make sure no pending cloud backup re-creates data after deletion
    cancelCloudSnapshot();

    // Clear local guest storage and flush pending sync items
    await storage.deleteItem(AUTH_TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    await deleteLocalAppState(AUTH_TOKEN_KEY);
    await deleteLocalAppState(USER_KEY);
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
    set({ token: null, user: null, isAuthenticated: false });
    useGamificationStore.getState().hydrate('guest');
  },

  hydrate: async () => {
    try {
      // 1. Instant offline auth restoration: check SecureStore/AsyncStorage first, then SQLite fallback
      let storedToken = await storage.getItem(AUTH_TOKEN_KEY);
      let userStr = await storage.getItem(USER_KEY);

      if (!storedToken) {
        storedToken = await loadLocalAppState(AUTH_TOKEN_KEY);
      }
      if (!userStr) {
        userStr = await loadLocalAppState(USER_KEY);
      }

      let restoredUser: User | null = null;
      if (userStr) {
        try {
          restoredUser = JSON.parse(userStr);
        } catch (e) {
          console.warn('[Auth] Failed to parse stored user JSON:', e);
        }
      }

      if (storedToken && restoredUser) {
        // Ensure all persistence tiers are aligned
        storage.setItem(AUTH_TOKEN_KEY, storedToken).catch(() => {});
        storage.setItem(USER_KEY, JSON.stringify(restoredUser)).catch(() => {});
        saveLocalAppState(AUTH_TOKEN_KEY, storedToken).catch(() => {});
        saveLocalAppState(USER_KEY, JSON.stringify(restoredUser)).catch(() => {});

        const isGuest = isGuestToken(storedToken) || restoredUser.id === 'guest';
        const targetUserId = isGuest ? 'guest' : restoredUser.id;
        setActiveGamificationUser(targetUserId);
        set({
          token: storedToken,
          user: restoredUser,
          isAuthenticated: true,
          isLoading: false,
        });
        useGamificationStore.getState().hydrate(targetUserId);
      } else if (isGuestToken(storedToken)) {
        const guestUser: User = {
          id: 'guest',
          name: 'Guest Explorer',
          email: 'guest@cbudget.com',
          avatarColor: '#14B8A6',
          avatarEmoji: '💼',
        };
        const validGuestToken = storedToken as string;
        storage.setItem(AUTH_TOKEN_KEY, validGuestToken).catch(() => {});
        storage.setItem(USER_KEY, JSON.stringify(guestUser)).catch(() => {});
        saveLocalAppState(AUTH_TOKEN_KEY, validGuestToken).catch(() => {});
        saveLocalAppState(USER_KEY, JSON.stringify(guestUser)).catch(() => {});

        setActiveGamificationUser('guest');
        set({
          token: storedToken,
          user: guestUser,
          isAuthenticated: true,
          isLoading: false,
        });
        useGamificationStore.getState().hydrate('guest');
      }

      // Unsubscribe any previous listener to prevent leaks on re-hydration / hot-reload
      if (authSubscription) {
        authSubscription.unsubscribe();
        authSubscription = null;
      }

      // 2. Initialize Supabase session listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          const current = get();

          // Token refreshes / repeat events for the same signed-in user: only update the token.
          if (current.isAuthenticated && current.user?.id === session.user.id) {
            set({ token: session.access_token, isLoading: false });
            await storage.setItem(AUTH_TOKEN_KEY, session.access_token);
            return;
          }

          // A real sign-in just succeeded: drop any local guest session
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
            avatarUrl: meta.avatar_url || meta.picture || undefined,
            age: meta.age ? Number(meta.age) : undefined,
            isOnboarded: Boolean(meta.is_onboarded),
          };

          // Persist user and token to hardware storage and SQLite so APK upgrades and app relaunches
          // never lose authentication or encounter blank guest race conditions.
          await storage.setItem(AUTH_TOKEN_KEY, session.access_token);
          await storage.setItem(USER_KEY, JSON.stringify(initialUser));
          await saveLocalAppState(AUTH_TOKEN_KEY, session.access_token);
          await saveLocalAppState(USER_KEY, JSON.stringify(initialUser));

          setActiveGamificationUser(session.user.id);

          set({
            token: session.access_token,
            user: initialUser,
            isAuthenticated: true,
            isLoading: false,
          });

          // Hydrate user-specific gamification state (activities, portfolio & completed lessons)
          useGamificationStore.getState().hydrate(session.user.id);

          // Concurrently fetch or create user profile in background
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
                  avatar_url: initialUser.avatarUrl || null,
                });
              } else {
                const profileAny = profile as Record<string, unknown>;
                const resolvedAge = profileAny.age ? Number(profileAny.age) : initialUser.age;
                const resolvedOnboarded =
                  profileAny.is_onboarded !== undefined
                    ? Boolean(profileAny.is_onboarded)
                    : Boolean(initialUser.isOnboarded || (profile.name && profile.name !== 'User' && resolvedAge));

                const updatedUser: User = {
                  ...initialUser,
                  name: profile.name || initialUser.name,
                  avatarColor: profile.avatar_color || initialUser.avatarColor,
                  avatarEmoji: profile.avatar_emoji || initialUser.avatarEmoji,
                  avatarUrl: (profileAny.avatar_url as string) || initialUser.avatarUrl,
                  age: resolvedAge,
                  isOnboarded: resolvedOnboarded,
                };

                await storage.setItem(USER_KEY, JSON.stringify(updatedUser));
    await saveLocalAppState(USER_KEY, JSON.stringify(updatedUser));
                await saveLocalAppState(USER_KEY, JSON.stringify(updatedUser));
                set((state) => ({
                  user: state.user ? updatedUser : state.user,
                }));
              }
            } catch (err) {
              console.warn('[Auth] Background profile sync warning:', err);
            }
          })();
        } else if (event === 'SIGNED_OUT') {
          // Explicit sign out: clear user session and transition to guest mode
          setActiveGamificationUser('guest');
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          useGamificationStore.getState().hydrate('guest');
        } else {
          // Device is offline or Supabase session token is refreshing during INITIAL_SESSION.
          // NEVER wipe authenticated user data or force-downgrade to guest when offline!
          const current = get();
          if (current.isAuthenticated && current.user && current.user.id !== 'guest') {
            // Keep user logged in with local offline credentials
            set({ isLoading: false });
            return;
          }

          // Unauthenticated initial state (no saved credentials exist)
          if (!current.isAuthenticated && !isGuestToken(current.token)) {
            setActiveGamificationUser('guest');
            set({
              token: null,
              user: null,
              isAuthenticated: false,
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



  updateProfile: async (
    name: string,
    email: string,
    avatarColor?: string,
    avatarEmoji?: string,
    phone?: string,
    city?: string,
    schoolGrade?: string,
    age?: number,
    isOnboarded?: boolean,
    avatarUrl?: string | null
  ) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedFields = {
      name,
      email,
      avatarColor: avatarColor !== undefined ? avatarColor : currentUser.avatarColor,
      avatarEmoji: avatarEmoji !== undefined ? avatarEmoji : currentUser.avatarEmoji,
      avatarUrl: avatarUrl !== undefined ? (avatarUrl || undefined) : currentUser.avatarUrl,
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
    await saveLocalAppState(USER_KEY, JSON.stringify(updatedUser));
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
          avatar_url: updatedFields.avatarUrl || null,
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
        avatar_url: updatedFields.avatarUrl || null,
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
            avatar_url: updatedFields.avatarUrl || null,
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
