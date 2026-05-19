'use strict';

const UserProfile = require('../models/UserProfile');
const { calculateBmi, classifyBmi } = require('../utils/bmi');

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 409;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 404;
  }
}

async function getProfile(userId) {
  return UserProfile.findOne({ userId });
}

async function createProfile(userId, data) {
  const existing = await UserProfile.findOne({ userId });
  if (existing) {
    throw new ConflictError('Profile already exists for this user');
  }

  const { height, weight, age, gender } = data;
  const profile = new UserProfile({ userId, height, weight, age, gender });
  return profile.save();
}

async function updateProfile(userId, data) {
  const profile = await UserProfile.findOne({ userId });
  if (!profile) {
    throw new NotFoundError('Profile not found');
  }

  const allowed = ['height', 'weight', 'age', 'gender'];
  for (const field of allowed) {
    if (field in data) {
      profile[field] = data[field];
    }
  }

  return profile.save();
}

function calcBmi(height, weight) {
  const bmi = calculateBmi(height, weight);
  const bodyClassification = classifyBmi(bmi);
  return { bmi, bodyClassification };
}

module.exports = { getProfile, createProfile, updateProfile, calcBmi, ConflictError, NotFoundError };
