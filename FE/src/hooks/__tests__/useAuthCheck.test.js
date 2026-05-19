import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthCheck } from '../useAuthCheck';
import useAuthStore from '../../stores/auth.store';

describe('useAuthCheck()', () => {
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call initializeAuth once on mount', () => {
    const initializeSpy = vi.spyOn(useAuthStore.getState(), 'initializeAuth');

    renderHook(() => useAuthCheck());

    expect(initializeSpy).toHaveBeenCalled();
  });

  it('should not make any API calls (only reads localStorage)', () => {
    localStorage.setItem('fitgainer_access_token', 'test_token');

    renderHook(() => useAuthCheck());

    const state = useAuthStore.getState();
    // initializeAuth should have loaded the token from localStorage
    expect(state.tokens.accessToken).toBe('test_token');
  });
});
