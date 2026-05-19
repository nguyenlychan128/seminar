import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '../useAuth';
import useAuthStore from '../../stores/auth.store';

describe('useAuth()', () => {
  beforeEach(() => {
    useAuthStore.setState({
      tokens: { accessToken: null, refreshToken: null },
      user: { userId: null, email: null, role: null },
      loading: false,
      error: null,
      isAuthenticated: false,
    });
  });

  it('should return user, isAuthenticated, tokens from store', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeDefined();
    expect(result.current.isAuthenticated).toBeDefined();
    expect(result.current.tokens).toBeDefined();
  });

  it('should return isAuthenticated = false when user not logged in', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user.userId).toBeNull();
  });

  it('should return isAuthenticated = true after setUser called', () => {
    const { setUser } = useAuthStore.getState();
    setUser({ userId: 'user_123', email: 'test@example.com', role: 'user' });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.userId).toBe('user_123');
  });
});
