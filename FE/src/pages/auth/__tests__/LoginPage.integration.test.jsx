import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import LoginPage from '../LoginPage';
import useAuthStore from '../../../stores/auth.store';

// Mock useNavigate since we're testing integration, not routing
import { useNavigate as useNavigateOrig } from 'react-router-dom';
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

// Setup MSW server
const server = setupServer(
  http.post('http://localhost/api/auth/login', async ({ request }) => {
    const body = await request.json();

    // Mock valid login
    if (body.email === 'user@example.com' && body.password === 'ValidPass123!') {
      return HttpResponse.json({
        success: true,
        message: 'Login successful',
        accessToken: 'mock-access-token-user',
        refreshToken: 'mock-refresh-token-user',
        user: {
          userId: '123',
          email: 'user@example.com',
          role: 'User',
        },
      });
    }

    // Mock admin login
    if (
      body.email === 'admin@example.com' &&
      body.password === 'AdminPass123!'
    ) {
      return HttpResponse.json({
        success: true,
        message: 'Login successful',
        accessToken: 'mock-access-token-admin',
        refreshToken: 'mock-refresh-token-admin',
        user: {
          userId: '456',
          email: 'admin@example.com',
          role: 'Admin',
        },
      });
    }

    // Mock invalid credentials
    if (body.email === 'user@example.com' && body.password === 'WrongPass') {
      return HttpResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Mock missing fields
    if (!body.email || !body.password) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Missing email or password',
        },
        { status: 400 }
      );
    }

    // Default 401 for any other case
    return HttpResponse.json(
      {
        success: false,
        message: 'Invalid email or password',
      },
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
});
afterAll(() => server.close());

// Helper to render component with router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// ============================================================================
// Happy Path Integration Tests
// ============================================================================

describe('LoginPage Integration — Happy Path', () => {
  it('should complete full login flow: fill form → submit → redirect', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Fill form
    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');

    // Submit
    await user.click(submitButton);

    // Verify redirect
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
        replace: true,
      });
    });
  });

  it('should store accessToken in localStorage after successful login', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      const storedToken = localStorage.getItem('fitgainer_access_token');
      expect(storedToken).toBe('mock-access-token-user');
    });
  });

  it('should call POST /api/auth/login with correct email and password', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());

    let capturedRequest = null;
    server.use(
      http.post('http://localhost/api/auth/login', async ({ request }) => {
        capturedRequest = await request.json();
        return HttpResponse.json({
          success: true,
          message: 'Login successful',
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          user: {
            userId: '123',
            email: 'user@example.com',
            role: 'User',
          },
        });
      })
    );

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(capturedRequest).toEqual({
        email: 'user@example.com',
        password: 'ValidPass123!',
      });
    });
  });

  it('should redirect Admin role user to /admin after successful login', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'admin@example.com');
    await user.type(passwordInput, 'AdminPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
    });
  });
});

// ============================================================================
// Error Response Integration Tests
// ============================================================================

describe('LoginPage Integration — Error Responses', () => {
  it('should display error when server returns 401', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'WrongPass');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Invalid email or password')
      ).toBeInTheDocument();
    });
  });

  it('should display error when server returns 400', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());

    server.use(
      http.post('http://localhost/api/auth/login', () => {
        return HttpResponse.json(
          {
            success: false,
            message: 'Missing email or password',
          },
          { status: 400 }
        );
      })
    );

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Missing email or password')
      ).toBeInTheDocument();
    });
  });

  it('should NOT update auth store when login fails', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'WrongPass');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Invalid email or password')
      ).toBeInTheDocument();
    });

    // Verify store is not updated
    const state = useAuthStore.getState();
    expect(state.tokens.accessToken).toBeNull();
    expect(state.user.userId).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should NOT redirect when login fails', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'WrongPass');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Invalid email or password')
      ).toBeInTheDocument();
    });

    // Navigate should NOT have been called
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Network & Edge Cases
// ============================================================================

describe('LoginPage Integration — Network & Edge Cases', () => {
  it('should handle network failure gracefully', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());

    server.use(
      http.post('http://localhost/api/auth/login', () => {
        return HttpResponse.error();
      })
    );

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      // Should display some error message
      const errorAlert = screen.queryByRole('alert');
      expect(errorAlert).toBeInTheDocument();
    });
  });

  it('should prevent double submission on rapid double-click', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());

    let requestCount = 0;
    server.use(
      http.post('http://localhost/api/auth/login', async () => {
        requestCount++;
        return HttpResponse.json(
          {
            success: true,
            message: 'Login successful',
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh',
            user: {
              userId: '123',
              email: 'user@example.com',
              role: 'User',
            },
          },
          { delay: 100 }
        );
      })
    );

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');

    // Rapid double-click
    await user.click(submitButton);
    await user.click(submitButton);

    await waitFor(() => {
      // Only one request should be sent due to double-submit protection
      expect(requestCount).toBe(1);
    });
  });

  it('should allow retry after failed login', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // First attempt - fail
    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'WrongPass');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Invalid email or password')
      ).toBeInTheDocument();
    });

    // Clear inputs and retry
    await user.clear(passwordInput);
    await user.type(passwordInput, 'ValidPass123!');
    await user.click(submitButton);

    // Should redirect on success
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
        replace: true,
      });
    });
  });

  it('should clear error message when user starts new submission', async () => {
    const user = userEvent.setup();
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // First attempt - fail
    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'WrongPass');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Invalid email or password')
      ).toBeInTheDocument();
    });

    // Update password and click submit again
    await user.clear(passwordInput);
    await user.type(passwordInput, 'ValidPass123!');

    // Error should disappear once submission starts
    await user.click(submitButton);

    await waitFor(() => {
      // After successful login, no error should be visible
      const errorAlert = screen.queryByRole('alert');
      expect(errorAlert).not.toBeInTheDocument();
    });
  });
});
