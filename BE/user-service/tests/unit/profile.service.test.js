'use strict';

jest.mock('../../src/models/UserProfile');
const UserProfile = require('../../src/models/UserProfile');
const { getProfile, createProfile, updateProfile, calcBmi, ConflictError, NotFoundError } = require('../../src/services/profile.service');

beforeEach(() => {
  jest.clearAllMocks();
});

// ── getProfile ──────────────────────────────────────────────────────────────
describe('getProfile(userId)', () => {
  it('should return the profile document when found', async () => {
    const mockDoc = { userId: 'user-123', height: 165, weight: 48 };
    UserProfile.findOne.mockResolvedValue(mockDoc);

    const result = await getProfile('user-123');
    expect(result).toBe(mockDoc);
    expect(UserProfile.findOne).toHaveBeenCalledWith({ userId: 'user-123' });
  });

  it('should return null when no profile exists', async () => {
    UserProfile.findOne.mockResolvedValue(null);

    const result = await getProfile('user-not-exist');
    expect(result).toBeNull();
  });
});

// ── createProfile ───────────────────────────────────────────────────────────
describe('createProfile(userId, data)', () => {
  it('should create and return a new profile document', async () => {
    UserProfile.findOne.mockResolvedValue(null);

    const savedDoc = {
      userId: 'user-new',
      height: 165,
      weight: 48,
      age: 22,
      gender: 'male',
      bmi: 17.63,
      bodyClassification: 'underweight',
    };
    const mockSave = jest.fn().mockResolvedValue(savedDoc);
    UserProfile.mockImplementation(() => ({ save: mockSave }));

    const result = await createProfile('user-new', { height: 165, weight: 48, age: 22, gender: 'male' });
    expect(mockSave).toHaveBeenCalled();
    expect(result).toBe(savedDoc);
  });

  it('should throw ConflictError (statusCode 409) when profile already exists', async () => {
    UserProfile.findOne.mockResolvedValue({ userId: 'user-dup' });

    await expect(createProfile('user-dup', { height: 165, weight: 48, age: 22, gender: 'male' }))
      .rejects.toThrow(ConflictError);

    await expect(createProfile('user-dup', { height: 165, weight: 48, age: 22, gender: 'male' }))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it('should not pass bmi/bodyClassification from data to model constructor', async () => {
    UserProfile.findOne.mockResolvedValue(null);

    const capturedArgs = [];
    const mockSave = jest.fn().mockResolvedValue({ bmi: 17.63, bodyClassification: 'underweight' });
    UserProfile.mockImplementation((args) => {
      capturedArgs.push(args);
      return { save: mockSave };
    });

    await createProfile('user-new', { height: 165, weight: 48, age: 22, gender: 'male', bmi: 99, bodyClassification: 'obese' });
    expect(capturedArgs[0]).not.toHaveProperty('bmi');
    expect(capturedArgs[0]).not.toHaveProperty('bodyClassification');
  });
});

// ── updateProfile ───────────────────────────────────────────────────────────
describe('updateProfile(userId, data)', () => {
  it('should return updated profile after partial update (weight only)', async () => {
    const mockDoc = {
      userId: 'user-123',
      height: 165,
      weight: 48,
      age: 22,
      gender: 'male',
      save: jest.fn().mockResolvedValue({ userId: 'user-123', height: 165, weight: 55, age: 22, gender: 'male', bmi: 20.2 }),
    };
    UserProfile.findOne.mockResolvedValue(mockDoc);

    const result = await updateProfile('user-123', { weight: 55 });
    expect(mockDoc.weight).toBe(55);
    expect(mockDoc.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should keep fields not included in update data (age, gender unchanged)', async () => {
    const mockDoc = {
      userId: 'user-123',
      height: 165,
      weight: 48,
      age: 22,
      gender: 'male',
      save: jest.fn().mockResolvedValue({}),
    };
    UserProfile.findOne.mockResolvedValue(mockDoc);

    await updateProfile('user-123', { height: 170 });
    expect(mockDoc.age).toBe(22);
    expect(mockDoc.gender).toBe('male');
    expect(mockDoc.height).toBe(170);
    expect(mockDoc.weight).toBe(48);
  });

  it('should assign all provided fields onto the existing document', async () => {
    const mockDoc = {
      userId: 'user-123',
      height: 165,
      weight: 48,
      age: 22,
      gender: 'male',
      save: jest.fn().mockResolvedValue({}),
    };
    UserProfile.findOne.mockResolvedValue(mockDoc);

    await updateProfile('user-123', { height: 170, weight: 60, age: 25, gender: 'female' });
    expect(mockDoc.height).toBe(170);
    expect(mockDoc.weight).toBe(60);
    expect(mockDoc.age).toBe(25);
    expect(mockDoc.gender).toBe('female');
    expect(mockDoc.save).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundError (statusCode 404) when profile does not exist', async () => {
    UserProfile.findOne.mockResolvedValue(null);

    await expect(updateProfile('user-ghost', { weight: 60 }))
      .rejects.toThrow(NotFoundError);

    await expect(updateProfile('user-ghost', { weight: 60 }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('should call doc.save() — not findOneAndUpdate', async () => {
    const mockDoc = {
      userId: 'user-123',
      height: 165,
      weight: 48,
      age: 22,
      gender: 'male',
      save: jest.fn().mockResolvedValue({}),
    };
    UserProfile.findOne.mockResolvedValue(mockDoc);
    UserProfile.findOneAndUpdate = jest.fn();

    await updateProfile('user-123', { weight: 60 });
    expect(mockDoc.save).toHaveBeenCalled();
    expect(UserProfile.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

// ── calcBmi ─────────────────────────────────────────────────────────────────
describe('calcBmi(height, weight)', () => {
  it('should return { bmi: 17.63, bodyClassification: "underweight" } for height=165, weight=48', () => {
    const result = calcBmi(165, 48);
    expect(result).toEqual({ bmi: 17.63, bodyClassification: 'underweight' });
  });

  it('should return bodyClassification "normal" for height=170, weight=70', () => {
    const result = calcBmi(170, 70);
    expect(result.bodyClassification).toBe('normal');
  });

  it('should return bodyClassification "overweight" for height=170, weight=80', () => {
    const result = calcBmi(170, 80);
    expect(result.bodyClassification).toBe('overweight');
  });

  it('should return bodyClassification "obese" for height=170, weight=100', () => {
    const result = calcBmi(170, 100);
    expect(result.bodyClassification).toBe('obese');
  });

  it('should not interact with DB (UserProfile methods not called)', () => {
    UserProfile.findOne.mockClear();
    calcBmi(165, 48);
    expect(UserProfile.findOne).not.toHaveBeenCalled();
  });

  it('should return bmi rounded to 2 decimal places', () => {
    const result = calcBmi(175, 63);
    expect(typeof result.bmi).toBe('number');
    const decimals = result.bmi.toString().split('.')[1];
    expect(decimals ? decimals.length : 0).toBeLessThanOrEqual(2);
  });
});
