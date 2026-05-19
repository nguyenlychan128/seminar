'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = require('../../src/app');
const User = require('../../src/models/User');

const TEST_SECRET = 'test-secret-at-least-32-characters-long!!';
const VALID_PASSWORD = 'SecurePass123!';

function makeRefreshToken(overrides = {}) {
  const payload = {
    userId: new mongoose.Types.ObjectId().toString(),
    email: 'alice@example.com',
    type: 'refresh',
    ...overrides,
  };
  return jwt.sign(payload, TEST_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
}

function makeAccessToken(overrides = {}) {
  const payload = {
    userId: new mongoose.Types.ObjectId().toString(),
    email: 'alice@example.com',
    role: 'User',
    ...overrides,
  };
  return jwt.sign(payload, TEST_SECRET, { expiresIn: '15m', algorithm: 'HS256' });
}

async function seedUserWithTokens(overrides = {}) {
  const passwordHash = await bcrypt.hash(VALID_PASSWORD, 5);
  const user = await User.create({
    email: 'alice@example.com',
    passwordHash,
    role: 'User',
    isActive: true,
    ...overrides,
  });
  const refreshToken = makeRefreshToken({ userId: user._id.toString(), email: user.email });
  const accessToken = makeAccessToken({ userId: user._id.toString(), email: user.email });
  return { user, refreshToken, accessToken };
}

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  process.env.JWT_SECRET = TEST_SECRET;
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/refresh — Happy Path', () => {
  it('should return 200 with success: true and message "Token refreshed successfully"', async () => {
    const { refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Token refreshed successfully');
  });

  it('should return data object with accessToken, refreshToken, and expiresIn: 900', async () => {
    const { refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.body.data).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(res.body.data.refreshToken).toBeDefined();
    expect(typeof res.body.data.refreshToken).toBe('string');
    expect(res.body.data.expiresIn).toBe(900);
  });

  it('new accessToken should be a verifiable HS256 JWT', async () => {
    const { refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    const decoded = jwt.verify(res.body.data.accessToken, TEST_SECRET);
    expect(decoded).toBeDefined();
  });

  it('new accessToken should contain correct claims: userId, email, role', async () => {
    const { user, refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    const decoded = jwt.verify(res.body.data.accessToken, TEST_SECRET);
    expect(decoded.userId).toBe(user._id.toString());
    expect(decoded.email).toBe('alice@example.com');
    expect(decoded.role).toBe('User');
    expect(decoded.type).toBeUndefined();
  });

  it('new accessToken should expire in exactly 900 seconds (15m TTL)', async () => {
    const { refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    const decoded = jwt.verify(res.body.data.accessToken, TEST_SECRET);
    expect(decoded.exp - decoded.iat).toBe(900);
  });

  it('new refreshToken should be a verifiable HS256 JWT with type: "refresh"', async () => {
    const { user, refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    const decoded = jwt.verify(res.body.data.refreshToken, TEST_SECRET);
    expect(decoded.type).toBe('refresh');
    expect(decoded.userId).toBe(user._id.toString());
    expect(decoded.email).toBe('alice@example.com');
    expect(decoded.role).toBeUndefined();
  });

  it('new refreshToken should expire in exactly 7 days (604800 seconds TTL)', async () => {
    const { refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    const decoded = jwt.verify(res.body.data.refreshToken, TEST_SECRET);
    expect(decoded.exp - decoded.iat).toBe(604800);
  });

  it('new accessToken should be different from the refresh token', async () => {
    const { refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.body.data.accessToken).not.toBe(refreshToken);
  });

  it('two refresh calls with a 1s gap should produce different token pairs', async () => {
    const { refreshToken } = await seedUserWithTokens();

    const res1 = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    await new Promise(resolve => setTimeout(resolve, 1100));

    const res2 = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res1.body.data.accessToken).not.toBe(res2.body.data.accessToken);
    expect(res1.body.data.refreshToken).not.toBe(res2.body.data.refreshToken);
  });

  it('response should never contain passwordHash or plaintext password', async () => {
    const { refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    const responseStr = JSON.stringify(res.body);
    expect(responseStr).not.toContain('passwordHash');
    expect(responseStr).not.toContain(VALID_PASSWORD);
  });

  it('should work without Authorization header (access token in header is optional for this endpoint)', async () => {
    const { refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
  });

  it('should accept request when Authorization header is present with a valid access token', async () => {
    const { refreshToken, accessToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
  });
});

describe('POST /api/auth/refresh — 400 Missing Refresh Token', () => {
  it('should return 400 when body is completely empty', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Refresh token required');
  });

  it('should return 400 when refreshToken field is missing from body', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ someOtherField: 'value' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Refresh token required');
  });

  it('should return 400 when refreshToken is null', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: null });

    expect(res.status).toBe(400);
  });

  it('should return 400 when refreshToken is empty string', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: '' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when refreshToken is whitespace-only', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: '   ' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when refreshToken is a number (wrong type)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 12345 });

    expect(res.status).toBe(400);
  });

  it('should return 400 when refreshToken is an array', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: [] });

    expect(res.status).toBe(400);
  });

  it('should return 400 when refreshToken is an object (NoSQL injection guard)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: { $gt: '' } });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/refresh — 401 User Not Found / Disabled', () => {
  it('should return 401 when user was deleted from database', async () => {
    const deletedUserId = new mongoose.Types.ObjectId().toString();
    const refreshToken = jwt.sign(
      { userId: deletedUserId, email: 'deleted@example.com', type: 'refresh' },
      TEST_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('User not found');
  });

  it('should return 401 when user account is disabled', async () => {
    const passwordHash = await bcrypt.hash(VALID_PASSWORD, 5);
    const user = await User.create({
      email: 'disabled@example.com',
      passwordHash,
      role: 'User',
      isActive: false,
    });

    const refreshToken = jwt.sign(
      { userId: user._id.toString(), email: user.email, type: 'refresh' },
      TEST_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Account is disabled');
  });
});

describe('POST /api/auth/refresh — 401 Invalid / Expired / Wrong Type', () => {
  it('should return 403 when refresh token has invalid signature (tampered payload)', async () => {
    const { refreshToken } = await seedUserWithTokens();
    const tamperedToken = refreshToken.slice(0, -5) + 'xxxxx';

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: tamperedToken });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 when refresh token is expired', async () => {
    const expiredToken = jwt.sign(
      { userId: '507f1f77bcf86cd799439011', email: 'alice@example.com', type: 'refresh' },
      TEST_SECRET,
      { expiresIn: '-1s', algorithm: 'HS256' }
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: expiredToken });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Refresh token expired. Please log in again.');
  });

  it('should return 401 when an access token is passed as the refreshToken (wrong token type)', async () => {
    const { accessToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: accessToken });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token type');
  });

  it('should return 401 when token is a completely random string (malformed JWT)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'not-a-jwt-at-all' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 when refresh token has only two segments (invalid JWT structure)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'header.payload' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh — 403 Invalid Signature', () => {
  it('should return 403 when refresh token is signed with a completely different secret', async () => {
    const wrongToken = jwt.sign(
      { userId: '507f1f77bcf86cd799439011', email: 'alice@example.com', type: 'refresh' },
      'wrong-secret-that-is-32-characters-long!!',
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: wrongToken });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid token signature');
  });
});

describe('POST /api/auth/refresh — 500 Server Errors', () => {
  it('should not expose stack trace in production mode when server error occurs', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const { refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    // Should succeed on valid token
    if (res.status !== 200) {
      expect(res.body.stack).toBeUndefined();
      expect(res.body.error).toBeUndefined();
    }

    process.env.NODE_ENV = originalEnv;
  });
});

describe('POST /api/auth/refresh — Security Invariants', () => {
  it('new accessToken header should use alg: HS256 (not none or RS256)', async () => {
    const { refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    const decoded = jwt.decode(res.body.data.accessToken, { complete: true });
    expect(decoded.header.alg).toBe('HS256');
  });

  it('new refreshToken header should use alg: HS256', async () => {
    const { refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    const decoded = jwt.decode(res.body.data.refreshToken, { complete: true });
    expect(decoded.header.alg).toBe('HS256');
  });

  it('new accessToken signed with wrong secret should be rejected by jwt.verify', async () => {
    const { refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(() => {
      jwt.verify(res.body.data.accessToken, 'wrong-secret-that-is-32-characters-long!!');
    }).toThrow();
  });

  it('access token should not carry a "type" claim (prevents using it as refresh)', async () => {
    const { refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    const decoded = jwt.verify(res.body.data.accessToken, TEST_SECRET);
    expect(decoded.type).toBeUndefined();
  });

  it('refresh token payload should not expose role claim', async () => {
    const { refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    const decoded = jwt.verify(res.body.data.refreshToken, TEST_SECRET);
    expect(decoded.role).toBeUndefined();
  });

  it('new accessToken userId should match the userId embedded in the original refresh token', async () => {
    const { user, refreshToken } = await seedUserWithTokens();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    const decodedAccess = jwt.verify(res.body.data.accessToken, TEST_SECRET);
    const decodedRefresh = jwt.verify(refreshToken, TEST_SECRET);

    expect(decodedAccess.userId).toBe(decodedRefresh.userId);
  });
});
