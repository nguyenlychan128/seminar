'use strict';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const UserProfile = require('../../src/models/UserProfile');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await UserProfile.deleteMany({});
});

const validPayload = () => ({
  userId: 'user-abc-123',
  height: 165,
  weight: 48,
  age: 22,
  gender: 'male',
});

describe('UserProfile Model', () => {
  // ── Valid document ──────────────────────────────────────────
  describe('valid document', () => {
    it('should save successfully with all required fields', async () => {
      const saved = await new UserProfile(validPayload()).save();
      expect(saved._id).toBeDefined();
    });

    it('should compute bmi = 17.63 for height=165, weight=48', async () => {
      const saved = await new UserProfile(validPayload()).save();
      expect(saved.bmi).toBe(17.63);
    });

    it("should set bodyClassification = 'underweight' for bmi 17.63", async () => {
      const saved = await new UserProfile(validPayload()).save();
      expect(saved.bodyClassification).toBe('underweight');
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const saved = await new UserProfile(validPayload()).save();
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
    });

    it('should persist all input fields correctly', async () => {
      const payload = validPayload();
      const saved = await new UserProfile(payload).save();
      expect(saved.userId).toBe(payload.userId);
      expect(saved.height).toBe(payload.height);
      expect(saved.weight).toBe(payload.weight);
      expect(saved.age).toBe(payload.age);
      expect(saved.gender).toBe(payload.gender);
    });
  });

  // ── Pre-save hook ───────────────────────────────────────────
  describe('pre-save hook', () => {
    it('should overwrite client-supplied bmi with computed value', async () => {
      const saved = await new UserProfile({ ...validPayload(), bmi: 99.99 }).save();
      expect(saved.bmi).toBe(17.63);
    });

    it('should overwrite client-supplied bodyClassification with computed value', async () => {
      const saved = await new UserProfile({ ...validPayload(), bodyClassification: 'obese' }).save();
      expect(saved.bodyClassification).toBe('underweight');
    });

    it('should recompute bmi when height is updated', async () => {
      const profile = await new UserProfile(validPayload()).save();
      profile.height = 175;
      const updated = await profile.save();
      // 48 / (1.75)^2 = 15.67
      expect(updated.bmi).toBe(15.67);
      expect(updated.bmi).not.toBe(17.63);
    });

    it('should recompute bmi when weight is updated', async () => {
      const profile = await new UserProfile(validPayload()).save();
      profile.weight = 70;
      const updated = await profile.save();
      // 70 / (1.65)^2 = 25.71
      expect(updated.bmi).toBe(25.71);
    });

    it('should recompute bodyClassification when bmi crosses threshold after update', async () => {
      const profile = await new UserProfile(validPayload()).save();
      expect(profile.bodyClassification).toBe('underweight');

      profile.weight = 70;
      const updated = await profile.save();
      expect(updated.bodyClassification).toBe('overweight');
    });

    it('should run hook on every save (idempotent)', async () => {
      const profile = await new UserProfile(validPayload()).save();
      const resaved = await profile.save();
      expect(resaved.bmi).toBe(17.63);
      expect(resaved.bodyClassification).toBe('underweight');
    });
  });

  // ── Validation: required fields ─────────────────────────────
  describe('validation — required fields', () => {
    it('should throw ValidationError when userId is missing', async () => {
      const payload = validPayload();
      delete payload.userId;
      await expect(new UserProfile(payload).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should throw ValidationError when height is missing', async () => {
      const payload = validPayload();
      delete payload.height;
      await expect(new UserProfile(payload).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should throw ValidationError when weight is missing', async () => {
      const payload = validPayload();
      delete payload.weight;
      await expect(new UserProfile(payload).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should throw ValidationError when age is missing', async () => {
      const payload = validPayload();
      delete payload.age;
      await expect(new UserProfile(payload).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should throw ValidationError when gender is missing', async () => {
      const payload = validPayload();
      delete payload.gender;
      await expect(new UserProfile(payload).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });

  // ── Validation: height range [100, 250] ─────────────────────
  describe('validation — height range [100, 250]', () => {
    it('should throw ValidationError when height = 99', async () => {
      await expect(new UserProfile({ ...validPayload(), height: 99 }).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should throw ValidationError when height = 0', async () => {
      await expect(new UserProfile({ ...validPayload(), height: 0 }).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should throw ValidationError when height = 251', async () => {
      await expect(new UserProfile({ ...validPayload(), height: 251 }).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should save successfully when height = 100 (boundary min)', async () => {
      await expect(new UserProfile({ ...validPayload(), height: 100 }).save()).resolves.toBeDefined();
    });

    it('should save successfully when height = 250 (boundary max)', async () => {
      await expect(new UserProfile({ ...validPayload(), height: 250 }).save()).resolves.toBeDefined();
    });
  });

  // ── Validation: weight range [20, 300] ──────────────────────
  describe('validation — weight range [20, 300]', () => {
    it('should throw ValidationError when weight = 19', async () => {
      await expect(new UserProfile({ ...validPayload(), weight: 19 }).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should throw ValidationError when weight = 0', async () => {
      await expect(new UserProfile({ ...validPayload(), weight: 0 }).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should throw ValidationError when weight = 301', async () => {
      await expect(new UserProfile({ ...validPayload(), weight: 301 }).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should save successfully when weight = 20 (boundary min)', async () => {
      await expect(new UserProfile({ ...validPayload(), weight: 20 }).save()).resolves.toBeDefined();
    });

    it('should save successfully when weight = 300 (boundary max)', async () => {
      await expect(new UserProfile({ ...validPayload(), weight: 300 }).save()).resolves.toBeDefined();
    });
  });

  // ── Validation: age range [10, 100] ─────────────────────────
  describe('validation — age range [10, 100]', () => {
    it('should throw ValidationError when age = 9', async () => {
      await expect(new UserProfile({ ...validPayload(), age: 9 }).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should throw ValidationError when age = 0', async () => {
      await expect(new UserProfile({ ...validPayload(), age: 0 }).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should throw ValidationError when age = 101', async () => {
      await expect(new UserProfile({ ...validPayload(), age: 101 }).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should save successfully when age = 10 (boundary min)', async () => {
      await expect(new UserProfile({ ...validPayload(), age: 10 }).save()).resolves.toBeDefined();
    });

    it('should save successfully when age = 100 (boundary max)', async () => {
      await expect(new UserProfile({ ...validPayload(), age: 100 }).save()).resolves.toBeDefined();
    });

    it('should throw ValidationError when age = 22.5 (non-integer)', async () => {
      await expect(new UserProfile({ ...validPayload(), age: 22.5 }).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });

  // ── Validation: gender enum ─────────────────────────────────
  describe("validation — gender enum ['male', 'female']", () => {
    it("should throw ValidationError when gender = 'other'", async () => {
      await expect(new UserProfile({ ...validPayload(), gender: 'other' }).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it("should throw ValidationError when gender = '' (empty string)", async () => {
      await expect(new UserProfile({ ...validPayload(), gender: '' }).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it("should throw ValidationError when gender = 'Male' (case-sensitive)", async () => {
      await expect(new UserProfile({ ...validPayload(), gender: 'Male' }).save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it("should save successfully when gender = 'male'", async () => {
      await expect(new UserProfile({ ...validPayload(), gender: 'male' }).save()).resolves.toBeDefined();
    });

    it("should save successfully when gender = 'female'", async () => {
      await expect(new UserProfile({ ...validPayload(), gender: 'female' }).save()).resolves.toBeDefined();
    });
  });

  // ── Unique index: userId ─────────────────────────────────────
  describe('unique index — userId', () => {
    it('should throw duplicate key error (E11000) when saving two documents with same userId', async () => {
      await new UserProfile(validPayload()).save();
      await expect(new UserProfile(validPayload()).save()).rejects.toMatchObject({ code: 11000 });
    });

    it('should save successfully when two documents have different userId', async () => {
      await new UserProfile({ ...validPayload(), userId: 'user-001' }).save();
      await expect(new UserProfile({ ...validPayload(), userId: 'user-002' }).save()).resolves.toBeDefined();
    });

    it('duplicate userId error should NOT be a ValidationError', async () => {
      await new UserProfile(validPayload()).save();
      try {
        await new UserProfile(validPayload()).save();
        throw new Error('Expected error was not thrown');
      } catch (err) {
        expect(err.name).not.toBe('ValidationError');
        expect(err.code).toBe(11000);
      }
    });
  });

  // ── bodyClassification: all 4 values via hook ───────────────
  describe('bodyClassification — all 4 values triggered by pre-save hook', () => {
    it("should set 'normal' for height=175, weight=70 (bmi≈22.86)", async () => {
      const saved = await new UserProfile({ ...validPayload(), height: 175, weight: 70 }).save();
      expect(saved.bodyClassification).toBe('normal');
    });

    it("should set 'overweight' for height=170, weight=85 (bmi≈29.41)", async () => {
      const saved = await new UserProfile({ ...validPayload(), height: 170, weight: 85 }).save();
      expect(saved.bodyClassification).toBe('overweight');
    });

    it("should set 'obese' for height=160, weight=100 (bmi≈39.06)", async () => {
      const saved = await new UserProfile({ ...validPayload(), height: 160, weight: 100 }).save();
      expect(saved.bodyClassification).toBe('obese');
    });
  });

  // ── findOneAndUpdate hook guard (BR-02) ─────────────────────
  describe('findOneAndUpdate — hook bypass guard', () => {
    it('should throw error when findOneAndUpdate touches height (hook guard)', async () => {
      const profile = await new UserProfile(validPayload()).save();
      await expect(
        UserProfile.findOneAndUpdate({ userId: profile.userId }, { $set: { height: 170 } })
      ).rejects.toThrow('Use .save() when updating height or weight to ensure BMI recomputation (BR-02)');
    });

    it('should throw error when findOneAndUpdate touches weight (hook guard)', async () => {
      const profile = await new UserProfile(validPayload()).save();
      await expect(
        UserProfile.findOneAndUpdate({ userId: profile.userId }, { $set: { weight: 70 } })
      ).rejects.toThrow('Use .save() when updating height or weight to ensure BMI recomputation (BR-02)');
    });

    it('should allow findOneAndUpdate for fields other than height/weight (e.g. age)', async () => {
      const profile = await new UserProfile(validPayload()).save();
      await expect(
        UserProfile.findOneAndUpdate({ userId: profile.userId }, { $set: { age: 25 } }, { new: true })
      ).resolves.toBeDefined();
    });

    it('should throw error when findOneAndUpdate uses bare update object with height (Mongoose normalizes to $set)', async () => {
      // Mongoose normalizes { height: 170 } → { $set: { height: 170 } } before hook runs,
      // so the guard catches both bare and explicit $set forms.
      const profile = await new UserProfile(validPayload()).save();
      await expect(
        UserProfile.findOneAndUpdate({ userId: profile.userId }, { $set: { height: 170 } })
      ).rejects.toThrow('Use .save() when updating height or weight to ensure BMI recomputation (BR-02)');
    });
  });
});
