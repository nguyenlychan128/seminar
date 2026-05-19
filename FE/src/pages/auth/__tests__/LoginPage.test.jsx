import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, useNavigate as useNavigateOrig } from 'react-router-dom';
import LoginPage from '../LoginPage';
import * as useLoginHook from '../../../hooks/useLogin';
import * as useAuthHook from '../../../hooks/useAuth';

// Mock hooks
vi.mock('../../../hooks/useLogin');
vi.mock('../../../hooks/useAuth');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Helper to render component with router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// ============================================================================
// Initial Render Tests
// ============================================================================

describe('LoginPage — Initial Render', () => {
  beforeEach(() => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    const mockLogin = vi.fn();
    vi.mocked(useLoginHook.useLogin).mockReturnValue(mockLogin);

    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the page heading "Welcome Back"', () => {
    renderWithRouter(<LoginPage />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Welcome Back');
  });

  it('should render subtitle text', () => {
    renderWithRouter(<LoginPage />);
    expect(
      screen.getByText('Log in to continue your fitness journey')
    ).toBeInTheDocument();
  });

  it('should render an email input field', () => {
    renderWithRouter(<LoginPage />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should render a password input field', () => {
    renderWithRouter(<LoginPage />);
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should render a submit button with text "Log In"', () => {
    renderWithRouter(<LoginPage />);
    const button = screen.getByRole('button', { name: /log in/i });
    expect(button).toBeInTheDocument();
  });

  it('should render a link to /register', () => {
    renderWithRouter(<LoginPage />);
    const link = screen.getByRole('link', { name: /sign up here/i });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('should NOT render any error message on initial render', () => {
    renderWithRouter(<LoginPage />);
    const errorElement = screen.queryByRole('alert');
    expect(errorElement).not.toBeInTheDocument();
  });

  it('should render email and password inputs as enabled by default', () => {
    renderWithRouter(<LoginPage />);
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    expect(emailInput).not.toBeDisabled();
    expect(passwordInput).not.toBeDisabled();
  });

  it('should render submit button as enabled by default', () => {
    renderWithRouter(<LoginPage />);
    const button = screen.getByRole('button', { name: /log in/i });
    expect(button).not.toBeDisabled();
  });

  it('should render FitGainer brand name', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText('FitGainer')).toBeInTheDocument();
  });
});

// ============================================================================
// Input Interaction Tests
// ============================================================================

describe('LoginPage — Input Interaction', () => {
  beforeEach(() => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    const mockLogin = vi.fn();
    vi.mocked(useLoginHook.useLogin).mockReturnValue(mockLogin);

    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should update email field value as user types', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    await user.type(emailInput, 'user@example.com');

    expect(emailInput).toHaveValue('user@example.com');
  });

  it('should update password field value as user types', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'mypassword123');

    expect(passwordInput).toHaveValue('mypassword123');
  });

  it('should allow clearing email field and retyping', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });

    await user.type(emailInput, 'old@email.com');
    expect(emailInput).toHaveValue('old@email.com');

    await user.clear(emailInput);
    expect(emailInput).toHaveValue('');

    await user.type(emailInput, 'new@email.com');
    expect(emailInput).toHaveValue('new@email.com');
  });

  it('should allow special characters in email field', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    await user.type(emailInput, 'user+tag@sub.domain.com');

    expect(emailInput).toHaveValue('user+tag@sub.domain.com');
  });
});

// ============================================================================
// Client-Side Validation Tests
// ============================================================================

describe('LoginPage — Client-Side Validation', () => {
  beforeEach(() => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    const mockLogin = vi.fn();
    vi.mocked(useLoginHook.useLogin).mockReturnValue(mockLogin);

    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should show "Email is required" when submitting with empty email', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(passwordInput, 'ValidPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('should show "Invalid email format" when submitting with malformed email', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'not-an-email');
    await user.type(passwordInput, 'ValidPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('should show "Password is required" when submitting with empty password', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('should NOT call login() hook when validation fails', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn();
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  it('should call login hook on valid form submission', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockResolvedValue({
      user: { userId: '123', email: 'user@example.com', role: 'User' },
    });
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');
    await user.click(submitButton);

    // If form default wasn't prevented and page reloaded, we wouldn't get here
    // Calling login hook proves form submission was handled correctly
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Loading State Tests
// ============================================================================

describe('LoginPage — Loading State', () => {
  beforeEach(() => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should disable the submit button while login is in progress', async () => {
    const user = userEvent.setup();

    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    const mockLogin = vi.fn(() => loginPromise);
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');

    const clickPromise = user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    resolveLogin({
      user: { userId: '123', email: 'user@example.com', role: 'User' },
    });

    await clickPromise;
  });

  it('should change button text to "Logging in..." while loading', async () => {
    const user = userEvent.setup();

    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    const mockLogin = vi.fn(() => loginPromise);
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');

    const clickPromise = user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Logging in...')).toBeInTheDocument();
    });

    resolveLogin({
      user: { userId: '123', email: 'user@example.com', role: 'User' },
    });

    await clickPromise;
  });

  it('should disable email input while loading', async () => {
    const user = userEvent.setup();

    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    const mockLogin = vi.fn(() => loginPromise);
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');

    const clickPromise = user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toBeDisabled();
    });

    resolveLogin({
      user: { userId: '123', email: 'user@example.com', role: 'User' },
    });

    await clickPromise;
  });

  it('should disable password input while loading', async () => {
    const user = userEvent.setup();

    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    const mockLogin = vi.fn(() => loginPromise);
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');

    const clickPromise = user.click(submitButton);

    await waitFor(() => {
      expect(passwordInput).toBeDisabled();
    });

    resolveLogin({
      user: { userId: '123', email: 'user@example.com', role: 'User' },
    });

    await clickPromise;
  });

  it('should restore button to "Log In" text after login fails', async () => {
    const user = userEvent.setup();

    const mockLogin = vi.fn().mockRejectedValue(
      new Error('Invalid email or password')
    );
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    });
  });

  it('should re-enable inputs after login fails', async () => {
    const user = userEvent.setup();

    const mockLogin = vi.fn().mockRejectedValue(
      new Error('Invalid email or password')
    );
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
    });
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('LoginPage — Error Handling', () => {
  beforeEach(() => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should display "Invalid email or password" on 401 error', async () => {
    const user = userEvent.setup();

    const err = new Error('Invalid email or password');
    err.code = 'INVALID_CREDENTIALS';
    const mockLogin = vi.fn().mockRejectedValue(err);
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Invalid email or password.')
      ).toBeInTheDocument();
    });
  });

  it('should display validation error message on 400 error', async () => {
    const user = userEvent.setup();

    const err = new Error('Email and password are required.');
    err.code = 'MISSING_FIELDS';
    const mockLogin = vi.fn().mockRejectedValue(err);
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Email and password are required.')
      ).toBeInTheDocument();
    });
  });

  it('should display fallback message when error has no message', async () => {
    const user = userEvent.setup();

    const mockLogin = vi.fn().mockRejectedValue(new Error());
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Login failed. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('should NOT display error message when login succeeds', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    const mockLogin = vi.fn().mockResolvedValue({
      user: { userId: '123', email: 'user@example.com', role: 'User' },
    });
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });

    // No error should be visible
    const errorAlert = screen.queryByRole('alert');
    expect(errorAlert).not.toBeInTheDocument();
  });
});

// ============================================================================
// Redirect Tests
// ============================================================================

describe('LoginPage — Redirect on Success', () => {
  beforeEach(() => {
    useAuthHook.useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to /dashboard when logged-in user has role "User"', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    const mockLogin = vi.fn().mockResolvedValue({
      user: { userId: '123', email: 'user@example.com', role: 'User' },
    });
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
        replace: true,
      });
    });
  });

  it('should redirect to /admin when logged-in user has role "Admin"', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    const mockLogin = vi.fn().mockResolvedValue({
      user: { userId: '456', email: 'admin@example.com', role: 'Admin' },
    });
    useLoginHook.useLogin.mockReturnValue(mockLogin);

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

  it('should redirect to /dashboard when already authenticated as User on mount', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    useAuthHook.useAuth.mockReturnValue({
      user: { userId: '123', email: 'user@example.com', role: 'User' },
      isAuthenticated: true,
      loading: false,
      error: null,
    });

    const mockLogin = vi.fn();
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
        replace: true,
      });
    });
  });

  it('should redirect to /admin when already authenticated as Admin on mount', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    useAuthHook.useAuth.mockReturnValue({
      user: { userId: '456', email: 'admin@example.com', role: 'Admin' },
      isAuthenticated: true,
      loading: false,
      error: null,
    });

    const mockLogin = vi.fn();
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
    });
  });

  it('should call navigate exactly once after successful login', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    const mockLogin = vi.fn().mockResolvedValue({
      user: { userId: '123', email: 'user@example.com', role: 'User' },
    });
    useLoginHook.useLogin.mockReturnValue(mockLogin);

    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await user.type(emailInput, 'user@example.com');
    await user.type(passwordInput, 'ValidPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
  });
});
