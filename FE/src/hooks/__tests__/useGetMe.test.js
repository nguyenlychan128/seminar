import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useGetMe } from '../useGetMe';
import useAuthStore from '../../stores/auth.store';

const handlers = [
  http.get('/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'Missing authorization header' },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      user: {
        userId: 'user_123',
        email: 'test@example.com',
        role: 'user',
      },
    });
  }),
];

const server = setupServer(...handlers);

describe('useGetMe()', () => {
  beforeEach(() => {
    server.listen();
    localStorage.clear();
  });

  afterEach(() => {
    server.resetHandlers();
    server.close();
    useAuthStore.setState({
      tokens: { accessToken: null, refreshToken: null },
      user: { userId: null, email: null, role: null },
      loading: false,
      error: null,
      isAuthenticated: false,
    });
  });

  it('should fetch user data when authenticated but user is null', async () => {
    const { setTokens } = useAuthStore.getState();
    setTokens('access_token_123', 'refresh_token_123');
    useAuthStore.setState({ isAuthenticated: true });

    const { result } = renderHook(() => useGetMe());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const state = useAuthStore.getState();
    expect(state.user.userId).toBe('user_123');
    expect(state.user.email).toBe('test@example.com');
  });

  it('should not fetch if already authenticated with user data', async () => {
    const { setTokens, setUser } = useAuthStore.getState();
    setTokens('access_token_123', 'refresh_token_123');
    setUser({ userId: 'user_123', email: 'test@example.com', role: 'user' });

    let fetchCalled = false;
    server.use(
      http.get('/auth/me', () => {
        fetchCalled = true;
        return HttpResponse.json({
          user: { userId: 'user_123', email: 'test@example.com', role: 'user' },
        });
      })
    );

    renderHook(() => useGetMe());

    expect(fetchCalled).toBe(false);
  });

  it('should not fetch if not authenticated', async () => {
    useAuthStore.setState({ isAuthenticated: false });

    let fetchCalled = false;
    server.use(
      http.get('/auth/me', () => {
        fetchCalled = true;
        return HttpResponse.json({
          user: { userId: 'user_123', email: 'test@example.com', role: 'user' },
        });
      })
    );

    renderHook(() => useGetMe());

    // Wait a bit to ensure no fetch happened
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(fetchCalled).toBe(false);
  });

  it('should set error on API failure', async () => {
    const { setTokens } = useAuthStore.getState();
    setTokens('access_token_123', 'refresh_token_123');
    useAuthStore.setState({ isAuthenticated: true });

    server.use(
      http.get('/auth/me', () => {
        return HttpResponse.json(
          { message: 'Internal server error' },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(() => useGetMe());

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
