'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const TEST_SECRET = 'test-jwt-secret-minimum-32-chars-long!!';
const TEST_USER_ID = new mongoose.Types.ObjectId().toString();
const OTHER_USER_ID = new mongoose.Types.ObjectId().toString();

let mongoServer;
let app;
let UserProfile;

const makeToken = (userId = TEST_USER_ID, overrides = {}) =>
  jwt.sign({ sub: userId, role: 'user', ...overrides }, TEST_SECRET, { algorithm: 'HS256', expiresIn: '1h' });

const validBody = () => ({ height: 165, weight: 48, age: 22, gender: 'male' });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGO_URI = mongoUri;
  process.env.JWT_SECRET = TEST_SECRET;
  process.env.NODE_ENV = 'test';
  await mongoose.connect(mongoUri);
  app = require('../../src/app');
  UserProfile = require('../../src/models/UserProfile');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await UserProfile.deleteMany({});
});

// ── authenticate middleware ─────────────────────────────────────────────────
describe('authenticate middleware', () => {
  it('should return 401 when Authorization header is absent', async () => {
    const res = await request(app).get('/profile');
    expect(res.status).toBe(401);
  });

  it('should return 401 when Authorization header is not Bearer scheme', async () => {
    const res = await request(app).get('/profile').set('Authorization', 'Basic sometoken');
    expect(res.status).toBe(401);
  });

  it('should return 401 when token is signed with wrong secret', async () => {
    const badToken = jwt.sign({ sub: TEST_USER_ID }, 'wrong-secret', { algorithm: 'HS256' });
    const res = await request(app).get('/profile').set('Authorization', `Bearer ${badToken}`);
    expect(res.status).toBe(401);
  });

  it('should return 401 when token is expired', async () => {
    const expiredToken = jwt.sign({ sub: TEST_USER_ID }, TEST_SECRET, { algorithm: 'HS256', expiresIn: '-1s' });
    const res = await request(app).get('/profile').set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});

// ── GET /profile ────────────────────────────────────────────────────────────
describe('GET /profile', () => {
  it('should return 200 with profile data when profile exists', async () => {
    await new UserProfile({ userId: TEST_USER_ID, ...validBody() }).save();

    const res = await request(app)
      .get('/profile')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(TEST_USER_ID);
    expect(res.body.height).toBe(165);
    expect(res.body.bmi).toBe(17.63);
    expect(res.body.bodyClassification).toBe('underweight');
  });

  it('should return 404 when profile does not exist for authenticated user', async () => {
    const res = await request(app)
      .get('/profile')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });

  it('should return 401 when no token provided', async () => {
    const res = await request(app).get('/profile');
    expect(res.status).toBe(401);
  });

  it('should not expose email or auth fields in response (SR-02)', async () => {
    await new UserProfile({ userId: TEST_USER_ID, ...validBody() }).save();

    const res = await request(app)
      .get('/profile')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.body).not.toHaveProperty('email');
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('role');
    expect(res.body).not.toHaveProperty('__v');
  });

  it('should return userId matching the JWT sub claim', async () => {
    await new UserProfile({ userId: TEST_USER_ID, ...validBody() }).save();

    const res = await request(app)
      .get('/profile')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.body.userId).toBe(TEST_USER_ID);
  });
});

// ── POST /profile ───────────────────────────────────────────────────────────
describe('POST /profile', () => {
  it('should return 201 with computed bmi and bodyClassification for valid body', async () => {
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody());

    expect(res.status).toBe(201);
    expect(res.body.bmi).toBe(17.63);
    expect(res.body.bodyClassification).toBe('underweight');
  });

  it('should return 201 and userId from JWT (not from body)', async () => {
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody());

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(TEST_USER_ID);
  });

  it('should return 409 when called a second time with same userId', async () => {
    await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody());

    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(validBody());

    expect(res.status).toBe(409);
  });

  it('should confirm only one profile record exists after duplicate POST attempt', async () => {
    await request(app).post('/profile').set('Authorization', `Bearer ${makeToken()}`).send(validBody());
    await request(app).post('/profile').set('Authorization', `Bearer ${makeToken()}`).send(validBody());

    const count = await UserProfile.countDocuments({ userId: TEST_USER_ID });
    expect(count).toBe(1);
  });

  it('should return 400 when height is missing', async () => {
    const { height, ...body } = validBody();
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(body);
    expect(res.status).toBe(400);
  });

  it('should return 400 when weight is missing', async () => {
    const { weight, ...body } = validBody();
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(body);
    expect(res.status).toBe(400);
  });

  it('should return 400 when age is missing', async () => {
    const { age, ...body } = validBody();
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(body);
    expect(res.status).toBe(400);
  });

  it('should return 400 when gender is missing', async () => {
    const { gender, ...body } = validBody();
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send(body);
    expect(res.status).toBe(400);
  });

  it('should return 400 when height is below minimum (99)', async () => {
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody(), height: 99 });
    expect(res.status).toBe(400);
  });

  it('should return 400 when height is above maximum (251)', async () => {
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody(), height: 251 });
    expect(res.status).toBe(400);
  });

  it('should return 400 when weight is below minimum (19)', async () => {
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody(), weight: 19 });
    expect(res.status).toBe(400);
  });

  it('should return 400 when weight is above maximum (301)', async () => {
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody(), weight: 301 });
    expect(res.status).toBe(400);
  });

  it('should return 400 when age is below minimum (9)', async () => {
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody(), age: 9 });
    expect(res.status).toBe(400);
  });

  it('should return 400 when age is above maximum (101)', async () => {
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody(), age: 101 });
    expect(res.status).toBe(400);
  });

  it('should return 400 when age is a float', async () => {
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody(), age: 22.5 });
    expect(res.status).toBe(400);
  });

  it('should return 400 when gender is not in enum', async () => {
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody(), gender: 'other' });
    expect(res.status).toBe(400);
  });

  it('should return 400 when body contains bmi field', async () => {
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody(), bmi: 99 });
    expect(res.status).toBe(400);
  });

  it('should return 400 when body contains bodyClassification field', async () => {
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody(), bodyClassification: 'obese' });
    expect(res.status).toBe(400);
  });

  it('should return 400 when height is boundary-invalid (100-1 = 99)', async () => {
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody(), height: 99 });
    expect(res.status).toBe(400);
  });

  it('should accept height = 100 (boundary min)', async () => {
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody(), height: 100 });
    expect(res.status).toBe(201);
  });

  it('should accept height = 250 (boundary max)', async () => {
    const res = await request(app)
      .post('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ ...validBody(), height: 250 });
    expect(res.status).toBe(201);
  });

  it('should return 401 when no token provided', async () => {
    const res = await request(app).post('/profile').send(validBody());
    expect(res.status).toBe(401);
  });
});

// ── PUT /profile ────────────────────────────────────────────────────────────
describe('PUT /profile', () => {
  beforeEach(async () => {
    await new UserProfile({ userId: TEST_USER_ID, ...validBody() }).save();
  });

  it('should return 200 with recalculated bmi after updating weight only', async () => {
    const res = await request(app)
      .put('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ weight: 60 });

    expect(res.status).toBe(200);
    // 60 / (1.65)^2 = 22.04
    expect(res.body.bmi).toBe(22.04);
    expect(res.body.bodyClassification).toBe('normal');
  });

  it('should keep height when only weight is updated', async () => {
    const res = await request(app)
      .put('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ weight: 60 });

    expect(res.body.height).toBe(165);
  });

  it('should keep age and gender when only height is updated', async () => {
    const res = await request(app)
      .put('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ height: 170 });

    expect(res.body.age).toBe(22);
    expect(res.body.gender).toBe('male');
  });

  it('should return 200 when updating all 4 fields', async () => {
    const res = await request(app)
      .put('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ height: 170, weight: 65, age: 25, gender: 'female' });

    expect(res.status).toBe(200);
    expect(res.body.height).toBe(170);
    expect(res.body.weight).toBe(65);
    expect(res.body.age).toBe(25);
    expect(res.body.gender).toBe('female');
  });

  it('should return 400 when body is empty object {}', async () => {
    const res = await request(app)
      .put('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('should return 404 when profile does not exist', async () => {
    const otherToken = makeToken(OTHER_USER_ID);
    const res = await request(app)
      .put('/profile')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ weight: 60 });
    expect(res.status).toBe(404);
  });

  it('should return 400 when height is out of range in update', async () => {
    const res = await request(app)
      .put('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ height: 50 });
    expect(res.status).toBe(400);
  });

  it('should return 400 when weight is out of range in update', async () => {
    const res = await request(app)
      .put('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ weight: 5 });
    expect(res.status).toBe(400);
  });

  it('should return 400 when body contains bmi field', async () => {
    const res = await request(app)
      .put('/profile')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ weight: 60, bmi: 999 });
    expect(res.status).toBe(400);
  });

  it('should return 401 when no token provided', async () => {
    const res = await request(app).put('/profile').send({ weight: 60 });
    expect(res.status).toBe(401);
  });
});

// ── GET /profile/bmi ────────────────────────────────────────────────────────
describe('GET /profile/bmi', () => {
  it('should return 200 with bmi=17.63 and bodyClassification="underweight" for height=165&weight=48', async () => {
    const res = await request(app)
      .get('/profile/bmi?height=165&weight=48')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.bmi).toBe(17.63);
    expect(res.body.bodyClassification).toBe('underweight');
  });

  it('should return bodyClassification "normal" for height=170&weight=70', async () => {
    const res = await request(app)
      .get('/profile/bmi?height=170&weight=70')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.body.bodyClassification).toBe('normal');
  });

  it('should return bodyClassification "overweight" for height=170&weight=80', async () => {
    const res = await request(app)
      .get('/profile/bmi?height=170&weight=80')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.body.bodyClassification).toBe('overweight');
  });

  it('should return bodyClassification "obese" for height=170&weight=100', async () => {
    const res = await request(app)
      .get('/profile/bmi?height=170&weight=100')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.body.bodyClassification).toBe('obese');
  });

  it('should return 400 when height param is missing', async () => {
    const res = await request(app)
      .get('/profile/bmi?weight=48')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(400);
  });

  it('should return 400 when weight param is missing', async () => {
    const res = await request(app)
      .get('/profile/bmi?height=165')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(400);
  });

  it('should return 400 when both params are missing', async () => {
    const res = await request(app)
      .get('/profile/bmi')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(400);
  });

  it('should return 400 when height is out of range (height=50)', async () => {
    const res = await request(app)
      .get('/profile/bmi?height=50&weight=48')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(400);
  });

  it('should return 400 when height is not a number (height=abc)', async () => {
    const res = await request(app)
      .get('/profile/bmi?height=abc&weight=48')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(400);
  });

  it('should not create any UserProfile document in DB', async () => {
    await request(app)
      .get('/profile/bmi?height=165&weight=48')
      .set('Authorization', `Bearer ${makeToken()}`);

    const count = await UserProfile.countDocuments();
    expect(count).toBe(0);
  });

  it('should return 401 when no token provided', async () => {
    const res = await request(app).get('/profile/bmi?height=165&weight=48');
    expect(res.status).toBe(401);
  });
});
