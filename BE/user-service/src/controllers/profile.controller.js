'use strict';

const profileService = require('../services/profile.service');

function formatProfile(doc) {
  return {
    userId: doc.userId,
    height: doc.height,
    weight: doc.weight,
    age: doc.age,
    gender: doc.gender,
    bmi: doc.bmi,
    bodyClassification: doc.bodyClassification,
    updatedAt: doc.updatedAt,
  };
}

async function getProfile(req, res, next) {
  try {
    const profile = await profileService.getProfile(req.user.userId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.status(200).json(formatProfile(profile));
  } catch (err) {
    next(err);
  }
}

async function createProfile(req, res, next) {
  try {
    const profile = await profileService.createProfile(req.user.userId, req.body);
    res.status(201).json(formatProfile(profile));
  } catch (err) {
    if (err.statusCode === 409 || err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Profile already exists for this user' });
    }
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const profile = await profileService.updateProfile(req.user.userId, req.body);
    res.status(200).json(formatProfile(profile));
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
}

async function getBmi(req, res, next) {
  try {
    const { height, weight } = req.query;

    if (height === undefined || height === null || height === '') {
      return res.status(400).json({ success: false, message: 'height is required' });
    }
    if (weight === undefined || weight === null || weight === '') {
      return res.status(400).json({ success: false, message: 'weight is required' });
    }

    const h = Number(height);
    const w = Number(weight);

    if (isNaN(h) || isNaN(w)) {
      return res.status(400).json({ success: false, message: 'height and weight must be numbers' });
    }
    if (h < 100 || h > 250) {
      return res.status(400).json({ success: false, message: 'height must be between 100 and 250' });
    }
    if (w < 20 || w > 300) {
      return res.status(400).json({ success: false, message: 'weight must be between 20 and 300' });
    }

    const result = profileService.calcBmi(h, w);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, createProfile, updateProfile, getBmi };
