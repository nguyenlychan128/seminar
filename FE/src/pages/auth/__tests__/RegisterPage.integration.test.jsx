import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import RegisterPage from '../RegisterPage';
import useAuthStore from '../../../stores/auth.store';

import { useNavigate as useNavigateOrig } from 'react-router-dom';

// Module-level capture variable for payload tests
let capturedPayload = null;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

// Setup MSW server with register + login endpoints
const server = setupServer(
  http.post('http://localhost/api/auth/register', async ({ request }) => {
    const body = await request.json();

    if (!body.email || !body.password || !body.confirmPassword) {
      return HttpResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }

    if (body.password !== body.confirmPassword) {
      return HttpResponse.json(
        { message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      {
        user: {
          userId: 'new_user_id',
          email: body.email,
          role: 'user',
        },
      },
      { status: 201 }
    );
  }),

  http.post('http://localhost/api/auth/login', async ({ request }) => {
    const body = await request.json();

    if (body.email === 'newuser@example.com' && body.password === 'StrongP@ss1') {
      return HttpResponse.json({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          userId: 'new_user_id',
          email: 'newuser@example.com',
          role: 'user',
        },
      });
    }

    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  useAuthStore.getState().clearAuth();
  localStorage.clear();
  vi.clearAllMocks();
  capturedPayload = null;
});
afterAll(() => server.close());

const renderWithRouter = (component) =>
  render(<BrowserRouter>{component}</BrowserRouter>);

// ============================================================================
// Happy Path
// ============================================================================

describe('RegisterPage Integration — Happy Path', () => {
  // These tests use base stubs: register accepts any non-existing email,
  // login only accepts newuser@example.com + StrongP@ss1 — exercises real guard.

  it('should complete full registration flow using base stubs: fill → submit → redirect', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    renderWithRouter(<RegisterPage />);

    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'newuser@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('should store accessToken in localStorage after successful registration + auto-login', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'newuser@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(localStorage.getItem('fitgainer_access_token')).toBe('mock-access-token');
    });
  });

  it('should update auth store with user after successful registration + auto-login', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'newuser@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user.email).toBe('newuser@example.com');
    });
  });

  it('should redirect to /login?registered=1 when auto-login fails after successful register', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    // Register succeeds; login stub rejects (wrong credentials simulated via override)
    server.use(
      http.post('http://localhost/api/auth/login', () => {
        return HttpResponse.json({ message: 'Service unavailable' }, { status: 503 });
      })
    );

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'newuser@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?registered=1', { replace: true });
    });
  });
});

// ============================================================================
// Error Responses
// ============================================================================

describe('RegisterPage Integration — Error Responses', () => {
  it('should show "Email is already registered" when server returns 409', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'existing@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Email is already registered. Try logging in.')
      ).toBeInTheDocument();
    });
  });

  it('should show generic error when server returns 500', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());

    server.use(
      http.post('http://localhost/api/auth/register', () => {
        return HttpResponse.json(
          { message: 'Internal server error' },
          { status: 500 }
        );
      })
    );

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('should NOT update auth store when registration fails', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'existing@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user.userId).toBeNull();
  });

  it('should NOT redirect when registration fails', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'existing@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should show field error for mismatched passwords without calling API', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());

    let registerCalled = false;
    server.use(
      http.post('http://localhost/api/auth/register', () => {
        registerCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'Different1!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    expect(registerCalled).toBe(false);
  });
});

// ============================================================================
// Network & Edge Cases
// ============================================================================

describe('RegisterPage Integration — Network & Edge Cases', () => {
  it('should handle network failure gracefully', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());

    server.use(
      http.post('http://localhost/api/auth/register', () => {
        return HttpResponse.error();
      })
    );

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('should allow retry after failed registration', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    renderWithRouter(<RegisterPage />);

    // First attempt — duplicate email
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'existing@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Switch to fresh email + add login stub
    server.use(
      http.post('http://localhost/api/auth/login', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
          accessToken: 'token',
          refreshToken: 'refresh',
          user: { userId: '2', email: body.email, role: 'user' },
        });
      })
    );

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    await user.clear(emailInput);
    await user.type(emailInput, 'newuser2@example.com');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
