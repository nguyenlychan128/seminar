import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, useNavigate as useNavigateOrig } from 'react-router-dom';
import RegisterPage from '../RegisterPage';
import * as useRegisterHook from '../../../hooks/useRegister';
import * as useLoginHook from '../../../hooks/useLogin';
import * as useAuthHook from '../../../hooks/useAuth';

vi.mock('../../../hooks/useRegister');
vi.mock('../../../hooks/useLogin');
vi.mock('../../../hooks/useAuth');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const mockUnauthenticated = () => {
  vi.mocked(useAuthHook.useAuth).mockReturnValue({
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
  });
};

const renderWithRouter = (component) =>
  render(<BrowserRouter>{component}</BrowserRouter>);

// ============================================================================
// Initial Render
// ============================================================================

describe('RegisterPage — Initial Render', () => {
  beforeEach(() => {
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(vi.fn());
    vi.mocked(useLoginHook.useLogin).mockReturnValue(vi.fn());
    mockUnauthenticated();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the page heading "Create Your Account"', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Create Your Account'
    );
  });

  it('should render the brand name "FitGainer"', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByText('FitGainer')).toBeInTheDocument();
  });

  it('should render an email input', () => {
    renderWithRouter(<RegisterPage />);
    const input = screen.getByRole('textbox', { name: /email address/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should render a password input', () => {
    renderWithRouter(<RegisterPage />);
    const input = screen.getByLabelText(/^password$/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should render a confirm password input', () => {
    renderWithRouter(<RegisterPage />);
    const input = screen.getByLabelText(/confirm password/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should render a submit button with text "Create Account"', () => {
    renderWithRouter(<RegisterPage />);
    expect(
      screen.getByRole('button', { name: /create account/i })
    ).toBeInTheDocument();
  });

  it('should render a link to /login', () => {
    renderWithRouter(<RegisterPage />);
    const link = screen.getByRole('link', { name: /login here/i });
    expect(link).toHaveAttribute('href', '/login');
  });

  it('should NOT render any error alert on initial render', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should render all inputs as enabled by default', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByRole('textbox', { name: /email address/i })).not.toBeDisabled();
    expect(screen.getByLabelText(/^password$/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/confirm password/i)).not.toBeDisabled();
  });

  it('should NOT show password strength indicator when password is empty', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument();
  });
});

// ============================================================================
// Authenticated Redirect Guard
// ============================================================================

describe('RegisterPage — Authenticated Redirect Guard', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to /dashboard when already authenticated on mount', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(vi.fn());
    vi.mocked(useLoginHook.useLogin).mockReturnValue(vi.fn());
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { userId: '1', email: 'user@example.com', role: 'User' },
      loading: false,
      error: null,
    });

    renderWithRouter(<RegisterPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('should NOT redirect when user is not authenticated', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(vi.fn());
    vi.mocked(useLoginHook.useLogin).mockReturnValue(vi.fn());
    mockUnauthenticated();

    renderWithRouter(<RegisterPage />);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Input Interaction
// ============================================================================

describe('RegisterPage — Input Interaction', () => {
  beforeEach(() => {
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(vi.fn());
    vi.mocked(useLoginHook.useLogin).mockReturnValue(vi.fn());
    mockUnauthenticated();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should update email as user types', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);
    const input = screen.getByRole('textbox', { name: /email address/i });
    await user.type(input, 'new@example.com');
    expect(input).toHaveValue('new@example.com');
  });

  it('should update password as user types', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);
    const input = screen.getByLabelText(/^password$/i);
    await user.type(input, 'Secret1!');
    expect(input).toHaveValue('Secret1!');
  });

  it('should update confirmPassword as user types', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);
    const input = screen.getByLabelText(/confirm password/i);
    await user.type(input, 'Secret1!');
    expect(input).toHaveValue('Secret1!');
  });
});

// ============================================================================
// Password Strength Indicator
// ============================================================================

describe('RegisterPage — Password Strength Indicator', () => {
  beforeEach(() => {
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(vi.fn());
    vi.mocked(useLoginHook.useLogin).mockReturnValue(vi.fn());
    mockUnauthenticated();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should show strength indicator once user starts typing a password', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByLabelText(/^password$/i), 'a');
    expect(screen.getByText(/password strength/i)).toBeInTheDocument();
  });

  it('should show "Very Weak" for a single character password', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByLabelText(/^password$/i), 'a');
    expect(screen.getByText('Very Weak')).toBeInTheDocument();
  });

  it('should show "Strong" for a fully qualifying password', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('should update strength label in real-time as user types', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(passwordInput, 'abc');
    expect(screen.getByText('Very Weak')).toBeInTheDocument();

    await user.type(passwordInput, 'ABC123!@#');
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });
});

// ============================================================================
// Client-Side Validation
// ============================================================================

describe('RegisterPage — Client-Side Validation', () => {
  beforeEach(() => {
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(vi.fn());
    vi.mocked(useLoginHook.useLogin).mockReturnValue(vi.fn());
    mockUnauthenticated();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should show "Email is required" when email is empty on submit', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('should show "Email is required" and NOT call register when email is empty', async () => {
    const user = userEvent.setup();
    const mockRegister = vi.fn();
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(mockRegister);

    renderWithRouter(<RegisterPage />);
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should show "Password is required" when password is empty', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('should show password strength error for weak password', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'weakpassword');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(
        screen.getByText('Password must have min 8 chars, uppercase, lowercase, number, special char')
      ).toBeInTheDocument();
    });
  });

  it('should show "Please confirm your password" when confirmPassword is empty', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
    });
  });

  it('should show "Passwords do not match" when passwords differ', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'Different1!');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should NOT call register() when validation fails', async () => {
    const user = userEvent.setup();
    const mockRegister = vi.fn();
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(mockRegister);

    renderWithRouter(<RegisterPage />);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Loading State
// ============================================================================

describe('RegisterPage — Loading State', () => {
  beforeEach(() => {
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());
    mockUnauthenticated();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    let resolve;
    const pending = new Promise((r) => (resolve = r));
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(vi.fn(() => pending));
    vi.mocked(useLoginHook.useLogin).mockReturnValue(vi.fn());

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');

    const clickPromise = user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });

    resolve({ user: { userId: '1', email: 'user@example.com', role: 'user' } });
    await clickPromise;
  });

  it('should show "Creating account..." text while loading', async () => {
    const user = userEvent.setup();
    let resolve;
    const pending = new Promise((r) => (resolve = r));
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(vi.fn(() => pending));
    vi.mocked(useLoginHook.useLogin).mockReturnValue(vi.fn());

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');

    const clickPromise = user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Creating account...')).toBeInTheDocument();
    });

    resolve({ user: { userId: '1', email: 'user@example.com', role: 'user' } });
    await clickPromise;
  });

  it('should disable all inputs while loading', async () => {
    const user = userEvent.setup();
    let resolve;
    const pending = new Promise((r) => (resolve = r));
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(vi.fn(() => pending));
    vi.mocked(useLoginHook.useLogin).mockReturnValue(vi.fn());

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');

    const clickPromise = user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /email address/i })).toBeDisabled();
      expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
      expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
    });

    resolve({ user: { userId: '1', email: 'user@example.com', role: 'user' } });
    await clickPromise;
  });

  it('should re-enable inputs after registration fails', async () => {
    const user = userEvent.setup();
    const err = new Error('Registration failed');
    err.code = 'REGISTER_ERROR';
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(vi.fn().mockRejectedValue(err));
    vi.mocked(useLoginHook.useLogin).mockReturnValue(vi.fn());

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /email address/i })).not.toBeDisabled();
    });
  });
});

// ============================================================================
// Error Handling
// ============================================================================

describe('RegisterPage — Error Handling', () => {
  beforeEach(() => {
    vi.mocked(useNavigateOrig).mockReturnValue(vi.fn());
    vi.mocked(useLoginHook.useLogin).mockReturnValue(vi.fn());
    mockUnauthenticated();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should show "Email is already registered" on DUPLICATE_EMAIL error', async () => {
    const user = userEvent.setup();
    const err = new Error('Email already registered');
    err.code = 'DUPLICATE_EMAIL';
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(vi.fn().mockRejectedValue(err));

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

  it('should show "Please check your details" on INVALID_DATA (400) error', async () => {
    const user = userEvent.setup();
    const err = new Error('Invalid registration data');
    err.code = 'INVALID_DATA';
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(vi.fn().mockRejectedValue(err));

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Please check your details and try again.')
      ).toBeInTheDocument();
    });
  });

  it('should show "Registration failed" on generic server error', async () => {
    const user = userEvent.setup();
    const err = new Error('Registration failed');
    err.code = 'REGISTER_ERROR';
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(vi.fn().mockRejectedValue(err));

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument();
    });
  });

  it('should show error message in alert role', async () => {
    const user = userEvent.setup();
    const err = new Error('Network error');
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(vi.fn().mockRejectedValue(err));

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('should redirect to /login?registered=1 when auto-login fails after successful register', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    vi.mocked(useRegisterHook.useRegister).mockReturnValue(
      vi.fn().mockResolvedValue({ user: { userId: '1', email: 'user@example.com', role: 'user' } })
    );
    const loginErr = new Error('Auto-login failed');
    loginErr.code = 'LOGIN_ERROR';
    vi.mocked(useLoginHook.useLogin).mockReturnValue(vi.fn().mockRejectedValue(loginErr));

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?registered=1', { replace: true });
    });
  });
});

// ============================================================================
// Success: Auto-Login + Redirect
// ============================================================================

describe('RegisterPage — Success Flow', () => {
  beforeEach(() => {
    mockUnauthenticated();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call login() with same credentials after successful registration', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    const mockRegister = vi.fn().mockResolvedValue({
      user: { userId: '1', email: 'user@example.com', role: 'user' },
    });
    const mockLogin = vi.fn().mockResolvedValue({
      accessToken: 'token',
      user: { userId: '1', email: 'user@example.com', role: 'user' },
    });
    vi.mocked(useRegisterHook.useRegister).mockReturnValue(mockRegister);
    vi.mocked(useLoginHook.useLogin).mockReturnValue(mockLogin);

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'StrongP@ss1');
    });
  });

  it('should redirect to /dashboard after successful registration + auto-login', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    vi.mocked(useRegisterHook.useRegister).mockReturnValue(
      vi.fn().mockResolvedValue({ user: { userId: '1', email: 'user@example.com', role: 'user' } })
    );
    vi.mocked(useLoginHook.useLogin).mockReturnValue(
      vi.fn().mockResolvedValue({ accessToken: 'token', user: { userId: '1', email: 'user@example.com', role: 'user' } })
    );

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('should NOT show error message on successful registration', async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();
    vi.mocked(useNavigateOrig).mockReturnValue(mockNavigate);

    vi.mocked(useRegisterHook.useRegister).mockReturnValue(
      vi.fn().mockResolvedValue({ user: { userId: '1', email: 'user@example.com', role: 'user' } })
    );
    vi.mocked(useLoginHook.useLogin).mockReturnValue(
      vi.fn().mockResolvedValue({ accessToken: 'token', user: { userId: '1', email: 'user@example.com', role: 'user' } })
    );

    renderWithRouter(<RegisterPage />);
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongP@ss1');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongP@ss1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
