import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import useAuthStore from '../auth.store';
import useUserStore from '../user.store';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Auth Store', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      tokens: { accessToken: null, refreshToken: null },
      user: { userId: null, email: null, role: null },
      loading: false,
      error: null,
      isAuthenticated: false,
    });
  });

  describe('Initial State', () => {
    it('should have default state with null tokens', () => {
      const state = useAuthStore.getState();
      expect(state.tokens.accessToken).toBeNull();
      expect(state.tokens.refreshToken).toBeNull();
    });

    it('should have default state with null user', () => {
      const state = useAuthStore.getState();
      expect(state.user.userId).toBeNull();
      expect(state.user.email).toBeNull();
      expect(state.user.role).toBeNull();
    });

    it('should have isAuthenticated = false by default', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should have loading = false by default', () => {
      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
    });

    it('should have error = null by default', () => {
      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('setTokens()', () => {
    it('should store accessToken and refreshToken in state', () => {
      const { setTokens } = useAuthStore.getState();
      setTokens('access123', 'refresh456');

      const state = useAuthStore.getState();
      expect(state.tokens.accessToken).toBe('access123');
      expect(state.tokens.refreshToken).toBe('refresh456');
    });

    it('should write accessToken to localStorage with key fitgainer_access_token', () => {
      const { setTokens } = useAuthStore.getState();
      setTokens('access123', 'refresh456');

      expect(localStorage.getItem('fitgainer_access_token')).toBe('access123');
    });

    it('should write refreshToken to localStorage with key fitgainer_refresh_token', () => {
      const { setTokens } = useAuthStore.getState();
      setTokens('access123', 'refresh456');

      expect(localStorage.getItem('fitgainer_refresh_token')).toBe('refresh456');
    });

    it('should handle null refreshToken without throwing', () => {
      const { setTokens } = useAuthStore.getState();
      expect(() => setTokens('access123', null)).not.toThrow();

      const state = useAuthStore.getState();
      expect(state.tokens.accessToken).toBe('access123');
      expect(state.tokens.refreshToken).toBeNull();
    });

    it('should overwrite existing tokens in localStorage', () => {
      const { setTokens } = useAuthStore.getState();
      setTokens('access1', 'refresh1');
      setTokens('access2', 'refresh2');

      expect(localStorage.getItem('fitgainer_access_token')).toBe('access2');
      expect(localStorage.getItem('fitgainer_refresh_token')).toBe('refresh2');
    });
  });

  describe('setUser()', () => {
    it('should store userId, email, role in state', () => {
      const { setUser } = useAuthStore.getState();
      const user = { userId: '123', email: 'test@example.com', role: 'user' };
      setUser(user);

      const state = useAuthStore.getState();
      expect(state.user.userId).toBe('123');
      expect(state.user.email).toBe('test@example.com');
      expect(state.user.role).toBe('user');
    });

    it('should set isAuthenticated to true', () => {
      const { setUser } = useAuthStore.getState();
      setUser({ userId: '123', email: 'test@example.com', role: 'user' });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle null user gracefully', () => {
      const { setUser, setTokens } = useAuthStore.getState();
      setTokens('access123', 'refresh456');
      setUser(null);

      const state = useAuthStore.getState();
      expect(state.user.userId).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setAccessToken()', () => {
    it('should update only accessToken when refreshToken is not provided', () => {
      const { setTokens, setAccessToken } = useAuthStore.getState();
      setTokens('access1', 'refresh1');
      setAccessToken('access2');

      const state = useAuthStore.getState();
      expect(state.tokens.accessToken).toBe('access2');
      expect(state.tokens.refreshToken).toBe('refresh1');
    });

    it('should update both accessToken and refreshToken when refreshToken is provided', () => {
      const { setTokens, setAccessToken } = useAuthStore.getState();
      setTokens('access1', 'refresh1');
      setAccessToken('access2', 'refresh2');

      const state = useAuthStore.getState();
      expect(state.tokens.accessToken).toBe('access2');
      expect(state.tokens.refreshToken).toBe('refresh2');
    });

    it('should update localStorage fitgainer_access_token', () => {
      const { setTokens, setAccessToken } = useAuthStore.getState();
      setTokens('access1', 'refresh1');
      setAccessToken('access2');

      expect(localStorage.getItem('fitgainer_access_token')).toBe('access2');
    });

    it('should update localStorage fitgainer_refresh_token when provided', () => {
      const { setTokens, setAccessToken } = useAuthStore.getState();
      setTokens('access1', 'refresh1');
      setAccessToken('access2', 'refresh2');

      expect(localStorage.getItem('fitgainer_refresh_token')).toBe('refresh2');
    });

    it('should not change user or isAuthenticated', () => {
      const { setTokens, setUser, setAccessToken } = useAuthStore.getState();
      setTokens('access1', 'refresh1');
      setUser({ userId: '123', email: 'test@example.com', role: 'user' });
      setAccessToken('access2');

      const state = useAuthStore.getState();
      expect(state.user.userId).toBe('123');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('setLoading()', () => {
    it('should set loading to true', () => {
      const { setLoading } = useAuthStore.getState();
      setLoading(true);

      const state = useAuthStore.getState();
      expect(state.loading).toBe(true);
    });

    it('should set loading to false', () => {
      const { setLoading } = useAuthStore.getState();
      setLoading(true);
      setLoading(false);

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
    });
  });

  describe('setError()', () => {
    it('should store error message in state', () => {
      const { setError } = useAuthStore.getState();
      setError('Login failed');

      const state = useAuthStore.getState();
      expect(state.error).toBe('Login failed');
    });

    it('should overwrite previous error', () => {
      const { setError } = useAuthStore.getState();
      setError('Error 1');
      setError('Error 2');

      const state = useAuthStore.getState();
      expect(state.error).toBe('Error 2');
    });

    it('should accept null to clear error', () => {
      const { setError } = useAuthStore.getState();
      setError('Error');
      setError(null);

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('clearAuth()', () => {
    it('should reset tokens to null', () => {
      const { setTokens, clearAuth } = useAuthStore.getState();
      setTokens('access123', 'refresh456');
      clearAuth();

      const state = useAuthStore.getState();
      expect(state.tokens.accessToken).toBeNull();
      expect(state.tokens.refreshToken).toBeNull();
    });

    it('should reset user to null', () => {
      const { setUser, clearAuth } = useAuthStore.getState();
      setUser({ userId: '123', email: 'test@example.com', role: 'user' });
      clearAuth();

      const state = useAuthStore.getState();
      expect(state.user.userId).toBeNull();
      expect(state.user.email).toBeNull();
      expect(state.user.role).toBeNull();
    });

    it('should set isAuthenticated to false', () => {
      const { setUser, clearAuth } = useAuthStore.getState();
      setUser({ userId: '123', email: 'test@example.com', role: 'user' });
      clearAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should clear fitgainer_access_token from localStorage', () => {
      const { setTokens, clearAuth } = useAuthStore.getState();
      setTokens('access123', 'refresh456');
      clearAuth();

      expect(localStorage.getItem('fitgainer_access_token')).toBeNull();
    });

    it('should clear both fitgainer_access_token and fitgainer_refresh_token from localStorage', () => {
      const { setTokens, clearAuth } = useAuthStore.getState();
      setTokens('access123', 'refresh456');
      clearAuth();

      expect(localStorage.getItem('fitgainer_access_token')).toBeNull();
      expect(localStorage.getItem('fitgainer_refresh_token')).toBeNull();
    });

    it('should not throw when localStorage is already empty', () => {
      const { clearAuth } = useAuthStore.getState();
      expect(() => clearAuth()).not.toThrow();
    });

    it('should reset user profile store when clearAuth is called (cross-store integration)', () => {
      const mockProfile = {
        userId: 'user_123',
        height: 165,
        weight: 48,
        age: 22,
        gender: 'male',
        bmi: 17.63,
        bodyClassification: 'underweight',
        updatedAt: '2026-05-17T10:00:00Z',
      };
      useUserStore.setState({ profile: mockProfile, error: 'some error', isLoading: false });

      const { clearAuth } = useAuthStore.getState();
      clearAuth();

      const userState = useUserStore.getState();
      expect(userState.profile).toBeNull();
      expect(userState.error).toBeNull();
      expect(userState.isLoading).toBe(false);
    });
  });

  describe('initializeAuth()', () => {
    it('should load both accessToken and refreshToken from localStorage', () => {
      localStorage.setItem('fitgainer_access_token', 'stored_access');
      localStorage.setItem('fitgainer_refresh_token', 'stored_refresh');

      const { initializeAuth } = useAuthStore.getState();
      initializeAuth();

      const state = useAuthStore.getState();
      expect(state.tokens.accessToken).toBe('stored_access');
      expect(state.tokens.refreshToken).toBe('stored_refresh');
    });

    it('should set isAuthenticated to true when both tokens exist', () => {
      localStorage.setItem('fitgainer_access_token', 'stored_access');
      localStorage.setItem('fitgainer_refresh_token', 'stored_refresh');

      const { initializeAuth } = useAuthStore.getState();
      initializeAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
    });

    it('should keep isAuthenticated false when either token is missing', () => {
      localStorage.setItem('fitgainer_access_token', 'stored_access');
      // refreshToken is missing

      const { initializeAuth } = useAuthStore.getState();
      initializeAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should keep isAuthenticated false when localStorage is empty', () => {
      const { initializeAuth } = useAuthStore.getState();
      initializeAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should not throw when localStorage has no tokens', () => {
      const { initializeAuth } = useAuthStore.getState();
      expect(() => initializeAuth()).not.toThrow();
    });
  });
});
