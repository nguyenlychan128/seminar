'use strict';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const WorkoutSession = require('../../../src/models/WorkoutSession');

let mongoServer;

// ── Helpers ──────────────────────────────────────────────────────────────────

const VALID_PLAN_ID = new mongoose.Types.ObjectId().toString();
const VALID_EXERCISE_ID = new mongoose.Types.ObjectId().toString();

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

function makeValidSession(overrides = {}) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return {
    userId: 'user-001',
    planId: VALID_PLAN_ID,
    weekNumber: 1,
    dayNumber: 1,
    sessionDate: yesterday,
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

// ── Schema Validation ────────────────────────────────────────────────────────

describe('WorkoutSession model — Schema validation', () => {
  // Required root fields
  describe('Required root fields', () => {
    test('should save a valid session document', async () => {
      const session = new WorkoutSession(makeValidSession());
      const saved = await session.save();
      expect(saved._id).toBeDefined();
      expect(saved.userId).toBe('user-001');
      expect(saved.planId).toBe(VALID_PLAN_ID);
    });

    test('should fail without userId', async () => {
      const data = makeValidSession();
      delete data.userId;
      const session = new WorkoutSession(data);
      await expect(session.save()).rejects.toThrow();
    });

    test('should fail without planId', async () => {
      const data = makeValidSession();
      delete data.planId;
      const session = new WorkoutSession(data);
      await expect(session.save()).rejects.toThrow();
    });

    test('should fail without weekNumber', async () => {
      const data = makeValidSession();
      delete data.weekNumber;
      const session = new WorkoutSession(data);
      await expect(session.save()).rejects.toThrow();
    });

    test('should fail without dayNumber', async () => {
      const data = makeValidSession();
      delete data.dayNumber;
      const session = new WorkoutSession(data);
      await expect(session.save()).rejects.toThrow();
    });

    test('should fail without sessionDate', async () => {
      const data = makeValidSession();
      delete data.sessionDate;
      const session = new WorkoutSession(data);
      await expect(session.save()).rejects.toThrow();
    });

    test('should fail without exercises', async () => {
      const data = makeValidSession();
      delete data.exercises;
      const session = new WorkoutSession(data);
      await expect(session.save()).rejects.toThrow();
    });

    test('should fail with empty exercises array', async () => {
      const session = new WorkoutSession(makeValidSession({ exercises: [] }));
      await expect(session.save()).rejects.toThrow();
    });
  });

  // dayNumber bounds
  describe('dayNumber bounds', () => {
    test('should accept dayNumber = 1', async () => {
      const session = new WorkoutSession(makeValidSession({ dayNumber: 1 }));
      const saved = await session.save();
      expect(saved.dayNumber).toBe(1);
    });

    test('should accept dayNumber = 7', async () => {
      const session = new WorkoutSession(makeValidSession({ dayNumber: 7 }));
      const saved = await session.save();
      expect(saved.dayNumber).toBe(7);
    });

    test('should reject dayNumber = 0', async () => {
      const session = new WorkoutSession(makeValidSession({ dayNumber: 0 }));
      await expect(session.save()).rejects.toThrow();
    });

    test('should reject dayNumber = 8', async () => {
      const session = new WorkoutSession(makeValidSession({ dayNumber: 8 }));
      await expect(session.save()).rejects.toThrow();
    });
  });

  // weekNumber
  describe('weekNumber', () => {
    test('should accept weekNumber >= 1', async () => {
      const session = new WorkoutSession(makeValidSession({ weekNumber: 4 }));
      const saved = await session.save();
      expect(saved.weekNumber).toBe(4);
    });

    test('should reject weekNumber = 0', async () => {
      const session = new WorkoutSession(makeValidSession({ weekNumber: 0 }));
      await expect(session.save()).rejects.toThrow();
    });
  });

  // Optional fields
  describe('Optional root fields', () => {
    test('should accept valid mood values', async () => {
      const moods = ['great', 'good', 'ok', 'tired'];
      for (const mood of moods) {
        await WorkoutSession.deleteMany({});
        const session = new WorkoutSession(makeValidSession({ mood }));
        const saved = await session.save();
        expect(saved.mood).toBe(mood);
      }
    });

    test('should reject invalid mood value', async () => {
      const session = new WorkoutSession(makeValidSession({ mood: 'amazing' }));
      await expect(session.save()).rejects.toThrow();
    });

    test('should accept totalDuration between 0 and 300', async () => {
      const session = new WorkoutSession(makeValidSession({ totalDuration: 60 }));
      const saved = await session.save();
      expect(saved.totalDuration).toBe(60);
    });

    test('should accept totalDuration = 0', async () => {
      const session = new WorkoutSession(makeValidSession({ totalDuration: 0 }));
      const saved = await session.save();
      expect(saved.totalDuration).toBe(0);
    });

    test('should reject totalDuration > 300', async () => {
      const session = new WorkoutSession(makeValidSession({ totalDuration: 301 }));
      await expect(session.save()).rejects.toThrow();
    });

    test('should reject totalDuration < 0', async () => {
      const session = new WorkoutSession(makeValidSession({ totalDuration: -1 }));
      await expect(session.save()).rejects.toThrow();
    });

    test('should accept notes up to 500 chars', async () => {
      const notes = 'a'.repeat(500);
      const session = new WorkoutSession(makeValidSession({ notes }));
      const saved = await session.save();
      expect(saved.notes).toBe(notes);
    });

    test('should reject notes > 500 chars', async () => {
      const notes = 'a'.repeat(501);
      const session = new WorkoutSession(makeValidSession({ notes }));
      await expect(session.save()).rejects.toThrow();
    });
  });
});

// ── ExerciseSession sub-schema ────────────────────────────────────────────────

describe('ExerciseSession sub-schema', () => {
  test('should require exerciseId', async () => {
    const ex = makeValidExercise();
    delete ex.exerciseId;
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should require name', async () => {
    const ex = makeValidExercise();
    delete ex.name;
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should require muscleGroup', async () => {
    const ex = makeValidExercise();
    delete ex.muscleGroup;
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should reject invalid muscleGroup', async () => {
    const ex = makeValidExercise({ muscleGroup: 'glutes' });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should accept all valid muscleGroup values', async () => {
    const validGroups = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
    for (const muscleGroup of validGroups) {
      await WorkoutSession.deleteMany({});
      const ex = makeValidExercise({ muscleGroup });
      const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
      const saved = await session.save();
      expect(saved.exercises[0].muscleGroup).toBe(muscleGroup);
    }
  });

  test('should require status', async () => {
    const ex = makeValidExercise();
    delete ex.status;
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should reject invalid status', async () => {
    const ex = makeValidExercise({ status: 'pending' });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should accept status = skipped with no sets', async () => {
    const ex = makeValidExercise({ status: 'skipped', sets: [] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    const saved = await session.save();
    expect(saved.exercises[0].status).toBe('skipped');
  });

  test('should require plannedSets', async () => {
    const ex = makeValidExercise();
    delete ex.plannedSets;
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should reject plannedSets < 1', async () => {
    const ex = makeValidExercise({ plannedSets: 0 });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should require plannedReps', async () => {
    const ex = makeValidExercise();
    delete ex.plannedReps;
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should reject exercise notes > 300 chars', async () => {
    const ex = makeValidExercise({ notes: 'a'.repeat(301) });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should accept exercise notes up to 300 chars', async () => {
    const ex = makeValidExercise({ notes: 'a'.repeat(300) });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    const saved = await session.save();
    expect(saved.exercises[0].notes).toHaveLength(300);
  });
});

// ── SetResult sub-schema ──────────────────────────────────────────────────────

describe('SetResult sub-schema', () => {
  test('should require setNumber', async () => {
    const set = makeValidSet();
    delete set.setNumber;
    const ex = makeValidExercise({ sets: [set] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should reject setNumber < 1', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ setNumber: 0 })] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should require actualReps', async () => {
    const set = makeValidSet();
    delete set.actualReps;
    const ex = makeValidExercise({ sets: [set] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should accept actualReps = 0', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ actualReps: 0 })] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    const saved = await session.save();
    expect(saved.exercises[0].sets[0].actualReps).toBe(0);
  });

  test('should accept actualReps = 100', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ actualReps: 100 })] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    const saved = await session.save();
    expect(saved.exercises[0].sets[0].actualReps).toBe(100);
  });

  test('should reject actualReps > 100', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ actualReps: 101 })] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should reject actualReps < 0', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ actualReps: -1 })] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should require weight', async () => {
    const set = makeValidSet();
    delete set.weight;
    const ex = makeValidExercise({ sets: [set] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should accept weight = 0 (bodyweight)', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ weight: 0 })] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    const saved = await session.save();
    expect(saved.exercises[0].sets[0].weight).toBe(0);
  });

  test('should accept weight = 500', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ weight: 500 })] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    const saved = await session.save();
    expect(saved.exercises[0].sets[0].weight).toBe(500);
  });

  test('should reject weight > 500', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ weight: 501 })] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should reject weight < 0', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ weight: -1 })] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should accept rpe between 1 and 10', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ rpe: 7 })] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    const saved = await session.save();
    expect(saved.exercises[0].sets[0].rpe).toBe(7);
  });

  test('should reject rpe < 1', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ rpe: 0 })] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should reject rpe > 10', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ rpe: 11 })] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });

  test('should accept set notes up to 200 chars', async () => {
    const notes = 'a'.repeat(200);
    const ex = makeValidExercise({ sets: [makeValidSet({ notes })] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    const saved = await session.save();
    expect(saved.exercises[0].sets[0].notes).toHaveLength(200);
  });

  test('should reject set notes > 200 chars', async () => {
    const ex = makeValidExercise({ sets: [makeValidSet({ notes: 'a'.repeat(201) })] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow();
  });
});

// ── Unique Compound Index ────────────────────────────────────────────────────

describe('WorkoutSession — Unique compound index', () => {
  test('should allow two sessions with same userId but different planId', async () => {
    const s1 = makeValidSession({ planId: 'plan-A' });
    const s2 = makeValidSession({ planId: 'plan-B' });
    await new WorkoutSession(s1).save();
    await expect(new WorkoutSession(s2).save()).resolves.toBeDefined();
  });

  test('should allow two sessions with different weekNumber', async () => {
    const s1 = makeValidSession({ weekNumber: 1 });
    const s2 = makeValidSession({ weekNumber: 2 });
    await new WorkoutSession(s1).save();
    await expect(new WorkoutSession(s2).save()).resolves.toBeDefined();
  });

  test('should allow two sessions with different dayNumber', async () => {
    const s1 = makeValidSession({ dayNumber: 1 });
    const s2 = makeValidSession({ dayNumber: 2 });
    await new WorkoutSession(s1).save();
    await expect(new WorkoutSession(s2).save()).resolves.toBeDefined();
  });

  test('should allow two sessions with different sessionDate', async () => {
    const d1 = new Date();
    d1.setDate(d1.getDate() - 1);
    const d2 = new Date();
    d2.setDate(d2.getDate() - 2);
    const s1 = makeValidSession({ sessionDate: d1 });
    const s2 = makeValidSession({ sessionDate: d2 });
    await new WorkoutSession(s1).save();
    await expect(new WorkoutSession(s2).save()).resolves.toBeDefined();
  });

  test('should reject duplicate (userId, planId, weekNumber, dayNumber, sessionDate)', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const s1 = makeValidSession({ sessionDate: yesterday });
    const s2 = makeValidSession({ sessionDate: yesterday });
    await new WorkoutSession(s1).save();
    await expect(new WorkoutSession(s2).save()).rejects.toThrow();
  });
});

// ── Pre-save hooks ────────────────────────────────────────────────────────────

describe('WorkoutSession — Pre-save hooks', () => {
  test('BR-02: should reject sessionDate in the future', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const session = new WorkoutSession(makeValidSession({ sessionDate: tomorrow }));
    await expect(session.save()).rejects.toThrow(/future/);
  });

  test('BR-02: should allow sessionDate = today', async () => {
    const today = new Date();
    const session = new WorkoutSession(makeValidSession({ sessionDate: today }));
    const saved = await session.save();
    expect(saved._id).toBeDefined();
  });

  test('BR-02: should allow sessionDate in the past', async () => {
    const past = new Date();
    past.setDate(past.getDate() - 7);
    const session = new WorkoutSession(makeValidSession({ sessionDate: past }));
    const saved = await session.save();
    expect(saved._id).toBeDefined();
  });

  test('BR-03: completed exercise with no sets should throw', async () => {
    const ex = makeValidExercise({ status: 'completed', sets: [] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    await expect(session.save()).rejects.toThrow(/completed.*no sets|sets.*completed/i);
  });

  test('BR-03: skipped exercise with no sets should be allowed', async () => {
    const ex = makeValidExercise({ status: 'skipped', sets: [] });
    const session = new WorkoutSession(makeValidSession({ exercises: [ex] }));
    const saved = await session.save();
    expect(saved.exercises[0].status).toBe('skipped');
  });

  test('should set completedAt on save', async () => {
    const session = new WorkoutSession(makeValidSession());
    const saved = await session.save();
    expect(saved.completedAt).toBeDefined();
    expect(saved.completedAt).toBeInstanceOf(Date);
  });

  test('should add timestamps (createdAt, updatedAt)', async () => {
    const session = new WorkoutSession(makeValidSession());
    const saved = await session.save();
    expect(saved.createdAt).toBeDefined();
    expect(saved.updatedAt).toBeDefined();
  });
});
