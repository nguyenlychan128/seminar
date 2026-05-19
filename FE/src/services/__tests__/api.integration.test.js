import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import useAuthStore from '../../stores/auth.store';

const BASE_URL = 'http://localhost/api';

const server = setupServer();

let api;

describe('api.js — Axios interceptors', () => {
  beforeAll(async () => {
    server.listen({ onUnhandledRequest: 'bypass' });
    api = (await import('../api')).default;
  });

  beforeEach(() => {
    useAuthStore.setState({
      tokens: { accessToken: 'valid_access_token', refreshToken: 'valid_refresh_token' },
      user: { userId: 'u1', email: 'user@example.com', role: 'User' },
      loading: false,
      error: null,
      isAuthenticated: true,
    });
    localStorage.setItem('fitgainer_access_token', 'valid_access_token');
  });

  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
  });

  afterAll(() => server.close());

  describe('request interceptor — Authorization header', () => {
    it('should attach Bearer <accessToken> from store to every request', async () => {
      let capturedAuth;
      server.use(
        http.get(`${BASE_URL}/secure`, ({ request }) => {
          capturedAuth = request.headers.get('Authorization');
          return HttpResponse.json({ ok: true });
        })
      );
      await api.get('/secure');
      expect(capturedAuth).toBe('Bearer valid_access_token');
    });

    it('should not attach Authorization header when store has no access token', async () => {
      useAuthStore.setState({
        tokens: { accessToken: null, refreshToken: null },
        isAuthenticated: false,
        user: { userId: null, email: null, role: null },
      });
      let capturedAuth;
      server.use(
        http.get(`${BASE_URL}/public`, ({ request }) => {
          capturedAuth = request.headers.get('Authorization');
          return HttpResponse.json({ ok: true });
        })
      );
      await api.get('/public');
      expect(capturedAuth).toBeNull();
    });
  });

  describe('response interceptor — 403 Forbidden (pass-through)', () => {
    it('should NOT call /auth/refresh on a 403 response', async () => {
      let refreshCalled = false;
      server.use(
        http.get(`${BASE_URL}/admin-only`, () =>
          HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
        ),
        http.post(`${BASE_URL}/auth/refresh`, () => {
          refreshCalled = true;
          return HttpResponse.json({ accessToken: 'new_token' });
        })
      );
      try { await api.get('/admin-only'); } catch (_) {}
      expect(refreshCalled).toBe(false);
    });

    it('should reject with a 403 error object directly', async () => {
      server.use(
        http.get(`${BASE_URL}/admin-only`, () =>
          HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
        )
      );
      await expect(api.get('/admin-only')).rejects.toMatchObject({
        response: { status: 403 },
      });
    });
  });
});
