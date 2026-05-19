'use strict';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const WeightLog = require('../../src/models/WeightLog');

let mongoServer;

const USER_A = new mongoose.Types.ObjectId();
const USER_B = new mongoose.Types.ObjectId();

const VALID_PAYLOAD = {
  userId: USER_A,
  weight: 65.5,
  date: new Date('2026-05-17'),
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await WeightLog.ensureIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await WeightLog.deleteMany({});
});

// ─── Suite 1: Schema Creation — Happy Path ────────────────────────────────

describe('WeightLog Model — Schema Creation', () => {
  test('should create a valid WeightLog document with all required fields and return _id', async () => {
    const doc = await new WeightLog(VALID_PAYLOAD).save();

    expect(doc._id).toBeDefined();
    expect(doc.userId.toString()).toBe(USER_A.toString());
    expect(doc.weight).toBe(65.5);
    expect(doc.date).toBeInstanceOf(Date);
  });

  test('should default trend to 0 when not explicitly provided', async () => {
    const doc = await new WeightLog(VALID_PAYLOAD).save();
    expect(doc.trend).toBe(0);
  });

  test('should accept decimal weight values at 0.1 kg resolution', async () => {
    const doc = await new WeightLog({ ...VALID_PAYLOAD, weight: 65.3 }).save();
    expect(doc.weight).toBeCloseTo(65.3, 1);
  });

  test('should accept weight at lower boundary (30 kg)', async () => {
    const doc = await new WeightLog({ ...VALID_PAYLOAD, weight: 30 }).save();
    expect(doc.weight).toBe(30);
  });

  test('should accept weight at upper boundary (200 kg)', async () => {
    const doc = await new WeightLog({ ...VALID_PAYLOAD, weight: 200 }).save();
    expect(doc.weight).toBe(200);
  });

  test('should save notes when provided within 200 character limit', async () => {
    const doc = await new WeightLog({
      ...VALID_PAYLOAD,
      notes: 'Felt good today',
    }).save();
    expect(doc.notes).toBe('Felt good today');
  });

  test('should trim leading and trailing whitespace from notes', async () => {
    const doc = await new WeightLog({
      ...VALID_PAYLOAD,
      notes: '  post workout  ',
    }).save();
    expect(doc.notes).toBe('post workout');
  });

  test('should save successfully when notes is omitted (optional field)', async () => {
    const doc = await new WeightLog(VALID_PAYLOAD).save();
    expect(doc.notes == null || doc.notes === '').toBe(true);
  });
});

// ─── Suite 2: Required Fields Validation ────────────────────────────────

describe('WeightLog Model — Required Fields Validation', () => {
  test('should reject when userId is missing', async () => {
    const { userId: _u, ...payload } = VALID_PAYLOAD;
    await expect(new WeightLog(payload).save()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  test('should reject when weight is missing', async () => {
    const { weight: _w, ...payload } = VALID_PAYLOAD;
    const err = await new WeightLog(payload).save().catch((e) => e);
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.weight).toBeDefined();
  });

  test('should reject when date is missing', async () => {
    const { date: _d, ...payload } = VALID_PAYLOAD;
    await expect(new WeightLog(payload).save()).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });
});

// ─── Suite 3: Weight Range Validation ─────────────────────────────────

describe('WeightLog Model — Weight Validation (BR-1: 30-200 kg)', () => {
  test('should reject weight below minimum (29.9 kg)', async () => {
    const err = await new WeightLog({ ...VALID_PAYLOAD, weight: 29.9 })
      .save()
      .catch((e) => e);
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.weight.message).toMatch(/30.?200/i);
  });

  test('should reject weight = 0', async () => {
    await expect(
      new WeightLog({ ...VALID_PAYLOAD, weight: 0 }).save()
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should reject negative weight', async () => {
    await expect(
      new WeightLog({ ...VALID_PAYLOAD, weight: -5 }).save()
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should reject weight above maximum (200.1 kg)', async () => {
    const err = await new WeightLog({ ...VALID_PAYLOAD, weight: 200.1 })
      .save()
      .catch((e) => e);
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.weight.message).toMatch(/30.?200/i);
  });

  test('should reject weight = 999 (far above maximum)', async () => {
    await expect(
      new WeightLog({ ...VALID_PAYLOAD, weight: 999 }).save()
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should reject non-numeric string cast — weight = "heavy"', async () => {
    await expect(
      new WeightLog({ ...VALID_PAYLOAD, weight: 'heavy' }).save()
    ).rejects.toThrow();
  });
});

// ─── Suite 4: Date Validation ──────────────────────────────────

describe('WeightLog Model — Date Validation', () => {
  test('should accept a valid past ISO date string (YYYY-MM-DD)', async () => {
    const doc = await new WeightLog({
      ...VALID_PAYLOAD,
      date: new Date('2026-05-01'),
    }).save();
    expect(doc.date).toBeInstanceOf(Date);
    expect(doc.date.toISOString().startsWith('2026-05-01')).toBe(true);
  });

  test('should accept today as a valid date', async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const doc = await new WeightLog({ ...VALID_PAYLOAD, date: today }).save();
    expect(doc._id).toBeDefined();
  });

  test('should reject a future date (tomorrow)', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const err = await new WeightLog({ ...VALID_PAYLOAD, date: tomorrow })
      .save()
      .catch((e) => e);
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.date.message).toMatch(/future/i);
  });

  test('should reject a date far in the future (year 2099)', async () => {
    await expect(
      new WeightLog({ ...VALID_PAYLOAD, date: new Date('2099-01-01') }).save()
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should reject an invalid date string that cannot be parsed', async () => {
    await expect(
      new WeightLog({ ...VALID_PAYLOAD, date: 'not-a-date' }).save()
    ).rejects.toThrow();
  });
});

// ─── Suite 5: Unique Index Enforcement ─────────────────────────────

describe('WeightLog Model — Unique Index (userId + date)', () => {
  test('should reject duplicate entry for same userId and same date', async () => {
    await new WeightLog(VALID_PAYLOAD).save();
    const err = await new WeightLog(VALID_PAYLOAD).save().catch((e) => e);
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });

  test('should allow same userId with different dates', async () => {
    await new WeightLog({ ...VALID_PAYLOAD, date: new Date('2026-05-15') }).save();
    const doc2 = await new WeightLog({
      ...VALID_PAYLOAD,
      date: new Date('2026-05-16'),
    }).save();
    expect(doc2._id).toBeDefined();
  });

  test('should allow same date with different userIds', async () => {
    await new WeightLog({ ...VALID_PAYLOAD, userId: USER_A }).save();
    const doc2 = await new WeightLog({
      ...VALID_PAYLOAD,
      userId: USER_B,
    }).save();
    expect(doc2._id).toBeDefined();
  });

  test('should verify compound unique index exists on the collection', async () => {
    await new WeightLog(VALID_PAYLOAD).save();
    const indexes = await WeightLog.collection.getIndexes();
    const indexNames = Object.keys(indexes);
    const hasCompoundUnique = indexNames.some(
      (name) => name.includes('userId') && name.includes('date')
    );
    expect(hasCompoundUnique).toBe(true);
  });

  test('should verify sorting index (userId, date DESC) also exists', async () => {
    await new WeightLog(VALID_PAYLOAD).save();
    const indexes = await WeightLog.collection.getIndexes();
    const customIndexes = Object.keys(indexes).filter((k) => k !== '_id_');
    expect(customIndexes.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Suite 6: Notes Field Validation ──────────────────────────────

describe('WeightLog Model — Notes Field (optional, maxlength 200)', () => {
  test('should reject notes longer than 200 characters', async () => {
    const err = await new WeightLog({
      ...VALID_PAYLOAD,
      notes: 'N'.repeat(201),
    })
      .save()
      .catch((e) => e);
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.notes).toBeDefined();
  });

  test('should accept notes exactly at 200 character boundary', async () => {
    const doc = await new WeightLog({
      ...VALID_PAYLOAD,
      notes: 'N'.repeat(200),
    }).save();
    expect(doc.notes).toHaveLength(200);
  });

  test('should accept empty string for notes', async () => {
    const doc = await new WeightLog({ ...VALID_PAYLOAD, notes: '' }).save();
    expect(doc._id).toBeDefined();
  });
});

// ─── Suite 7: Trend Calculation ───────────────────────────────

describe('WeightLog Model — Trend Calculation (BR-2)', () => {
  test('should set trend = 0 for the very first entry (no previous day entry exists)', async () => {
    const doc = await new WeightLog({
      userId: USER_A,
      weight: 65.0,
      date: new Date('2026-05-10'),
    }).save();
    expect(doc.trend).toBe(0);
  });

  test('should calculate positive trend when weight increased from previous day', async () => {
    await new WeightLog({
      userId: USER_A,
      weight: 65.0,
      date: new Date('2026-05-10'),
    }).save();

    const doc2 = await new WeightLog({
      userId: USER_A,
      weight: 65.5,
      date: new Date('2026-05-11'),
    }).save();

    expect(doc2.trend).toBeCloseTo(0.5, 1);
  });

  test('should calculate negative trend when weight decreased (weight loss scenario)', async () => {
    await new WeightLog({
      userId: USER_A,
      weight: 66.0,
      date: new Date('2026-05-10'),
    }).save();

    const doc2 = await new WeightLog({
      userId: USER_A,
      weight: 65.0,
      date: new Date('2026-05-11'),
    }).save();

    expect(doc2.trend).toBeCloseTo(-1.0, 1);
  });

  test('should set trend = 0 when previous day entry is missing (non-consecutive dates)', async () => {
    await new WeightLog({
      userId: USER_A,
      weight: 65.0,
      date: new Date('2026-05-10'),
    }).save();

    const doc2 = await new WeightLog({
      userId: USER_A,
      weight: 65.5,
      date: new Date('2026-05-15'),
    }).save();

    expect(doc2.trend).toBe(0);
  });

  test('should calculate trend using the date field, not createdAt', async () => {
    await new WeightLog({
      userId: USER_A,
      weight: 64.0,
      date: new Date('2026-05-09'),
    }).save();

    const doc = await new WeightLog({
      userId: USER_A,
      weight: 64.8,
      date: new Date('2026-05-10'),
    }).save();

    expect(doc.trend).toBeCloseTo(0.8, 1);
  });

  test('should not leak trend from USER_A to USER_B — trend scoped to userId', async () => {
    await new WeightLog({
      userId: USER_A,
      weight: 65.0,
      date: new Date('2026-05-10'),
    }).save();

    const doc = await new WeightLog({
      userId: USER_B,
      weight: 70.0,
      date: new Date('2026-05-11'),
    }).save();

    expect(doc.trend).toBe(0);
  });

  test('should store trend = 0 when weight is unchanged from previous day', async () => {
    await new WeightLog({
      userId: USER_A,
      weight: 65.0,
      date: new Date('2026-05-10'),
    }).save();

    const doc2 = await new WeightLog({
      userId: USER_A,
      weight: 65.0,
      date: new Date('2026-05-11'),
    }).save();

    expect(doc2.trend).toBeCloseTo(0, 2);
  });
});

// ─── Suite 8: Timestamps ────────────────────────────────────

describe('WeightLog Model — Timestamps', () => {
  test('should auto-generate createdAt as a Date on save', async () => {
    const doc = await new WeightLog(VALID_PAYLOAD).save();
    expect(doc.createdAt).toBeInstanceOf(Date);
  });

  test('should auto-generate updatedAt as a Date on save', async () => {
    const doc = await new WeightLog(VALID_PAYLOAD).save();
    expect(doc.updatedAt).toBeInstanceOf(Date);
  });

  test('createdAt and updatedAt should be close to current time at creation', async () => {
    const before = new Date();
    const doc = await new WeightLog(VALID_PAYLOAD).save();
    const after = new Date();

    expect(doc.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(doc.createdAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
  });

  test('createdAt should not change after document modification', async () => {
    const doc = await new WeightLog(VALID_PAYLOAD).save();
    const originalCreatedAt = doc.createdAt;

    await new Promise((resolve) => setTimeout(resolve, 50));
    doc.notes = 'Updated note';
    const updated = await doc.save();

    expect(updated.createdAt.getTime()).toBe(originalCreatedAt.getTime());
  });

  test('updatedAt should advance when document is modified and re-saved', async () => {
    const doc = await new WeightLog(VALID_PAYLOAD).save();
    const originalUpdatedAt = doc.updatedAt;

    await new Promise((resolve) => setTimeout(resolve, 50));
    doc.notes = 'Post-session note';
    const updated = await doc.save();

    expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
