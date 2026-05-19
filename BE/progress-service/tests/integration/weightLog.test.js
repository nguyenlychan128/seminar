'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../src/app');
const WeightLog = require('../../src/models/WeightLog');

let mongoServer;

const TEST_JWT_SECRET = 'test-secret-progress-service-32chars!!';

const USER_A_ID = new mongoose.Types.ObjectId();
const USER_B_ID = new mongoose.Types.ObjectId();

function makeToken(userId, overrides = {}) {
  return jwt.sign(
    {
      userId: userId.toString(),
      email: 'test@fitgainer.com',
      role: 'user',
      ...overrides,
    },
    TEST_JWT_SECRET,
    { expiresIn: '1h', algorithm: 'HS256' }
  );
}

const TOKEN_A = makeToken(USER_A_ID);
const TOKEN_B = makeToken(USER_B_ID);

function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

const TODAY = isoDate(0);
const YESTERDAY = isoDate(-1);
const TWO_DAYS_AGO = isoDate(-2);
const TOMORROW = isoDate(1);
const THIRTY_DAYS_AGO = isoDate(-30);
const THIRTY_ONE_DAYS_AGO = isoDate(-31);

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
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

// ═════════════════════════════════════════════════════════════════════════════
// POST /progress/weight
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /progress/weight — Create Weight Log', () => {
  test('TC-001: should return 201 with full entry when weight and date are valid', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 65.5, date: YESTERDAY });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.userId).toBe(USER_A_ID.toString());
    expect(res.body.weight).toBe(65.5);
    expect(res.body.date).toContain(YESTERDAY);
    expect(typeof res.body.trend).toBe('number');
    expect(res.body.createdAt).toBeDefined();
  });

  test('TC-002: should default date to today when date field is omitted', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 65.0 });

    expect(res.status).toBe(201);
    expect(res.body.date).toContain(TODAY);
  });

  test('TC-003: should accept a past date and return 201', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 63.0, date: THIRTY_DAYS_AGO });

    expect(res.status).toBe(201);
    expect(res.body.date).toContain(THIRTY_DAYS_AGO);
  });

  test('TC-004: should set trend = 0 for the first weight entry (no previous day)', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 65.0, date: TWO_DAYS_AGO });

    expect(res.status).toBe(201);
    expect(res.body.trend).toBe(0);
  });

  test('TC-005: should calculate positive trend for second consecutive day entry', async () => {
    await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 65.0, date: TWO_DAYS_AGO });

    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 65.5, date: YESTERDAY });

    expect(res.status).toBe(201);
    expect(res.body.trend).toBeCloseTo(0.5, 1);
  });

  test('TC-006: should calculate negative trend when weight decreased (weight loss)', async () => {
    await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 66.0, date: TWO_DAYS_AGO });

    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 65.0, date: YESTERDAY });

    expect(res.status).toBe(201);
    expect(res.body.trend).toBeCloseTo(-1.0, 1);
  });

  test('TC-007: should persist the new entry in the database after 201 response', async () => {
    await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 65.5, date: YESTERDAY });

    const doc = await WeightLog.findOne({ userId: USER_A_ID });
    expect(doc).not.toBeNull();
    expect(doc.weight).toBe(65.5);
  });

  test('TC-008: should accept weight at exact lower boundary (30 kg)', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 30, date: YESTERDAY });

    expect(res.status).toBe(201);
    expect(res.body.weight).toBe(30);
  });

  test('TC-009: should accept weight at exact upper boundary (200 kg)', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 200, date: YESTERDAY });

    expect(res.status).toBe(201);
    expect(res.body.weight).toBe(200);
  });

  test('TC-010: should return 400 when weight is missing', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ date: YESTERDAY });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/weight is required/i);
  });

  test('TC-011: should return 400 when weight is below minimum (29 kg)', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 29, date: YESTERDAY });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/30.?200/i);
  });

  test('TC-012: should return 400 when weight is above maximum (201 kg)', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 201, date: YESTERDAY });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/30.?200/i);
  });

  test('TC-013: should return 400 when weight is a non-numeric string', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 'heavy', date: YESTERDAY });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/number/i);
  });

  test('TC-014: should return 400 when weight is null', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: null, date: YESTERDAY });

    expect(res.status).toBe(400);
  });

  test('TC-015: should return 400 when weight is 0', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 0, date: YESTERDAY });

    expect(res.status).toBe(400);
  });

  test('TC-016: should return 400 when weight is negative', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: -10, date: YESTERDAY });

    expect(res.status).toBe(400);
  });

  test('TC-017: should return 400 when date format is invalid (not ISO)', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 65.0, date: '18/05/2026' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid date format/i);
  });

  test('TC-018: should return 400 when date is a random string', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 65.0, date: 'not-a-date' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid date format/i);
  });

  test('TC-019: should return 400 when date is in the future (tomorrow)', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 65.0, date: TOMORROW });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/future/i);
  });

  test('TC-020: should return 400 when date is far future (year 2099)', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 65.0, date: '2099-01-01' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/future/i);
  });

  test('TC-021: should return 409 when same user logs weight on the same date twice', async () => {
    await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 65.0, date: YESTERDAY });

    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 66.0, date: YESTERDAY });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  test('TC-022: should allow USER_B to log on the same date as USER_A (different users)', async () => {
    await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 65.0, date: YESTERDAY });

    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_B}`)
      .send({ weight: 70.0, date: YESTERDAY });

    expect(res.status).toBe(201);
  });

  test('TC-023: should return 401 when Authorization header is missing', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .send({ weight: 65.0, date: YESTERDAY });

    expect(res.status).toBe(401);
  });

  test('TC-024: should return 401 when token is malformed (not a valid JWT)', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', 'Bearer invalid.token.value')
      .send({ weight: 65.0, date: YESTERDAY });

    expect(res.status).toBe(401);
  });

  test('TC-025: should return 401 when token is signed with wrong secret', async () => {
    const badToken = jwt.sign({ userId: USER_A_ID.toString() }, 'wrong-secret', {
      expiresIn: '1h',
    });
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${badToken}`)
      .send({ weight: 65.0, date: YESTERDAY });

    expect(res.status).toBe(401);
  });

  test('TC-026: should return 401 when token is expired', async () => {
    const expiredToken = jwt.sign(
      { userId: USER_A_ID.toString(), email: 'a@b.com', role: 'user' },
      TEST_JWT_SECRET,
      { expiresIn: '-1s', algorithm: 'HS256' }
    );
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({ weight: 65.0, date: YESTERDAY });

    expect(res.status).toBe(401);
  });

  test('TC-027: should only create entry for the authenticated user (userId from JWT, not body)', async () => {
    const res = await request(app)
      .post('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`)
      .send({ weight: 65.0, date: YESTERDAY, userId: USER_B_ID.toString() });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(USER_A_ID.toString());
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /progress/weight
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /progress/weight — Fetch Weight History', () => {
  test('TC-028: should return 200 with data array for authenticated user', async () => {
    await WeightLog.create({
      userId: USER_A_ID,
      weight: 65.5,
      date: new Date(YESTERDAY),
      trend: 0,
    });

    const res = await request(app)
      .get('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.count).toBe('number');
    expect(res.body.startDate).toBeDefined();
    expect(res.body.endDate).toBeDefined();
  });

  test('TC-029: should return 200 with empty data array when user has no entries', async () => {
    const res = await request(app)
      .get('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  test('TC-030: should default to last 30 entries when no query params provided', async () => {
    const entries = [];
    for (let i = 1; i <= 35; i++) {
      entries.push({
        userId: USER_A_ID,
        weight: 60 + i * 0.1,
        date: new Date(isoDate(-i)),
        trend: 0,
      });
    }
    await WeightLog.insertMany(entries);

    const res = await request(app)
      .get('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(30);
  });

  test('TC-031: should return entries sorted descending by date (newest first)', async () => {
    await WeightLog.insertMany([
      { userId: USER_A_ID, weight: 65.0, date: new Date(TWO_DAYS_AGO), trend: 0 },
      { userId: USER_A_ID, weight: 65.5, date: new Date(YESTERDAY), trend: 0.5 },
    ]);

    const res = await request(app)
      .get('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    const firstDate = new Date(res.body.data[0].date);
    const secondDate = new Date(res.body.data[1].date);
    expect(firstDate.getTime()).toBeGreaterThan(secondDate.getTime());
  });

  test('TC-032: should filter entries by startDate query param', async () => {
    await WeightLog.insertMany([
      { userId: USER_A_ID, weight: 63.0, date: new Date(THIRTY_ONE_DAYS_AGO), trend: 0 },
      { userId: USER_A_ID, weight: 65.0, date: new Date(YESTERDAY), trend: 0 },
    ]);

    const res = await request(app)
      .get('/progress/weight')
      .query({ startDate: THIRTY_DAYS_AGO })
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((e) => new Date(e.date) >= new Date(THIRTY_DAYS_AGO))).toBe(true);
  });

  test('TC-033: should filter entries by endDate query param', async () => {
    await WeightLog.insertMany([
      { userId: USER_A_ID, weight: 65.0, date: new Date(TWO_DAYS_AGO), trend: 0 },
      { userId: USER_A_ID, weight: 65.5, date: new Date(TODAY), trend: 0 },
    ]);

    const res = await request(app)
      .get('/progress/weight')
      .query({ endDate: YESTERDAY })
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((e) => new Date(e.date) <= new Date(YESTERDAY))).toBe(true);
  });

  test('TC-034: should filter by both startDate and endDate (date range)', async () => {
    const minus5 = isoDate(-5);
    const minus4 = isoDate(-4);
    const minus3 = isoDate(-3);
    const minus2 = isoDate(-2);
    const minus1 = isoDate(-1);

    await WeightLog.insertMany([
      { userId: USER_A_ID, weight: 64.0, date: new Date(minus5), trend: 0 },
      { userId: USER_A_ID, weight: 64.5, date: new Date(minus3), trend: 0 },
      { userId: USER_A_ID, weight: 65.0, date: new Date(minus1), trend: 0 },
    ]);

    const res = await request(app)
      .get('/progress/weight')
      .query({ startDate: minus4, endDate: minus2 })
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].date).toContain(minus3);
  });

  test('TC-035: should respect limit query param and return at most N entries', async () => {
    const entries = [];
    for (let i = 1; i <= 15; i++) {
      entries.push({
        userId: USER_A_ID,
        weight: 60 + i * 0.1,
        date: new Date(isoDate(-i)),
        trend: 0,
      });
    }
    await WeightLog.insertMany(entries);

    const res = await request(app)
      .get('/progress/weight')
      .query({ limit: 5 })
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });

  test('TC-036: should return correct count reflecting actual number of entries in response', async () => {
    await WeightLog.insertMany([
      { userId: USER_A_ID, weight: 65.0, date: new Date(TWO_DAYS_AGO), trend: 0 },
      { userId: USER_A_ID, weight: 65.5, date: new Date(YESTERDAY), trend: 0.5 },
      { userId: USER_A_ID, weight: 66.0, date: new Date(TODAY), trend: 0.5 },
    ]);

    const res = await request(app)
      .get('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
    expect(res.body.data.length).toBe(3);
  });

  test('TC-037: should not return entries belonging to other users', async () => {
    await WeightLog.insertMany([
      { userId: USER_A_ID, weight: 65.0, date: new Date(TWO_DAYS_AGO), trend: 0 },
      { userId: USER_A_ID, weight: 65.5, date: new Date(YESTERDAY), trend: 0.5 },
      { userId: USER_B_ID, weight: 70.0, date: new Date(YESTERDAY), trend: 0 },
    ]);

    const res = await request(app)
      .get('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.data.every((e) => e.userId === USER_A_ID.toString())).toBe(true);
  });

  test('TC-038: should include weight, date, trend, createdAt in each entry object', async () => {
    await WeightLog.create({
      userId: USER_A_ID,
      weight: 65.5,
      date: new Date(YESTERDAY),
      trend: 0,
    });

    const res = await request(app)
      .get('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    const entry = res.body.data[0];
    expect(entry._id).toBeDefined();
    expect(entry.weight).toBeDefined();
    expect(entry.date).toBeDefined();
    expect(typeof entry.trend).toBe('number');
    expect(entry.createdAt).toBeDefined();
  });

  test('TC-039: response should include startDate and endDate reflecting the effective query range', async () => {
    const res = await request(app)
      .get('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    expect(res.body.startDate).toBeDefined();
    expect(res.body.endDate).toBeDefined();
    expect(new Date(res.body.startDate).toString()).not.toBe('Invalid Date');
    expect(new Date(res.body.endDate).toString()).not.toBe('Invalid Date');
  });

  test('TC-040: should return 400 when startDate query param has invalid format', async () => {
    const res = await request(app)
      .get('/progress/weight')
      .query({ startDate: 'not-a-date' })
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid date format/i);
  });

  test('TC-041: should return 400 when endDate query param has invalid format', async () => {
    const res = await request(app)
      .get('/progress/weight')
      .query({ endDate: '31-12-2026' })
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid date format/i);
  });

  test('TC-042: should return 400 when limit is not a positive integer', async () => {
    const res = await request(app)
      .get('/progress/weight')
      .query({ limit: 'abc' })
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(400);
  });

  test('TC-043: should return 400 when limit is 0 or negative', async () => {
    const res = await request(app)
      .get('/progress/weight')
      .query({ limit: 0 })
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(400);
  });

  test('TC-044: should return 401 when Authorization header is missing on GET', async () => {
    const res = await request(app).get('/progress/weight');

    expect(res.status).toBe(401);
  });

  test('TC-045: should return 401 when GET token is expired', async () => {
    const expiredToken = jwt.sign(
      { userId: USER_A_ID.toString(), email: 'a@b.com', role: 'user' },
      TEST_JWT_SECRET,
      { expiresIn: '-1s', algorithm: 'HS256' }
    );
    const res = await request(app)
      .get('/progress/weight')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });

  test('TC-046: unique compound index should be enforced at DB level (not just service layer)', async () => {
    await WeightLog.create({
      userId: USER_A_ID,
      weight: 65.0,
      date: new Date(YESTERDAY),
      trend: 0,
    });

    const duplicate = new WeightLog({
      userId: USER_A_ID,
      weight: 66.0,
      date: new Date(YESTERDAY),
      trend: 0,
    });

    const err = await duplicate.save().catch((e) => e);
    expect(err.code).toBe(11000);
  });

  test('TC-047: GET should return entries only within default 30-day window when no dates specified', async () => {
    await WeightLog.insertMany([
      {
        userId: USER_A_ID,
        weight: 63.0,
        date: new Date(isoDate(-31)),
        trend: 0,
      },
      {
        userId: USER_A_ID,
        weight: 65.5,
        date: new Date(YESTERDAY),
        trend: 0,
      },
    ]);

    const res = await request(app)
      .get('/progress/weight')
      .set('Authorization', `Bearer ${TOKEN_A}`);

    expect(res.status).toBe(200);
    expect(
      res.body.data.every((e) => new Date(e.date) >= new Date(isoDate(-30)))
    ).toBe(true);
  });
});
