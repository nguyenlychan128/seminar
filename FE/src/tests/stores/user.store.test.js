import { act } from '@testing-library/react';
import useUserStore from '../../stores/user.store';
import userService from '../../services/user.service';

vi.mock('../../services/user.service');

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

beforeEach(() => {
  useUserStore.setState({ profile: null, isLoading: false, error: null });
  vi.clearAllMocks();
});

describe('useUserStore', () => {
  describe('initial state', () => {
    it('profile là null', () => {
      expect(useUserStore.getState().profile).toBeNull();
    });

    it('isLoading là false', () => {
      expect(useUserStore.getState().isLoading).toBe(false);
    });

    it('error là null', () => {
      expect(useUserStore.getState().error).toBeNull();
    });
  });

  describe('fetchProfile()', () => {
    it('set isLoading = true trong khi gọi API', async () => {
      let loadingDuringCall = false;
      userService.getProfile.mockImplementation(async () => {
        loadingDuringCall = useUserStore.getState().isLoading;
        return mockProfile;
      });
      await act(async () => {
        await useUserStore.getState().fetchProfile();
      });
      expect(loadingDuringCall).toBe(true);
    });

    it('set isLoading = false sau khi xong', async () => {
      userService.getProfile.mockResolvedValue(mockProfile);
      await act(async () => {
        await useUserStore.getState().fetchProfile();
      });
      expect(useUserStore.getState().isLoading).toBe(false);
    });

    it('set profile khi thành công', async () => {
      userService.getProfile.mockResolvedValue(mockProfile);
      await act(async () => {
        await useUserStore.getState().fetchProfile();
      });
      expect(useUserStore.getState().profile).toEqual(mockProfile);
      expect(useUserStore.getState().error).toBeNull();
    });

    it('set profile = null và error = null khi 404 (silent)', async () => {
      const err = new Error('Hồ sơ chưa tồn tại');
      err.status = 404;
      userService.getProfile.mockRejectedValue(err);
      await act(async () => {
        await useUserStore.getState().fetchProfile();
      });
      expect(useUserStore.getState().profile).toBeNull();
      expect(useUserStore.getState().error).toBeNull();
      expect(useUserStore.getState().isLoading).toBe(false);
    });

    it('không throw khi 404', async () => {
      const err = new Error('Hồ sơ chưa tồn tại');
      err.status = 404;
      userService.getProfile.mockRejectedValue(err);
      await expect(
        act(async () => {
          await useUserStore.getState().fetchProfile();
        })
      ).resolves.not.toThrow();
    });

    it('set error khi lỗi không phải 404', async () => {
      const err = new Error('Phiên đăng nhập hết hạn');
      err.status = 401;
      userService.getProfile.mockRejectedValue(err);
      await act(async () => {
        await useUserStore.getState().fetchProfile();
      });
      expect(useUserStore.getState().error).toBe('Phiên đăng nhập hết hạn');
      expect(useUserStore.getState().isLoading).toBe(false);
    });

    it('set isLoading = false kể cả khi lỗi', async () => {
      userService.getProfile.mockRejectedValue(new Error('Network error'));
      await act(async () => {
        await useUserStore.getState().fetchProfile();
      });
      expect(useUserStore.getState().isLoading).toBe(false);
    });
  });

  describe('createProfile(data)', () => {
    const createData = { height: 165, weight: 48, age: 22, gender: 'male' };

    it('set isLoading = true trong khi gọi API', async () => {
      let loadingDuringCall = false;
      userService.createProfile.mockImplementation(async () => {
        loadingDuringCall = useUserStore.getState().isLoading;
        return mockProfile;
      });
      await act(async () => {
        await useUserStore.getState().createProfile(createData);
      });
      expect(loadingDuringCall).toBe(true);
    });

    it('set profile khi thành công', async () => {
      userService.createProfile.mockResolvedValue(mockProfile);
      await act(async () => {
        await useUserStore.getState().createProfile(createData);
      });
      expect(useUserStore.getState().profile).toEqual(mockProfile);
      expect(useUserStore.getState().error).toBeNull();
      expect(useUserStore.getState().isLoading).toBe(false);
    });

    it('return profile khi thành công (để caller dùng ngay)', async () => {
      userService.createProfile.mockResolvedValue(mockProfile);
      let result;
      await act(async () => {
        result = await useUserStore.getState().createProfile(createData);
      });
      expect(result).toEqual(mockProfile);
    });

    it('set error khi 409', async () => {
      const err = new Error('Hồ sơ đã tồn tại');
      err.status = 409;
      userService.createProfile.mockRejectedValue(err);
      await act(async () => {
        try {
          await useUserStore.getState().createProfile(createData);
        } catch {}
      });
      expect(useUserStore.getState().error).toBe('Hồ sơ đã tồn tại');
      expect(useUserStore.getState().profile).toBeNull();
      expect(useUserStore.getState().isLoading).toBe(false);
    });

    it('set error khi 400', async () => {
      const err = new Error('Dữ liệu không hợp lệ');
      err.status = 400;
      userService.createProfile.mockRejectedValue(err);
      await act(async () => {
        try {
          await useUserStore.getState().createProfile(createData);
        } catch {}
      });
      expect(useUserStore.getState().error).toBe('Dữ liệu không hợp lệ');
    });
  });

  describe('updateProfile(data)', () => {
    const updateData = { weight: 52 };
    const updatedProfile = { ...mockProfile, weight: 52, bmi: 19.1, bodyClassification: 'normal' };

    beforeEach(() => {
      useUserStore.setState({ profile: { ...mockProfile }, isLoading: false, error: null });
    });

    it('merge profile sau khi update thành công', async () => {
      userService.updateProfile.mockResolvedValue(updatedProfile);
      await act(async () => {
        await useUserStore.getState().updateProfile(updateData);
      });
      const { profile } = useUserStore.getState();
      expect(profile.weight).toBe(52);
      expect(profile.bmi).toBe(19.1);
      expect(profile.userId).toBe('user_123');
      expect(profile.height).toBe(165);
    });

    it('isLoading = true trong khi gọi, false sau khi xong', async () => {
      let loadingDuringCall = false;
      userService.updateProfile.mockImplementation(async () => {
        loadingDuringCall = useUserStore.getState().isLoading;
        return updatedProfile;
      });
      await act(async () => {
        await useUserStore.getState().updateProfile(updateData);
      });
      expect(loadingDuringCall).toBe(true);
      expect(useUserStore.getState().isLoading).toBe(false);
    });

    it('giữ nguyên profile cũ khi update thất bại', async () => {
      const err = new Error('Hồ sơ chưa tồn tại');
      err.status = 404;
      userService.updateProfile.mockRejectedValue(err);
      await act(async () => {
        try {
          await useUserStore.getState().updateProfile(updateData);
        } catch {}
      });
      expect(useUserStore.getState().profile).toEqual(mockProfile);
    });

    it('set error khi update thất bại', async () => {
      const err = new Error('Hồ sơ chưa tồn tại');
      err.status = 404;
      userService.updateProfile.mockRejectedValue(err);
      await act(async () => {
        try {
          await useUserStore.getState().updateProfile(updateData);
        } catch {}
      });
      expect(useUserStore.getState().error).toBe('Hồ sơ chưa tồn tại');
    });

    it('clear error khi update thành công', async () => {
      useUserStore.setState({ error: 'old error' });
      userService.updateProfile.mockResolvedValue(updatedProfile);
      await act(async () => {
        await useUserStore.getState().updateProfile(updateData);
      });
      expect(useUserStore.getState().error).toBeNull();
    });
  });

  describe('clearProfile()', () => {
    it('reset profile về null', () => {
      useUserStore.setState({ profile: mockProfile });
      useUserStore.getState().clearProfile();
      expect(useUserStore.getState().profile).toBeNull();
    });

    it('reset error về null', () => {
      useUserStore.setState({ error: 'some error' });
      useUserStore.getState().clearProfile();
      expect(useUserStore.getState().error).toBeNull();
    });

    it('reset isLoading về false', () => {
      useUserStore.setState({ isLoading: true });
      useUserStore.getState().clearProfile();
      expect(useUserStore.getState().isLoading).toBe(false);
    });

    it('đồng bộ — state thay đổi ngay lập tức', () => {
      useUserStore.setState({ profile: mockProfile, error: 'err' });
      useUserStore.getState().clearProfile();
      expect(useUserStore.getState().profile).toBeNull();
      expect(useUserStore.getState().error).toBeNull();
    });
  });
});
