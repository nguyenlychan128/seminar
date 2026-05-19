import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import ProfileSetupPage from '../../../pages/profile/ProfileSetupPage';
import useUserProfile from '../../../hooks/useUserProfile';

vi.mock('../../../hooks/useUserProfile');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

const mockNavigate = vi.fn();

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProfileSetupPage />
    </MemoryRouter>
  );

const setupHook = ({
  profile = null,
  isLoading = false,
  error = null,
  hasProfile = false,
  createProfile = vi.fn(),
} = {}) => {
  useUserProfile.mockReturnValue({
    profile,
    isLoading,
    error,
    hasProfile,
    createProfile,
    fetchProfile: vi.fn(),
    updateProfile: vi.fn(),
    clearProfile: vi.fn(),
    isUnderweight: false,
  });
};

const mockCreatedProfile = {
  userId: 'user_123',
  height: 165,
  weight: 48,
  age: 22,
  gender: 'male',
  bmi: 17.6,
  bodyClassification: 'underweight',
  updatedAt: '2026-05-17T10:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  useNavigate.mockReturnValue(mockNavigate);
});

async function fillForm() {
  const user = userEvent.setup({ delay: null });
  await user.type(screen.getByLabelText(/height/i), '165');
  await user.type(screen.getByLabelText(/weight/i), '48');
  await user.type(screen.getByLabelText(/age/i), '22');
  fireEvent.click(screen.getByText('Male'));
}

describe('ProfileSetupPage', () => {
  describe('loading state on mount', () => {
    it('shows spinner when isLoading=true', () => {
      setupHook({ isLoading: true, hasProfile: false });
      renderPage();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('does NOT show form while loading', () => {
      setupHook({ isLoading: true, hasProfile: false });
      renderPage();
      expect(screen.queryByLabelText(/height/i)).not.toBeInTheDocument();
    });

    it('does NOT redirect while loading', () => {
      setupHook({ isLoading: true, hasProfile: false });
      renderPage();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('redirect when profile already exists', () => {
    it('redirects to /dashboard when hasProfile=true and not loading', async () => {
      setupHook({ hasProfile: true, isLoading: false, profile: mockCreatedProfile });
      renderPage();
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    it('does NOT render form when profile already exists', () => {
      setupHook({ hasProfile: true, isLoading: false, profile: mockCreatedProfile });
      renderPage();
      expect(screen.queryByLabelText(/height/i)).not.toBeInTheDocument();
    });
  });

  describe('render form when no profile exists', () => {
    it('renders ProfileForm when hasProfile=false and not loading', () => {
      setupHook({ hasProfile: false, isLoading: false });
      renderPage();
      expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/weight/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
    });

    it('shows page heading "Set Up Your Profile"', () => {
      setupHook({ hasProfile: false });
      renderPage();
      expect(screen.getByText(/set up your profile/i)).toBeInTheDocument();
    });

    it('shows BmiResultCard placeholder before submit', () => {
      setupHook({ hasProfile: false });
      renderPage();
      expect(screen.getByText('Enter your measurements to see your BMI')).toBeInTheDocument();
    });
  });

  describe('submit success (UR-01, UR-06)', () => {
    it('calls createProfile with correct form data', async () => {
      const cp = vi.fn().mockResolvedValue(mockCreatedProfile);
      setupHook({ hasProfile: false, createProfile: cp });
      renderPage();

      await fillForm();
      fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

      await waitFor(() => {
        expect(cp).toHaveBeenCalledWith({ height: 165, weight: 48, age: 22, gender: 'male' });
      });
    });

    it('shows BmiResultCard with result after success', async () => {
      const cp = vi.fn().mockResolvedValue(mockCreatedProfile);
      setupHook({ hasProfile: false, createProfile: cp });
      renderPage();

      await fillForm();
      fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

      await waitFor(() => {
        expect(screen.getByText('17.6')).toBeInTheDocument();
        expect(screen.getByText('Underweight')).toBeInTheDocument();
      });
    });

    it('shows success message after submit', async () => {
      const cp = vi.fn().mockResolvedValue(mockCreatedProfile);
      setupHook({ hasProfile: false, createProfile: cp });
      renderPage();

      await fillForm();
      fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

      await waitFor(() => {
        expect(screen.getByText(/profile saved successfully/i)).toBeInTheDocument();
      });
    });

    it('redirects to /dashboard after 1500ms', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: false });
      const cp = vi.fn().mockResolvedValue(mockCreatedProfile);
      setupHook({ hasProfile: false, createProfile: cp });
      renderPage();

      fireEvent.change(screen.getByLabelText(/height/i), { target: { value: '165' } });
      fireEvent.change(screen.getByLabelText(/weight/i), { target: { value: '48' } });
      fireEvent.change(screen.getByLabelText(/age/i), { target: { value: '22' } });
      fireEvent.click(screen.getByText('Male'));

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /save profile/i }));
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');

      act(() => vi.advanceTimersByTime(1500));

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      vi.useRealTimers();
    });

    it('does NOT redirect before 1500ms', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: false });
      const cp = vi.fn().mockResolvedValue(mockCreatedProfile);
      setupHook({ hasProfile: false, createProfile: cp });
      renderPage();

      fireEvent.change(screen.getByLabelText(/height/i), { target: { value: '165' } });
      fireEvent.change(screen.getByLabelText(/weight/i), { target: { value: '48' } });
      fireEvent.change(screen.getByLabelText(/age/i), { target: { value: '22' } });
      fireEvent.click(screen.getByText('Male'));

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /save profile/i }));
        await Promise.resolve();
        await Promise.resolve();
      });

      act(() => vi.advanceTimersByTime(1499));
      expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');

      vi.useRealTimers();
    });
  });

  describe('submit failure', () => {
    it('shows error message when createProfile returns 400', async () => {
      const err = new Error('Invalid data');
      err.status = 400;
      const cp = vi.fn().mockRejectedValue(err);
      setupHook({ hasProfile: false, createProfile: cp });
      renderPage();

      await fillForm();
      fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('alert').textContent).toMatch(/invalid data/i);
      });
    });

    it('does NOT redirect when createProfile returns 4xx error', async () => {
      const err = new Error('Invalid data');
      err.status = 400;
      const cp = vi.fn().mockRejectedValue(err);
      setupHook({ hasProfile: false, createProfile: cp });
      renderPage();

      await fillForm();
      fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
      expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
    });

    it('does NOT show BmiResultCard with real data when submit fails', async () => {
      const err = new Error('Server error');
      err.status = 500;
      const cp = vi.fn().mockRejectedValue(err);
      setupHook({ hasProfile: false, createProfile: cp });
      renderPage();

      await fillForm();
      fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
      expect(screen.getByText('Enter your measurements to see your BMI')).toBeInTheDocument();
    });

    it('form remains accessible after submit failure — user can retry', async () => {
      const err = new Error('Error');
      err.status = 400;
      const cp = vi.fn().mockRejectedValue(err);
      setupHook({ hasProfile: false, createProfile: cp });
      renderPage();

      await fillForm();
      fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
      expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save profile/i })).not.toBeDisabled();
    });

    it('shows generic error message when server returns no message', async () => {
      const cp = vi.fn().mockRejectedValue(new Error());
      setupHook({ hasProfile: false, createProfile: cp });
      renderPage();

      await fillForm();
      fireEvent.click(screen.getByRole('button', { name: /save profile/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('does not crash when hook returns error state', () => {
      setupHook({ hasProfile: false, isLoading: false, error: 'Session expired' });
      expect(() => renderPage()).not.toThrow();
    });

    it('redirect timer is cancelled on unmount before 1500ms', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: false });
      const cp = vi.fn().mockResolvedValue(mockCreatedProfile);
      setupHook({ hasProfile: false, createProfile: cp });
      const { unmount } = renderPage();

      fireEvent.change(screen.getByLabelText(/height/i), { target: { value: '165' } });
      fireEvent.change(screen.getByLabelText(/weight/i), { target: { value: '48' } });
      fireEvent.change(screen.getByLabelText(/age/i), { target: { value: '22' } });
      fireEvent.click(screen.getByText('Male'));

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /save profile/i }));
        await Promise.resolve();
        await Promise.resolve();
      });

      unmount();
      act(() => vi.advanceTimersByTime(2000));

      expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
      vi.useRealTimers();
    });
  });
});
