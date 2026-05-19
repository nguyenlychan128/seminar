'use strict';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Exercise = require('../../src/models/Exercise');

let mongoServer;

const VALID_EXERCISE = {
  name: 'Bench Press',
  muscleGroup: 'chest',
  equipment: 'barbell',
  difficulty: 'beginner',
  instructions: 'Lie on a flat bench and press the barbell upward until arms are fully extended.',
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Exercise.ensureIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Exercise Model — TASK-022', () => {
  beforeEach(async () => {
    await Exercise.deleteMany({});
  });

  // ── Happy Path ─────────────────────────────────────────────────────────────
  describe('Schema Creation — Happy Path', () => {
    it('should save successfully with all required fields', async () => {
      const doc = await new Exercise(VALID_EXERCISE).save();
      expect(doc._id).toBeDefined();
      expect(doc.name).toBe('Bench Press');
      expect(doc.muscleGroup).toBe('chest');
      expect(doc.equipment).toBe('barbell');
      expect(doc.difficulty).toBe('beginner');
    });

    it('should default isActive to true when not provided', async () => {
      const doc = await new Exercise(VALID_EXERCISE).save();
      expect(doc.isActive).toBe(true);
    });

    it('should accept isActive: false at creation time', async () => {
      const doc = await new Exercise({ ...VALID_EXERCISE, isActive: false }).save();
      expect(doc.isActive).toBe(false);
    });

    it('should default secondaryMuscles to [] when not provided', async () => {
      const doc = await new Exercise(VALID_EXERCISE).save();
      expect(doc.secondaryMuscles).toEqual([]);
    });

    it('should default tips to [] when not provided', async () => {
      const doc = await new Exercise(VALID_EXERCISE).save();
      expect(doc.tips).toEqual([]);
    });

    it('should default imageUrl to null when not provided', async () => {
      const doc = await new Exercise(VALID_EXERCISE).save();
      expect(doc.imageUrl).toBeNull();
    });

    it('should accept valid secondaryMuscles array', async () => {
      const doc = await new Exercise({
        ...VALID_EXERCISE,
        secondaryMuscles: ['triceps', 'shoulders'],
      }).save();
      expect(doc.secondaryMuscles).toEqual(['triceps', 'shoulders']);
    });

    it('should accept tips where every item is within 200 characters', async () => {
      const doc = await new Exercise({
        ...VALID_EXERCISE,
        tips: ['Keep your back flat.', 'Breathe out on the press.'],
      }).save();
      expect(doc.tips).toHaveLength(2);
    });

    it('should accept imageUrl as a string when provided', async () => {
      const doc = await new Exercise({
        ...VALID_EXERCISE,
        imageUrl: 'https://cdn.example.com/bench.jpg',
      }).save();
      expect(doc.imageUrl).toBe('https://cdn.example.com/bench.jpg');
    });
  });

  // ── Timestamps ─────────────────────────────────────────────────────────────
  describe('Timestamps', () => {
    it('should auto-generate createdAt and updatedAt on save', async () => {
      const doc = await new Exercise(VALID_EXERCISE).save();
      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt when document is modified', async () => {
      const doc = await new Exercise(VALID_EXERCISE).save();
      const originalUpdatedAt = doc.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 50));
      doc.difficulty = 'intermediate';
      const updated = await doc.save();

      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should not change createdAt when document is modified', async () => {
      const doc = await new Exercise(VALID_EXERCISE).save();
      const originalCreatedAt = doc.createdAt;

      await new Promise((resolve) => setTimeout(resolve, 50));
      doc.difficulty = 'intermediate';
      const updated = await doc.save();

      expect(updated.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });

  // ── Soft Delete (BR-08) ────────────────────────────────────────────────────
  describe('Soft Delete — BR-08', () => {
    it('should persist document in DB after isActive is set to false', async () => {
      const doc = await new Exercise(VALID_EXERCISE).save();
      doc.isActive = false;
      await doc.save();

      const found = await Exercise.findById(doc._id);
      expect(found).not.toBeNull();
      expect(found.isActive).toBe(false);
    });

    it('should allow setting isActive back to true after soft delete', async () => {
      const doc = await new Exercise({ ...VALID_EXERCISE, isActive: false }).save();
      doc.isActive = true;
      const reactivated = await doc.save();
      expect(reactivated.isActive).toBe(true);
    });
  });

  // ── Required Fields Validation ─────────────────────────────────────────────
  describe('Required Fields Validation', () => {
    it('should reject when name is missing', async () => {
      const { name: _n, ...payload } = VALID_EXERCISE;
      await expect(new Exercise(payload).save()).rejects.toThrow();
    });

    it('should reject when muscleGroup is missing', async () => {
      const { muscleGroup: _m, ...payload } = VALID_EXERCISE;
      await expect(new Exercise(payload).save()).rejects.toThrow();
    });

    it('should reject when equipment is missing', async () => {
      const { equipment: _e, ...payload } = VALID_EXERCISE;
      await expect(new Exercise(payload).save()).rejects.toThrow();
    });

    it('should reject when difficulty is missing', async () => {
      const { difficulty: _d, ...payload } = VALID_EXERCISE;
      await expect(new Exercise(payload).save()).rejects.toThrow();
    });

    it('should reject when instructions is missing', async () => {
      const { instructions: _i, ...payload } = VALID_EXERCISE;
      await expect(new Exercise(payload).save()).rejects.toThrow();
    });
  });

  // ── name Validation ────────────────────────────────────────────────────────
  describe('name Field Validation', () => {
    it('should reject duplicate name (unique constraint)', async () => {
      await new Exercise(VALID_EXERCISE).save();
      await expect(new Exercise({ ...VALID_EXERCISE }).save()).rejects.toThrow();
    });

    it('should reject name shorter than 2 characters', async () => {
      await expect(
        new Exercise({ ...VALID_EXERCISE, name: 'A' }).save()
      ).rejects.toThrow();
    });

    it('should reject name longer than 100 characters', async () => {
      await expect(
        new Exercise({ ...VALID_EXERCISE, name: 'A'.repeat(101) }).save()
      ).rejects.toThrow();
    });

    it('should accept name at boundary length of 2 characters', async () => {
      const doc = await new Exercise({ ...VALID_EXERCISE, name: 'AB' }).save();
      expect(doc.name).toBe('AB');
    });

    it('should accept name at boundary length of 100 characters', async () => {
      const name = 'A'.repeat(100);
      const doc = await new Exercise({ ...VALID_EXERCISE, name }).save();
      expect(doc.name).toHaveLength(100);
    });

    it('should trim leading and trailing whitespace from name', async () => {
      const doc = await new Exercise({
        ...VALID_EXERCISE,
        name: '  Bench Press  ',
      }).save();
      expect(doc.name).toBe('Bench Press');
    });
  });

  // ── Enum Validation ────────────────────────────────────────────────────────
  describe('Enum Field Validation', () => {
    it('should reject muscleGroup value not in allowed enum', async () => {
      await expect(
        new Exercise({ ...VALID_EXERCISE, muscleGroup: 'glutes' }).save()
      ).rejects.toThrow();
    });

    it('should reject equipment value not in allowed enum', async () => {
      await expect(
        new Exercise({ ...VALID_EXERCISE, equipment: 'kettlebell' }).save()
      ).rejects.toThrow();
    });

    it('should reject difficulty value not in allowed enum', async () => {
      await expect(
        new Exercise({ ...VALID_EXERCISE, difficulty: 'expert' }).save()
      ).rejects.toThrow();
    });

    it('should accept all valid muscleGroup enum values', async () => {
      const groups = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
      for (const [i, muscleGroup] of groups.entries()) {
        const doc = await new Exercise({
          ...VALID_EXERCISE,
          name: `MuscleGroup Test ${i}`,
          muscleGroup,
        }).save();
        expect(doc.muscleGroup).toBe(muscleGroup);
      }
    });

    it('should accept all valid equipment enum values', async () => {
      const equipments = ['barbell', 'dumbbell', 'bodyweight', 'cable', 'machine'];
      for (const [i, equipment] of equipments.entries()) {
        const doc = await new Exercise({
          ...VALID_EXERCISE,
          name: `Equipment Test ${i}`,
          equipment,
        }).save();
        expect(doc.equipment).toBe(equipment);
      }
    });

    it('should accept all valid difficulty enum values', async () => {
      const levels = ['beginner', 'intermediate', 'advanced'];
      for (const [i, difficulty] of levels.entries()) {
        const doc = await new Exercise({
          ...VALID_EXERCISE,
          name: `Difficulty Test ${i}`,
          difficulty,
        }).save();
        expect(doc.difficulty).toBe(difficulty);
      }
    });
  });

  // ── instructions Validation ────────────────────────────────────────────────
  describe('instructions Field Validation', () => {
    it('should reject instructions shorter than 10 characters', async () => {
      await expect(
        new Exercise({ ...VALID_EXERCISE, instructions: 'Do it.' }).save()
      ).rejects.toThrow();
    });

    it('should reject instructions longer than 2000 characters', async () => {
      await expect(
        new Exercise({ ...VALID_EXERCISE, instructions: 'A'.repeat(2001) }).save()
      ).rejects.toThrow();
    });

    it('should accept instructions exactly 10 characters long', async () => {
      const doc = await new Exercise({
        ...VALID_EXERCISE,
        instructions: 'A'.repeat(10),
      }).save();
      expect(doc.instructions).toHaveLength(10);
    });

    it('should accept instructions exactly 2000 characters long', async () => {
      const doc = await new Exercise({
        ...VALID_EXERCISE,
        instructions: 'A'.repeat(2000),
      }).save();
      expect(doc.instructions).toHaveLength(2000);
    });
  });

  // ── tips Validation ────────────────────────────────────────────────────────
  describe('tips Field Validation', () => {
    it('should reject a tip longer than 200 characters', async () => {
      await expect(
        new Exercise({ ...VALID_EXERCISE, tips: ['A'.repeat(201)] }).save()
      ).rejects.toThrow();
    });

    it('should reject when any one of multiple tips exceeds 200 characters', async () => {
      await expect(
        new Exercise({
          ...VALID_EXERCISE,
          tips: ['Valid tip here.', 'B'.repeat(201)],
        }).save()
      ).rejects.toThrow();
    });

    it('should accept a tip of exactly 200 characters', async () => {
      const doc = await new Exercise({
        ...VALID_EXERCISE,
        tips: ['X'.repeat(200)],
      }).save();
      expect(doc.tips[0]).toHaveLength(200);
    });
  });

  // ── Collection Indexes ─────────────────────────────────────────────────────
  describe('Collection Indexes', () => {
    beforeEach(async () => {
      await new Exercise(VALID_EXERCISE).save();
    });

    it('should have a unique index on name', async () => {
      const indexes = await Exercise.collection.getIndexes();
      expect('name_1' in indexes).toBe(true);
    });

    it('should have an index on muscleGroup', async () => {
      const indexes = await Exercise.collection.getIndexes();
      expect('muscleGroup_1' in indexes).toBe(true);
    });

    it('should have an index on equipment', async () => {
      const indexes = await Exercise.collection.getIndexes();
      expect('equipment_1' in indexes).toBe(true);
    });

    it('should have an index on difficulty', async () => {
      const indexes = await Exercise.collection.getIndexes();
      expect('difficulty_1' in indexes).toBe(true);
    });
  });
});
