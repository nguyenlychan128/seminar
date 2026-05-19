'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = require('../../src/app');
const User = require('../../src/models/User');
const logger = require('../../src/utils/logger');
const rateLimit = require('../../src/middleware/rateLimit');

const TEST_SECRET = 'test-secret-at-least-32-characters-long!!';
const VALID_PASSWORD = 'SecurePass123!';

// ── Token factory helpers ──────────────────────────────────────────────────

function makeAccessToken(userId, email, role = 'User') {
  return jwt.sign(
    { userId, email, role },
    TEST_SECRET,
    { expiresIn: '15m', algorithm: 'HS256' }
  );
}

function makeExpiredAccessToken(userId, email, role = 'User') {
  return jwt.sign(
    { userId, email, role },
    TEST_SECRET,
    { expiresIn: '-1s', algorithm: 'HS256' }
  );
}

function makeRefreshToken(userId, email) {
  return jwt.sign(
    { userId, email, type: 'refresh' },
    TEST_SECRET,
    { expiresIn: '7d', algorithm: 'HS256' }
  );
}

function makeTokenWithWrongSecret(userId, email, role = 'User') {
  return jwt.sign(
    { userId, email, role },
    'completely-wrong-secret-xxxxxxxxxxxxxx',
    { expiresIn: '15m', algorithm: 'HS256' }
  );
}

// ── DB seeding helper ──────────────────────────────────────────────────────

async function seedUser(overrides = {}) {
  const passwordHash = await bcrypt.hash(VALID_PASSWORD, 5);
  return User.create({
    email: 'alice@example.com',
    passwordHash,
    role: 'User',
    isActive: true,
    ...overrides,
  });
}

// ── Lifecycle ──────────────────────────────────────────────────────────────

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
  if (rateLimit.resetStore) {
    rateLimit.resetStore();
  }
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 1 — Happy Path
// ══════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/logout — Happy Path', () => {
  it('should return 200 when a valid User access token is provided', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('should return 200 when a valid Admin access token is provided', async () => {
    const user = await seedUser({ role: 'Admin' });
    const token = makeAccessToken(user._id.toString(), user.email, 'Admin');

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('should return success: true', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.success).toBe(true);
  });

  it('should return message: "Logout successful"', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.message).toBe('Logout successful');
  });

  it('should not return a "data" key in the response body', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data).toBeUndefined();
  });

  it('should work when no request body is sent', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('should ignore any body fields sent by the client', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({ refreshToken: 'some-token', extra: 'junk' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('response body should never contain passwordHash', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 2 — 401 Missing Token
// ══════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/logout — 401 Missing Token', () => {
  it('should return 401 when Authorization header is absent', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(401);
  });

  it('should return message "Missing authorization token" when header is absent', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.body.message).toBe('Missing authorization token');
  });

  it('should return 401 when Authorization header uses "Token" scheme instead of "Bearer"', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid authorization header');
  });

  it('should return 401 when Authorization header is "Bearer" with no token part', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid authorization header');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 3 — 401 Invalid / Malformed Token
// ══════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/logout — 401 Invalid / Malformed Token', () => {
  it('should return 401 when token is signed with the wrong secret', async () => {
    const user = await seedUser();
    const token = makeTokenWithWrongSecret(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token signature');
  });

  it('should return 401 when token is a random non-JWT string', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer this-is-not-a-jwt');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token signature');
  });

  it('should return 401 when token has only header.payload (missing signature segment)', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);
    const malformed = token.split('.').slice(0, 2).join('.');

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${malformed}`);

    expect(res.status).toBe(401);
  });

  it('should return 401 when the signature segment is tampered', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);
    const tampered = token.slice(0, -5) + 'xxxxx';

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tampered}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token signature');
  });

  it('should return 401 when a refresh token is used as the Bearer token', async () => {
    const user = await seedUser();
    const refreshToken = makeRefreshToken(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${refreshToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token signature');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 4 — 401 Expired Token
// ══════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/logout — 401 Expired Token', () => {
  it('should return 401 when access token is expired', async () => {
    const user = await seedUser();
    const token = makeExpiredAccessToken(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  it('should return message "Token expired" when access token is expired', async () => {
    const user = await seedUser();
    const token = makeExpiredAccessToken(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token expired');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 5 — Idempotency
// ══════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/logout — Idempotency', () => {
  it('two consecutive logout calls with the same valid token should both return 200', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    const res1 = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    const res2 = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
  });

  it('three consecutive logout calls with the same valid token should all return 200', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    }
  });

  it('both idempotent responses should contain the same body shape', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    const res1 = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    const res2 = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res1.body).toEqual(res2.body);
  });

  it('logout after a new login with a fresh token should return 200', async () => {
    const user = await seedUser();
    const tokenFirst = makeAccessToken(user._id.toString(), user.email);

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tokenFirst}`);

    const tokenSecond = makeAccessToken(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tokenSecond}`);

    expect(res.status).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 6 — Audit Logging
// ══════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/logout — Audit Logging', () => {
  let loggerInfoSpy;

  beforeEach(() => {
    loggerInfoSpy = jest.spyOn(logger, 'info');
  });

  afterEach(() => {
    loggerInfoSpy.mockRestore();
  });

  it('should call logger.info on successful logout', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(loggerInfoSpy).toHaveBeenCalled();
  });

  it('logger.info call should include userId matching the token userId', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    const logCalls = loggerInfoSpy.mock.calls;
    const logoutCall = logCalls.find(([msg]) =>
      typeof msg === 'string' && msg.toLowerCase().includes('logout')
    );

    expect(logoutCall).toBeDefined();
    expect(logoutCall[1].userId).toBe(user._id.toString());
  });

  it('logger.info call should include email matching the token email', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    const logCalls = loggerInfoSpy.mock.calls;
    const logoutCall = logCalls.find(([msg]) =>
      typeof msg === 'string' && msg.toLowerCase().includes('logout')
    );

    expect(logoutCall[1].email).toBe(user.email);
  });

  it('logger.info call should include a timestamp field', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    const logCalls = loggerInfoSpy.mock.calls;
    const logoutCall = logCalls.find(([msg]) =>
      typeof msg === 'string' && msg.toLowerCase().includes('logout')
    );

    expect(logoutCall[1].timestamp).toBeDefined();
    expect(new Date(logoutCall[1].timestamp).getTime()).not.toBeNaN();
  });

  it('logger.info call should include ip field', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    const logCalls = loggerInfoSpy.mock.calls;
    const logoutCall = logCalls.find(([msg]) =>
      typeof msg === 'string' && msg.toLowerCase().includes('logout')
    );

    expect(logoutCall[1]).toHaveProperty('ip');
  });

  it('logger.info call should include userAgent field with actual value', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);
    const testUserAgent = 'TestAgent/1.0';

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .set('User-Agent', testUserAgent);

    const logCalls = loggerInfoSpy.mock.calls;
    const logoutCall = logCalls.find(([msg]) =>
      typeof msg === 'string' && msg.toLowerCase().includes('logout')
    );

    expect(logoutCall[1].userAgent).toBe(testUserAgent);
  });

  it('should NOT call a logout audit log when token is invalid (auth fails before handler)', async () => {
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer invalid-token-string');

    const logCalls = loggerInfoSpy.mock.calls;
    const logoutAuditCall = logCalls.find(([msg]) =>
      typeof msg === 'string' && msg.toLowerCase().includes('logout')
    );

    expect(logoutAuditCall).toBeUndefined();
  });

  it('should only call logger.info once per logout request', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    loggerInfoSpy.mockClear();

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    const logCalls = loggerInfoSpy.mock.calls;
    const logoutCalls = logCalls.filter(([msg]) =>
      typeof msg === 'string' && msg.toLowerCase().includes('logout')
    );

    expect(logoutCalls).toHaveLength(1);
  });

  it('inactive user can still logout with valid token (no DB re-validation in MVP)', async () => {
    const user = await seedUser({ isActive: false });
    const token = makeAccessToken(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 7 — Security Invariants
// ══════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/logout — Security Invariants', () => {
  it('response body should never expose the token string received in the request', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(JSON.stringify(res.body)).not.toContain(token);
  });

  it('response body should never expose passwordHash', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('401 error response should not expose stack trace in development mode', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.body.stack).toBeUndefined();
  });

  it('using refresh token as Bearer should return 401, not 200 (prevents misuse)', async () => {
    const user = await seedUser();
    const refreshToken = makeRefreshToken(user._id.toString(), user.email);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${refreshToken}`);

    expect(res.status).toBe(401);
  });

  it('only valid access tokens (not refresh tokens) should produce a successful logout', async () => {
    const user = await seedUser();
    const accessToken = makeAccessToken(user._id.toString(), user.email);
    const refreshToken = makeRefreshToken(user._id.toString(), user.email);

    const resWithAccess = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    const resWithRefresh = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${refreshToken}`);

    expect(resWithAccess.status).toBe(200);
    expect(resWithRefresh.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 8 — 500 Server Errors
// ══════════════════════════════════════════════════════════════════════════

describe('POST /api/auth/logout — 500 Server Errors', () => {
  it('should return 500 and not crash when logger.info throws unexpectedly', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    const spy = jest.spyOn(logger, 'info').mockImplementationOnce(() => {
      throw new Error('Logger exploded');
    });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);

    spy.mockRestore();
  });

  it('should not expose stack trace in production mode when 500 occurs', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email);

    const spy = jest.spyOn(logger, 'info').mockImplementationOnce(() => {
      throw new Error('Logger exploded');
    });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.stack).toBeUndefined();

    spy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});
