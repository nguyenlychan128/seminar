import api from './api';

// Helper to create structured error with code
const createAuthError = (message, code) => {
  const err = new Error(message);
  err.code = code;
  err.success = false;
  return err;
};

const authService = {
  // Login with email and password
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      return {
        success: true,
        accessToken: response.data.data.accessToken,
        refreshToken: response.data.data.refreshToken,
        user: {
          userId: response.data.data.userId,
          email: response.data.data.email,
          role: response.data.data.role,
        },
      };
    } catch (error) {
      if (error.response?.status === 401) {
        throw createAuthError(
          error.response.data?.message || 'Invalid email or password',
          'INVALID_CREDENTIALS'
        );
      }
      if (error.response?.status === 400) {
        throw createAuthError(
          error.response.data?.message || 'Missing email or password',
          'MISSING_FIELDS'
        );
      }
      throw createAuthError(
        error.response?.data?.message || 'Login failed',
        'LOGIN_ERROR'
      );
    }
  },

  // Register with email, password, confirmPassword
  register: async (email, password, confirmPassword) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        confirmPassword,
      });

      return {
        success: true,
        user: {
          userId: response.data.data.userId,
          email: response.data.data.email,
          role: response.data.data.role,
        },
      };
    } catch (error) {
      if (error.response?.status === 409) {
        throw createAuthError('Email already registered', 'DUPLICATE_EMAIL');
      }
      if (error.response?.status === 400) {
        throw createAuthError(
          error.response.data?.message || 'Invalid registration data',
          'INVALID_DATA'
        );
      }
      throw createAuthError(
        error.response?.data?.message || 'Registration failed',
        'REGISTER_ERROR'
      );
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
      return { success: true };
    } catch (error) {
      throw createAuthError(
        error.response?.data?.message || 'Logout failed',
        'LOGOUT_ERROR'
      );
    }
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/auth/refresh', {
        refreshToken,
      });

      return {
        success: true,
        accessToken: response.data.data.accessToken,
        refreshToken: response.data.data.refreshToken,
      };
    } catch (error) {
      if (error.response?.status === 401) {
        throw createAuthError(
          'Refresh token expired or invalid',
          'INVALID_REFRESH_TOKEN'
        );
      }
      throw createAuthError(
        error.response?.data?.message || 'Token refresh failed',
        'REFRESH_ERROR'
      );
    }
  },

  // Get current user
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');

      return {
        success: true,
        user: {
          userId: response.data.data.userId,
          email: response.data.data.email,
          role: response.data.data.role,
        },
      };
    } catch (error) {
      if (error.response?.status === 401) {
        throw createAuthError(
          'Unauthorized - no valid token',
          'UNAUTHORIZED'
        );
      }
      throw createAuthError(
        error.response?.data?.message || 'Failed to fetch user',
        'GET_ME_ERROR'
      );
    }
  },
};

export default authService;
