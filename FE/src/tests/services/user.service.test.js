import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import userService from '../../services/user.service';

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

const BASE = 'http://localhost/api';

describe('userService', () => {
  describe('getProfile()', () => {
    it('trả về profile object khi 200', async () => {
      server.use(
        http.get(`${BASE}/users/profile`, () => HttpResponse.json(mockProfile))
      );
      const result = await userService.getProfile();
      expect(result).toEqual(mockProfile);
    });

    it('throw "Hồ sơ chưa tồn tại" khi 404', async () => {
      server.use(
        http.get(`${BASE}/users/profile`, () =>
          HttpResponse.json({ message: 'Not found' }, { status: 404 })
        )
      );
      await expect(userService.getProfile()).rejects.toThrow('Hồ sơ chưa tồn tại');
    });

    it('throw error với status 404 khi 404', async () => {
      server.use(
        http.get(`${BASE}/users/profile`, () =>
          HttpResponse.json({ message: 'Not found' }, { status: 404 })
        )
      );
      await expect(userService.getProfile()).rejects.toMatchObject({ status: 404 });
    });

    it('throw "Phiên đăng nhập hết hạn" khi 401', async () => {
      server.use(
        http.get(`${BASE}/users/profile`, () =>
          HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        )
      );
      await expect(userService.getProfile()).rejects.toThrow('Phiên đăng nhập hết hạn');
    });
  });

  describe('createProfile(data)', () => {
    const createData = { height: 165, weight: 48, age: 22, gender: 'male' };

    it('trả về profile khi 201', async () => {
      server.use(
        http.post(`${BASE}/users/profile`, () =>
          HttpResponse.json(mockProfile, { status: 201 })
        )
      );
      const result = await userService.createProfile(createData);
      expect(result).toEqual(mockProfile);
    });

    it('gửi đúng request body', async () => {
      let capturedBody;
      server.use(
        http.post(`${BASE}/users/profile`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(mockProfile, { status: 201 });
        })
      );
      await userService.createProfile(createData);
      expect(capturedBody).toEqual(createData);
    });

    it('throw "Hồ sơ đã tồn tại" khi 409', async () => {
      server.use(
        http.post(`${BASE}/users/profile`, () =>
          HttpResponse.json({ message: 'Conflict' }, { status: 409 })
        )
      );
      await expect(userService.createProfile(createData)).rejects.toThrow('Hồ sơ đã tồn tại');
    });

    it('throw message từ server khi 400 có message', async () => {
      server.use(
        http.post(`${BASE}/users/profile`, () =>
          HttpResponse.json({ message: 'Chiều cao phải từ 100 đến 250 cm' }, { status: 400 })
        )
      );
      await expect(userService.createProfile(createData)).rejects.toThrow(
        'Chiều cao phải từ 100 đến 250 cm'
      );
    });

    it('throw "Dữ liệu không hợp lệ" khi 400 không có message', async () => {
      server.use(
        http.post(`${BASE}/users/profile`, () =>
          HttpResponse.json({}, { status: 400 })
        )
      );
      await expect(userService.createProfile(createData)).rejects.toThrow('Dữ liệu không hợp lệ');
    });

    it('throw "Phiên đăng nhập hết hạn" khi 401', async () => {
      server.use(
        http.post(`${BASE}/users/profile`, () =>
          HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        )
      );
      await expect(userService.createProfile(createData)).rejects.toThrow(
        'Phiên đăng nhập hết hạn'
      );
    });
  });

  describe('updateProfile(data)', () => {
    const updateData = { weight: 52 };
    const updatedProfile = { ...mockProfile, weight: 52, bmi: 19.1, bodyClassification: 'normal' };

    it('trả về profile đã cập nhật khi 200', async () => {
      server.use(
        http.put(`${BASE}/users/profile`, () => HttpResponse.json(updatedProfile))
      );
      const result = await userService.updateProfile(updateData);
      expect(result).toEqual(updatedProfile);
    });

    it('gửi đúng request body', async () => {
      let capturedBody;
      server.use(
        http.put(`${BASE}/users/profile`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(updatedProfile);
        })
      );
      await userService.updateProfile(updateData);
      expect(capturedBody).toEqual(updateData);
    });

    it('throw "Hồ sơ chưa tồn tại" khi 404', async () => {
      server.use(
        http.put(`${BASE}/users/profile`, () =>
          HttpResponse.json({ message: 'Not found' }, { status: 404 })
        )
      );
      await expect(userService.updateProfile(updateData)).rejects.toThrow('Hồ sơ chưa tồn tại');
    });

    it('throw "Phiên đăng nhập hết hạn" khi 401', async () => {
      server.use(
        http.put(`${BASE}/users/profile`, () =>
          HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        )
      );
      await expect(userService.updateProfile(updateData)).rejects.toThrow(
        'Phiên đăng nhập hết hạn'
      );
    });

    it('throw message từ server khi 400', async () => {
      server.use(
        http.put(`${BASE}/users/profile`, () =>
          HttpResponse.json({ message: 'Cân nặng không hợp lệ' }, { status: 400 })
        )
      );
      await expect(userService.updateProfile(updateData)).rejects.toThrow('Cân nặng không hợp lệ');
    });
  });

  describe('calcBmi(height, weight)', () => {
    it('trả về { bmi, bodyClassification } khi 200', async () => {
      server.use(
        http.get(`${BASE}/users/profile/bmi`, () =>
          HttpResponse.json({ bmi: 17.63, bodyClassification: 'underweight' })
        )
      );
      const result = await userService.calcBmi(165, 48);
      expect(result).toEqual({ bmi: 17.63, bodyClassification: 'underweight' });
    });

    it('gửi đúng query params height và weight', async () => {
      let capturedUrl;
      server.use(
        http.get(`${BASE}/users/profile/bmi`, ({ request }) => {
          capturedUrl = new URL(request.url);
          return HttpResponse.json({ bmi: 17.63, bodyClassification: 'underweight' });
        })
      );
      await userService.calcBmi(165, 48);
      expect(capturedUrl.searchParams.get('height')).toBe('165');
      expect(capturedUrl.searchParams.get('weight')).toBe('48');
    });

    it('throw "Phiên đăng nhập hết hạn" khi 401', async () => {
      server.use(
        http.get(`${BASE}/users/profile/bmi`, () =>
          HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        )
      );
      await expect(userService.calcBmi(165, 48)).rejects.toThrow('Phiên đăng nhập hết hạn');
    });

    it('throw "Dữ liệu không hợp lệ" khi 400 không có message', async () => {
      server.use(
        http.get(`${BASE}/users/profile/bmi`, () =>
          HttpResponse.json({}, { status: 400 })
        )
      );
      await expect(userService.calcBmi(165, 48)).rejects.toThrow('Dữ liệu không hợp lệ');
    });

    it('trả về bodyClassification normal', async () => {
      server.use(
        http.get(`${BASE}/users/profile/bmi`, () =>
          HttpResponse.json({ bmi: 22.0, bodyClassification: 'normal' })
        )
      );
      const result = await userService.calcBmi(170, 63);
      expect(result.bodyClassification).toBe('normal');
    });
  });
});
