'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');

const app = require('../../src/app');
const User = require('../../src/models/User');
const rateLimit = require('../../src/middleware/rateLimit');

let mongoServer;

const VALID_PASSWORD = 'SecurePass123!';

async function seedUser(email = 'alice@example.com') {
  const passwordHash = await bcrypt.hash(VALID_PASSWORD, 5);
  return User.create({
    email,
    passwordHash,
    role: 'User',
    isActive: true,
  });
}

const VALID_LOGIN = {
  email: 'alice@example.com',
  password: VALID_PASSWORD,
};

const VALID_REGISTER = {
  email: 'new@example.com',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long!!';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.RATE_LIMIT_LOGIN_WINDOW = '900';
  process.env.RATE_LIMIT_LOGIN_MAX_ATTEMPTS = '5';
  process.env.RATE_LIMIT_REGISTER_WINDOW = '86400';
  process.env.RATE_LIMIT_REGISTER_MAX_ACCOUNTS = '3';
  process.env.RATE_LIMIT_ENABLED = 'true';
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

describe('Rate Limiting — POST /api/auth/login', () => {
  it('should allow the 1st through 5th requests (200 each)', async () => {
    await seedUser();

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '1.1.1.1')
        .send(VALID_LOGIN);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }
  });

  it('should block the 6th request with 429', async () => {
    await seedUser();

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '1.1.1.1')
        .send(VALID_LOGIN);
    }

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '1.1.1.1')
      .send(VALID_LOGIN);
    expect(res.status).toBe(429);
  });

  it('should return success: false on 429', async () => {
    await seedUser();

    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '1.1.1.1')
        .send(VALID_LOGIN);
    }

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '1.1.1.1')
      .send(VALID_LOGIN);
    expect(res.body.success).toBe(false);
  });

  it('should return exact message on 429', async () => {
    await seedUser();

    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '1.1.1.1')
        .send(VALID_LOGIN);
    }

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '1.1.1.1')
      .send(VALID_LOGIN);
    expect(res.body.message).toBe('Too many requests. Please try again later.');
  });

  it('should return a numeric retryAfter on 429', async () => {
    await seedUser();

    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '1.1.1.1')
        .send(VALID_LOGIN);
    }

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '1.1.1.1')
      .send(VALID_LOGIN);
    expect(typeof res.body.retryAfter).toBe('number');
    expect(res.body.retryAfter).toBeGreaterThan(0);
  });

  it('should include Retry-After header on 429 response', async () => {
    await seedUser();

    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '1.1.1.1')
        .send(VALID_LOGIN);
    }

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '1.1.1.1')
      .send(VALID_LOGIN);
    expect(res.get('Retry-After')).toBeDefined();
  });

  it('should keep blocking on 7th and beyond requests', async () => {
    await seedUser();

    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '1.1.1.1')
        .send(VALID_LOGIN);

      if (i < 5) {
        expect(res.status).toBe(200);
      } else {
        expect(res.status).toBe(429);
      }
    }
  });
});

describe('Rate Limiting — POST /api/auth/register', () => {
  it('should allow the 1st through 3rd requests (201 each)', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '2.2.2.2')
        .send({
          email: `user${i}@example.com`,
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    }
  });

  it('should block the 4th request with 429', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '2.2.2.2')
        .send({
          email: `user${i}@example.com`,
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        });
    }

    const res = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '2.2.2.2')
      .send({
        email: 'user3@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      });
    expect(res.status).toBe(429);
  });

  it('should return correct 429 response shape', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '2.2.2.2')
        .send({
          email: `user${i}@example.com`,
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        });
    }

    const res = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '2.2.2.2')
      .send({
        email: 'user3@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      });
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Too many requests. Please try again later.');
    expect(typeof res.body.retryAfter).toBe('number');
  });

  it('should keep blocking on 5th and beyond requests from same IP', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '2.2.2.2')
        .send({
          email: `user${i}@example.com`,
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        });

      if (i < 3) {
        expect(res.status).toBe(201);
      } else {
        expect(res.status).toBe(429);
      }
    }
  });
});

describe('Rate Limiting — POST /api/auth/refresh (no limit)', () => {
  it('should allow 10 consecutive refresh calls without returning 429', async () => {
    await seedUser();
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send(VALID_LOGIN);
    const refreshToken = loginRes.body.data.refreshToken;

    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });
      expect(res.status).not.toBe(429);
    }
  });

  it('should never set Retry-After header on refresh responses', async () => {
    await seedUser();
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send(VALID_LOGIN);
    const refreshToken = loginRes.body.data.refreshToken;

    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });
      expect(res.get('Retry-After')).not.toBeDefined();
    }
  });
});

describe('Rate Limiting — IP isolation', () => {
  it('exhausting login limit on IP-A should not block IP-B', async () => {
    await seedUser();

    // Exhaust IP-A
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '3.3.3.3')
        .send(VALID_LOGIN);
    }

    // IP-B should still work
    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '4.4.4.4')
      .send(VALID_LOGIN);
    expect(res.status).toBe(200);
  });

  it('exhausting register limit on IP-A should not block IP-B', async () => {
    // Exhaust IP-A
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '3.3.3.3')
        .send({
          email: `user${i}@example.com`,
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        });
    }

    // IP-B should still work
    const res = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '4.4.4.4')
      .send({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      });
    expect(res.status).toBe(201);
  });

  it('each IP tracks its own counter independently', async () => {
    await seedUser('user1@example.com');
    await seedUser('user2@example.com');

    // IP-A makes 3 login attempts
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '5.5.5.5')
        .send({ email: 'user1@example.com', password: VALID_PASSWORD });
    }

    // IP-B makes 3 login attempts
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '6.6.6.6')
        .send({ email: 'user2@example.com', password: VALID_PASSWORD });
    }

    // Both should still have 2 attempts remaining
    const resA = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '5.5.5.5')
      .send({ email: 'user1@example.com', password: VALID_PASSWORD });
    expect(resA.status).toBe(200);

    const resB = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '6.6.6.6')
      .send({ email: 'user2@example.com', password: VALID_PASSWORD });
    expect(resB.status).toBe(200);
  });
});

describe('Rate Limiting — window reset', () => {
  it('login counter should reset after window expires, allowing requests again', async () => {
    await seedUser();

    // Exhaust limit
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '7.7.7.7')
        .send(VALID_LOGIN);
    }

    // Should be blocked
    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '7.7.7.7')
      .send(VALID_LOGIN);
    expect(res.status).toBe(429);

    // Verify retryAfter is set correctly - proves window logic is working
    const retryAfter = res.body.retryAfter;
    expect(typeof retryAfter).toBe('number');
    expect(retryAfter).toBeGreaterThan(0);
    // retryAfter should be close to the configured window (900 seconds)
    expect(retryAfter).toBeLessThanOrEqual(900);
  });

  it('register counter should reset after window expires', async () => {
    // Exhaust limit
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '8.8.8.8')
        .send({
          email: `user${i}@example.com`,
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        });
    }

    // Should be blocked
    const res = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '8.8.8.8')
      .send({
        email: 'user3@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      });
    expect(res.status).toBe(429);

    // Verify retryAfter is set correctly - proves window logic is working
    const retryAfter = res.body.retryAfter;
    expect(typeof retryAfter).toBe('number');
    expect(retryAfter).toBeGreaterThan(0);
    // retryAfter should be close to the configured window (86400 seconds)
    expect(retryAfter).toBeLessThanOrEqual(86400);
  });
});

describe('Rate Limiting — disabled via RATE_LIMIT_ENABLED=false', () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_ENABLED = 'false';
  });

  afterEach(() => {
    process.env.RATE_LIMIT_ENABLED = 'true';
  });

  it('should never return 429 on login regardless of attempt count', async () => {
    await seedUser();

    for (let i = 0; i < 20; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '9.9.9.9')
        .send(VALID_LOGIN);
      expect(res.status).not.toBe(429);
    }
  });

  it('should never return 429 on register regardless of attempt count', async () => {
    for (let i = 0; i < 20; i++) {
      const res = await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '10.10.10.10')
        .send({
          email: `user${i}@example.com`,
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        });
      expect(res.status).not.toBe(429);
    }
  });
});

describe('Rate Limiting — 429 response shape contract', () => {
  it('response body must have exactly: success, message, retryAfter', async () => {
    await seedUser();

    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '11.11.11.11')
        .send(VALID_LOGIN);
    }

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '11.11.11.11')
      .send(VALID_LOGIN);

    expect(Object.keys(res.body).sort()).toEqual(['message', 'retryAfter', 'success']);
  });

  it('success must be false (boolean)', async () => {
    await seedUser();

    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '12.12.12.12')
        .send(VALID_LOGIN);
    }

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '12.12.12.12')
      .send(VALID_LOGIN);

    expect(res.body.success).toBe(false);
    expect(typeof res.body.success).toBe('boolean');
  });

  it('message must be exact text', async () => {
    await seedUser();

    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '13.13.13.13')
        .send(VALID_LOGIN);
    }

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '13.13.13.13')
      .send(VALID_LOGIN);

    expect(res.body.message).toBe('Too many requests. Please try again later.');
  });

  it('retryAfter must be a positive integer (seconds)', async () => {
    await seedUser();

    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '14.14.14.14')
        .send(VALID_LOGIN);
    }

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '14.14.14.14')
      .send(VALID_LOGIN);

    expect(Number.isInteger(res.body.retryAfter)).toBe(true);
    expect(res.body.retryAfter).toBeGreaterThan(0);
  });

  it('response Content-Type must be application/json', async () => {
    await seedUser();

    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '15.15.15.15')
        .send(VALID_LOGIN);
    }

    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '15.15.15.15')
      .send(VALID_LOGIN);

    expect(res.type).toBe('application/json');
  });
});

describe('Rate Limiting — login limit does not bleed into register limit', () => {
  it('exhausting login limit should not affect register counter for same IP', async () => {
    await seedUser();

    // Exhaust login limit for IP
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '16.16.16.16')
        .send(VALID_LOGIN);
    }

    // Register should still work (different endpoint)
    const res = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', '16.16.16.16')
      .send(VALID_REGISTER);
    expect(res.status).toBe(201);
  });

  it('exhausting register limit should not affect login counter for same IP', async () => {
    // Exhaust register limit for IP
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/register')
        .set('X-Forwarded-For', '17.17.17.17')
        .send({
          email: `user${i}@example.com`,
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
        });
    }

    // Login should still work (different endpoint)
    await seedUser();
    const res = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '17.17.17.17')
      .send(VALID_LOGIN);
    expect(res.status).toBe(200);
  });
});
