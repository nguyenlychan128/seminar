'use strict';

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { refreshToken } = require('../../src/services/authService');
const User = require('../../src/models/User');

const TEST_SECRET = 'test-secret-at-least-32-characters-long!!';
const MOCK_USER_ID = new mongoose.Types.ObjectId().toString();

beforeEach(() => {
  process.env.JWT_SECRET = TEST_SECRET;
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
});

afterEach(() => {
  delete process.env.JWT_SECRET;
  delete process.env.JWT_EXPIRES_IN;
  delete process.env.JWT_REFRESH_EXPIRES_IN;
  jest.restoreAllMocks();
});

describe('authService.refreshToken — Happy Path', () => {
  it('should return success: true with new accessToken and refreshToken on valid input', async () => {
    jest.spyOn(User, 'findById').mockResolvedValueOnce({
      _id: MOCK_USER_ID,
      email: 'alice@example.com',
      role: 'User',
      isActive: true,
    });

    const validRefreshToken = jwt.sign(
      { userId: MOCK_USER_ID, email: 'alice@example.com', type: 'refresh' },
      TEST_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const result = await refreshToken(validRefreshToken);

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.data.accessToken).toBeDefined();
    expect(typeof result.data.accessToken).toBe('string');
    expect(result.data.refreshToken).toBeDefined();
    expect(typeof result.data.refreshToken).toBe('string');
    expect(result.data.expiresIn).toBe(900);
  });

  it('returned accessToken should decode to correct userId, email, role', async () => {
    jest.spyOn(User, 'findById').mockResolvedValueOnce({
      _id: MOCK_USER_ID,
      email: 'alice@example.com',
      role: 'User',
      isActive: true,
    });

    const validRefreshToken = jwt.sign(
      { userId: MOCK_USER_ID, email: 'alice@example.com', type: 'refresh' },
      TEST_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const result = await refreshToken(validRefreshToken);
    const decoded = jwt.verify(result.data.accessToken, TEST_SECRET);

    expect(decoded.userId).toBe(MOCK_USER_ID);
    expect(decoded.email).toBe('alice@example.com');
    expect(decoded.role).toBe('User');
  });

  it('returned refreshToken should decode to correct userId, email, type: "refresh"', async () => {
    jest.spyOn(User, 'findById').mockResolvedValueOnce({
      _id: MOCK_USER_ID,
      email: 'alice@example.com',
      role: 'User',
      isActive: true,
    });

    const validRefreshToken = jwt.sign(
      { userId: MOCK_USER_ID, email: 'alice@example.com', type: 'refresh' },
      TEST_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const result = await refreshToken(validRefreshToken);
    const decoded = jwt.verify(result.data.refreshToken, TEST_SECRET);

    expect(decoded.userId).toBe(MOCK_USER_ID);
    expect(decoded.email).toBe('alice@example.com');
    expect(decoded.type).toBe('refresh');
    expect(decoded.role).toBeUndefined();
  });

  it('returned accessToken should have TTL of 900 seconds', async () => {
    jest.spyOn(User, 'findById').mockResolvedValueOnce({
      _id: MOCK_USER_ID,
      email: 'alice@example.com',
      role: 'User',
      isActive: true,
    });

    const validRefreshToken = jwt.sign(
      { userId: MOCK_USER_ID, email: 'alice@example.com', type: 'refresh' },
      TEST_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const result = await refreshToken(validRefreshToken);
    const decoded = jwt.verify(result.data.accessToken, TEST_SECRET);

    expect(decoded.exp - decoded.iat).toBe(900);
  });

  it('returned refreshToken should have TTL of 604800 seconds', async () => {
    jest.spyOn(User, 'findById').mockResolvedValueOnce({
      _id: MOCK_USER_ID,
      email: 'alice@example.com',
      role: 'User',
      isActive: true,
    });

    const validRefreshToken = jwt.sign(
      { userId: MOCK_USER_ID, email: 'alice@example.com', type: 'refresh' },
      TEST_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const result = await refreshToken(validRefreshToken);
    const decoded = jwt.verify(result.data.refreshToken, TEST_SECRET);

    expect(decoded.exp - decoded.iat).toBe(604800);
  });
});

describe('authService.refreshToken — Error Returns (not throws)', () => {
  it('should return status 401 when user not found in database', async () => {
    jest.spyOn(User, 'findById').mockResolvedValueOnce(null);

    const validRefreshToken = jwt.sign(
      { userId: MOCK_USER_ID, email: 'alice@example.com', type: 'refresh' },
      TEST_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const result = await refreshToken(validRefreshToken);

    expect(result.success).toBe(false);
    expect(result.status).toBe(401);
    expect(result.message).toBe('User not found');
  });

  it('should return status 401 when user account is disabled', async () => {
    jest.spyOn(User, 'findById').mockResolvedValueOnce({
      _id: MOCK_USER_ID,
      email: 'alice@example.com',
      role: 'User',
      isActive: false,
    });

    const validRefreshToken = jwt.sign(
      { userId: MOCK_USER_ID, email: 'alice@example.com', type: 'refresh' },
      TEST_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const result = await refreshToken(validRefreshToken);

    expect(result.success).toBe(false);
    expect(result.status).toBe(401);
    expect(result.message).toBe('Account is disabled');
  });

  it('should return status 401 when refresh token is expired (TokenExpiredError)', async () => {
    jest.spyOn(User, 'findById').mockResolvedValueOnce({
      _id: MOCK_USER_ID,
      email: 'alice@example.com',
      role: 'User',
      isActive: true,
    });

    const expiredToken = jwt.sign(
      { userId: MOCK_USER_ID, email: 'alice@example.com', type: 'refresh' },
      TEST_SECRET,
      { expiresIn: '-1s', algorithm: 'HS256' }
    );

    const result = await refreshToken(expiredToken);

    expect(result.success).toBe(false);
    expect(result.status).toBe(401);
    expect(result.message).toBe('Refresh token expired. Please log in again.');
  });

  it('should return status 401 when passed an access token (type check fails)', async () => {
    jest.spyOn(User, 'findById').mockResolvedValueOnce({
      _id: MOCK_USER_ID,
      email: 'alice@example.com',
      role: 'User',
      isActive: true,
    });

    const accessToken = jwt.sign(
      { userId: MOCK_USER_ID, email: 'alice@example.com', role: 'User' },
      TEST_SECRET,
      { expiresIn: '15m', algorithm: 'HS256' }
    );

    const result = await refreshToken(accessToken);

    expect(result.success).toBe(false);
    expect(result.status).toBe(401);
    expect(result.message).toBe('Invalid token type');
  });

  it('should return status 403 when token has invalid signature (JsonWebTokenError)', async () => {
    const wronglySignedToken = jwt.sign(
      { userId: MOCK_USER_ID, email: 'alice@example.com', type: 'refresh' },
      'wrong-secret-that-is-32-characters-long!!',
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const result = await refreshToken(wronglySignedToken);

    expect(result.success).toBe(false);
    expect(result.status).toBe(403);
    expect(result.message).toBe('Invalid token signature');
  });

  it('should return status 401 when token is a random non-JWT string', async () => {
    const result = await refreshToken('not-a-jwt');

    expect(result.success).toBe(false);
    expect(result.status).toBe(401);
  });
});

describe('authService.refreshToken — Audit Logging', () => {
  it('should log a token refresh event with userId, email, and timestamp on success', async () => {
    jest.spyOn(User, 'findById').mockResolvedValueOnce({
      _id: MOCK_USER_ID,
      email: 'alice@example.com',
      role: 'User',
      isActive: true,
    });

    const validRefreshToken = jwt.sign(
      { userId: MOCK_USER_ID, email: 'alice@example.com', type: 'refresh' },
      TEST_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const logger = require('../../src/utils/logger');
    const spy = jest.spyOn(logger, 'info');

    await refreshToken(validRefreshToken);

    expect(spy).toHaveBeenCalledWith(
      'Token refreshed',
      expect.objectContaining({
        userId: MOCK_USER_ID,
        email: 'alice@example.com',
      })
    );

    spy.mockRestore();
  });

  it('should log a warning when invalid token attempt occurs', async () => {
    const logger = require('../../src/utils/logger');
    const spy = jest.spyOn(logger, 'warn');

    await refreshToken('invalid-token');

    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});
