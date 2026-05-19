import { create } from 'zustand';
import useUserStore from './user.store';

const initialState = {
  tokens: {
    accessToken: null,
    refreshToken: null,
  },
  user: {
    userId: null,
    email: null,
    role: null,
  },
  loading: false,
  error: null,
  isAuthenticated: false,
};

const useAuthStore = create((set, get) => ({
  ...initialState,

  // Set tokens - persist both tokens to localStorage
  // Note: In a production app with HttpOnly cookies, refreshToken would be httpOnly.
  // Here we store it in localStorage for the SPA to manage token refresh on reload.
  setTokens: (accessToken, refreshToken) => {
    try {
      localStorage.setItem('fitgainer_access_token', accessToken || '');
      localStorage.setItem('fitgainer_refresh_token', refreshToken || '');
      set({
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    } catch (err) {
      console.warn('Failed to persist tokens:', err);
      set({
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    }
  },

  // Set user info and mark as authenticated
  setUser: (user) => {
    if (!user) {
      set({
        user: {
          userId: null,
          email: null,
          role: null,
        },
        isAuthenticated: false,
      });
      return;
    }
    set({
      user: {
        userId: user.userId || null,
        email: user.email || null,
        role: user.role || null,
      },
      isAuthenticated: !!user.userId,
    });
  },

  // Update access token and optionally refresh token (for refresh endpoint)
  setAccessToken: (accessToken, refreshToken = null) => {
    try {
      localStorage.setItem('fitgainer_access_token', accessToken || '');
      if (refreshToken) {
        localStorage.setItem('fitgainer_refresh_token', refreshToken);
      }
      set((state) => ({
        tokens: {
          ...state.tokens,
          accessToken,
          ...(refreshToken && { refreshToken }),
        },
      }));
    } catch (err) {
      console.warn('Failed to persist token:', err);
      set((state) => ({
        tokens: {
          ...state.tokens,
          accessToken,
          ...(refreshToken && { refreshToken }),
        },
      }));
    }
  },

  // Set loading state
  setLoading: (loading) => {
    set({ loading });
  },

  // Set error state
  setError: (error) => {
    set({ error });
  },

  // Clear all auth data and reset user profile
  clearAuth: () => {
    try {
      localStorage.removeItem('fitgainer_access_token');
      localStorage.removeItem('fitgainer_refresh_token');
    } catch (err) {
      console.warn('Failed to clear localStorage:', err);
    }
    useUserStore.getState().clearProfile();
    set(initialState);
  },

  // Initialize auth from localStorage on app start
  // Note: user state is NOT persisted. After reload, isAuthenticated = true but user = null.
  // Components must call getMe() API to restore user data, or handle null gracefully.
  initializeAuth: () => {
    try {
      const accessToken = localStorage.getItem('fitgainer_access_token');
      const refreshToken = localStorage.getItem('fitgainer_refresh_token');

      if (accessToken && refreshToken) {
        set({
          tokens: {
            accessToken,
            refreshToken,
          },
          isAuthenticated: true,
          // user remains null until getMe() is called
        });
      }
    } catch (err) {
      console.warn('Failed to initialize auth from localStorage:', err);
    }
  },
}));

export default useAuthStore;
