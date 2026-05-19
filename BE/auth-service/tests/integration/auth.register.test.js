const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const User = require('../../src/models/User');
const rateLimit = require('../../src/middleware/rateLimit');

let mongoServer;

const VALID_PAYLOAD = {
  email: 'alice@example.com',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
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

describe('POST /api/auth/register — Happy Path', () => {
  it('should return 201 and correct response shape on valid registration', async () => {
    const res = await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('User registered successfully');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.userId).toBeDefined();
    expect(res.body.data.email).toBe(VALID_PAYLOAD.email);
    expect(res.body.data.role).toBe('User');
  });

  it('should store user in DB with role = "User" by default', async () => {
    await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

    const user = await User.findOne({ email: VALID_PAYLOAD.email });
    expect(user).not.toBeNull();
    expect(user.role).toBe('User');
  });

  it('should store a bcrypt hash, not the plaintext password', async () => {
    await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

    const user = await User.findOne({ email: VALID_PAYLOAD.email });
    expect(user.passwordHash).not.toBe(VALID_PAYLOAD.password);
    expect(user.passwordHash).toMatch(/^\$2[ab]\$\d+\$/);
  });

  it('should verify the stored hash matches the original password', async () => {
    await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

    const user = await User.findOne({ email: VALID_PAYLOAD.email });
    const isMatch = await bcrypt.compare(VALID_PAYLOAD.password, user.passwordHash);
    expect(isMatch).toBe(true);
  });

  it('should not return passwordHash or password in response body', async () => {
    const res = await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('data.userId should be a valid MongoDB ObjectId string', async () => {
    const res = await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

    expect(res.body.data.userId).toMatch(/^[a-f\d]{24}$/i);
  });

  it('should store email in lowercase even if input is mixed case', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_PAYLOAD, email: 'ALICE@Example.COM' });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('alice@example.com');
  });
});

describe('POST /api/auth/register — 400 Validation Errors', () => {
  it('should return 400 when email is missing', async () => {
    const { email, ...body } = VALID_PAYLOAD;
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });

  it('should return 400 when password is missing', async () => {
    const { password, ...body } = VALID_PAYLOAD;
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when confirmPassword is missing', async () => {
    const { confirmPassword, ...body } = VALID_PAYLOAD;
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when request body is empty', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when email format is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_PAYLOAD, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  it('should return 400 when password has no uppercase letter', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_PAYLOAD, password: 'securepass123!', confirmPassword: 'securepass123!' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/password|uppercase/i);
  });

  it('should return 400 when password has no lowercase letter', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_PAYLOAD, password: 'SECUREPASS123!', confirmPassword: 'SECUREPASS123!' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/password|lowercase/i);
  });

  it('should return 400 when password has no digit', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_PAYLOAD, password: 'SecurePass!!!', confirmPassword: 'SecurePass!!!' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when password has no special character', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_PAYLOAD, password: 'SecurePass123', confirmPassword: 'SecurePass123' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when password is shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_PAYLOAD, password: 'Ab1!', confirmPassword: 'Ab1!' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when confirmPassword does not match password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_PAYLOAD, confirmPassword: 'DifferentPass123!' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/match|confirm|password/i);
  });

  it('should return 400 when email field is null', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_PAYLOAD, email: null });

    expect(res.status).toBe(400);
  });

  it('should return 400 when email is empty string', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_PAYLOAD, email: '' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when password is empty string', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_PAYLOAD, password: '', confirmPassword: '' });

    expect(res.status).toBe(400);
  });

  it('should not create a user in DB when validation fails', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_PAYLOAD, email: 'bad-email' });

    const count = await User.countDocuments();
    expect(count).toBe(0);
  });
});

describe('POST /api/auth/register — 409 Conflict', () => {
  it('should return 409 when email already exists', async () => {
    await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

    const res = await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/email|already|registered|exist/i);
  });

  it('should return 409 for duplicate email regardless of case', async () => {
    await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...VALID_PAYLOAD, email: 'ALICE@EXAMPLE.COM' });

    expect(res.status).toBe(409);
  });

  it('should not create a second user document on duplicate email', async () => {
    await request(app).post('/api/auth/register').send(VALID_PAYLOAD);
    await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

    const count = await User.countDocuments({ email: VALID_PAYLOAD.email });
    expect(count).toBe(1);
  });
});

describe('POST /api/auth/register — 500 Server Error', () => {
  it('should return 500 when database save throws an unexpected error', async () => {
    const saveSpy = jest
      .spyOn(User.prototype, 'save')
      .mockRejectedValueOnce(new Error('Unexpected DB error'));

    const res = await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);

    saveSpy.mockRestore();
  });

  it('should not expose internal error stack in production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const saveSpy = jest
      .spyOn(User.prototype, 'save')
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app).post('/api/auth/register').send(VALID_PAYLOAD);

    expect(res.status).toBe(500);
    expect(res.body.stack).toBeUndefined();

    saveSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});
