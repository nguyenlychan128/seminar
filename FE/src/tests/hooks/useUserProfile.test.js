import { renderHook, act, waitFor } from '@testing-library/react';
import useUserProfile from '../../hooks/useUserProfile';

// Mock stores at module level
vi.mock('../../stores/user.store');
vi.mock('../../stores/auth.store');

import useUserStore from '../../stores/user.store';
import useAuthStore from '../../stores/auth.store';

const mockProfile = {
  userId: 'user_123',
  height: 165,
  weight: 48,
  age: 22,
  gender: 'male',
  bmi: 17.63,
  bodyClassification: 'underweight',
  updatedAt: '2026-05-17T10:00:00Z',
};

const mockFetchProfile = vi.fn();
const mockCreateProfile = vi.fn();
const mockUpdateProfile = vi.fn();
const mockClearProfile = vi.fn();

const setupStores = ({ profile = null, isLoading = false, error = null, isAuthenticated = true } = {}) => {
  useUserStore.mockReturnValue({
    profile,
    isLoading,
    error,
    fetchProfile: mockFetchProfile,
    createProfile: mockCreateProfile,
    updateProfile: mockUpdateProfile,
    clearProfile: mockClearProfile,
  });
  useAuthStore.mockReturnValue({ isAuthenticated });
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useUserProfile hook', () => {
  describe('return values', () => {
    it('expose profile từ store', () => {
      setupStores({ profile: mockProfile });
      const { result } = renderHook(() => useUserProfile());
      expect(result.current.profile).toEqual(mockProfile);
    });

    it('expose isLoading từ store', () => {
      setupStores({ isLoading: true });
      const { result } = renderHook(() => useUserProfile());
      expect(result.current.isLoading).toBe(true);
    });

    it('expose error từ store', () => {
      setupStores({ error: 'Phiên đăng nhập hết hạn' });
      const { result } = renderHook(() => useUserProfile());
      expect(result.current.error).toBe('Phiên đăng nhập hết hạn');
    });

    it('expose fetchProfile, createProfile, updateProfile, clearProfile là functions', () => {
      setupStores();
      const { result } = renderHook(() => useUserProfile());
      expect(typeof result.current.fetchProfile).toBe('function');
      expect(typeof result.current.createProfile).toBe('function');
      expect(typeof result.current.updateProfile).toBe('function');
      expect(typeof result.current.clearProfile).toBe('function');
    });
  });

  describe('computed: hasProfile', () => {
    it('false khi profile là null', () => {
      setupStores({ profile: null });
      const { result } = renderHook(() => useUserProfile());
      expect(result.current.hasProfile).toBe(false);
    });

    it('true khi profile có data', () => {
      setupStores({ profile: mockProfile });
      const { result } = renderHook(() => useUserProfile());
      expect(result.current.hasProfile).toBe(true);
    });
  });

  describe('computed: isUnderweight', () => {
    it('true khi bodyClassification là "underweight"', () => {
      setupStores({ profile: { ...mockProfile, bodyClassification: 'underweight' } });
      const { result } = renderHook(() => useUserProfile());
      expect(result.current.isUnderweight).toBe(true);
    });

    it('false khi bodyClassification là "normal"', () => {
      setupStores({ profile: { ...mockProfile, bodyClassification: 'normal' } });
      const { result } = renderHook(() => useUserProfile());
      expect(result.current.isUnderweight).toBe(false);
    });

    it('false khi bodyClassification là "overweight"', () => {
      setupStores({ profile: { ...mockProfile, bodyClassification: 'overweight' } });
      const { result } = renderHook(() => useUserProfile());
      expect(result.current.isUnderweight).toBe(false);
    });

    it('false khi bodyClassification là "obese"', () => {
      setupStores({ profile: { ...mockProfile, bodyClassification: 'obese' } });
      const { result } = renderHook(() => useUserProfile());
      expect(result.current.isUnderweight).toBe(false);
    });

    it('false khi profile là null (null-safe)', () => {
      setupStores({ profile: null });
      const { result } = renderHook(() => useUserProfile());
      expect(result.current.isUnderweight).toBe(false);
    });
  });

  describe('auto-fetch khi mount', () => {
    it('gọi fetchProfile khi mount, profile null và user đã login', async () => {
      mockFetchProfile.mockResolvedValue(undefined);
      setupStores({ profile: null, isAuthenticated: true });
      renderHook(() => useUserProfile());
      await waitFor(() => {
        expect(mockFetchProfile).toHaveBeenCalledTimes(1);
      });
    });

    it('KHÔNG gọi fetchProfile khi user chưa login', async () => {
      setupStores({ profile: null, isAuthenticated: false });
      renderHook(() => useUserProfile());
      await new Promise((r) => setTimeout(r, 50));
      expect(mockFetchProfile).not.toHaveBeenCalled();
    });

    it('KHÔNG gọi fetchProfile khi profile đã có', async () => {
      setupStores({ profile: mockProfile, isAuthenticated: true });
      renderHook(() => useUserProfile());
      await new Promise((r) => setTimeout(r, 50));
      expect(mockFetchProfile).not.toHaveBeenCalled();
    });

    it('KHÔNG gọi fetchProfile lại khi re-render', async () => {
      mockFetchProfile.mockResolvedValue(undefined);
      setupStores({ profile: null, isAuthenticated: true });
      const { rerender } = renderHook(() => useUserProfile());
      await waitFor(() => expect(mockFetchProfile).toHaveBeenCalledTimes(1));
      rerender();
      await new Promise((r) => setTimeout(r, 50));
      expect(mockFetchProfile).toHaveBeenCalledTimes(1);
    });
  });

  describe('action delegation', () => {
    it('delegate createProfile với đúng data', async () => {
      setupStores();
      mockCreateProfile.mockResolvedValue(undefined);
      const { result } = renderHook(() => useUserProfile());
      const data = { height: 165, weight: 48, age: 22, gender: 'male' };
      await act(async () => {
        await result.current.createProfile(data);
      });
      expect(mockCreateProfile).toHaveBeenCalledWith(data);
    });

    it('delegate updateProfile với đúng data', async () => {
      setupStores({ profile: mockProfile });
      mockUpdateProfile.mockResolvedValue(undefined);
      const { result } = renderHook(() => useUserProfile());
      const updateData = { weight: 52 };
      await act(async () => {
        await result.current.updateProfile(updateData);
      });
      expect(mockUpdateProfile).toHaveBeenCalledWith(updateData);
    });

    it('delegate clearProfile', () => {
      setupStores({ profile: mockProfile });
      const { result } = renderHook(() => useUserProfile());
      act(() => {
        result.current.clearProfile();
      });
      expect(mockClearProfile).toHaveBeenCalledTimes(1);
    });
  });
});
