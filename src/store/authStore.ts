import { create } from 'zustand';
import { storage } from '@/utils/storage';

const AUTH_TOKEN_KEY = 'cbudget_auth_token';

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
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  hydrate: () => Promise<void>;
  setPremium: (premium: boolean) => Promise<void>;
  updateProfile: (name: string, email: string, avatarColor?: string, avatarEmoji?: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isPremium: false,

  login: async (token: string, user: User) => {
    await storage.setItem(AUTH_TOKEN_KEY, token);
    await storage.setItem('cbudget_user', JSON.stringify(user));
    
    // Retrieve stored premium status if it exists
    const storedPremium = await storage.getItem('cbudget_is_premium');
    const isPremium = storedPremium === 'true';
    
    set({ token, user, isAuthenticated: true, isPremium });
  },

  logout: async () => {
    await storage.deleteItem(AUTH_TOKEN_KEY);
    await storage.deleteItem('cbudget_user');
    await storage.deleteItem('cbudget_is_premium');
    set({ token: null, user: null, isAuthenticated: false, isPremium: false });
  },

  deleteAccount: async () => {
    await storage.deleteItem(AUTH_TOKEN_KEY);
    await storage.deleteItem('cbudget_user');
    await storage.deleteItem('cbudget_is_premium');
    set({ token: null, user: null, isAuthenticated: false, isPremium: false });
  },

  hydrate: async () => {
    try {
      const token = await storage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        const userStr = await storage.getItem('cbudget_user');
        const storedPremium = await storage.getItem('cbudget_is_premium');
        const isPremium = storedPremium === 'true';
        let user: User | null = null;
        if (userStr) {
          try {
            user = JSON.parse(userStr);
          } catch (e) {
            console.error('Failed to parse persisted user:', e);
          }
        }
        if (!user) {
          // Fallback if user profile wasn't stored
          user = token === 'mock-guest-token-56789'
            ? { id: 'guest', name: 'Guest Explorer', email: 'guest@cbudget.com', avatarColor: '#14B8A6', avatarEmoji: '💼' }
            : { id: '1', name: 'Demo User', email: 'user@example.com', avatarColor: '#0EA5E9', avatarEmoji: '💼' };
        }
        set({
          token,
          user,
          isAuthenticated: true,
          isPremium,
        });
      }
    } catch (error) {
      console.error('Failed to hydrate auth state:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setPremium: async (premium: boolean) => {
    await storage.setItem('cbudget_is_premium', premium ? 'true' : 'false');
    set({ isPremium: premium });
  },

  updateProfile: async (name: string, email: string, avatarColor?: string, avatarEmoji?: string) => {
    set((state) => {
      if (!state.user) return {};
      const updatedUser = {
        ...state.user,
        name,
        email,
        avatarColor: avatarColor !== undefined ? avatarColor : state.user.avatarColor,
        avatarEmoji: avatarEmoji !== undefined ? avatarEmoji : state.user.avatarEmoji,
      };
      
      storage.setItem('cbudget_user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
}));
