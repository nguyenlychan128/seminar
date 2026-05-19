'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const WorkoutPlan = require('../../src/models/WorkoutPlan');
const Exercise = require('../../src/models/Exercise');
const userServiceClient = require('../../src/config/userServiceClient');

jest.mock('../../src/config/userServiceClient');

let mongoServer;

const TEST_JWT_SECRET = 'test-secret-for-plan-api-tests-32chars-minimum';

const USER_A = { userId: 'user-plan-001', email: 'usera@test.com', role: 'user' };
const USER_B = { userId: 'user-plan-002', email: 'userb@test.com', role: 'user' };

const VALID_PROFILE = {
  userId: 'user-plan-001',
  weight: 50,
  height: 170,
  bmi: 17.3,
  gender: 'male',
};

const SEVERE_BMI_PROFILE = {
  userId: 'user-plan-001',
  weight: 43,
  height: 170,
  bmi: 14.9,
  gender: 'male',
};

const FEMALE_PROFILE = {
  userId: 'user-plan-001',
  weight: 45,
  height: 160,
  bmi: 17.6,
  gender: 'female',
};

function makeExercise(overrides = {}) {
  return {
    name: `Exercise ${Date.now()}-${Math.random()}`,
    muscleGroup: 'chest',
    equipment: 'barbell',
    difficulty: 'beginner',
    instructions: 'Standard instructions for test exercise.',
    isActive: true,
    ...overrides,
  };
}

async function seedFullExerciseLibrary() {
  const muscleGroups = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
  const docs = [];
  for (const group of muscleGroups) {
    for (let i = 1; i <= 5; i++) {
      docs.push(
        makeExercise({
          name: `${group} Exercise ${i}`,
          muscleGroup: group,
        })
      );
    }
  }
  return Exercise.insertMany(docs);
}

async function seedActivePlan(userId, startDate = new Date()) {
  const durationWeeks = 4;
  const weeks = [];

  for (let weekNum = 1; weekNum <= durationWeeks; weekNum++) {
    const days = [];
    for (let dayNum = 1; dayNum <= 7; dayNum++) {
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + (weekNum - 1) * 7 + (dayNum - 1));

      const isRestDay = [2, 4, 6, 7].includes(dayNum);
      const dayLabel = isRestDay
        ? 'Rest Day'
        : dayNum === 1
          ? 'Day A — Push'
          : dayNum === 3
            ? 'Day B — Pull'
            : 'Day C — Legs';

      const exercises = isRestDay ? [] : [
        {
          exerciseId: new mongoose.Types.ObjectId(),
          name: `Sample Exercise ${dayNum}`,
          muscleGroup: 'chest',
          sets: 3,
          reps: '8-12',
          restSeconds: 90,
          order: 1,
        },
      ];

      days.push({
        dayNumber: dayNum,
        dayLabel,
        scheduledDate,
        isRestDay,
        exercises,
      });
    }

    weeks.push({
      weekNumber: weekNum,
      days,
    });
  }

  const plan = new WorkoutPlan({
    userId,
    name: 'Test Beginner Plan',
    startDate,
    endDate: new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000),
    durationWeeks: 4,
    daysPerWeek: 3,
    status: 'active',
    weeks,
    generatedFrom: {
      weight: 50,
      height: 170,
      bmi: 17.3,
      gender: 'male',
    },
  });

  await plan.save();
  return plan;
}

function makeToken(payload) {
  return jwt.sign(payload, TEST_JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  process.env.JWT_SECRET = TEST_JWT_SECRET;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Exercise.deleteMany({});
  await WorkoutPlan.deleteMany({});
  jest.clearAllMocks();
});

describe('GET /plans/my', () => {
  it('P-01: should return 404 when user has no active plan', async () => {
    const tokenA = makeToken(USER_A);

    const res = await request(app)
      .get('/api/workouts/plans/my')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('P-02: should return 200 with full plan including 4 weeks and 7 days each', async () => {
    const tokenA = makeToken(USER_A);
    await seedActivePlan(USER_A.userId);

    const res = await request(app)
      .get('/api/workouts/plans/my')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      planId: expect.any(String),
      userId: USER_A.userId,
      name: expect.any(String),
      status: 'active',
      durationWeeks: 4,
      daysPerWeek: 3,
      startDate: expect.any(String),
      endDate: expect.any(String),
      weeks: expect.any(Array),
      createdAt: expect.any(String),
    });
    expect(res.body.weeks).toHaveLength(4);
    res.body.weeks.forEach((week) => {
      expect(week.days).toHaveLength(7);
    });
  });

  it('P-03: should return 401 when Authorization header is missing', async () => {
    const res = await request(app)
      .get('/api/workouts/plans/my');

    expect(res.status).toBe(401);
  });

  it('P-04: should return 401 when token is expired', async () => {
    const expiredToken = jwt.sign(USER_A, TEST_JWT_SECRET, { expiresIn: '-1s' });

    const res = await request(app)
      .get('/api/workouts/plans/my')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });

  it('P-05: should return 404 for USER_B when only USER_A has a plan', async () => {
    const tokenB = makeToken(USER_B);
    await seedActivePlan(USER_A.userId);

    const res = await request(app)
      .get('/api/workouts/plans/my')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });

  it('P-06: should return planId (not _id) in response body', async () => {
    const tokenA = makeToken(USER_A);
    await seedActivePlan(USER_A.userId);

    const res = await request(app)
      .get('/api/workouts/plans/my')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.planId).toBeDefined();
    expect(res.body._id).toBeUndefined();
  });
});

describe('POST /plans/generate', () => {
  it('P-07: should return 201 and plan summary when profile exists and no active plan', async () => {
    const tokenA = makeToken(USER_A);
    await seedFullExerciseLibrary();
    userServiceClient.getUserProfile.mockResolvedValueOnce(VALID_PROFILE);

    const res = await request(app)
      .post('/api/workouts/plans/generate')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      planId: expect.any(String),
      name: expect.any(String),
      durationWeeks: 4,
      daysPerWeek: 3,
      startDate: expect.any(String),
      endDate: expect.any(String),
      status: 'active',
    });
  });

  it('P-08: should persist the new plan to MongoDB after generate', async () => {
    const tokenA = makeToken(USER_A);
    await seedFullExerciseLibrary();
    userServiceClient.getUserProfile.mockResolvedValueOnce(VALID_PROFILE);

    const res = await request(app)
      .post('/api/workouts/plans/generate')
      .set('Authorization', `Bearer ${tokenA}`);

    const planInDB = await WorkoutPlan.findById(res.body.planId);
    expect(planInDB).not.toBeNull();
    expect(planInDB.userId).toBe(USER_A.userId);
    expect(planInDB.status).toBe('active');
    expect(planInDB.weeks).toHaveLength(4);
  });

  it('P-09: should call getUserProfile with the Authorization token from the request header', async () => {
    const tokenA = makeToken(USER_A);
    await seedFullExerciseLibrary();
    userServiceClient.getUserProfile.mockResolvedValueOnce(VALID_PROFILE);

    await request(app)
      .post('/api/workouts/plans/generate')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(userServiceClient.getUserProfile).toHaveBeenCalledTimes(1);
    expect(userServiceClient.getUserProfile).toHaveBeenCalledWith(tokenA);
  });

  it('P-10: should return 409 when user already has an active plan (BR-01)', async () => {
    const tokenA = makeToken(USER_A);
    await seedFullExerciseLibrary();
    await seedActivePlan(USER_A.userId);
    userServiceClient.getUserProfile.mockResolvedValueOnce(VALID_PROFILE);

    const res = await request(app)
      .post('/api/workouts/plans/generate')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/active/i);
  });

  it('P-11: should return 400 when user-service returns 404 (no profile) (BR-02)', async () => {
    const tokenA = makeToken(USER_A);
    userServiceClient.getUserProfile.mockRejectedValueOnce(new Error('User profile not found'));

    const res = await request(app)
      .post('/api/workouts/plans/generate')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/profile/i);
  });

  it('P-12: should return 500 when exercise library has fewer than 5 exercises per muscle group', async () => {
    const tokenA = makeToken(USER_A);
    await Exercise.create(makeExercise({ name: 'Chest Ex 1', muscleGroup: 'chest' }));
    await Exercise.create(makeExercise({ name: 'Chest Ex 2', muscleGroup: 'chest' }));
    userServiceClient.getUserProfile.mockResolvedValueOnce(VALID_PROFILE);

    const res = await request(app)
      .post('/api/workouts/plans/generate')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(500);
  });

  it('P-13: should return 401 when Authorization header is missing on generate', async () => {
    const res = await request(app)
      .post('/api/workouts/plans/generate');

    expect(res.status).toBe(401);
    expect(userServiceClient.getUserProfile).not.toHaveBeenCalled();
  });

  it('P-14: should ignore userId in request body and use userId from JWT', async () => {
    const tokenA = makeToken(USER_A);
    await seedFullExerciseLibrary();
    userServiceClient.getUserProfile.mockResolvedValueOnce(VALID_PROFILE);

    await request(app)
      .post('/api/workouts/plans/generate')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ userId: 'injected-malicious-id' });

    const plan = await WorkoutPlan.findOne({ userId: USER_A.userId });
    expect(plan).not.toBeNull();

    const maliciousPlan = await WorkoutPlan.findOne({ userId: 'injected-malicious-id' });
    expect(maliciousPlan).toBeNull();
  });

  it('P-15: GET /plans/my after generate should return 200 with 4 weeks × 7 days each', async () => {
    const tokenA = makeToken(USER_A);
    await seedFullExerciseLibrary();
    userServiceClient.getUserProfile.mockResolvedValueOnce(VALID_PROFILE);

    await request(app)
      .post('/api/workouts/plans/generate')
      .set('Authorization', `Bearer ${tokenA}`);

    const res = await request(app)
      .get('/api/workouts/plans/my')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.weeks).toHaveLength(4);
    res.body.weeks.forEach((week) => {
      expect(week.days).toHaveLength(7);
    });
  });

  it('P-16: should return 500 when userServiceClient throws a non-404 network error', async () => {
    const tokenA = makeToken(USER_A);
    const networkError = new Error('ECONNREFUSED');
    userServiceClient.getUserProfile.mockRejectedValueOnce(networkError);

    const res = await request(app)
      .post('/api/workouts/plans/generate')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(500);
  });
});

describe('GET /plans/my/week/:weekNumber', () => {
  it('P-17: should return 200 with 7 days for week 1', async () => {
    const tokenA = makeToken(USER_A);
    await seedActivePlan(USER_A.userId);

    const res = await request(app)
      .get('/api/workouts/plans/my/week/1')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toMatchObject({
      planId: expect.any(String),
      weekNumber: 1,
      days: expect.any(Array),
    });
    expect(res.body.days).toHaveLength(7);
  });

  it('P-18: should return 200 for week 4 (max boundary)', async () => {
    const tokenA = makeToken(USER_A);
    await seedActivePlan(USER_A.userId);

    const res = await request(app)
      .get('/api/workouts/plans/my/week/4')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.weekNumber).toBe(4);
  });

  it('P-19: should return 400 for weekNumber = 0 (below minimum)', async () => {
    const tokenA = makeToken(USER_A);
    await seedActivePlan(USER_A.userId);

    const res = await request(app)
      .get('/api/workouts/plans/my/week/0')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('P-20: should return 400 for weekNumber = 5 (exceeds durationWeeks)', async () => {
    const tokenA = makeToken(USER_A);
    await seedActivePlan(USER_A.userId);

    const res = await request(app)
      .get('/api/workouts/plans/my/week/5')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('P-21: should return 400 when weekNumber is a non-numeric string', async () => {
    const tokenA = makeToken(USER_A);
    await seedActivePlan(USER_A.userId);

    const res = await request(app)
      .get('/api/workouts/plans/my/week/abc')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
  });

  it('P-22: should return 404 when user has no plan and requests week detail', async () => {
    const tokenA = makeToken(USER_A);

    const res = await request(app)
      .get('/api/workouts/plans/my/week/1')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('P-23: should include isRestDay and exercises fields on each day in week detail', async () => {
    const tokenA = makeToken(USER_A);
    await seedActivePlan(USER_A.userId);

    const res = await request(app)
      .get('/api/workouts/plans/my/week/1')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    res.body.days.forEach((day) => {
      expect(day).toHaveProperty('dayNumber');
      expect(day).toHaveProperty('dayLabel');
      expect(day).toHaveProperty('scheduledDate');
      expect(day).toHaveProperty('isRestDay');
      expect(day).toHaveProperty('exercises');
      expect(Array.isArray(day.exercises)).toBe(true);
    });
  });

  it('P-24: should return 401 when Authorization header is missing on week detail', async () => {
    const res = await request(app)
      .get('/api/workouts/plans/my/week/1');

    expect(res.status).toBe(401);
  });
});

describe('GET /plans/my/today', () => {
  it('P-25: should return 200 with isRestDay: false and exercises when today is a workout day', async () => {
    const tokenA = makeToken(USER_A);
    await seedActivePlan(USER_A.userId, new Date());

    const res = await request(app)
      .get('/api/workouts/plans/my/today')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      planId: expect.any(String),
      today: expect.any(String),
      dayLabel: expect.any(String),
    });
    expect(res.body.isRestDay).toBe(false);
    expect(res.body.exercises).toBeInstanceOf(Array);
    expect(res.body.exercises.length).toBeGreaterThan(0);
  });

  it('P-26: should return 200 with isRestDay: true and empty exercises array on a rest day', async () => {
    const tokenA = makeToken(USER_A);
    // Set start date to yesterday so today = dayNumber 2 = rest day
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await seedActivePlan(USER_A.userId, yesterday);

    const res = await request(app)
      .get('/api/workouts/plans/my/today')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.isRestDay).toBe(true);
    expect(res.body.exercises).toEqual([]);
    expect(res.body.dayLabel).toMatch(/rest/i);
  });

  it('P-27: should return 200 with isRestDay: true when today is outside the plan cycle', async () => {
    const tokenA = makeToken(USER_A);
    const oldStart = new Date();
    oldStart.setDate(oldStart.getDate() - 30);

    await seedActivePlan(USER_A.userId, oldStart);

    const res = await request(app)
      .get('/api/workouts/plans/my/today')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.isRestDay).toBe(true);
  });

  it('P-28: should return 404 when user has no active plan for today endpoint', async () => {
    const tokenA = makeToken(USER_A);

    const res = await request(app)
      .get('/api/workouts/plans/my/today')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('P-29: should return 401 when Authorization header is missing on today endpoint', async () => {
    const res = await request(app)
      .get('/api/workouts/plans/my/today');

    expect(res.status).toBe(401);
  });

  it('P-30: should return a valid date string in the today field', async () => {
    const tokenA = makeToken(USER_A);
    await seedActivePlan(USER_A.userId, new Date());

    const res = await request(app)
      .get('/api/workouts/plans/my/today')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(() => new Date(res.body.today).toISOString()).not.toThrow();
  });
});
