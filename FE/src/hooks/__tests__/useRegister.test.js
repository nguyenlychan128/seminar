import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useRegister } from '../useRegister';
import useAuthStore from '../../stores/auth.store';

const server = setupServer(
  http.post('http://localhost/api/auth/register', async ({ request }) => {
    const { email, password, confirmPassword } = await request.json();

    if (email === 'existing@example.com') {
      return HttpResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }

    if (password !== confirmPassword) {
      return HttpResponse.json(
        { message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      { user: { userId: 'new_user_123', email, role: 'user' } },
      { status: 201 }
    );
  })
);

beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
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
  vi.clearAllMocks();
});

describe('useRegister()', () => {
  it('should return a callable function', () => {
    const { result } = renderHook(() => useRegister());
    expect(typeof result.current).toBe('function');
  });

  it('should call authService.register and return result on success', async () => {
    const { result } = renderHook(() => useRegister());

    let returnValue;
    await act(async () => {
      returnValue = await result.current('newuser@example.com', 'Password1!', 'Password1!');
    });

    expect(returnValue).toMatchObject({
      user: { userId: 'new_user_123', email: 'newuser@example.com' },
    });
  });

  it('should NOT mutate auth store on successful register', async () => {
    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await result.current('newuser@example.com', 'Password1!', 'Password1!');
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user.userId).toBeNull();
  });

  it('should throw an error when registration fails (409 duplicate)', async () => {
    const { result } = renderHook(() => useRegister());

    let errorThrown = false;
    await act(async () => {
      try {
        await result.current('existing@example.com', 'Password1!', 'Password1!');
      } catch {
        errorThrown = true;
      }
    });

    expect(errorThrown).toBe(true);
  });

  it('should throw an error when passwords do not match (400)', async () => {
    const { result } = renderHook(() => useRegister());

    let errorThrown = false;
    await act(async () => {
      try {
        await result.current('newuser@example.com', 'Password1!', 'Different1!');
      } catch {
        errorThrown = true;
      }
    });

    expect(errorThrown).toBe(true);
  });

  it('should NOT mutate auth store on failed register', async () => {
    const { result } = renderHook(() => useRegister());

    await act(async () => {
      try {
        await result.current('existing@example.com', 'Password1!', 'Password1!');
      } catch {
        // expected
      }
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user.userId).toBeNull();
  });
});
