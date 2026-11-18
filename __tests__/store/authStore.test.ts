import { isGuestToken, useAuthStore } from '../../src/store/authStore';

describe('authStore', () => {
  describe('isGuestToken', () => {
    test('isGuestToken null or undefined returns false', () => {
      expect(isGuestToken(null)).toBe(false);
      expect(isGuestToken(undefined)).toBe(false);
      expect(isGuestToken('')).toBe(false);
    });

    test('isGuestToken token with guest-session- prefix returns true', () => {
      expect(isGuestToken('guest-session-1700000000-abcdef')).toBe(true);
    });

    test('isGuestToken legacy mock token returns true', () => {
      expect(isGuestToken('mock-guest-token-56789')).toBe(true);
    });

    test('isGuestToken real user JWT token returns false', () => {
      expect(isGuestToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID')).toBe(false);
      expect(isGuestToken('user-access-token-999')).toBe(false);
    });
  });

  describe('authState store', () => {
    test('initial authState has null user and unauthenticated flag', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(true);
    });
  });
});
