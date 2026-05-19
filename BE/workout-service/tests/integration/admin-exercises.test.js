'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const app = require('../../src/app');
const Exercise = require('../../src/models/Exercise');

const TEST_SECRET = 'test-secret-at-least-32-characters-long!!';

let mongoServer;

// ---------------------------------------------------------------------------
// Token factory helpers
// ---------------------------------------------------------------------------
function makeAdminToken(userId = 'admin-001', email = 'admin@test.com') {
  return jwt.sign(
    { userId, email, role: 'Admin' },
    TEST_SECRET,
    { expiresIn: '15m', algorithm: 'HS256' }
  );
}

function makeUserToken(userId = 'user-001', email = 'user@test.com') {
  return jwt.sign(
    { userId, email, role: 'User' },
    TEST_SECRET,
    { expiresIn: '15m', algorithm: 'HS256' }
  );
}

function makeExpiredToken() {
  return jwt.sign(
    { userId: 'admin-001', email: 'admin@test.com', role: 'Admin' },
    TEST_SECRET,
    { expiresIn: '-1s', algorithm: 'HS256' }
  );
}

function makeWrongSecretToken() {
  return jwt.sign(
    { userId: 'admin-001', email: 'admin@test.com', role: 'Admin' },
    'completely-wrong-secret-xxxxxxxxxxxxxx',
    { expiresIn: '15m', algorithm: 'HS256' }
  );
}

// ---------------------------------------------------------------------------
// Fixture: base valid exercise
// ---------------------------------------------------------------------------
const BASE_EXERCISE = {
  name: 'Bench Press',
  description: 'Flat bench chest press',
  muscleGroup: 'chest',
  sets: 4,
  reps: '8-10',
  restTime: 90,
  equipment: 'barbell',
  difficulty: 'beginner',
  instructions: 'Lie flat on bench and press barbell upward in controlled motion.',
};

function makeExercise(overrides = {}) {
  return { ...BASE_EXERCISE, ...overrides };
}

async function seedExercise(overrides = {}) {
  return Exercise.create(makeExercise(overrides));
}

async function seedDeletedExercise(overrides = {}) {
  return Exercise.create(
    makeExercise({ ...overrides, isDeleted: true, deletedAt: new Date() })
  );
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  process.env.JWT_SECRET = TEST_SECRET;
  process.env.JWT_EXPIRES_IN = '15m';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Exercise.deleteMany({});
});

// ===========================================================================
// GET /api/admin/exercises
// ===========================================================================
describe('Admin Exercises API', () => {
  describe('GET /api/admin/exercises', () => {

    // --- Happy path ---

    it('EX-G-01: should return 200 with data array and pagination object', async () => {
      await seedExercise({ name: 'Bench Press' });
      await seedExercise({ name: 'Squat', muscleGroup: 'legs' });

      const res = await request(app)
        .get('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
      });
    });

    it('EX-G-02: should return correct exercise object shape per spec', async () => {
      await seedExercise();

      const res = await request(app)
        .get('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      const ex = res.body.data[0];
      expect(ex).toHaveProperty('_id');
      expect(ex).toHaveProperty('name');
      expect(ex).toHaveProperty('muscleGroup');
      expect(ex).toHaveProperty('sets');
      expect(ex).toHaveProperty('reps');
      expect(ex).toHaveProperty('restTime');
      expect(ex).toHaveProperty('isDeleted', false);
      expect(ex).toHaveProperty('createdAt');
    });

    it('EX-G-03: should exclude soft-deleted exercises by default', async () => {
      await seedExercise({ name: 'Active Exercise' });
      await seedDeletedExercise({ name: 'Deleted Exercise' });

      const res = await request(app)
        .get('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Active Exercise');
      expect(res.body.pagination.total).toBe(1);
    });

    it('EX-G-04: should filter by search on name (partial, case-insensitive)', async () => {
      await seedExercise({ name: 'Bench Press', description: 'Upper chest exercise' });
      await seedExercise({ name: 'Incline Bench Press', muscleGroup: 'shoulders', description: 'Upper chest exercise' });
      await seedExercise({ name: 'Squat', muscleGroup: 'legs', description: 'Full leg workout' });

      const res = await request(app)
        .get('/api/admin/exercises?search=bench')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every((ex) =>
        ex.name.toLowerCase().includes('bench')
      )).toBe(true);
    });

    it('EX-G-05: should filter by search on description (partial, case-insensitive)', async () => {
      await seedExercise({ name: 'Bench Press', description: 'Classic chest exercise' });
      await seedExercise({ name: 'Squat', description: 'Full leg workout' });

      const res = await request(app)
        .get('/api/admin/exercises?search=CHEST')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Bench Press');
    });

    it('EX-G-06: should filter by muscleGroup (exact match)', async () => {
      await seedExercise({ name: 'Bench Press', muscleGroup: 'chest' });
      await seedExercise({ name: 'Squat', muscleGroup: 'legs' });
      await seedExercise({ name: 'Deadlift', muscleGroup: 'back' });

      const res = await request(app)
        .get('/api/admin/exercises?muscleGroup=chest')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].muscleGroup).toBe('chest');
    });

    it('EX-G-07: should combine search and muscleGroup filters', async () => {
      await seedExercise({ name: 'Bench Press', muscleGroup: 'chest', description: 'press move' });
      await seedExercise({ name: 'Incline Press', muscleGroup: 'shoulders', description: 'press move' });
      await seedExercise({ name: 'Squat', muscleGroup: 'legs' });

      const res = await request(app)
        .get('/api/admin/exercises?search=press&muscleGroup=chest')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Bench Press');
    });

    it('EX-G-08: should return exercises sorted alphabetically by name (A-Z)', async () => {
      await seedExercise({ name: 'Squat', muscleGroup: 'legs' });
      await seedExercise({ name: 'Bench Press' });
      await seedExercise({ name: 'Arnold Press', muscleGroup: 'shoulders' });

      const res = await request(app)
        .get('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      const names = res.body.data.map((ex) => ex.name);
      expect(names).toEqual(['Arnold Press', 'Bench Press', 'Squat']);
    });

    it('EX-G-09: should paginate correctly (page=2)', async () => {
      const names = Array.from({ length: 12 }, (_, i) => `Exercise ${String(i + 1).padStart(2, '0')}`);
      for (const name of names) {
        await seedExercise({ name });
      }

      const res = await request(app)
        .get('/api/admin/exercises?page=2')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toMatchObject({
        page: 2,
        limit: 10,
        total: 12,
        pages: 2,
      });
    });

    it('EX-G-10: should default to page=1 when page query param is absent', async () => {
      await seedExercise();

      const res = await request(app)
        .get('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
    });

    it('EX-G-11: should return empty data array with total=0 when no exercises match search', async () => {
      await seedExercise({ name: 'Bench Press' });

      const res = await request(app)
        .get('/api/admin/exercises?search=nonexistentterm')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });

    // --- Auth failures ---

    it('EX-G-12: should return 401 when Authorization header is absent', async () => {
      const res = await request(app).get('/api/admin/exercises');

      expect(res.status).toBe(401);
    });

    it('EX-G-13: should return 401 when token is expired', async () => {
      const res = await request(app)
        .get('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeExpiredToken()}`);

      expect(res.status).toBe(401);
    });

    it('EX-G-14: should return 401 when token has wrong signature', async () => {
      const res = await request(app)
        .get('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeWrongSecretToken()}`);

      expect(res.status).toBe(401);
    });

    it('EX-G-15: should return 403 when token role is User (non-admin)', async () => {
      const res = await request(app)
        .get('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeUserToken()}`);

      expect(res.status).toBe(403);
    });

    it('EX-G-16: should ignore negative page numbers and default to page 1', async () => {
      await seedExercise({ name: 'Exercise 1' });

      const res = await request(app)
        .get('/api/admin/exercises?page=-5')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
    });
  });

  // ===========================================================================
  // POST /api/admin/exercises
  // ===========================================================================
  describe('POST /api/admin/exercises', () => {

    // --- Happy path ---

    it('EX-P-01: should create exercise and return 201 with correct shape', async () => {
      const payload = {
        name: 'Bench Press',
        description: 'Classic chest exercise',
        muscleGroup: 'chest',
        sets: 4,
        reps: '8-10',
        restTime: 90,
      };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Exercise created');
      expect(res.body).toHaveProperty('exercise');
      expect(res.body.exercise).toMatchObject({
        name: 'Bench Press',
        muscleGroup: 'chest',
        sets: 4,
        reps: '8-10',
        restTime: 90,
        isDeleted: false,
      });
      expect(res.body.exercise).toHaveProperty('_id');
      expect(res.body.exercise).toHaveProperty('createdAt');
    });

    it('EX-P-02: should persist created exercise in database', async () => {
      const payload = {
        name: 'Deadlift',
        muscleGroup: 'back',
        sets: 3,
        reps: '5-5',
        restTime: 180,
      };

      await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload)
        .expect(201);

      const inDb = await Exercise.findOne({ name: 'Deadlift' });
      expect(inDb).not.toBeNull();
      expect(inDb.isDeleted).toBe(false);
    });

    it('EX-P-03: should accept optional difficulty field', async () => {
      const payload = {
        name: 'Romanian Deadlift',
        muscleGroup: 'legs',
        sets: 4,
        reps: '10-12',
        restTime: 90,
        difficulty: 'intermediate',
      };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.exercise.difficulty).toBe('intermediate');
    });

    // --- Missing required field (400) ---

    it('EX-P-04: should return 400 when name is missing', async () => {
      const payload = { muscleGroup: 'chest', sets: 4, reps: '8-10', restTime: 90 };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('EX-P-05: should return 400 when muscleGroup is missing', async () => {
      const payload = { name: 'Bench Press', sets: 4, reps: '8-10', restTime: 90 };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('EX-P-06: should return 400 when sets is missing', async () => {
      const payload = { name: 'Bench Press', muscleGroup: 'chest', reps: '8-10', restTime: 90 };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('EX-P-07: should return 400 when reps is missing', async () => {
      const payload = { name: 'Bench Press', muscleGroup: 'chest', sets: 4, restTime: 90 };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('EX-P-08: should return 400 when restTime is missing', async () => {
      const payload = { name: 'Bench Press', muscleGroup: 'chest', sets: 4, reps: '8-10' };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    // --- Field validation failures (400) ---

    it('EX-P-09: should return 400 when name exceeds 100 characters', async () => {
      const payload = {
        name: 'A'.repeat(101),
        muscleGroup: 'chest',
        sets: 4,
        reps: '8-10',
        restTime: 90,
      };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('EX-P-10: should return 400 when name is empty string', async () => {
      const payload = { name: '', muscleGroup: 'chest', sets: 4, reps: '8-10', restTime: 90 };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('EX-P-11: should return 400 when muscleGroup is not a valid enum value', async () => {
      const payload = {
        name: 'Bench Press',
        muscleGroup: 'invalid_group',
        sets: 4,
        reps: '8-10',
        restTime: 90,
      };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('EX-P-12: should return 400 when sets is 0 (below minimum)', async () => {
      const payload = { name: 'Bench Press', muscleGroup: 'chest', sets: 0, reps: '8-10', restTime: 90 };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('EX-P-13: should return 400 when sets is 11 (above maximum)', async () => {
      const payload = { name: 'Bench Press', muscleGroup: 'chest', sets: 11, reps: '8-10', restTime: 90 };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('EX-P-14: should return 400 when reps is a single number without dash ("8")', async () => {
      const payload = { name: 'Bench Press', muscleGroup: 'chest', sets: 4, reps: '8', restTime: 90 };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('EX-P-15: should return 400 when reps contains non-numeric characters ("abc-def")', async () => {
      const payload = {
        name: 'Bench Press',
        muscleGroup: 'chest',
        sets: 4,
        reps: 'abc-def',
        restTime: 90,
      };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('EX-P-16: should return 400 when restTime is 29 (below minimum 30)', async () => {
      const payload = { name: 'Bench Press', muscleGroup: 'chest', sets: 4, reps: '8-10', restTime: 29 };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('EX-P-17: should return 400 when restTime is 301 (above maximum 300)', async () => {
      const payload = { name: 'Bench Press', muscleGroup: 'chest', sets: 4, reps: '8-10', restTime: 301 };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('EX-P-18: should return 400 when restTime is a non-numeric string', async () => {
      const payload = {
        name: 'Bench Press',
        muscleGroup: 'chest',
        sets: 4,
        reps: '8-10',
        restTime: 'ninety',
      };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    // --- Conflict (409) ---

    it('EX-P-19: should return 409 when exercise name already exists (exact case)', async () => {
      await seedExercise({ name: 'Bench Press' });

      const payload = {
        name: 'Bench Press',
        muscleGroup: 'chest',
        sets: 3,
        reps: '6-8',
        restTime: 120,
      };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(409);
    });

    it('EX-P-20: should return 409 when exercise name duplicates existing (case-insensitive)', async () => {
      await seedExercise({ name: 'Bench Press' });

      const payload = {
        name: 'bench press',
        muscleGroup: 'chest',
        sets: 3,
        reps: '6-8',
        restTime: 120,
      };

      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send(payload);

      expect(res.status).toBe(409);
    });

    // --- Auth failures ---

    it('EX-P-21: should return 401 when no token provided', async () => {
      const res = await request(app)
        .post('/api/admin/exercises')
        .send({ name: 'Bench Press', muscleGroup: 'chest', sets: 4, reps: '8-10', restTime: 90 });

      expect(res.status).toBe(401);
    });

    it('EX-P-22: should return 403 when token role is User', async () => {
      const res = await request(app)
        .post('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeUserToken()}`)
        .send({ name: 'Bench Press', muscleGroup: 'chest', sets: 4, reps: '8-10', restTime: 90 });

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // PATCH /api/admin/exercises/:exerciseId
  // ===========================================================================
  describe('PATCH /api/admin/exercises/:exerciseId', () => {

    // --- Happy path ---

    it('EX-U-01: should return 200 when updating a single field (name)', async () => {
      const ex = await seedExercise({ name: 'Old Name' });

      const res = await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Exercise updated');
      expect(res.body).toHaveProperty('exercise');
      expect(res.body.exercise.name).toBe('New Name');
    });

    it('EX-U-02: should return 200 when updating multiple fields simultaneously', async () => {
      const ex = await seedExercise();

      const res = await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ sets: 3, reps: '6-8', restTime: 120 });

      expect(res.status).toBe(200);
      expect(res.body.exercise).toMatchObject({ sets: 3, reps: '6-8', restTime: 120 });
    });

    it('EX-U-03: should not modify fields absent from update body', async () => {
      const ex = await seedExercise({ name: 'Bench Press', muscleGroup: 'chest' });

      await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ sets: 5 })
        .expect(200);

      const updated = await Exercise.findById(ex._id);
      expect(updated.name).toBe('Bench Press');
      expect(updated.muscleGroup).toBe('chest');
      expect(updated.sets).toBe(5);
    });

    it('EX-U-04: should persist updated fields in database', async () => {
      const ex = await seedExercise({ name: 'Original Name' });

      await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      const inDb = await Exercise.findById(ex._id);
      expect(inDb.name).toBe('Updated Name');
    });

    it('EX-U-05: should return 200 when updating name to the same value (no false conflict)', async () => {
      const ex = await seedExercise({ name: 'Bench Press' });

      const res = await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ name: 'Bench Press' });

      expect(res.status).toBe(200);
    });

    // --- Validation failures (400) ---

    it('EX-U-06: should return 400 when updated sets is 0', async () => {
      const ex = await seedExercise();

      const res = await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ sets: 0 });

      expect(res.status).toBe(400);
    });

    it('EX-U-07: should return 400 when updated sets is 11', async () => {
      const ex = await seedExercise();

      const res = await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ sets: 11 });

      expect(res.status).toBe(400);
    });

    it('EX-U-08: should return 400 when updated reps is invalid format ("10" without dash)', async () => {
      const ex = await seedExercise();

      const res = await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ reps: '10' });

      expect(res.status).toBe(400);
    });

    it('EX-U-09: should return 400 when updated muscleGroup is invalid enum', async () => {
      const ex = await seedExercise();

      const res = await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ muscleGroup: 'glutes' });

      expect(res.status).toBe(400);
    });

    it('EX-U-10: should return 400 when updated restTime is below 30', async () => {
      const ex = await seedExercise();

      const res = await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ restTime: 20 });

      expect(res.status).toBe(400);
    });

    it('EX-U-11: should return 400 when updated name is empty string', async () => {
      const ex = await seedExercise();

      const res = await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    // --- Not found (404) ---

    it('EX-U-12: should return 404 when exerciseId does not exist in database', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/admin/exercises/${nonExistentId}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ sets: 3 });

      expect(res.status).toBe(404);
    });

    // --- Conflict (409) ---

    it('EX-U-13: should return 409 when updated name conflicts with another exercise (exact case)', async () => {
      await seedExercise({ name: 'Squat', muscleGroup: 'legs' });
      const ex = await seedExercise({ name: 'Bench Press' });

      const res = await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ name: 'Squat' });

      expect(res.status).toBe(409);
    });

    it('EX-U-14: should return 409 when updated name conflicts case-insensitively', async () => {
      await seedExercise({ name: 'Squat', muscleGroup: 'legs' });
      const ex = await seedExercise({ name: 'Bench Press' });

      const res = await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ name: 'SQUAT' });

      expect(res.status).toBe(409);
    });

    // --- Auth failures ---

    it('EX-U-15: should return 401 when no token provided', async () => {
      const ex = await seedExercise();

      const res = await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .send({ sets: 3 });

      expect(res.status).toBe(401);
    });

    it('EX-U-16: should return 403 when token role is User', async () => {
      const ex = await seedExercise();

      const res = await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeUserToken()}`)
        .send({ sets: 3 });

      expect(res.status).toBe(403);
    });

    it('EX-U-17: should return 404 when trying to update a soft-deleted exercise', async () => {
      const ex = await seedDeletedExercise();

      const res = await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ sets: 5 });

      expect(res.status).toBe(404);
    });

    it('EX-U-18: should escape regex characters in name to prevent ReDoS', async () => {
      const ex = await seedExercise({ name: 'Bench Press' });

      const res = await request(app)
        .patch(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .send({ name: 'Test(Bench)+Press' });

      expect(res.status).toBe(200);
      expect(res.body.exercise.name).toBe('Test(Bench)+Press');

      const inDb = await Exercise.findById(ex._id);
      expect(inDb.name).toBe('Test(Bench)+Press');
    });
  });

  // ===========================================================================
  // DELETE /api/admin/exercises/:exerciseId
  // ===========================================================================
  describe('DELETE /api/admin/exercises/:exerciseId', () => {

    // --- Happy path ---

    it('EX-D-01: should soft-delete exercise and return 200 with isDeleted: true', async () => {
      const ex = await seedExercise();

      const res = await request(app)
        .delete(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Exercise deleted');
      expect(res.body).toHaveProperty('exercise');
      expect(res.body.exercise).toMatchObject({ isDeleted: true });
      expect(res.body.exercise._id).toBe(ex._id.toString());
    });

    it('EX-D-02: should set isDeleted=true and deletedAt in database after soft delete', async () => {
      const ex = await seedExercise();

      await request(app)
        .delete(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .expect(200);

      const inDb = await Exercise.findById(ex._id);
      expect(inDb.isDeleted).toBe(true);
      expect(inDb.deletedAt).toBeInstanceOf(Date);
    });

    it('EX-D-03: should exclude soft-deleted exercise from subsequent GET list', async () => {
      const ex = await seedExercise({ name: 'To Be Deleted' });
      await seedExercise({ name: 'Remains Active', muscleGroup: 'legs' });

      await request(app)
        .delete(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`)
        .expect(200);

      const listRes = await request(app)
        .get('/api/admin/exercises')
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(listRes.body.data).toHaveLength(1);
      expect(listRes.body.data[0].name).toBe('Remains Active');
    });

    it('EX-D-04: should be idempotent — already-deleted exercise returns 200 OK (not 404)', async () => {
      const ex = await seedDeletedExercise({ name: 'Already Deleted' });

      const res = await request(app)
        .delete(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.exercise.isDeleted).toBe(true);
    });

    // --- Not found (404) ---

    it('EX-D-05: should return 404 when exerciseId does not exist in database', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .delete(`/api/admin/exercises/${nonExistentId}`)
        .set('Authorization', `Bearer ${makeAdminToken()}`);

      expect(res.status).toBe(404);
    });

    // --- Auth failures ---

    it('EX-D-06: should return 401 when no token provided', async () => {
      const ex = await seedExercise();

      const res = await request(app)
        .delete(`/api/admin/exercises/${ex._id}`);

      expect(res.status).toBe(401);
    });

    it('EX-D-07: should return 403 when token role is User', async () => {
      const ex = await seedExercise();

      const res = await request(app)
        .delete(`/api/admin/exercises/${ex._id}`)
        .set('Authorization', `Bearer ${makeUserToken()}`);

      expect(res.status).toBe(403);
    });
  });
});
