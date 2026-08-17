import { create } from 'zustand';
import { storage } from '@/utils/storage';
import { supabase } from '@/utils/supabase';

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
          // Fetch user profile from the database 'profiles' table
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

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
