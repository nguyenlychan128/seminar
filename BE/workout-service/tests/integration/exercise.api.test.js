'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const app = require('../../src/app');
const Exercise = require('../../src/models/Exercise');
const WorkoutPlan = require('../../src/models/WorkoutPlan');

const TEST_JWT_SECRET = 'test-secret-for-exercise-api-tests-32chars-minimum';
const USER_PAYLOAD = { userId: 'user-001', email: 'user@test.com', role: 'user' };
const ADMIN_PAYLOAD = { userId: 'admin-001', email: 'admin@test.com', role: 'admin' };

let mongoServer;
let userToken;
let adminToken;

const VALID_EXERCISE = {
  name: 'Bench Press',
  muscleGroup: 'chest',
  equipment: 'barbell',
  difficulty: 'beginner',
  description: 'A fundamental chest exercise',
  videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
};

function makeExercise(overrides = {}) {
  return { ...VALID_EXERCISE, ...overrides };
}

async function seedExercise(overrides = {}) {
  return Exercise.create(makeExercise(overrides));
}

async function seedActivePlanWithExercise(exerciseId) {
  return WorkoutPlan.create({
    userId: 'user-plan-001',
    name: 'Test Plan',
    startDate: new Date(),
    endDate: new Date(Date.now() + 28 * 86400000),
    durationWeeks: 4,
    daysPerWeek: 3,
    status: 'active',
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            dayNumber: 1,
            dayLabel: 'Ngày A — Push',
            scheduledDate: new Date(),
            isRestDay: false,
            exercises: [
              {
                exerciseId,
                name: 'Bench Press',
                muscleGroup: 'chest',
                sets: 3,
                reps: '10',
                restSeconds: 90,
                order: 1,
              },
            ],
          },
        ],
      },
    ],
  });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  process.env.JWT_SECRET = TEST_JWT_SECRET;

  userToken = jwt.sign(USER_PAYLOAD, TEST_JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
  adminToken = jwt.sign(ADMIN_PAYLOAD, TEST_JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Exercise.deleteMany({});
  await WorkoutPlan.deleteMany({});
});

describe('GET /exercises', () => {
  it('A-01: should return 200 with exercises array and total when authenticated', async () => {
    const ex1 = await seedExercise({ name: 'Bench Press' });
    const ex2 = await seedExercise({ name: 'Squat', muscleGroup: 'legs' });

    const res = await request(app)
      .get('/exercises')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('exercises');
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.exercises)).toBe(true);
    expect(res.body.total).toBe(2);
    expect(res.body.exercises.length).toBe(2);
  });

  it('A-02: should filter by muscleGroup query param', async () => {
    await seedExercise({ name: 'Bench Press', muscleGroup: 'chest' });
    await seedExercise({ name: 'Squat', muscleGroup: 'legs' });
    await seedExercise({ name: 'Deadlift', muscleGroup: 'back' });

    const res = await request(app)
      .get('/exercises?muscleGroup=chest')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.exercises).toHaveLength(1);
    expect(res.body.exercises[0].muscleGroup).toBe('chest');
    expect(res.body.total).toBe(1);
  });

  it('A-03: should filter by equipment query param', async () => {
    await seedExercise({ name: 'Bench Press', equipment: 'barbell' });
    await seedExercise({ name: 'Dumbbell Press', equipment: 'dumbbell' });

    const res = await request(app)
      .get('/exercises?equipment=barbell')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.exercises).toHaveLength(1);
    expect(res.body.exercises[0].equipment).toBe('barbell');
    expect(res.body.total).toBe(1);
  });

  it('A-04: should filter by difficulty query param', async () => {
    await seedExercise({ name: 'Bench Press', difficulty: 'beginner' });
    await seedExercise({ name: 'Advanced Bench', difficulty: 'advanced' });

    const res = await request(app)
      .get('/exercises?difficulty=beginner')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.exercises).toHaveLength(1);
    expect(res.body.exercises[0].difficulty).toBe('beginner');
    expect(res.body.total).toBe(1);
  });

  it('A-05: should support combined filters (muscleGroup + equipment)', async () => {
    await seedExercise({ name: 'Bench Press', muscleGroup: 'chest', equipment: 'barbell' });
    await seedExercise({ name: 'Dumbbell Press', muscleGroup: 'chest', equipment: 'dumbbell' });
    await seedExercise({ name: 'Squat', muscleGroup: 'legs', equipment: 'barbell' });

    const res = await request(app)
      .get('/exercises?muscleGroup=chest&equipment=barbell')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.exercises).toHaveLength(1);
    expect(res.body.exercises[0].name).toBe('Bench Press');
    expect(res.body.total).toBe(1);
  });

  it('A-06: should return empty array for valid filter with no matching results', async () => {
    await seedExercise({ name: 'Bench Press', muscleGroup: 'chest' });

    const res = await request(app)
      .get('/exercises?muscleGroup=legs')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.exercises).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it('A-07: should exclude exercises where isActive=false', async () => {
    await seedExercise({ name: 'Active Exercise' });
    await seedExercise({ name: 'Soft Deleted', isActive: false });

    const res = await request(app)
      .get('/exercises')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.exercises).toHaveLength(1);
    expect(res.body.exercises[0].name).toBe('Active Exercise');
    expect(res.body.total).toBe(1);
  });

  it('A-08: should return 401 when no Authorization header is present', async () => {
    const res = await request(app).get('/exercises').expect(401);

    expect(res.body.message).toBe('Missing authorization token');
  });
});

describe('GET /exercises/:exerciseId', () => {
  it('B-01: should return 200 with full exercise detail including videoUrl', async () => {
    const exercise = await seedExercise();

    const res = await request(app)
      .get(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('videoUrl');
    expect(res.body.name).toBe('Bench Press');
    expect(typeof res.body.videoUrl).toBe('string');
  });

  it('B-02: should return 404 for a non-existent ObjectId', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/exercises/${fakeId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Exercise not found');
  });

  it('B-03: should return 404 for a soft-deleted exercise', async () => {
    const exercise = await seedExercise({ isActive: false });

    const res = await request(app)
      .get(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Exercise not found');
  });

  it('B-04: should return 400 for a malformed (non-ObjectId) id, not 500', async () => {
    const res = await request(app)
      .get('/exercises/invalid-id')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(400);

    expect(res.body.message).toBe('Invalid exercise ID');
  });

  it('B-05: should return 401 when no token is provided', async () => {
    const res = await request(app).get('/exercises/any-id').expect(401);

    expect(res.body.message).toBe('Missing authorization token');
  });
});

describe('POST /exercises', () => {
  it('C-01: should return 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/exercises')
      .send(makeExercise())
      .expect(401);

    expect(res.body.message).toBe('Missing authorization token');
  });

  it('C-02: should return 403 when role=user token is used', async () => {
    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${userToken}`)
      .send(makeExercise())
      .expect(403);

    expect(res.body.message).toBe('Forbidden');
  });

  it('C-03: should return 201 with created exercise when admin sends valid body', async () => {
    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(makeExercise())
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe('Bench Press');
    expect(res.body.isActive).toBe(true);
  });

  it('C-04: should return 409 when name already exists', async () => {
    await seedExercise({ name: 'Bench Press' });

    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(makeExercise({ name: 'Bench Press' }))
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('C-05: should return 400 when name is missing', async () => {
    const body = makeExercise();
    delete body.name;

    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.some((e) => e.field === 'name')).toBe(true);
  });

  it('C-06: should return 400 when muscleGroup is missing', async () => {
    const body = makeExercise();
    delete body.muscleGroup;

    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body)
      .expect(400);

    expect(res.body.errors.some((e) => e.field === 'muscleGroup')).toBe(true);
  });

  it('C-07: should return 400 when equipment is missing', async () => {
    const body = makeExercise();
    delete body.equipment;

    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body)
      .expect(400);

    expect(res.body.errors.some((e) => e.field === 'equipment')).toBe(true);
  });

  it('C-08: should return 400 when difficulty is missing', async () => {
    const body = makeExercise();
    delete body.difficulty;

    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body)
      .expect(400);

    expect(res.body.errors.some((e) => e.field === 'difficulty')).toBe(true);
  });

  it('C-09: should return 400 when equipment is missing', async () => {
    const body = makeExercise();
    delete body.equipment;

    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body)
      .expect(400);

    expect(res.body.errors.some((e) => e.field === 'equipment')).toBe(true);
  });

  it('C-10: should accept videoUrl as optional field', async () => {
    const body = makeExercise({ videoUrl: 'https://youtube.com/watch?v=test123' });

    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.videoUrl).toBe('https://youtube.com/watch?v=test123');
  });

  it('C-11: should return 400 when muscleGroup is not a valid enum value', async () => {
    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(makeExercise({ muscleGroup: 'invalid' }))
      .expect(400);

    expect(res.body.errors.some((e) => e.field === 'muscleGroup')).toBe(true);
  });

  it('C-12: should return 400 when equipment is not a valid enum value', async () => {
    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(makeExercise({ equipment: 'invalid' }))
      .expect(400);

    expect(res.body.errors.some((e) => e.field === 'equipment')).toBe(true);
  });

  it('C-13: should return 400 when difficulty is not a valid enum value', async () => {
    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(makeExercise({ difficulty: 'invalid' }))
      .expect(400);

    expect(res.body.errors.some((e) => e.field === 'difficulty')).toBe(true);
  });

  it('C-14: should return 400 when videoUrl exceeds 500 chars', async () => {
    const longUrl = 'https://youtube.com/watch?v=' + 'x'.repeat(500);
    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(makeExercise({ videoUrl: longUrl }))
      .expect(400);

    expect(res.body.errors.some((e) => e.field === 'videoUrl')).toBe(true);
  });

  it('C-15: should return 400 when name is less than 2 characters', async () => {
    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(makeExercise({ name: 'A' }))
      .expect(400);

    expect(res.body.errors.some((e) => e.field === 'name')).toBe(true);
  });

  it('C-16: should return 201 with correct defaults when optional fields are omitted', async () => {
    const body = {
      name: 'Minimal Exercise',
      muscleGroup: 'chest',
      equipment: 'barbell',
      difficulty: 'beginner',
    };

    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.videoUrl).toBe(null);
    expect(res.body.description).toBe(null);
  });

  it('C-17: should return 201 when name is exactly 100 characters (boundary)', async () => {
    const name = 'x'.repeat(100);
    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(makeExercise({ name }))
      .expect(201);

    expect(res.body.name).toBe(name);
  });
});

describe('PUT /exercises/:exerciseId', () => {
  it('D-01: should return 401 when no token is provided', async () => {
    const exercise = await seedExercise();

    const res = await request(app)
      .put(`/exercises/${exercise._id}`)
      .send({ difficulty: 'advanced' })
      .expect(401);

    expect(res.body.message).toBe('Missing authorization token');
  });

  it('D-02: should return 403 when role=user token is used', async () => {
    const exercise = await seedExercise();

    const res = await request(app)
      .put(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ difficulty: 'advanced' })
      .expect(403);

    expect(res.body.message).toBe('Forbidden');
  });

  it('D-03: should return 200 and update only the supplied field', async () => {
    const exercise = await seedExercise({ difficulty: 'beginner', equipment: 'barbell' });

    const res = await request(app)
      .put(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ difficulty: 'advanced' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.difficulty).toBe('advanced');
    expect(res.body.equipment).toBe('barbell'); // unchanged
  });

  it('D-04: should return 200 when updating videoUrl field', async () => {
    const exercise = await seedExercise();

    const res = await request(app)
      .put(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ videoUrl: 'https://youtube.com/watch?v=newvideo' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.videoUrl).toBe('https://youtube.com/watch?v=newvideo');
  });

  it('D-05: should return 404 for a non-existent exercise id', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .put(`/exercises/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ difficulty: 'advanced' })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Exercise not found');
  });

  it('D-06: should return 404 for a soft-deleted exercise', async () => {
    const exercise = await seedExercise({ isActive: false });

    const res = await request(app)
      .put(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ difficulty: 'advanced' })
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Exercise not found');
  });

  it('D-07: should return 400 when muscleGroup enum is invalid', async () => {
    const exercise = await seedExercise();

    const res = await request(app)
      .put(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ muscleGroup: 'invalid' })
      .expect(400);

    expect(res.body.errors.some((e) => e.field === 'muscleGroup')).toBe(true);
  });

  it('D-08: should return 400 when videoUrl in the update body exceeds 500 chars', async () => {
    const exercise = await seedExercise();

    const res = await request(app)
      .put(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ videoUrl: 'https://youtube.com/' + 'x'.repeat(500) })
      .expect(400);

    expect(res.body.errors.some((e) => e.field === 'videoUrl')).toBe(true);
  });

  it('D-09: should return 200 and leave document unchanged when body is empty', async () => {
    const exercise = await seedExercise({ difficulty: 'beginner' });

    const res = await request(app)
      .put(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.difficulty).toBe('beginner');
  });

  it('D-10: should return 409 when updating name to an already-taken name', async () => {
    const ex1 = await seedExercise({ name: 'Exercise 1' });
    const ex2 = await seedExercise({ name: 'Exercise 2' });

    const res = await request(app)
      .put(`/exercises/${ex2._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Exercise 1' })
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });
});

describe('DELETE /exercises/:exerciseId', () => {
  it('E-01: should return 401 when no token is provided', async () => {
    const exercise = await seedExercise();

    const res = await request(app)
      .delete(`/exercises/${exercise._id}`)
      .expect(401);

    expect(res.body.message).toBe('Missing authorization token');
  });

  it('E-02: should return 403 when role=user token is used', async () => {
    const exercise = await seedExercise();

    const res = await request(app)
      .delete(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    expect(res.body.message).toBe('Forbidden');
  });

  it('E-03: should return 200 and soft-delete exercise (isActive=false, doc still in DB)', async () => {
    const exercise = await seedExercise();

    const res = await request(app)
      .delete(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Exercise deleted');

    // Verify soft delete: document still exists in DB with isActive=false
    const found = await Exercise.findById(exercise._id);
    expect(found).toBeDefined();
    expect(found.isActive).toBe(false);
  });

  it('E-03b: should return 201 when name is exactly 100 characters (boundary)', async () => {
    const name = 'x'.repeat(100);
    const res = await request(app)
      .post('/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(makeExercise({ name }))
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.name).toBe(name);
  });

  it('E-04: should return 409 when exercise is referenced in an active plan (BR-08)', async () => {
    const exercise = await seedExercise();
    await seedActivePlanWithExercise(exercise._id);

    const res = await request(app)
      .delete(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/active plan/i);
  });

  it('E-05: should soft-delete successfully when exercise is only in completed/cancelled plans', async () => {
    const exercise = await seedExercise();
    await WorkoutPlan.create({
      userId: 'user-001',
      name: 'Completed Plan',
      startDate: new Date(),
      endDate: new Date(),
      durationWeeks: 4,
      daysPerWeek: 3,
      status: 'completed',
      weeks: [
        {
          weekNumber: 1,
          days: [
            {
              dayNumber: 1,
              dayLabel: 'Day 1',
              scheduledDate: new Date(),
              isRestDay: false,
              exercises: [
                {
                  exerciseId: exercise._id,
                  name: 'Exercise',
                  muscleGroup: 'chest',
                  sets: 3,
                  reps: '10',
                  restSeconds: 90,
                  order: 1,
                },
              ],
            },
          ],
        },
      ],
    });

    const res = await request(app)
      .delete(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('E-06: should return 404 for a non-existent exercise id', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/exercises/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Exercise not found');
  });

  it('E-07: should return 404 for an already soft-deleted exercise', async () => {
    const exercise = await seedExercise({ isActive: false });

    const res = await request(app)
      .delete(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Exercise not found');
  });

  it('E-08: after soft delete, GET /exercises list must not include deleted exercise', async () => {
    const exercise = await seedExercise();

    await request(app)
      .delete(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const res = await request(app)
      .get('/exercises')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.exercises).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it('E-09: after soft delete, GET /exercises/:id must return 404', async () => {
    const exercise = await seedExercise();

    await request(app)
      .delete(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const res = await request(app)
      .get(`/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Exercise not found');
  });

  it('E-10: should return 400 for a malformed (non-ObjectId) id on DELETE', async () => {
    const res = await request(app)
      .delete('/exercises/invalid-id')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid exercise ID');
  });
});
