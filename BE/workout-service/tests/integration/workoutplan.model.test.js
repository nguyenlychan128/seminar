'use strict';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const WorkoutPlan = require('../../src/models/WorkoutPlan');

let mongoServer;

const VALID_PLAN_EXERCISE = {
  exerciseId: new mongoose.Types.ObjectId(),
  name: 'Bench Press',
  muscleGroup: 'chest',
  sets: 3,
  reps: '10',
  restSeconds: 90,
  order: 1,
};

const VALID_DAY_WORKOUT = {
  dayNumber: 1,
  dayLabel: 'Ngày A — Push',
  scheduledDate: new Date('2026-05-18'),
  isRestDay: false,
  exercises: [VALID_PLAN_EXERCISE],
};

const VALID_DAY_REST = {
  dayNumber: 2,
  dayLabel: 'Nghỉ ngơi',
  scheduledDate: new Date('2026-05-19'),
  isRestDay: true,
  exercises: [],
};

const VALID_WEEK = {
  weekNumber: 1,
  days: [VALID_DAY_WORKOUT, VALID_DAY_REST],
};

const VALID_WORKOUT_PLAN = {
  userId: 'user-001',
  name: 'Beginner Weight Gain Plan',
  startDate: new Date('2026-05-18'),
  endDate: new Date('2026-06-15'),
  durationWeeks: 4,
  daysPerWeek: 3,
  status: 'active',
  weeks: [VALID_WEEK],
  generatedFrom: { weight: 60, height: 175, bmi: 19.6, gender: 'male' },
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await WorkoutPlan.ensureIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('WorkoutPlan Model — TASK-023', () => {
  beforeEach(async () => {
    await WorkoutPlan.deleteMany({});
  });

  describe('Happy Path — Schema Creation', () => {
    it('I-01: should save successfully with all required fields', async () => {
      const doc = await new WorkoutPlan(VALID_WORKOUT_PLAN).save();
      expect(doc._id).toBeDefined();
      expect(doc.userId).toBe('user-001');
      expect(doc.name).toBe('Beginner Weight Gain Plan');
      expect(doc.status).toBe('active');
      expect(doc.durationWeeks).toBe(4);
      expect(doc.daysPerWeek).toBe(3);
      expect(doc.weeks).toHaveLength(1);
    });

    it('I-02: should persist embedded PlanExercise with all denormalized fields', async () => {
      const doc = await new WorkoutPlan(VALID_WORKOUT_PLAN).save();
      const exercise = doc.weeks[0].days[0].exercises[0];
      expect(exercise.name).toBe('Bench Press');
      expect(exercise.muscleGroup).toBe('chest');
      expect(exercise.sets).toBe(3);
      expect(exercise.reps).toBe('10');
      expect(exercise.restSeconds).toBe(90);
      expect(exercise.order).toBe(1);
      expect(exercise.exerciseId).toBeDefined();
    });

    it('I-03: should default status to "active" when not provided', async () => {
      const doc = await new WorkoutPlan({
        ...VALID_WORKOUT_PLAN,
        status: undefined,
      }).save();
      expect(doc.status).toBe('active');
    });

    it('I-04: should default durationWeeks to 4 and daysPerWeek to 3', async () => {
      const doc = await new WorkoutPlan({
        userId: 'user-001',
        name: 'Beginner Weight Gain Plan',
        startDate: new Date('2026-05-18'),
        endDate: new Date('2026-06-15'),
        weeks: [VALID_WEEK],
      }).save();
      expect(doc.durationWeeks).toBe(4);
      expect(doc.daysPerWeek).toBe(3);
    });

    it('I-15: should auto-generate createdAt and updatedAt timestamps', async () => {
      const doc = await new WorkoutPlan(VALID_WORKOUT_PLAN).save();
      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Required Field Validation', () => {
    it('I-05: should reject when userId is missing', async () => {
      const plan = new WorkoutPlan({
        ...VALID_WORKOUT_PLAN,
        userId: undefined,
      });
      await expect(plan.save()).rejects.toThrow();
    });

    it('I-07: should reject when weeks is missing or empty array', async () => {
      const plan1 = new WorkoutPlan({
        ...VALID_WORKOUT_PLAN,
        weeks: undefined,
      });
      await expect(plan1.save()).rejects.toThrow();

      const plan2 = new WorkoutPlan({
        ...VALID_WORKOUT_PLAN,
        weeks: [],
      });
      await expect(plan2.save()).rejects.toThrow();
    });
  });

  describe('Enum Validation', () => {
    it('I-06: should reject when status is not in allowed enum', async () => {
      const plan = new WorkoutPlan({
        ...VALID_WORKOUT_PLAN,
        status: 'paused',
      });
      await expect(plan.save()).rejects.toThrow();
    });
  });

  describe('PlanExercise Nested Validation', () => {
    it('I-08: should reject when sets is below minimum of 1', async () => {
      const plan = new WorkoutPlan({
        ...VALID_WORKOUT_PLAN,
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
                    exerciseId: new mongoose.Types.ObjectId(),
                    name: 'Test',
                    muscleGroup: 'chest',
                    sets: 0,
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
      await expect(plan.save()).rejects.toThrow();
    });

    it('I-09: should reject when sets is above maximum of 10', async () => {
      const plan = new WorkoutPlan({
        ...VALID_WORKOUT_PLAN,
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
                    exerciseId: new mongoose.Types.ObjectId(),
                    name: 'Test',
                    muscleGroup: 'chest',
                    sets: 11,
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
      await expect(plan.save()).rejects.toThrow();
    });

    it('I-10: should reject when restSeconds is below minimum of 30', async () => {
      const plan = new WorkoutPlan({
        ...VALID_WORKOUT_PLAN,
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
                    exerciseId: new mongoose.Types.ObjectId(),
                    name: 'Test',
                    muscleGroup: 'chest',
                    sets: 3,
                    reps: '10',
                    restSeconds: 29,
                    order: 1,
                  },
                ],
              },
            ],
          },
        ],
      });
      await expect(plan.save()).rejects.toThrow();
    });

    it('I-11: should reject when restSeconds is above maximum of 300', async () => {
      const plan = new WorkoutPlan({
        ...VALID_WORKOUT_PLAN,
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
                    exerciseId: new mongoose.Types.ObjectId(),
                    name: 'Test',
                    muscleGroup: 'chest',
                    sets: 3,
                    reps: '10',
                    restSeconds: 301,
                    order: 1,
                  },
                ],
              },
            ],
          },
        ],
      });
      await expect(plan.save()).rejects.toThrow();
    });
  });

  describe('Collection Indexes', () => {
    it('I-12: should have compound index on (userId, status)', async () => {
      const indexes = await WorkoutPlan.collection.getIndexes();
      const hasCompoundIndex = Object.keys(indexes).some(
        (key) => key === 'userId_1_status_1'
      );
      expect(hasCompoundIndex).toBe(true);
    });

    it('I-13: should have single-field index on userId', async () => {
      const indexes = await WorkoutPlan.collection.getIndexes();
      const hasSingleIndex = Object.keys(indexes).some((key) => key === 'userId_1');
      expect(hasSingleIndex).toBe(true);
    });
  });

  describe('Query Behavior', () => {
    it('I-14: should find active plan by userId using findOne with compound filter', async () => {
      await new WorkoutPlan(VALID_WORKOUT_PLAN).save();
      await new WorkoutPlan({
        ...VALID_WORKOUT_PLAN,
        userId: 'user-001',
        status: 'completed',
        name: 'Completed Plan',
      }).save();

      const result = await WorkoutPlan.findOne({
        userId: 'user-001',
        status: 'active',
      });
      expect(result).not.toBeNull();
      expect(result.status).toBe('active');
      expect(result.userId).toBe('user-001');
    });
  });
});
