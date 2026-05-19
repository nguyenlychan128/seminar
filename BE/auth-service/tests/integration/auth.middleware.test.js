'use strict';

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const User = require('../../src/models/User');
const { authenticate } = require('../../src/middleware/authenticate');
const { requireRole } = require('../../src/middleware/authorize');

let mongoServer;
let app;

const TEST_SECRET = 'test-secret-at-least-32-characters-long!!';
const VALID_PASSWORD = 'SecurePass123!';

async function seedUser(overrides = {}) {
  const passwordHash = await bcrypt.hash(VALID_PASSWORD, 5);
  const user = await User.create({
    email: 'alice@example.com',
    passwordHash,
    role: 'User',
    isActive: true,
    ...overrides,
  });
  return user;
}

function makeAccessToken(userId, email, role) {
  return jwt.sign(
    { userId, email, role },
    TEST_SECRET,
    { expiresIn: '15m', algorithm: 'HS256' }
  );
}

function makeExpiredAccessToken(userId, email, role) {
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

function makeTokenWithWrongSecret(userId, email, role) {
  return jwt.sign(
    { userId, email, role },
    'completely-wrong-secret-xxxxxxxxxxxxxx',
    { expiresIn: '15m', algorithm: 'HS256' }
  );
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  process.env.JWT_SECRET = TEST_SECRET;
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';

  // Create test app with protected routes
  app = express();
  app.use(express.json());

  // Public route
  app.get('/protected', authenticate, (req, res) => {
    res.status(200).json({ user: req.user });
  });

  // Admin-only route
  app.get('/admin', authenticate, requireRole(['Admin']), (req, res) => {
    res.status(200).json({ ok: true });
  });

  // User or Admin route
  app.get('/user-or-admin', authenticate, requireRole(['User', 'Admin']), (req, res) => {
    res.status(200).json({ ok: true });
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('authenticate middleware — integration', () => {
  // --- Happy path: authenticated access ---

  it('should return 200 and inject req.user when a valid User access token is sent', async () => {
    const user = await seedUser({ role: 'User' });
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
  });

  it('should return 200 and inject req.user when a valid Admin access token is sent', async () => {
    const user = await seedUser({ role: 'Admin' });
    const token = makeAccessToken(user._id.toString(), user.email, 'Admin');

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
  });

  it('should return req.user.userId matching the token userId', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.user.userId).toBe(user._id.toString());
  });

  it('should return req.user.email matching the token email', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.user.email).toBe(user.email);
  });

  it('should return req.user.role matching the token role', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.user.role).toBe('User');
  });

  // --- 401: No token ---

  it('should return 401 with "Missing authorization token" when Authorization header is absent', async () => {
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Missing authorization token');
  });

  // --- 401: Bad format ---

  it('should return 401 with "Invalid authorization header" when header is "Token <jwt>"', async () => {
    const user = await seedUser();
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Token ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid authorization header');
  });

  it('should return 401 with "Invalid authorization header" when header is "Bearer" (no token part)', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Bearer');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid authorization header');
  });

  // --- 401: Invalid signature ---

  it('should return 401 with "Invalid token signature" when token signed with different secret', async () => {
    const user = await seedUser();
    const token = makeTokenWithWrongSecret(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token signature');
  });

  it('should return 401 with "Invalid token signature" when token is a random string', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer randomstringnotajwt');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token signature');
  });

  // --- 401: Expired ---

  it('should return 401 with "Token expired" when access token is expired', async () => {
    const user = await seedUser();
    const token = makeExpiredAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token expired');
  });

  // --- 401: Refresh token used as Bearer ---

  it('should return 401 when a refresh token is sent as Bearer token', async () => {
    const user = await seedUser();
    const token = makeRefreshToken(user._id.toString(), user.email);

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  // --- RBAC: Admin-only route ---

  it('should return 200 on /admin route when Admin token is provided', async () => {
    const user = await seedUser({ role: 'Admin' });
    const token = makeAccessToken(user._id.toString(), user.email, 'Admin');

    const res = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('should return 403 with "Forbidden" on /admin route when User token is provided', async () => {
    const user = await seedUser({ role: 'User' });
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden');
  });

  it('should return 401 on /admin route when no token is provided', async () => {
    const res = await request(app).get('/admin');

    expect(res.status).toBe(401);
  });

  // --- RBAC: User-or-Admin route ---

  it('should return 200 on /user-or-admin route when User token is provided', async () => {
    const user = await seedUser({ role: 'User' });
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/user-or-admin')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('should return 200 on /user-or-admin route when Admin token is provided', async () => {
    const user = await seedUser({ role: 'Admin' });
    const token = makeAccessToken(user._id.toString(), user.email, 'Admin');

    const res = await request(app)
      .get('/user-or-admin')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  // --- RBAC: chaining order ---

  it('should return 401 (not 403) on an RBAC-protected route when Authorization header is missing', async () => {
    const res = await request(app).get('/admin');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Missing authorization token');
  });

  it('should return 401 (not 403) on an RBAC-protected route when token is expired', async () => {
    const user = await seedUser();
    const token = makeExpiredAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token expired');
  });

  it('should not reject a valid token for any user (middleware does not re-query DB)', async () => {
    const user = await seedUser({ role: 'User' });
    const token = makeAccessToken(user._id.toString(), user.email, 'User');

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
