'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-secret-for-session-api-tests-32chars-min';
process.env.NODE_ENV = 'test';

const app = require('../../../src/app');
const WorkoutSession = require('../../../src/models/WorkoutSession');

let mongoServer;

const TEST_JWT_SECRET = process.env.JWT_SECRET;
const USER_A = { userId: 'user-session-001', email: 'usera@test.com', role: 'user' };
const USER_B = { userId: 'user-session-002', email: 'userb@test.com', role: 'user' };
const VALID_PLAN_ID = new mongoose.Types.ObjectId().toString();
const VALID_EXERCISE_ID = new mongoose.Types.ObjectId().toString();
const VALID_EXERCISE_SQUAT = new mongoose.Types.ObjectId().toString();
const VALID_EXERCISE_2 = new mongoose.Types.ObjectId().toString();

function makeToken(payload = USER_A) {
  return jwt.sign(payload, TEST_JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

function makeValidSet(overrides = {}) {
  return {
    setNumber: 1,
    actualReps: 10,
    weight: 60,
    ...overrides,
  };
}

function makeValidExercise(overrides = {}) {
  return {
    exerciseId: VALID_EXERCISE_ID,
    name: 'Bench Press',
    muscleGroup: 'chest',
    status: 'completed',
    plannedSets: 3,
    plannedReps: '8-10',
    sets: [makeValidSet()],
    ...overrides,
  };
}

function makeValidBody(overrides = {}) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return {
    planId: VALID_PLAN_ID,
    weekNumber: 1,
    dayNumber: 1,
    sessionDate: yesterday.toISOString().split('T')[0],
    exercises: [makeValidExercise()],
    ...overrides,
  };
}

// ── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await WorkoutSession.deleteMany({});
});

// ── 201 Created ───────────────────────────────────────────────────────────────

describe('POST /api/workouts/sessions — 201 Created', () => {
  test('should create session and return 201 with all fields', async () => {
    const token = makeToken();
    const body = makeValidBody();

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.sessionId).toBeDefined();
    expect(res.body.data.userId).toBe(USER_A.userId);
    expect(res.body.data.planId).toBe(body.planId);
    expect(res.body.data.weekNumber).toBe(body.weekNumber);
    expect(res.body.data.dayNumber).toBe(body.dayNumber);
    expect(res.body.data.sessionDate).toBe(body.sessionDate);
    expect(res.body.data.exercises).toHaveLength(1);
    expect(res.body.data.completedAt).toBeDefined();
    expect(res.body.data.createdAt).toBeDefined();
  });

  test('should store userId from JWT not request body', async () => {
    const token = makeToken(USER_A);
    const body = makeValidBody();
    // Attempt to inject different userId in body (should be ignored)
    body.userId = 'attacker-id';

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.data.userId).toBe(USER_A.userId);
    expect(res.body.data.userId).not.toBe('attacker-id');
  });

  test('should return exercise with denormalized name and muscleGroup', async () => {
    const token = makeToken();
    const body = makeValidBody({
      exercises: [makeValidExercise({ name: 'Squat', muscleGroup: 'legs', exerciseId: VALID_EXERCISE_SQUAT })],
    });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.data.exercises[0].name).toBe('Squat');
    expect(res.body.data.exercises[0].muscleGroup).toBe('legs');
  });

  test('should accept session with optional totalDuration, mood, notes', async () => {
    const token = makeToken();
    const body = makeValidBody({ totalDuration: 45, mood: 'great', notes: 'Great session!' });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.data.totalDuration).toBe(45);
    expect(res.body.data.mood).toBe('great');
    expect(res.body.data.notes).toBe('Great session!');
  });

  test('should accept session with skipped exercise (no sets)', async () => {
    const token = makeToken();
    const body = makeValidBody({
      exercises: [makeValidExercise({ status: 'skipped', sets: [] })],
    });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.data.exercises[0].status).toBe('skipped');
  });

  test('should accept set with rpe field', async () => {
    const token = makeToken();
    const body = makeValidBody({
      exercises: [makeValidExercise({ sets: [makeValidSet({ rpe: 8 })] })],
    });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.data.exercises[0].sets[0].rpe).toBe(8);
  });

  test('should accept multiple exercises', async () => {
    const token = makeToken();
    const body = makeValidBody({
      exercises: [
        makeValidExercise({ exerciseId: VALID_EXERCISE_ID, name: 'Bench Press', muscleGroup: 'chest' }),
        makeValidExercise({
          exerciseId: VALID_EXERCISE_2,
          name: 'Squat',
          muscleGroup: 'legs',
          sets: [makeValidSet({ setNumber: 1 })],
        }),
      ],
    });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.data.exercises).toHaveLength(2);
  });

  test('should accept weight = 0 (bodyweight exercise)', async () => {
    const token = makeToken();
    const body = makeValidBody({
      exercises: [makeValidExercise({ sets: [makeValidSet({ weight: 0 })] })],
    });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.data.exercises[0].sets[0].weight).toBe(0);
  });

  test('should accept actualReps = 0 (failed set)', async () => {
    const token = makeToken();
    const body = makeValidBody({
      exercises: [makeValidExercise({ sets: [makeValidSet({ actualReps: 0 })] })],
    });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.data.exercises[0].sets[0].actualReps).toBe(0);
  });

  test('different users can log same plan/week/day/date', async () => {
    const tokenA = makeToken(USER_A);
    const tokenB = makeToken(USER_B);
    const body = makeValidBody();

    const resA = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(body);

    const resB = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${tokenB}`)
      .send(body);

    expect(resA.status).toBe(201);
    expect(resB.status).toBe(201);
  });
});

// ── 400 Bad Request ───────────────────────────────────────────────────────────

describe('POST /api/workouts/sessions — 400 Bad Request', () => {
  test('should return 400 when planId is missing', async () => {
    const token = makeToken();
    const body = makeValidBody();
    delete body.planId;

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/planId/);
  });

  test('should return 400 when weekNumber is missing', async () => {
    const token = makeToken();
    const body = makeValidBody();
    delete body.weekNumber;

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 when dayNumber is out of range', async () => {
    const token = makeToken();
    const body = makeValidBody({ dayNumber: 8 });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 when sessionDate is in the future', async () => {
    const token = makeToken();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const body = makeValidBody({ sessionDate: tomorrow.toISOString().split('T')[0] });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/future/i);
  });

  test('should return 400 when exercises array is empty', async () => {
    const token = makeToken();
    const body = makeValidBody({ exercises: [] });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 when completed exercise has no sets', async () => {
    const token = makeToken();
    const body = makeValidBody({
      exercises: [makeValidExercise({ status: 'completed', sets: [] })],
    });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 when actualReps > 100', async () => {
    const token = makeToken();
    const body = makeValidBody({
      exercises: [makeValidExercise({ sets: [makeValidSet({ actualReps: 101 })] })],
    });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 when weight > 500', async () => {
    const token = makeToken();
    const body = makeValidBody({
      exercises: [makeValidExercise({ sets: [makeValidSet({ weight: 501 })] })],
    });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 when invalid muscleGroup', async () => {
    const token = makeToken();
    const body = makeValidBody({
      exercises: [makeValidExercise({ muscleGroup: 'glutes' })],
    });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for invalid mood', async () => {
    const token = makeToken();
    const body = makeValidBody({ mood: 'ecstatic' });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 when notes exceed 500 chars', async () => {
    const token = makeToken();
    const body = makeValidBody({ notes: 'a'.repeat(501) });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for invalid JSON body', async () => {
    const token = makeToken();

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');

    expect(res.status).toBe(400);
  });

  test('should return 400 when rpe > 10', async () => {
    const token = makeToken();
    const body = makeValidBody({
      exercises: [makeValidExercise({ sets: [makeValidSet({ rpe: 11 })] })],
    });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 for negative totalDuration', async () => {
    const token = makeToken();
    const body = makeValidBody({ totalDuration: -5 });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('error response should match spec: { success: false, message: string }', async () => {
    const token = makeToken();
    const body = makeValidBody({ exercises: [] });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message');
    expect(typeof res.body.message).toBe('string');
  });
});

// ── 401 Unauthorized ─────────────────────────────────────────────────────────

describe('POST /api/workouts/sessions — 401 Unauthorized', () => {
  test('should return 401 when no Authorization header', async () => {
    const body = makeValidBody();

    const res = await request(app)
      .post('/api/workouts/sessions')
      .send(body);

    expect(res.status).toBe(401);
  });

  test('should return 401 when token is expired', async () => {
    const expiredToken = jwt.sign(USER_A, TEST_JWT_SECRET, { expiresIn: '-1s' });
    const body = makeValidBody();

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send(body);

    expect(res.status).toBe(401);
  });

  test('should return 401 when token has wrong signature', async () => {
    const badToken = jwt.sign(USER_A, 'wrong-secret-key-that-is-definitely-wrong');
    const body = makeValidBody();

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${badToken}`)
      .send(body);

    expect(res.status).toBe(401);
  });

  test('should return 401 when Authorization header is malformed', async () => {
    const body = makeValidBody();

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', 'NotBearer sometoken')
      .send(body);

    expect(res.status).toBe(401);
  });

  test('should return 401 when token is empty string after Bearer', async () => {
    const body = makeValidBody();

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', 'Bearer ')
      .send(body);

    expect(res.status).toBe(401);
  });
});

// ── 409 Conflict ──────────────────────────────────────────────────────────────

describe('POST /api/workouts/sessions — 409 Duplicate', () => {
  test('should return 409 on duplicate session', async () => {
    const token = makeToken();
    const body = makeValidBody();

    await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/[Dd]uplicate/);
  });

  test('409 response should match spec: { success: false, message }', async () => {
    const token = makeToken();
    const body = makeValidBody();

    await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message');
  });

  test('same user can log different weeks without conflict', async () => {
    const token = makeToken();
    const body1 = makeValidBody({ weekNumber: 1 });
    const body2 = makeValidBody({ weekNumber: 2 });

    const res1 = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body1);

    const res2 = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body2);

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
  });
});

// ── Response schema shape ─────────────────────────────────────────────────────

describe('POST /api/workouts/sessions — Response schema', () => {
  test('success response data shape matches spec', async () => {
    const token = makeToken();
    const body = makeValidBody();

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data).toHaveProperty('sessionId');
    expect(data).toHaveProperty('userId');
    expect(data).toHaveProperty('planId');
    expect(data).toHaveProperty('weekNumber');
    expect(data).toHaveProperty('dayNumber');
    expect(data).toHaveProperty('sessionDate');
    expect(data).toHaveProperty('exercises');
    expect(data).toHaveProperty('completedAt');
    expect(data).toHaveProperty('createdAt');
    expect(data).toHaveProperty('updatedAt');
  });

  test('exercise shape in response matches spec', async () => {
    const token = makeToken();
    const body = makeValidBody();

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    const ex = res.body.data.exercises[0];
    expect(ex).toHaveProperty('exerciseId');
    expect(ex).toHaveProperty('name');
    expect(ex).toHaveProperty('muscleGroup');
    expect(ex).toHaveProperty('status');
    expect(ex).toHaveProperty('sets');
  });

  test('set shape in response matches spec', async () => {
    const token = makeToken();
    const body = makeValidBody();

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    const set = res.body.data.exercises[0].sets[0];
    expect(set).toHaveProperty('setNumber');
    expect(set).toHaveProperty('actualReps');
    expect(set).toHaveProperty('weight');
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('POST /api/workouts/sessions — Edge cases', () => {
  test('should reject planId that is not a valid ObjectId', async () => {
    const token = makeToken();
    const body = makeValidBody({ planId: 'plan-abc-123-xyz' });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('should accept weekNumber = 1', async () => {
    const token = makeToken();
    const body = makeValidBody({ weekNumber: 1 });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
  });

  test('should accept large weekNumber (e.g. 52)', async () => {
    const token = makeToken();
    const body = makeValidBody({ weekNumber: 52 });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
  });

  test('should accept totalDuration = 0', async () => {
    const token = makeToken();
    const body = makeValidBody({ totalDuration: 0 });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.data.totalDuration).toBe(0);
  });

  test('should accept totalDuration = 300 (max)', async () => {
    const token = makeToken();
    const body = makeValidBody({ totalDuration: 300 });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
  });

  test('should handle empty string notes (set to empty)', async () => {
    const token = makeToken();
    const body = makeValidBody({ notes: '' });

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
  });

  test('content-type should be application/json', async () => {
    const token = makeToken();
    const body = makeValidBody();

    const res = await request(app)
      .post('/api/workouts/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
