'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const app = require('../../src/app');
const User = require('../../src/models/User');
const rateLimit = require('../../src/middleware/rateLimit');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long!!';
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

describe('Auth Service E2E — Full Lifecycle Flow', () => {
  it('should complete the full auth lifecycle: register → login → me → refresh → logout', async () => {
    const registerPayload = {
      email: 'alice@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    };

    // 1. Register
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(registerPayload);
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.data.email).toBe('alice@example.com');
    expect(registerRes.body.data.userId).toBeDefined();

    // 2. Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: registerPayload.email,
        password: registerPayload.password,
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data).toHaveProperty('accessToken');
    expect(loginRes.body.data).toHaveProperty('refreshToken');
    const { accessToken, refreshToken } = loginRes.body.data;
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');
    expect(accessToken).not.toEqual(refreshToken);

    // 3. Get me (with login access token)
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.email).toBe('alice@example.com');

    // 4. Refresh token
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data).toHaveProperty('accessToken');
    expect(refreshRes.body.data).toHaveProperty('refreshToken');
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshRes.body.data;
    expect(typeof newAccessToken).toBe('string');
    expect(typeof newRefreshToken).toBe('string');
    // Tokens should be refreshed (not necessarily different due to same iat)
    // The important thing is that refresh succeeded

    // 5. Get me (with refreshed access token)
    const meRes2 = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${newAccessToken}`);
    expect(meRes2.status).toBe(200);
    expect(meRes2.body.success).toBe(true);
    expect(meRes2.body.data.email).toBe('alice@example.com');

    // 6. Logout (with original login token)
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
  });

  it('should register and login with valid credentials', async () => {
    const payload = {
      email: 'bob@example.com',
      password: 'ValidPass123!',
      confirmPassword: 'ValidPass123!',
    };

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(payload);
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.data.email).toBe('bob@example.com');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: payload.email,
        password: payload.password,
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data).toHaveProperty('accessToken');
  });
});

describe('Auth Service E2E — Registration → Login Dependency', () => {
  it('should reject login for an email that was never registered', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'never-registered@example.com',
        password: 'SomePass123!',
      });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('should reject login with wrong password after registration', async () => {
    // Register
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'carol@example.com',
        password: 'CorrectPass123!',
        confirmPassword: 'CorrectPass123!',
      });

    // Login with wrong password
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'carol@example.com',
        password: 'WrongPass123!',
      });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('should reject duplicate email registration with 409', async () => {
    // First registration
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'dave@example.com',
        password: 'Pass123!',
        confirmPassword: 'Pass123!',
      });
    expect(res1.status).toBe(201);

    // Duplicate registration
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'dave@example.com',
        password: 'Pass123!',
        confirmPassword: 'Pass123!',
      });
    expect(res2.status).toBe(409);
    expect(res2.body.success).toBe(false);
    expect(res2.body.message).toMatch(/email.*already/i);
  });
});

describe('Auth Service E2E — Token Chain Validation', () => {
  it('access token from login should be accepted by GET /api/auth/me', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'eve@example.com',
        password: 'Pass123!',
        confirmPassword: 'Pass123!',
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'eve@example.com',
        password: 'Pass123!',
      });
    const { accessToken } = loginRes.body.data;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('eve@example.com');
  });

  it('refresh token from login should be accepted by POST /api/auth/refresh', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'frank@example.com',
        password: 'Pass123!',
        confirmPassword: 'Pass123!',
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'frank@example.com',
        password: 'Pass123!',
      });
    const { refreshToken } = loginRes.body.data;

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data).toHaveProperty('accessToken');
    expect(refreshRes.body.data).toHaveProperty('refreshToken');
  });

  it('new access token from refresh endpoint should be accepted by GET /api/auth/me', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'grace@example.com',
        password: 'Pass123!',
        confirmPassword: 'Pass123!',
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'grace@example.com',
        password: 'Pass123!',
      });
    const { refreshToken } = loginRes.body.data;

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    const { accessToken: newAccessToken } = refreshRes.body.data;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${newAccessToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('grace@example.com');
  });

  it('refresh token should be rejected by GET /api/auth/me with 401', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'hank@example.com',
        password: 'Pass123!',
        confirmPassword: 'Pass123!',
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'hank@example.com',
        password: 'Pass123!',
      });
    const { refreshToken } = loginRes.body.data;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${refreshToken}`);
    expect(meRes.status).toBe(401);
    expect(meRes.body.message).toBeDefined();
  });

  it('refresh token should be rejected by POST /api/auth/logout with 401', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'iris@example.com',
        password: 'Pass123!',
        confirmPassword: 'Pass123!',
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'iris@example.com',
        password: 'Pass123!',
      });
    const { refreshToken } = loginRes.body.data;

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${refreshToken}`);
    expect(logoutRes.status).toBe(401);
    expect(logoutRes.body.message).toBeDefined();
  });

  it('access token should be rejected by POST /api/auth/refresh with 401 Invalid token type', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'jack@example.com',
        password: 'Pass123!',
        confirmPassword: 'Pass123!',
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jack@example.com',
        password: 'Pass123!',
      });
    const { accessToken } = loginRes.body.data;

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: accessToken });
    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body.success).toBe(false);
    expect(refreshRes.body.message).toMatch(/invalid token type/i);
  });

  it('expired refresh token should be rejected by POST /api/auth/refresh with 401', async () => {
    const expiredToken = jwt.sign(
      { userId: '507f1f77bcf86cd799439011', type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: expiredToken });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/refresh token expired|token expired/i);
  });
});

describe('Auth Service E2E — Unauthenticated Request Rejection', () => {
  it('GET /api/auth/me without Authorization header should return 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing|authorization|token/i);
  });

  it('POST /api/auth/logout without Authorization header should return 401', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/missing|authorization|token/i);
  });

  it('expired access token should be rejected by GET /api/auth/me with "Token expired"', async () => {
    const expiredToken = jwt.sign(
      { userId: '507f1f77bcf86cd799439011', type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/token expired|expired/i);
  });

  it('expired access token should be rejected by POST /api/auth/logout with "Token expired"', async () => {
    const expiredToken = jwt.sign(
      { userId: '507f1f77bcf86cd799439011', type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/token expired|expired/i);
  });
});

describe('Auth Service E2E — Infrastructure', () => {
  it('GET /health should return 200 with correct shape', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('auth-service');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('unknown routes should return 404 with success: false', async () => {
    const res = await request(app).get('/api/auth/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('all responses should have Content-Type: application/json', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'content-test@example.com',
        password: 'Pass123!',
        confirmPassword: 'Pass123!',
      });
    expect(registerRes.headers['content-type']).toMatch(/application\/json/);

    const badRegisterRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'missing-password@example.com',
      });
    expect(badRegisterRes.headers['content-type']).toMatch(/application\/json/);

    const healthRes = await request(app).get('/health');
    expect(healthRes.headers['content-type']).toMatch(/application\/json/);
  });
});
