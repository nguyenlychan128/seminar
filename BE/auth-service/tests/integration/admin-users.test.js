'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = require('../../src/app');
const User = require('../../src/models/User');

const TEST_SECRET = 'test-secret-at-least-32-characters-long!!';
const VALID_PASSWORD = 'SecurePass123!';

let mongoServer;

// Token factory helpers
function makeAdminToken(userId, email) {
  return jwt.sign(
    { userId, email, role: 'Admin' },
    TEST_SECRET,
    { expiresIn: '15m', algorithm: 'HS256' }
  );
}

function makeUserToken(userId, email) {
  return jwt.sign(
    { userId, email, role: 'User' },
    TEST_SECRET,
    { expiresIn: '15m', algorithm: 'HS256' }
  );
}

function makeExpiredAdminToken(userId, email) {
  return jwt.sign(
    { userId, email, role: 'Admin' },
    TEST_SECRET,
    { expiresIn: '-1s', algorithm: 'HS256' }
  );
}

function makeTokenWithWrongSecret(userId, email) {
  return jwt.sign(
    { userId, email, role: 'Admin' },
    'completely-wrong-secret-xxxxxxxxxxxxxx',
    { expiresIn: '15m', algorithm: 'HS256' }
  );
}

// Seed helper
async function seedUser(overrides = {}) {
  const passwordHash = await bcrypt.hash(VALID_PASSWORD, 5);
  return User.create({
    email: 'user@example.com',
    passwordHash,
    role: 'User',
    isActive: true,
    isDeleted: false,
    ...overrides,
  });
}

async function seedAdmin(overrides = {}) {
  return seedUser({
    email: 'admin@example.com',
    role: 'Admin',
    ...overrides,
  });
}

// Lifecycle
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

describe('Admin Users API', () => {
  describe('GET /api/admin/users', () => {
    // --- Happy Path ---

    it('should return 200 with data array and pagination object for admin token', async () => {
      // arrange
      const admin = await seedAdmin();
      await seedUser({ email: 'user1@example.com' });
      await seedUser({ email: 'user2@example.com' });
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      // assert
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
    });

    it('should return only active users by default (status=active)', async () => {
      // arrange
      const admin = await seedAdmin();
      const user1 = await seedUser({ email: 'active1@example.com' });
      const user2 = await seedUser({ email: 'active2@example.com' });
      await seedUser({
        email: 'deleted@example.com',
        isDeleted: true,
        deletedAt: new Date(),
      });
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3); // admin + 2 active users
      expect(res.body.data.every((u) => u.isDeleted === false)).toBe(true);
    });

    it('should return correct response shape per spec for each user object', async () => {
      // arrange
      const admin = await seedAdmin();
      await seedUser({ email: 'alice@example.com' });
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      // assert
      expect(res.status).toBe(200);
      const user = res.body.data[0];
      expect(user).toHaveProperty('_id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('isDeleted');
      expect(user).toHaveProperty('createdAt');
      // Password must NOT be exposed
      expect(user.passwordHash).toBeUndefined();
      expect(user.password).toBeUndefined();
    });

    it('should filter by email case-insensitively with partial match', async () => {
      // arrange
      const admin = await seedAdmin();
      await seedUser({ email: 'alice@example.com' });
      await seedUser({ email: 'bob@example.com' });
      await seedUser({ email: 'charlie@example.com' });
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .get('/api/admin/users?email=ali')
        .set('Authorization', `Bearer ${adminToken}`);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].email).toBe('alice@example.com');
    });

    it('should filter by email case-insensitively (uppercase query)', async () => {
      // arrange
      const admin = await seedAdmin();
      await seedUser({ email: 'alice@example.com' });
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .get('/api/admin/users?email=ALICE')
        .set('Authorization', `Bearer ${adminToken}`);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('should include deleted users when status=all', async () => {
      // arrange
      const admin = await seedAdmin();
      await seedUser({ email: 'active@example.com' });
      await seedUser({
        email: 'deleted@example.com',
        isDeleted: true,
        deletedAt: new Date(),
      });
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .get('/api/admin/users?status=all')
        .set('Authorization', `Bearer ${adminToken}`);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3); // admin + 1 active + 1 deleted
    });

    it('should return correct pagination metadata', async () => {
      // arrange
      const admin = await seedAdmin();
      await seedUser({ email: 'user1@example.com' });
      await seedUser({ email: 'user2@example.com' });
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      // assert
      expect(res.status).toBe(200);
      const { pagination } = res.body;
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(10);
      expect(pagination.total).toBe(3);
      expect(pagination.pages).toBe(1);
    });

    it('should paginate correctly — page=2 returns second page slice', async () => {
      // arrange
      const admin = await seedAdmin();
      // Create 12 users (admin + 11 others)
      for (let i = 0; i < 11; i += 1) {
        await seedUser({ email: `user${i}@example.com` });
      }
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .get('/api/admin/users?page=2')
        .set('Authorization', `Bearer ${adminToken}`);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2); // 12 total, 10 on page 1, 2 on page 2
      expect(res.body.pagination.page).toBe(2);
    });

    it('should sort results by createdAt DESC (newest first)', async () => {
      // arrange
      const admin = await seedAdmin();
      const user1 = await seedUser({ email: 'user1@example.com' });
      await new Promise((resolve) => setTimeout(resolve, 10)); // small delay
      const user2 = await seedUser({ email: 'user2@example.com' });
      await new Promise((resolve) => setTimeout(resolve, 10)); // small delay
      const user3 = await seedUser({ email: 'user3@example.com' });
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      // assert
      expect(res.status).toBe(200);
      // Should be sorted newest first (user3 first)
      const emails = res.body.data.map((u) => u.email);
      expect(emails[0]).toBe('user3@example.com');
    });

    it('should return empty data array when no users match email filter', async () => {
      // arrange
      const admin = await seedAdmin();
      await seedUser({ email: 'user1@example.com' });
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .get('/api/admin/users?email=nobody')
        .set('Authorization', `Bearer ${adminToken}`);

      // assert
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
      expect(res.body.pagination.total).toBe(0);
    });

    // --- Auth & Error Path ---

    it('should return 401 when no Authorization header is provided', async () => {
      // act
      const res = await request(app).get('/api/admin/users');

      // assert
      expect(res.status).toBe(401);
    });

    it('should return 401 when token is expired', async () => {
      // arrange
      const admin = await seedAdmin();
      const expiredToken = makeExpiredAdminToken(
        admin._id.toString(),
        admin.email
      );

      // act
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${expiredToken}`);

      // assert
      expect(res.status).toBe(401);
    });

    it('should return 401 when token has invalid signature', async () => {
      // arrange
      const admin = await seedAdmin();
      const badToken = makeTokenWithWrongSecret(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${badToken}`);

      // assert
      expect(res.status).toBe(401);
    });

    it('should return 403 when token has User role (non-admin)', async () => {
      // arrange
      const user = await seedUser();
      const userToken = makeUserToken(user._id.toString(), user.email);

      // act
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      // assert
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/admin/users/:userId', () => {
    // --- Happy Path ---

    it('should return 200 and deactivate user successfully', async () => {
      // arrange
      const admin = await seedAdmin();
      const targetUser = await seedUser({ email: 'target@example.com' });
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .patch(`/api/admin/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'deactivate' });

      // assert
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User deactivated');
      expect(res.body.user._id).toBe(targetUser._id.toString());
    });

    it('should return response user with isDeleted: true', async () => {
      // arrange
      const admin = await seedAdmin();
      const targetUser = await seedUser();
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .patch(`/api/admin/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'deactivate' });

      // assert
      expect(res.status).toBe(200);
      expect(res.body.user.isDeleted).toBe(true);
    });

    it('should set isDeleted=true AND deletedAt in the database after deactivation', async () => {
      // arrange
      const admin = await seedAdmin();
      const targetUser = await seedUser();
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      await request(app)
        .patch(`/api/admin/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'deactivate' });

      // assert
      const dbUser = await User.findById(targetUser._id);
      expect(dbUser.isDeleted).toBe(true);
      expect(dbUser.deletedAt).toBeInstanceOf(Date);
    });

    it('should no longer return deactivated user in default GET list', async () => {
      // arrange
      const admin = await seedAdmin();
      const user1 = await seedUser({ email: 'user1@example.com' });
      const user2 = await seedUser({ email: 'user2@example.com' });
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      await request(app)
        .patch(`/api/admin/users/${user1._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'deactivate' });

      const listRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      // assert
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(2); // admin + user2 only
      expect(listRes.body.data.every((u) => u._id !== user1._id.toString())).toBe(
        true
      );
    });

    it('should be idempotent — deactivating already-deleted user returns 200 OK', async () => {
      // arrange
      const admin = await seedAdmin();
      const targetUser = await seedUser({
        isDeleted: true,
        deletedAt: new Date(),
      });
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .patch(`/api/admin/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'deactivate' });

      // assert
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User deactivated');
    });

    it('should NOT change deletedAt when idempotent call is made (original timestamp preserved)', async () => {
      // arrange
      const admin = await seedAdmin();
      const originalDeletedAt = new Date('2026-01-01T00:00:00Z');
      const targetUser = await seedUser({
        isDeleted: true,
        deletedAt: originalDeletedAt,
      });
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      await request(app)
        .patch(`/api/admin/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'deactivate' });

      // assert
      const dbUser = await User.findById(targetUser._id);
      expect(dbUser.deletedAt.getTime()).toBe(originalDeletedAt.getTime());
    });

    // --- Error Path ---

    it('should return 400 when action field is missing from body', async () => {
      // arrange
      const admin = await seedAdmin();
      const targetUser = await seedUser();
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .patch(`/api/admin/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      // assert
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/action/i);
    });

    it('should return 400 when action value is not "deactivate"', async () => {
      // arrange
      const admin = await seedAdmin();
      const targetUser = await seedUser();
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .patch(`/api/admin/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'delete' });

      // assert
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Invalid action. Only 'deactivate' is allowed");
    });

    it('should return 400 when action value is "deactivate" with wrong case', async () => {
      // arrange
      const admin = await seedAdmin();
      const targetUser = await seedUser();
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .patch(`/api/admin/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'Deactivate' });

      // assert
      expect(res.status).toBe(400);
    });

    it('should return 400 when admin tries to deactivate their own account', async () => {
      // arrange
      const admin = await seedAdmin();
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .patch(`/api/admin/users/${admin._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'deactivate' });

      // assert
      expect(res.status).toBe(400);
    });

    it('should NOT set isDeleted=true in DB when self-deactivation is blocked', async () => {
      // arrange
      const admin = await seedAdmin();
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      await request(app)
        .patch(`/api/admin/users/${admin._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'deactivate' });

      // assert
      const dbAdmin = await User.findById(admin._id);
      expect(dbAdmin.isDeleted).toBe(false);
    });

    it('should return 404 when userId does not exist in database', async () => {
      // arrange
      const admin = await seedAdmin();
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);
      const fakeId = new mongoose.Types.ObjectId();

      // act
      const res = await request(app)
        .patch(`/api/admin/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'deactivate' });

      // assert
      expect(res.status).toBe(404);
    });

    it('should return 401 when no Authorization header is provided', async () => {
      // arrange
      const targetUser = await seedUser();

      // act
      const res = await request(app)
        .patch(`/api/admin/users/${targetUser._id}`)
        .send({ action: 'deactivate' });

      // assert
      expect(res.status).toBe(401);
    });

    it('should return 401 when token is expired', async () => {
      // arrange
      const admin = await seedAdmin();
      const targetUser = await seedUser();
      const expiredToken = makeExpiredAdminToken(
        admin._id.toString(),
        admin.email
      );

      // act
      const res = await request(app)
        .patch(`/api/admin/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({ action: 'deactivate' });

      // assert
      expect(res.status).toBe(401);
    });

    it('should return 403 when token has User role (non-admin)', async () => {
      // arrange
      const user = await seedUser({ email: 'user1@example.com' });
      const targetUser = await seedUser({ email: 'user2@example.com' });
      const userToken = makeUserToken(user._id.toString(), user.email);

      // act
      const res = await request(app)
        .patch(`/api/admin/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ action: 'deactivate' });

      // assert
      expect(res.status).toBe(403);
    });

    it('should return 400 when userId format is invalid (not ObjectId)', async () => {
      // arrange
      const admin = await seedAdmin();
      const adminToken = makeAdminToken(admin._id.toString(), admin.email);

      // act
      const res = await request(app)
        .patch('/api/admin/users/not-a-valid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'deactivate' });

      // assert
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid|format/i);
    });
  });
});
