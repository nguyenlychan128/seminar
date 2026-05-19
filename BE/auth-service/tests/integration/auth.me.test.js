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

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 1 — Happy Path
// ══════════════════════════════════════════════════════════════════════════

describe('GET /api/auth/me — Happy Path', () => {
  it('should return 200 when a valid User access token is provided', async () => {
    const user = await seedUser({ role: 'User' });
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 200 when a valid Admin access token is provided', async () => {
    const user = await seedUser({ role: 'Admin' });
    const token = makeAccessToken(user._id.toString(), user.email, 'Admin');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return success: true in the response body', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.success).toBe(true);
  });

  it('should return data.userId matching the userId in the JWT payload', async () => {
    const user = await seedUser();
    const userId = user._id.toString();
    const token = makeAccessToken(userId, user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.userId).toBe(userId);
  });

  it('should return data.email matching the email in the JWT payload', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.email).toBe(user.email);
  });

  it('should return data.role as "User" when the token carries role "User"', async () => {
    const user = await seedUser({ role: 'User' });
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.role).toBe('User');
  });

  it('should return data.role as "Admin" when the token carries role "Admin"', async () => {
    const user = await seedUser({ role: 'Admin' });
    const token = makeAccessToken(user._id.toString(), user.email, 'Admin');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.role).toBe('Admin');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 2 — Response Contract
// ══════════════════════════════════════════════════════════════════════════

describe('GET /api/auth/me — Response Contract', () => {
  it('response body should contain a "data" key', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body).toHaveProperty('data');
  });

  it('response body "data" should contain exactly the keys: userId, email, role', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    const dataKeys = Object.keys(res.body.data).sort();
    expect(dataKeys).toEqual(['email', 'role', 'userId']);
  });

  it('response body should not contain passwordHash', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('response body should not contain isActive', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(JSON.stringify(res.body)).not.toContain('isActive');
  });

  it('response body should not contain lastLoginAt', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(JSON.stringify(res.body)).not.toContain('lastLoginAt');
  });

  it('response body should not contain __v or _id (raw Mongo fields)', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('"__v"');
    expect(bodyStr).not.toContain('"_id"');
  });

  it('response body should not contain iat or exp (JWT internals)', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('"iat"');
    expect(bodyStr).not.toContain('"exp"');
  });

  it('response body should not contain "message" key on success (only success + data)', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('data');
    expect(res.body).not.toHaveProperty('message');
  });

  it('response data should have exactly 3 keys', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(Object.keys(res.body.data).length).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 3 — 401 Missing Token
// ══════════════════════════════════════════════════════════════════════════

describe('GET /api/auth/me — 401 Missing Token', () => {
  it('should return 401 when Authorization header is absent', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('should return message "Missing authorization token" when header is absent', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.body.message).toBe('Missing authorization token');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 4 — 401 Malformed Header
// ══════════════════════════════════════════════════════════════════════════

describe('GET /api/auth/me — 401 Malformed Header', () => {
  it('should return 401 with "Invalid authorization header" when scheme is "Token" instead of "Bearer"', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid authorization header');
  });

  it('should return 401 with "Invalid authorization header" when header is "Bearer" with no token part', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid authorization header');
  });

  it('should return 401 when Authorization header has more than two space-separated parts', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token} extra`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid authorization header');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 5 — 401 Invalid / Tampered Token
// ══════════════════════════════════════════════════════════════════════════

describe('GET /api/auth/me — 401 Invalid Token', () => {
  it('should return 401 with "Invalid token signature" when token is signed with the wrong secret', async () => {
    const user = await seedUser();
    const token = makeTokenWithWrongSecret(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token signature');
  });

  it('should return 401 with "Invalid token signature" when token is a random non-JWT string', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer notajwt');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token signature');
  });

  it('should return 401 when token has only header.payload (missing signature segment)', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');
    const parts = token.split('.');
    const invalidToken = `${parts[0]}.${parts[1]}`;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${invalidToken}`);

    expect(res.status).toBe(401);
  });

  it('should return 401 with "Invalid token signature" when the signature segment is tampered', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');
    const parts = token.split('.');
    const tamperedToken = `${parts[0]}.${parts[1]}.tamperedsignature`;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tamperedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token signature');
  });

  it('should return 401 when a refresh token is used as the Bearer token', async () => {
    const user = await seedUser();
    const refreshToken = makeRefreshToken(user._id.toString(), user.email);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${refreshToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token signature');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 6 — 401 Expired Token
// ══════════════════════════════════════════════════════════════════════════

describe('GET /api/auth/me — 401 Expired Token', () => {
  it('should return 401 when the access token is expired', async () => {
    const user = await seedUser();
    const token = makeExpiredAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  it('should return message "Token expired" when the access token is expired', async () => {
    const user = await seedUser();
    const token = makeExpiredAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.message).toBe('Token expired');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 7 — No Database Round-trip
// ══════════════════════════════════════════════════════════════════════════

describe('GET /api/auth/me — No Database Round-trip', () => {
  it('should return 200 even when the user record has been deleted from DB (JWT-only path)', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    await User.deleteMany({});

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('should return the userId/email/role from the token, not from a DB refetch', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), 'changed@example.com', 'Admin');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.email).toBe('changed@example.com');
    expect(res.body.data.role).toBe('Admin');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 8 — Ignored Request Extras
// ══════════════════════════════════════════════════════════════════════════

describe('GET /api/auth/me — Ignored Request Extras', () => {
  it('should return 200 and ignore any query string parameters sent alongside a valid token', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me?foo=bar&baz=qux')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 200 and ignore any request body sent alongside a valid token', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ someField: 'someValue' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// DESCRIBE BLOCK 9 — Security Invariants
// ══════════════════════════════════════════════════════════════════════════

describe('GET /api/auth/me — Security Invariants', () => {
  it('response body should never expose the raw token string received in the request', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(JSON.stringify(res.body)).not.toContain(token);
  });

  it('401 error response should not expose a stack trace', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.body.stack).toBeUndefined();
  });

  it('response body success: false on 401, not true', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.body.success).not.toBe(true);
  });
});
