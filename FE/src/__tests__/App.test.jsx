import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';
import useAuthStore from '../stores/auth.store';

describe('App.jsx — Auth Initialization', () => {
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

  it('should render without crashing when auth state is empty', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('should render without crashing when auth state is populated', () => {
    const { setUser } = useAuthStore.getState();
    setUser({ userId: '123', email: 'test@example.com', role: 'user' });

    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});
