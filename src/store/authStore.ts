import { create } from 'zustand';
import { sqliteStorage } from '@/utils/sqliteStorage';
import { supabase } from '@/utils/supabase';

const AUTH_TOKEN_KEY = 'cbudget_auth_token';
const GUEST_USER_KEY = 'cbudget_user';
const GUEST_PREMIUM_KEY = 'cbudget_is_premium';
const PROFILE_CACHE_PREFIX = 'cbudget_profile_cache:';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor?: string;
  avatarEmoji?: string;
}

type RemoteProfileRow = {
  id: string;
  name: string;
  email: string;
  avatar_color: string;
  avatar_emoji: string;
  is_premium: boolean;
  updated_at?: string;
};

async function upsertRemoteProfile(userId: string, profile: Partial<RemoteProfileRow>) {
  const nextProfile: RemoteProfileRow = {
    id: userId,
    name: profile.name ?? '',
    email: profile.email ?? '',
    avatar_color: profile.avatar_color ?? '#0EA5E9',
    avatar_emoji: profile.avatar_emoji ?? '💼',
    is_premium: profile.is_premium ?? false,
  };

  const { error } = await supabase.from('profiles').upsert(nextProfile, { onConflict: 'id' });
  if (error) {
    console.warn('Supabase profile upsert failed:', error);
  }

  return nextProfile;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPremium: boolean;
  login: (email: string, password: string) => Promise<void>;
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
    await sqliteStorage.deleteItem(AUTH_TOKEN_KEY);
    await sqliteStorage.deleteItem(GUEST_USER_KEY);
    await sqliteStorage.deleteItem(GUEST_PREMIUM_KEY);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email, password) => {
    // Clear any local guest state before signing up
    await sqliteStorage.deleteItem(AUTH_TOKEN_KEY);
    await sqliteStorage.deleteItem(GUEST_USER_KEY);
    await sqliteStorage.deleteItem(GUEST_PREMIUM_KEY);

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
      await sqliteStorage.setItem(AUTH_TOKEN_KEY, 'mock-guest-token-56789');
      await sqliteStorage.setItem(GUEST_USER_KEY, JSON.stringify(mockUser));
      await sqliteStorage.setItem(GUEST_PREMIUM_KEY, 'false');

      set({
        token: 'mock-guest-token-56789',
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
    await sqliteStorage.deleteItem(AUTH_TOKEN_KEY);
    await sqliteStorage.deleteItem(GUEST_USER_KEY);
    await sqliteStorage.deleteItem(GUEST_PREMIUM_KEY);
    if (currentUser && currentUser.id !== 'guest') {
      await sqliteStorage.deleteItem(`${PROFILE_CACHE_PREFIX}${currentUser.id}`);
    }

    if (currentUser && currentUser.id !== 'guest') {
      await supabase.auth.signOut();
    }

    set({ token: null, user: null, isAuthenticated: false, isPremium: false });
  },

  deleteAccount: async () => {
    const currentUser = get().user;

    // Clear local guest storage
    await sqliteStorage.deleteItem(AUTH_TOKEN_KEY);
    await sqliteStorage.deleteItem(GUEST_USER_KEY);
    await sqliteStorage.deleteItem(GUEST_PREMIUM_KEY);
    if (currentUser && currentUser.id !== 'guest') {
      await sqliteStorage.deleteItem(`${PROFILE_CACHE_PREFIX}${currentUser.id}`);
    }

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
      const guestToken = await sqliteStorage.getItem(AUTH_TOKEN_KEY);
      if (guestToken === 'mock-guest-token-56789') {
        const userStr = await sqliteStorage.getItem(GUEST_USER_KEY);
        const storedPremium = await sqliteStorage.getItem(GUEST_PREMIUM_KEY);
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
          } catch (e) {}
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

      // Initialize Supabase session listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          const cacheKey = `${PROFILE_CACHE_PREFIX}${session.user.id}`;
          let profile: {
            name?: string | null;
            email?: string | null;
            avatar_color?: string | null;
            avatar_emoji?: string | null;
            is_premium?: boolean | null;
          } | null = null;

          try {
            // Prefer live Supabase data when online.
            const { data: remoteProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (remoteProfile) {
              profile = remoteProfile;
              await sqliteStorage.setItem(cacheKey, JSON.stringify(remoteProfile));
            } else {
              profile = await upsertRemoteProfile(session.user.id, {
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || '',
                avatar_color: '#0EA5E9',
                avatar_emoji: '💼',
                is_premium: false,
              });
              await sqliteStorage.setItem(cacheKey, JSON.stringify(profile));
            }
          } catch (error) {
            console.warn('Supabase profile fetch failed, falling back to SQLite cache:', error);
          }

          if (!profile) {
            const cachedProfile = await sqliteStorage.getItem(cacheKey);
            if (cachedProfile) {
              try {
                profile = JSON.parse(cachedProfile);
              } catch (cacheError) {
                console.warn('Failed to parse cached profile:', cacheError);
              }
            }
          }

          const user: User = {
            id: session.user.id,
            name: profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            avatarColor: profile?.avatar_color || '#0EA5E9',
            avatarEmoji: profile?.avatar_emoji || '💼',
          };

          set({
            token: session.access_token,
            user,
            isAuthenticated: true,
            isPremium: profile?.is_premium || false,
            isLoading: false,
          });
        } else {
          // If we had a local guest session, don't clear it. Otherwise, clean up auth state
          if (get().token !== 'mock-guest-token-56789') {
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
    } catch (error) {
      console.error('Failed to hydrate auth state:', error);
      set({ isLoading: false });
    }
  },

  setPremium: async (premium: boolean) => {
    const currentUser = get().user;
    if (!currentUser) return;

    if (currentUser.id === 'guest') {
      await sqliteStorage.setItem(GUEST_PREMIUM_KEY, premium ? 'true' : 'false');
      set({ isPremium: premium });
      return;
    }

    const cacheKey = `${PROFILE_CACHE_PREFIX}${currentUser.id}`;
    const cachedProfileRaw = await sqliteStorage.getItem(cacheKey);
    let cachedProfile: Record<string, unknown> = {};

    if (cachedProfileRaw) {
      try {
        cachedProfile = JSON.parse(cachedProfileRaw);
      } catch (error) {
        console.warn('Failed to parse cached profile before premium update:', error);
      }
    }

    cachedProfile.is_premium = premium;

    try {
      await upsertRemoteProfile(currentUser.id, {
        name: (cachedProfile.name as string) || currentUser.name,
        email: (cachedProfile.email as string) || currentUser.email,
        avatar_color: (cachedProfile.avatar_color as string) || currentUser.avatarColor || '#0EA5E9',
        avatar_emoji: (cachedProfile.avatar_emoji as string) || currentUser.avatarEmoji || '💼',
        is_premium: premium,
      });
    } catch (error) {
      console.warn('Supabase premium update failed, saving locally only:', error);
    }

    await sqliteStorage.setItem(cacheKey, JSON.stringify(cachedProfile));

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
      await sqliteStorage.setItem(GUEST_USER_KEY, JSON.stringify(updatedUser));
      set({ user: updatedUser });
      return;
    }

    const cacheKey = `${PROFILE_CACHE_PREFIX}${currentUser.id}`;
    const nextProfile = {
      name,
      email,
      avatar_color: updatedFields.avatarColor,
      avatar_emoji: updatedFields.avatarEmoji,
      is_premium: get().isPremium,
      updated_at: new Date().toISOString(),
    };

    try {
      await upsertRemoteProfile(currentUser.id, {
        name,
        email,
        avatar_color: updatedFields.avatarColor,
        avatar_emoji: updatedFields.avatarEmoji,
        is_premium: get().isPremium,
      });
    } catch (error) {
      console.warn('Supabase profile update failed, saving locally only:', error);
    }

    await sqliteStorage.setItem(cacheKey, JSON.stringify(nextProfile));

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
