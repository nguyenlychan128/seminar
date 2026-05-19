import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import api from '../api';
import useAuthStore from '../../stores/auth.store';

const handlers = [
  http.post('/auth/refresh', async ({ request }) => {
    const body = await request.json();
    if (body.refreshToken === 'valid_refresh') {
      return HttpResponse.json({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
    }
    return HttpResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }),

  http.get('/test', () => {
    return HttpResponse.json({ success: true });
  }),

  http.get('/protected', () => {
    return HttpResponse.json({ protected: true });
  }),

  http.get('/error', () => {
    return HttpResponse.json({ error: 'Server error' }, { status: 500 });
  }),

  http.get('/forbidden', () => {
    return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
  }),
];

const server = setupServer(...handlers);

describe('HTTP Client (api.js)', () => {
  beforeEach(() => {
    server.listen();
    localStorage.clear();
    useAuthStore.setState({
      tokens: { accessToken: null, refreshToken: null },
      user: { userId: null, email: null, role: null },
      loading: false,
      error: null,
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    server.resetHandlers();
    server.close();
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header when accessToken exists in store', async () => {
      const { setTokens } = useAuthStore.getState();
      setTokens('valid_token', 'refresh');

      let capturedConfig;
      server.use(
        http.get('/test', ({ request }) => {
          capturedConfig = {
            headers: request.headers,
          };
          return HttpResponse.json({ success: true });
        })
      );

      await api.get('/test');
      expect(capturedConfig.headers.get('Authorization')).toBe('Bearer valid_token');
    });

    it('should not add Authorization header when accessToken is null', async () => {
      let capturedConfig;
      server.use(
        http.get('/test', ({ request }) => {
          capturedConfig = {
            headers: request.headers,
          };
          return HttpResponse.json({ success: true });
        })
      );

      await api.get('/test');
      expect(capturedConfig.headers.get('Authorization')).toBeNull();
    });

    it('should use format Bearer <token> exactly', async () => {
      const { setTokens } = useAuthStore.getState();
      setTokens('mytoken123', 'refresh');

      let authHeader;
      server.use(
        http.get('/test', ({ request }) => {
          authHeader = request.headers.get('Authorization');
          return HttpResponse.json({ success: true });
        })
      );

      await api.get('/test');
      expect(authHeader).toBe('Bearer mytoken123');
    });
  });

  describe('Response Interceptor (401 handling)', () => {
    it('should pass non-401 errors through without interception', async () => {
      server.use(
        http.get('/error', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      try {
        await api.get('/error');
      } catch (error) {
        expect(error.response.status).toBe(500);
      }
    });

    it('should pass 403 errors through without triggering refresh', async () => {
      const { setTokens } = useAuthStore.getState();
      setTokens('valid_token', 'refresh');

      let refreshCalled = false;
      server.use(
        http.get('/forbidden', () => {
          return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
        }),
        http.post('/auth/refresh', () => {
          refreshCalled = true;
          return HttpResponse.json({});
        })
      );

      try {
        await api.get('/forbidden');
      } catch (error) {
        expect(error.response.status).toBe(403);
        expect(refreshCalled).toBe(false);
      }
    });
  });

  describe('Base Configuration', () => {
    it('should use VITE_API_BASE_URL as baseURL', () => {
      expect(api.defaults.baseURL).toBeDefined();
    });
  });
});
