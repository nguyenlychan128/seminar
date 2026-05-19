import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import ProfilePage from '../../../pages/profile/ProfilePage';
import useUserProfile from '../../../hooks/useUserProfile';

vi.mock('../../../hooks/useUserProfile');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

const mockNavigate = vi.fn();

const mockExistingProfile = {
  userId: 'user_123',
  height: 165,
  weight: 48,
  age: 22,
  gender: 'male',
  bmi: 17.63,
  bodyClassification: 'underweight',
  updatedAt: '2026-05-17T10:00:00Z',
};

const mockUpdatedProfile = {
  userId: 'user_123',
  height: 170,
  weight: 52,
  age: 22,
  gender: 'male',
  bmi: 17.99,
  bodyClassification: 'underweight',
  updatedAt: '2026-05-17T11:00:00Z',
};

const setupHook = ({
  profile = mockExistingProfile,
  isLoading = false,
  error = null,
  hasProfile = true,
  updateProfile = vi.fn(),
  fetchProfile = vi.fn(),
} = {}) => {
  useUserProfile.mockReturnValue({
    profile,
    isLoading,
    error,
    hasProfile,
    updateProfile,
    fetchProfile,
    createProfile: vi.fn(),
    clearProfile: vi.fn(),
    isUnderweight: profile?.bodyClassification === 'underweight',
  });
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  useNavigate.mockReturnValue(mockNavigate);
});

describe('ProfilePage', () => {
  // ── Loading state ──────────────────────────────────────────────────────────
  describe('loading state', () => {
    it('shows spinner when isLoading=true', () => {
      setupHook({ isLoading: true, hasProfile: false, profile: null });
      renderPage();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('does NOT show form while loading', () => {
      setupHook({ isLoading: true, hasProfile: false, profile: null });
      renderPage();
      expect(screen.queryByLabelText(/height/i)).not.toBeInTheDocument();
    });

    it('does NOT redirect while loading', () => {
      setupHook({ isLoading: true, hasProfile: false, profile: null });
      renderPage();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ── Redirect when profile is null (BR-04) ─────────────────────────────────
  describe('redirect when profile is null after fetch (BR-04)', () => {
    it('redirects to /profile/setup when profile=null and isLoading=false', async () => {
      setupHook({ profile: null, isLoading: false, hasProfile: false });
      renderPage();
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/profile/setup', { replace: true });
      });
    });

    it('does NOT render form when profile=null', () => {
      setupHook({ profile: null, isLoading: false, hasProfile: false });
      renderPage();
      expect(screen.queryByLabelText(/height/i)).not.toBeInTheDocument();
    });

    it('does NOT redirect while isLoading=true even if profile=null', () => {
      setupHook({ profile: null, isLoading: true, hasProfile: false });
      renderPage();
      expect(mockNavigate).not.toHaveBeenCalledWith('/profile/setup');
    });
  });

  // ── Render with existing profile ──────────────────────────────────────────
  describe('render with existing profile', () => {
    it('shows heading "My Profile"', () => {
      setupHook();
      renderPage();
      expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument();
    });

    it('shows BmiResultCard with current BMI from profile', () => {
      setupHook();
      renderPage();
      expect(screen.getByText('17.6')).toBeInTheDocument();
    });

    it('shows BmiResultCard with classification "Underweight"', () => {
      setupHook();
      renderPage();
      expect(screen.getByText('Underweight')).toBeInTheDocument();
    });

    it('shows ProfileForm pre-filled with profile values', () => {
      setupHook();
      renderPage();
      expect(screen.getByDisplayValue('165')).toBeInTheDocument();
      expect(screen.getByDisplayValue('48')).toBeInTheDocument();
      expect(screen.getByDisplayValue('22')).toBeInTheDocument();
    });

    it('ProfileForm has submitLabel="Update Profile"', () => {
      setupHook();
      renderPage();
      expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument();
    });

    it('does NOT redirect when profile exists', () => {
      setupHook();
      renderPage();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ── Submit success (UR-01, UR-06) ─────────────────────────────────────────
  describe('submit update success (UR-01, UR-06)', () => {
    it('calls updateProfile with correct form data on submit', async () => {
      const up = vi.fn().mockResolvedValue(mockUpdatedProfile);
      setupHook({ updateProfile: up });
      renderPage();

      const user = userEvent.setup({ delay: null });
      const heightInput = screen.getByLabelText(/height/i);
      await user.clear(heightInput);
      await user.type(heightInput, '170');

      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      await waitFor(() => {
        expect(up).toHaveBeenCalledWith(expect.objectContaining({ height: 170 }));
      });
    });

    it('shows toast "Profile updated successfully!" after submit', async () => {
      const up = vi.fn().mockResolvedValue(mockUpdatedProfile);
      setupHook({ updateProfile: up });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      await waitFor(() => {
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
      });
    });

    it('BmiResultCard updates immediately after submit (UR-01)', async () => {
      const up = vi.fn().mockResolvedValue(mockUpdatedProfile);
      setupHook({ updateProfile: up });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      await waitFor(() => {
        expect(screen.getByText('18.0')).toBeInTheDocument();
      });
    });

    it('does NOT navigate after submit success (UR-06 — unlike setup page)', async () => {
      const up = vi.fn().mockResolvedValue(mockUpdatedProfile);
      setupHook({ updateProfile: up });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      await waitFor(() => {
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('form stays on page after submit success — user can edit again', async () => {
      const up = vi.fn().mockResolvedValue(mockUpdatedProfile);
      setupHook({ updateProfile: up });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      await waitFor(() => {
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
    });
  });

  // ── Toast auto-dismiss after 3 seconds ────────────────────────────────────
  describe('toast auto-dismisses after 3 seconds', () => {
    it('toast disappears after 3000ms', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: false });
      const up = vi.fn().mockResolvedValue(mockUpdatedProfile);
      setupHook({ updateProfile: up });
      renderPage();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(3000));

      expect(screen.queryByText(/profile updated successfully/i)).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it('toast is still visible before 3000ms', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: false });
      const up = vi.fn().mockResolvedValue(mockUpdatedProfile);
      setupHook({ updateProfile: up });
      renderPage();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
        await Promise.resolve();
        await Promise.resolve();
      });

      act(() => vi.advanceTimersByTime(2999));

      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('toast timer is cancelled on unmount (no memory leak)', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: false });
      const up = vi.fn().mockResolvedValue(mockUpdatedProfile);
      setupHook({ updateProfile: up });
      const { unmount } = renderPage();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
        await Promise.resolve();
        await Promise.resolve();
      });

      unmount();

      expect(() => act(() => vi.advanceTimersByTime(3000))).not.toThrow();

      vi.useRealTimers();
    });
  });

  // ── Submit failure (4xx) ──────────────────────────────────────────────────
  describe('submit failure (4xx)', () => {
    it('shows error message when updateProfile returns 400', async () => {
      const err = new Error('Invalid data');
      err.status = 400;
      const up = vi.fn().mockRejectedValue(err);
      setupHook({ updateProfile: up });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('alert').textContent).toMatch(/invalid data/i);
      });
    });

    it('toast does NOT appear when updateProfile fails', async () => {
      const err = new Error('Server error');
      err.status = 500;
      const up = vi.fn().mockRejectedValue(err);
      setupHook({ updateProfile: up });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

      expect(screen.queryByText(/profile updated successfully/i)).not.toBeInTheDocument();
    });

    it('BmiResultCard keeps old values when submit fails', async () => {
      const err = new Error('Error');
      err.status = 400;
      const up = vi.fn().mockRejectedValue(err);
      setupHook({ updateProfile: up });
      renderPage();

      expect(screen.getByText('17.6')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

      expect(screen.getByText('17.6')).toBeInTheDocument();
      expect(screen.queryByText('18.0')).not.toBeInTheDocument();
    });

    it('does NOT navigate when updateProfile fails', async () => {
      const err = new Error('Error');
      err.status = 400;
      const up = vi.fn().mockRejectedValue(err);
      setupHook({ updateProfile: up });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('form remains accessible after submit failure — user can retry', async () => {
      const err = new Error('Error');
      err.status = 400;
      const up = vi.fn().mockRejectedValue(err);
      setupHook({ updateProfile: up });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

      expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update profile/i })).not.toBeDisabled();
    });

    it('shows generic error message when server returns no message', async () => {
      const up = vi.fn().mockRejectedValue(new Error());
      setupHook({ updateProfile: up });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('does not crash when hook returns error state with profile=null', () => {
      setupHook({ hasProfile: false, isLoading: false, profile: null, error: 'Session expired' });
      expect(() => renderPage()).not.toThrow();
    });

    it('does not crash when bmi=null in BmiResultCard', () => {
      const incompleteProfile = { ...mockExistingProfile, bmi: null, bodyClassification: null };
      setupHook({ profile: incompleteProfile, hasProfile: true });
      expect(() => renderPage()).not.toThrow();
    });

    it('button is disabled while submitting (UR-05)', async () => {
      let resolveUpdate;
      const up = vi.fn().mockImplementation(() => new Promise((res) => { resolveUpdate = res; }));
      setupHook({ updateProfile: up });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
      });

      await act(async () => { resolveUpdate(mockUpdatedProfile); });
    });

    it('error message clears on second successful submit', async () => {
      const errReq = new Error('Error');
      errReq.status = 400;
      const up = vi.fn()
        .mockRejectedValueOnce(errReq)
        .mockResolvedValueOnce(mockUpdatedProfile);
      setupHook({ updateProfile: up });
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
      await waitFor(() => {
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('toast timer resets on second successful submit', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: false });
      const up = vi.fn().mockResolvedValue(mockUpdatedProfile);
      setupHook({ updateProfile: up });
      renderPage();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
        await Promise.resolve();
        await Promise.resolve();
      });

      act(() => vi.advanceTimersByTime(1500));
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
        await Promise.resolve();
        await Promise.resolve();
      });

      act(() => vi.advanceTimersByTime(1500));
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();

      vi.useRealTimers();
    });
  });
});
