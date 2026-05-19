'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = require('../../src/app');
const User = require('../../src/models/User');
const rateLimit = require('../../src/middleware/rateLimit');

let mongoServer;

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

const VALID_LOGIN = {
  email: 'alice@example.com',
  password: VALID_PASSWORD,
};

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

describe('POST /api/auth/login — Happy Path', () => {
  it('should return 200 on valid credentials', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    expect(res.status).toBe(200);
  });

  it('should return success: true and message: "Login successful"', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Login successful');
  });

  it('should return data object with all required fields', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    const { data } = res.body;
    expect(data.userId).toBeDefined();
    expect(data.email).toBe(VALID_LOGIN.email);
    expect(data.role).toBe('User');
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
    expect(data.expiresIn).toBe(900);
  });

  it('data.userId should be a valid MongoDB ObjectId string', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    expect(res.body.data.userId).toMatch(/^[a-f\d]{24}$/i);
  });

  it('accessToken should be a verifiable JWT with correct claims', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    const decoded = jwt.verify(res.body.data.accessToken, process.env.JWT_SECRET);
    expect(decoded.userId).toBeDefined();
    expect(decoded.email).toBe(VALID_LOGIN.email);
    expect(decoded.role).toBe('User');
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
  });

  it('accessToken should NOT contain a "type" claim', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    const decoded = jwt.verify(res.body.data.accessToken, process.env.JWT_SECRET);
    expect(decoded.type).toBeUndefined();
  });

  it('accessToken should expire in ~900 seconds', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    const decoded = jwt.verify(res.body.data.accessToken, process.env.JWT_SECRET);
    const ttl = decoded.exp - decoded.iat;
    expect(ttl).toBe(900);
  });

  it('refreshToken should be a verifiable JWT with userId, email, type: "refresh"', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    const decoded = jwt.verify(res.body.data.refreshToken, process.env.JWT_SECRET);
    expect(decoded.userId).toBeDefined();
    expect(decoded.email).toBe(VALID_LOGIN.email);
    expect(decoded.type).toBe('refresh');
  });

  it('refreshToken should NOT contain a "role" claim', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    const decoded = jwt.verify(res.body.data.refreshToken, process.env.JWT_SECRET);
    expect(decoded.role).toBeUndefined();
  });

  it('refreshToken should expire in ~7 days (604800 seconds)', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    const decoded = jwt.verify(res.body.data.refreshToken, process.env.JWT_SECRET);
    const ttl = decoded.exp - decoded.iat;
    expect(ttl).toBe(7 * 24 * 60 * 60);
  });

  it('two consecutive logins should return different tokens', async () => {
    await seedUser();
    const res1 = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    await new Promise((r) => setTimeout(r, 1100));
    const res2 = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    expect(res1.body.data.accessToken).not.toBe(res2.body.data.accessToken);
    expect(res1.body.data.refreshToken).not.toBe(res2.body.data.refreshToken);
  });

  it('should update lastLoginAt in DB on successful login', async () => {
    const before = new Date();
    await seedUser();
    await request(app).post('/api/auth/login').send(VALID_LOGIN);
    const user = await User.findOne({ email: VALID_LOGIN.email });
    expect(user.lastLoginAt).not.toBeNull();
    expect(new Date(user.lastLoginAt).getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('should accept email in uppercase (case-insensitive lookup)', async () => {
    await seedUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ ...VALID_LOGIN, email: 'ALICE@EXAMPLE.COM' });
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('alice@example.com');
  });

  it('response should never contain passwordHash or password', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
    expect(res.body.data.password).toBeUndefined();
  });
});

describe('POST /api/auth/login — 400 Validation Errors', () => {
  it('should return 400 when request body is empty', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });

  it('should return 400 when email field is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: VALID_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when password field is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: VALID_LOGIN.email });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when email is empty string', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: '', password: VALID_PASSWORD });
    expect(res.status).toBe(400);
  });

  it('should return 400 when password is empty string', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: VALID_LOGIN.email, password: '' });
    expect(res.status).toBe(400);
  });

  it('should return 400 when email is null', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: null, password: VALID_PASSWORD });
    expect(res.status).toBe(400);
  });

  it('should return 400 when password is null', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: VALID_LOGIN.email, password: null });
    expect(res.status).toBe(400);
  });

  it('should return 400 when email has invalid format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: VALID_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  it('should return 400 when email is numeric type', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 12345, password: VALID_PASSWORD });
    expect(res.status).toBe(400);
  });

  it('should return 400 when password is an object', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_LOGIN.email, password: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  it('should return 400 when email is whitespace-only', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: '   ', password: VALID_PASSWORD });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login — 401 Errors', () => {
  it('should return 401 when email does not exist in DB', async () => {
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should return 401 when password is wrong', async () => {
    await seedUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ ...VALID_LOGIN, password: 'WrongPass999!' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('error message for wrong email and wrong password should be identical (no info leak)', async () => {
    await seedUser();
    const resWrongEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: VALID_PASSWORD });
    const resWrongPass = await request(app)
      .post('/api/auth/login')
      .send({ ...VALID_LOGIN, password: 'WrongPass999!' });
    expect(resWrongEmail.body.message).toBe(resWrongPass.body.message);
  });

  it('should return 401 when account is inactive (isActive: false)', async () => {
    await seedUser({ isActive: false });
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Account is disabled');
  });

  it('inactive user 401 message should differ from wrong-credentials 401 message', async () => {
    await seedUser({ isActive: false });
    const resInactive = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    expect(resInactive.body.message).toBe('Account is disabled');

    await User.deleteMany({});
    await seedUser({ isActive: true });
    const resWrong = await request(app)
      .post('/api/auth/login')
      .send({ ...VALID_LOGIN, password: 'WrongPass999!' });
    expect(resInactive.body.message).not.toBe(resWrong.body.message);
  });

  it('should not update lastLoginAt on failed login', async () => {
    await seedUser({ lastLoginAt: null });
    await request(app).post('/api/auth/login').send({ ...VALID_LOGIN, password: 'WrongPass!' });
    const user = await User.findOne({ email: VALID_LOGIN.email });
    expect(user.lastLoginAt).toBeNull();
  });

  it('should return 401, not 400, when email looks valid but user not found', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unknown@example.com', password: VALID_PASSWORD });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/login — 500 Server Errors', () => {
  it('should return 500 when User.findOne throws unexpectedly', async () => {
    const spy = jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('DB crash'));
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    spy.mockRestore();
  });

  it('should not expose stack trace in production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const spy = jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('DB crash'));
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    expect(res.status).toBe(500);
    expect(res.body.stack).toBeUndefined();
    spy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});

describe('POST /api/auth/login — Security Invariants', () => {
  it('response body should never expose passwordHash', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('response body should never expose raw password', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    expect(JSON.stringify(res.body)).not.toContain(VALID_PASSWORD);
  });

  it('access token should be signed with HS256 algorithm', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    const header = JSON.parse(
      Buffer.from(res.body.data.accessToken.split('.')[0], 'base64url').toString()
    );
    expect(header.alg).toBe('HS256');
  });

  it('refresh token should be signed with HS256 algorithm', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    const header = JSON.parse(
      Buffer.from(res.body.data.refreshToken.split('.')[0], 'base64url').toString()
    );
    expect(header.alg).toBe('HS256');
  });

  it('NoSQL injection via password field should be rejected with 400', async () => {
    await seedUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_LOGIN.email, password: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  it('access token signed with wrong secret should be rejected by verifyToken', async () => {
    await seedUser();
    const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
    expect(() => {
      jwt.verify(res.body.data.accessToken, 'completely-wrong-secret-here-xxxxx');
    }).toThrow();
  });

  it('should return 400 for very long password (DoS guard)', async () => {
    await seedUser();
    const longPassword = 'A'.repeat(10000);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_LOGIN.email, password: longPassword });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when password exceeds max length (128)', async () => {
    await seedUser();
    const tooLongPassword = 'A'.repeat(129);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_LOGIN.email, password: tooLongPassword });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/too long/i);
  });

  it('should accept password at max length (128 chars)', async () => {
    const maxPassword = 'Abc!Def@Ghi#Jkl$Mno%Pqr^Stu&Vwx*Yzz!Abc?Def@Ghi#Jkl$Mno%Pqr^Stu&Vwx*Yzz!Abc?Def@Ghi#Jkl$Mno%Pqr^Stu&';
    const passwordHash = await bcrypt.hash(maxPassword, 5);
    const user = await User.findOneAndUpdate(
      { email: 'alice@example.com' },
      { passwordHash },
      { upsert: true, new: true }
    );
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: maxPassword });
    expect(res.status).toBe(200);
  });
});
