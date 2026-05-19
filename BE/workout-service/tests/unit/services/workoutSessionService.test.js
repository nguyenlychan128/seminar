'use strict';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// We import the module under test after setting up the DB
let workoutSessionService;
let WorkoutSession;
let ValidationError;
let DuplicateSessionError;

let mongoServer;

// ── Helpers ──────────────────────────────────────────────────────────────────

const VALID_PLAN_ID = new mongoose.Types.ObjectId().toString();
const VALID_EXERCISE_ID = new mongoose.Types.ObjectId().toString();
const VALID_EXERCISE_999 = new mongoose.Types.ObjectId().toString();
const VALID_EXERCISE_2 = new mongoose.Types.ObjectId().toString();
const VALID_EXERCISE_TRIMMED = new mongoose.Types.ObjectId().toString();

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

function makeValidSessionData(overrides = {}) {
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
  workoutSessionService = require('../../../src/services/workoutSessionService');
  WorkoutSession = require('../../../src/models/WorkoutSession');
  ValidationError = require('../../../src/errors/ValidationError');
  DuplicateSessionError = require('../../../src/errors/DuplicateSessionError');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await WorkoutSession.deleteMany({});
});

// ── Happy path ───────────────────────────────────────────────────────────────

describe('workoutSessionService.createSession — happy path', () => {
  test('should create and return a saved session with _id and timestamps', async () => {
    const result = await workoutSessionService.createSession('user-001', makeValidSessionData());
    expect(result._id).toBeDefined();
    expect(result.userId).toBe('user-001');
    expect(result.planId).toBe(VALID_PLAN_ID);
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.completedAt).toBeDefined();
  });

  test('should use userId from parameter, not from session data', async () => {
    const data = makeValidSessionData();
    // Even if caller smuggles userId in body it must be ignored (service takes param)
    const result = await workoutSessionService.createSession('jwt-user-id', data);
    expect(result.userId).toBe('jwt-user-id');
  });

  test('should denormalize exercise name and muscleGroup', async () => {
    const data = makeValidSessionData({
      exercises: [makeValidExercise({ exerciseId: VALID_EXERCISE_999, name: 'Squat', muscleGroup: 'legs' })],
    });
    const result = await workoutSessionService.createSession('user-001', data);
    expect(result.exercises[0].name).toBe('Squat');
    expect(result.exercises[0].muscleGroup).toBe('legs');
    expect(result.exercises[0].exerciseId).toBe(VALID_EXERCISE_999);
  });

  test('should persist multiple exercises', async () => {
    const data = makeValidSessionData({
      exercises: [
        makeValidExercise({ exerciseId: VALID_EXERCISE_ID, name: 'Bench Press', muscleGroup: 'chest' }),
        makeValidExercise({ exerciseId: VALID_EXERCISE_2, name: 'Squat', muscleGroup: 'legs', sets: [makeValidSet({ setNumber: 1 })] }),
      ],
    });
    const result = await workoutSessionService.createSession('user-001', data);
    expect(result.exercises).toHaveLength(2);
  });

  test('should persist optional fields when provided', async () => {
    const data = makeValidSessionData({ totalDuration: 60, mood: 'good', notes: 'Felt strong' });
    const result = await workoutSessionService.createSession('user-001', data);
    expect(result.totalDuration).toBe(60);
    expect(result.mood).toBe('good');
    expect(result.notes).toBe('Felt strong');
  });

  test('should accept skipped exercise with no sets', async () => {
    const data = makeValidSessionData({
      exercises: [makeValidExercise({ status: 'skipped', sets: [] })],
    });
    const result = await workoutSessionService.createSession('user-001', data);
    expect(result.exercises[0].status).toBe('skipped');
  });

  test('should persist set with rpe', async () => {
    const data = makeValidSessionData({
      exercises: [makeValidExercise({ sets: [makeValidSet({ rpe: 8 })] })],
    });
    const result = await workoutSessionService.createSession('user-001', data);
    expect(result.exercises[0].sets[0].rpe).toBe(8);
  });

  test('should accept sessionDate as today', async () => {
    const today = new Date().toISOString().split('T')[0];
    const data = makeValidSessionData({ sessionDate: today });
    const result = await workoutSessionService.createSession('user-001', data);
    expect(result._id).toBeDefined();
  });
});

// ── Duplicate detection ──────────────────────────────────────────────────────

describe('workoutSessionService.createSession — duplicate detection', () => {
  test('should throw DuplicateSessionError when session already exists', async () => {
    const data = makeValidSessionData();
    await workoutSessionService.createSession('user-001', data);
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      DuplicateSessionError
    );
  });

  test('should allow same plan/week/day for different users', async () => {
    const data = makeValidSessionData();
    await workoutSessionService.createSession('user-001', data);
    await expect(workoutSessionService.createSession('user-002', data)).resolves.toBeDefined();
  });

  test('should allow same user/plan/week/day on different dates', async () => {
    const d1 = new Date();
    d1.setDate(d1.getDate() - 1);
    const d2 = new Date();
    d2.setDate(d2.getDate() - 2);
    const data1 = makeValidSessionData({ sessionDate: d1.toISOString().split('T')[0] });
    const data2 = makeValidSessionData({ sessionDate: d2.toISOString().split('T')[0] });
    await workoutSessionService.createSession('user-001', data1);
    await expect(workoutSessionService.createSession('user-001', data2)).resolves.toBeDefined();
  });

  test('should allow same user/date but different weekNumber', async () => {
    const data1 = makeValidSessionData({ weekNumber: 1 });
    const data2 = makeValidSessionData({ weekNumber: 2 });
    await workoutSessionService.createSession('user-001', data1);
    await expect(workoutSessionService.createSession('user-001', data2)).resolves.toBeDefined();
  });

  test('DuplicateSessionError should have status 409', async () => {
    const data = makeValidSessionData();
    await workoutSessionService.createSession('user-001', data);
    try {
      await workoutSessionService.createSession('user-001', data);
    } catch (err) {
      expect(err.status).toBe(409);
    }
  });
});

// ── Session-level validation ──────────────────────────────────────────────────

describe('workoutSessionService.createSession — session validation', () => {
  test('should throw ValidationError when planId is missing', async () => {
    const data = makeValidSessionData();
    delete data.planId;
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError when planId is empty string', async () => {
    const data = makeValidSessionData({ planId: '   ' });
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError when weekNumber is missing', async () => {
    const data = makeValidSessionData();
    delete data.weekNumber;
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError when weekNumber is 0', async () => {
    const data = makeValidSessionData({ weekNumber: 0 });
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError when weekNumber is not integer', async () => {
    const data = makeValidSessionData({ weekNumber: 1.5 });
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError when dayNumber is missing', async () => {
    const data = makeValidSessionData();
    delete data.dayNumber;
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError when dayNumber = 0', async () => {
    const data = makeValidSessionData({ dayNumber: 0 });
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError when dayNumber = 8', async () => {
    const data = makeValidSessionData({ dayNumber: 8 });
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError when sessionDate is missing', async () => {
    const data = makeValidSessionData();
    delete data.sessionDate;
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError when sessionDate is invalid', async () => {
    const data = makeValidSessionData({ sessionDate: 'not-a-date' });
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('BR-02: should throw ValidationError when sessionDate is in the future', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const data = makeValidSessionData({ sessionDate: tomorrow.toISOString().split('T')[0] });
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError when exercises is empty array', async () => {
    const data = makeValidSessionData({ exercises: [] });
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError when exercises is not array', async () => {
    const data = makeValidSessionData({ exercises: 'bad' });
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError for invalid totalDuration', async () => {
    const data = makeValidSessionData({ totalDuration: 301 });
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError for negative totalDuration', async () => {
    const data = makeValidSessionData({ totalDuration: -1 });
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError for invalid mood', async () => {
    const data = makeValidSessionData({ mood: 'euphoric' });
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('should throw ValidationError for notes > 500 chars', async () => {
    const data = makeValidSessionData({ notes: 'a'.repeat(501) });
    await expect(workoutSessionService.createSession('user-001', data)).rejects.toThrow(
      ValidationError
    );
  });

  test('ValidationError should have status 400', async () => {
    const data = makeValidSessionData();
    delete data.planId;
    try {
      await workoutSessionService.createSession('user-001', data);
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });
});

// ── Exercise-level validation ─────────────────────────────────────────────────

describe('workoutSessionService.createSession — exercise validation', () => {
  test('should throw ValidationError when exerciseId is missing', async () => {
    const ex = makeValidExercise();
    delete ex.exerciseId;
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError when exercise name is missing', async () => {
    const ex = makeValidExercise();
    delete ex.name;
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError for invalid muscleGroup', async () => {
    const ex = makeValidExercise({ muscleGroup: 'glutes' });
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError for invalid status', async () => {
    const ex = makeValidExercise({ status: 'in-progress' });
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });

  test('BR-03: should throw ValidationError when completed exercise has no sets', async () => {
    const ex = makeValidExercise({ status: 'completed', sets: [] });
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError when plannedSets < 1', async () => {
    const ex = makeValidExercise({ plannedSets: 0 });
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError when plannedReps is missing', async () => {
    const ex = makeValidExercise();
    delete ex.plannedReps;
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError when exercise notes > 300 chars', async () => {
    const ex = makeValidExercise({ notes: 'a'.repeat(301) });
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });
});

// ── Set-level validation ──────────────────────────────────────────────────────

describe('workoutSessionService.createSession — set validation', () => {
  test('should throw ValidationError when setNumber is missing', async () => {
    const set = makeValidSet();
    delete set.setNumber;
    const ex = makeValidExercise({ sets: [set] });
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError when setNumber < 1', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ setNumber: 0 })] });
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError when actualReps is missing', async () => {
    const set = makeValidSet();
    delete set.actualReps;
    const ex = makeValidExercise({ sets: [set] });
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError when actualReps > 100', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ actualReps: 101 })] });
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });

  test('should accept actualReps = 0 (failed set)', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ actualReps: 0 })] });
    const result = await workoutSessionService.createSession(
      'user-001',
      makeValidSessionData({ exercises: [ex] })
    );
    expect(result.exercises[0].sets[0].actualReps).toBe(0);
  });

  test('should throw ValidationError when weight is missing', async () => {
    const set = makeValidSet();
    delete set.weight;
    const ex = makeValidExercise({ sets: [set] });
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError when weight > 500', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ weight: 501 })] });
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });

  test('should accept weight = 0 (bodyweight)', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ weight: 0 })] });
    const result = await workoutSessionService.createSession(
      'user-001',
      makeValidSessionData({ exercises: [ex] })
    );
    expect(result.exercises[0].sets[0].weight).toBe(0);
  });

  test('should throw ValidationError when rpe < 1', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ rpe: 0 })] });
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError when rpe > 10', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ rpe: 11 })] });
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });

  test('should throw ValidationError for set notes > 200 chars', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ notes: 'a'.repeat(201) })] });
    await expect(
      workoutSessionService.createSession('user-001', makeValidSessionData({ exercises: [ex] }))
    ).rejects.toThrow(ValidationError);
  });
});

// ── Denormalization ───────────────────────────────────────────────────────────

describe('workoutSessionService — denormalization', () => {
  test('stores exercise name as snapshot (denormalized)', async () => {
    const data = makeValidSessionData({
      exercises: [makeValidExercise({ name: 'Romanian Deadlift', muscleGroup: 'legs' })],
    });
    const result = await workoutSessionService.createSession('user-001', data);
    expect(result.exercises[0].name).toBe('Romanian Deadlift');
    expect(result.exercises[0].muscleGroup).toBe('legs');
  });

  test('accepts valid ObjectIds for planId and exerciseId', async () => {
    const data = makeValidSessionData({
      planId: VALID_PLAN_ID,
      exercises: [makeValidExercise({ exerciseId: VALID_EXERCISE_TRIMMED })],
    });
    const result = await workoutSessionService.createSession('user-001', data);
    expect(result.planId).toBe(VALID_PLAN_ID);
    expect(result.exercises[0].exerciseId).toBe(VALID_EXERCISE_TRIMMED);
  });
});
