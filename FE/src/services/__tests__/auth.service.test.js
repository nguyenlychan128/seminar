import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import authService from '../auth.service';

const handlers = [
  http.post('/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
        user: {
          userId: 'user_123',
          email: 'test@example.com',
          role: 'user',
        },
      });
    }
    if (email === 'inactive@example.com') {
      return HttpResponse.json({ message: 'Account is disabled' }, { status: 401 });
    }
    return HttpResponse.json(
      { message: 'Invalid email or password' },
      { status: 401 }
    );
  }),

  http.post('/auth/register', async ({ request }) => {
    const { email, password, confirmPassword } = await request.json();

    if (email === 'existing@example.com') {
      return HttpResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }

    if (password !== confirmPassword) {
      return HttpResponse.json(
        { message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return HttpResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      {
        user: {
          userId: 'new_user_123',
          email,
          role: 'user',
        },
      },
      { status: 201 }
    );
  }),

  http.post('/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('/auth/refresh', async ({ request }) => {
    const { refreshToken } = await request.json();
    if (refreshToken === 'valid_refresh') {
      return HttpResponse.json({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
    }
    return HttpResponse.json(
      { message: 'Invalid refresh token' },
      { status: 401 }
    );
  }),

  http.get('/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json(
        { message: 'Missing authorization header' },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      user: {
        userId: 'user_123',
        email: 'test@example.com',
        role: 'user',
      },
    });
  }),
];

const server = setupServer(...handlers);

describe('Auth Service', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
    server.close();
  });

  describe('login()', () => {
    it('should return tokens and user on valid credentials', async () => {
      const result = await authService.login('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('access_token_123');
      expect(result.refreshToken).toBe('refresh_token_123');
      expect(result.user.userId).toBe('user_123');
    });

    it('should return structured error on 401 invalid credentials', async () => {
      try {
        await authService.login('wrong@example.com', 'wrong_password');
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.success).toBe(false);
        expect(error.code).toBe('INVALID_CREDENTIALS');
        expect(error.message).toBe('Invalid email or password');
      }
    });

    it('should return structured error on 401 inactive account', async () => {
      try {
        await authService.login('inactive@example.com', 'password123');
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.success).toBe(false);
        expect(error.code).toBe('INVALID_CREDENTIALS');
      }
    });
  });

  describe('register()', () => {
    it('should return user object on valid registration', async () => {
      const result = await authService.register(
        'newuser@example.com',
        'password123',
        'password123'
      );

      expect(result.success).toBe(true);
      expect(result.user.userId).toBe('new_user_123');
      expect(result.user.email).toBe('newuser@example.com');
    });

    it('should throw structured error on 409 duplicate email', async () => {
      try {
        await authService.register(
          'existing@example.com',
          'password123',
          'password123'
        );
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.success).toBe(false);
        expect(error.code).toBe('DUPLICATE_EMAIL');
        expect(error.message).toBe('Email already registered');
      }
    });

    it('should throw structured error on 400 password mismatch', async () => {
      try {
        await authService.register(
          'newuser@example.com',
          'password123',
          'password456'
        );
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.success).toBe(false);
        expect(error.code).toBe('INVALID_DATA');
      }
    });

    it('should throw structured error on 400 weak password', async () => {
      try {
        await authService.register('newuser@example.com', 'short', 'short');
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.success).toBe(false);
        expect(error.code).toBe('INVALID_DATA');
      }
    });
  });

  describe('logout()', () => {
    it('should call POST /api/auth/logout and resolve', async () => {
      const result = await authService.logout();
      expect(result.success).toBe(true);
    });

    it('should throw error on 401 unauthorized', async () => {
      server.use(
        http.post('/auth/logout', () => {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
          );
        })
      );

      try {
        await authService.logout();
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.success).toBe(false);
      }
    });
  });

  describe('refreshToken()', () => {
    it('should return new tokens on valid refresh token', async () => {
      const result = await authService.refreshToken('valid_refresh');

      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('new_access_token');
      expect(result.refreshToken).toBe('new_refresh_token');
    });

    it('should throw structured error on 401 expired refresh token', async () => {
      try {
        await authService.refreshToken('expired_refresh');
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.success).toBe(false);
        expect(error.code).toBe('INVALID_REFRESH_TOKEN');
      }
    });
  });

  describe('getMe()', () => {
    it('should return userId, email, role of current user', async () => {
      const result = await authService.getMe();

      expect(result.success).toBe(true);
      expect(result.user.userId).toBe('user_123');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe('user');
    });

    it('should throw structured error on 401 missing token', async () => {
      server.use(
        http.get('/auth/me', () => {
          return HttpResponse.json(
            { message: 'Missing authorization header' },
            { status: 401 }
          );
        })
      );

      try {
        await authService.getMe();
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.success).toBe(false);
        expect(error.code).toBe('UNAUTHORIZED');
      }
    });
  });
});
