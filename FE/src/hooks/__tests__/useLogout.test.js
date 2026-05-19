import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useLogout } from '../useLogout';
import useAuthStore from '../../stores/auth.store';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => mockNavigate),
  };
});

const BASE_URL = 'http://localhost/api';

const server = setupServer(
  http.post(`${BASE_URL}/auth/logout`, () =>
    HttpResponse.json({ success: true })
  )
);

const seedAuthState = () => {
  useAuthStore.setState({
    tokens: { accessToken: 'access_token_abc', refreshToken: 'refresh_token_xyz' },
    user: { userId: 'user_1', email: 'user@example.com', role: 'User' },
    loading: false,
    error: null,
    isAuthenticated: true,
  });
  localStorage.setItem('fitgainer_access_token', 'access_token_abc');
  localStorage.setItem('fitgainer_refresh_token', 'refresh_token_xyz');
};

describe('useLogout()', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

  beforeEach(() => {
    seedAuthState();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({
      tokens: { accessToken: null, refreshToken: null },
      user: { userId: null, email: null, role: null },
      loading: false,
      error: null,
      isAuthenticated: false,
    });
  });

  afterAll(() => server.close());

  it('should return a callable function', () => {
    const { result } = renderHook(() => useLogout());
    expect(typeof result.current).toBe('function');
  });

  it('should call POST /auth/logout on the server', async () => {
    let logoutCalled = false;
    server.use(
      http.post(`${BASE_URL}/auth/logout`, () => {
        logoutCalled = true;
        return HttpResponse.json({ success: true });
      })
    );
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    expect(logoutCalled).toBe(true);
  });

  it('should use the POST HTTP method for the logout call', async () => {
    let capturedMethod;
    server.use(
      http.post(`${BASE_URL}/auth/logout`, ({ request }) => {
        capturedMethod = request.method;
        return HttpResponse.json({ success: true });
      })
    );
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    expect(capturedMethod).toBe('POST');
  });

  it('should set isAuthenticated to false in the store', async () => {
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('should clear access token from the store', async () => {
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    expect(useAuthStore.getState().tokens.accessToken).toBeNull();
  });

  it('should clear refresh token from the store', async () => {
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    expect(useAuthStore.getState().tokens.refreshToken).toBeNull();
  });

  it('should clear user.userId from the store', async () => {
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    expect(useAuthStore.getState().user.userId).toBeNull();
  });

  it('should clear user.email from the store', async () => {
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    expect(useAuthStore.getState().user.email).toBeNull();
  });

  it('should clear user.role from the store', async () => {
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    expect(useAuthStore.getState().user.role).toBeNull();
  });

  it('should remove fitgainer_access_token from localStorage', async () => {
    expect(localStorage.getItem('fitgainer_access_token')).toBe('access_token_abc');
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    expect(localStorage.getItem('fitgainer_access_token')).toBeNull();
  });

  it('should remove fitgainer_refresh_token from localStorage', async () => {
    expect(localStorage.getItem('fitgainer_refresh_token')).toBe('refresh_token_xyz');
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    expect(localStorage.getItem('fitgainer_refresh_token')).toBeNull();
  });

  it('should navigate to /login after logout', async () => {
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({ replace: true }));
  });

  it('should use replace: true when navigating to /login', async () => {
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    const [path, options] = mockNavigate.mock.calls[0];
    expect(path).toBe('/login');
    expect(options.replace).toBe(true);
  });

  it('should call navigate exactly once', async () => {
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('should clear auth store even when logout API returns 500', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/logout`, () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
      )
    );
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().tokens.accessToken).toBeNull();
  });

  it('should clear localStorage even when logout API returns 500', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/logout`, () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
      )
    );
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    expect(localStorage.getItem('fitgainer_access_token')).toBeNull();
    expect(localStorage.getItem('fitgainer_refresh_token')).toBeNull();
  });

  it('should still navigate to /login even when logout API returns 500', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/logout`, () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
      )
    );
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current(); });
    expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({ replace: true }));
  });

  it('should not throw when logout API fails', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/logout`, () =>
        HttpResponse.json({ message: 'Server Error' }, { status: 500 })
      )
    );
    const { result } = renderHook(() => useLogout());
    await expect(
      act(async () => { await result.current(); })
    ).resolves.not.toThrow();
  });

});
