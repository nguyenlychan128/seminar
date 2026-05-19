import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useLogin } from '../useLogin';
import useAuthStore from '../../stores/auth.store';

const handlers = [
  http.post('/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
        user: {
          userId: 'user_123',
          email: 'test@example.com',
          role: 'user',
        },
      });
    }
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),
];

const server = setupServer(...handlers);

describe('useLogin()', () => {
  beforeEach(() => {
    server.listen();
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

  it('should call loginService with correct email and password', async () => {
    const { result } = renderHook(() => useLogin());

    let loginCalled = false;
    server.use(
      http.post('/auth/login', async ({ request }) => {
        loginCalled = true;
        const { email, password } = await request.json();
        expect(email).toBe('test@example.com');
        expect(password).toBe('password123');
        return HttpResponse.json({
          accessToken: 'access_token_123',
          refreshToken: 'refresh_token_123',
          user: {
            userId: 'user_123',
            email: 'test@example.com',
            role: 'user',
          },
        });
      })
    );

    await act(async () => {
      await result.current('test@example.com', 'password123');
    });

    expect(loginCalled).toBe(true);
  });

  it('should call setTokens with returned tokens on success', async () => {
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current('test@example.com', 'password123');
    });

    const state = useAuthStore.getState();
    expect(state.tokens.accessToken).toBe('access_token_123');
    expect(state.tokens.refreshToken).toBe('refresh_token_123');
  });

  it('should call setUser with returned user on success', async () => {
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current('test@example.com', 'password123');
    });

    const state = useAuthStore.getState();
    expect(state.user.userId).toBe('user_123');
    expect(state.user.email).toBe('test@example.com');
  });

  it('should set loading to false after API call succeeds', async () => {
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current('test@example.com', 'password123');
    });

    const state = useAuthStore.getState();
    expect(state.loading).toBe(false);
  });

  it('should set loading to false after API call fails', async () => {
    const { result } = renderHook(() => useLogin());

    try {
      await act(async () => {
        await result.current('wrong@example.com', 'wrong_password');
      });
    } catch (err) {
      // Expected error
    }

    const state = useAuthStore.getState();
    expect(state.loading).toBe(false);
  });

  it('should call setError with error message on failure', async () => {
    const { result } = renderHook(() => useLogin());

    try {
      await act(async () => {
        await result.current('wrong@example.com', 'wrong_password');
      });
    } catch (err) {
      // Expected error
    }

    const state = useAuthStore.getState();
    expect(state.error).toBeDefined();
    expect(state.error).not.toBeNull();
  });

  it('should throw error upward so component can handle it', async () => {
    const { result } = renderHook(() => useLogin());

    let errorThrown = false;
    try {
      await act(async () => {
        await result.current('wrong@example.com', 'wrong_password');
      });
    } catch (err) {
      errorThrown = true;
      expect(err.success).toBe(false);
    }

    expect(errorThrown).toBe(true);
  });

  it('should return result object on success', async () => {
    const { result } = renderHook(() => useLogin());

    let loginResult;
    await act(async () => {
      loginResult = await result.current('test@example.com', 'password123');
    });

    expect(loginResult.success).toBe(true);
    expect(loginResult.accessToken).toBeDefined();
    expect(loginResult.user).toBeDefined();
  });
});
