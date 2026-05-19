'use strict';

const mongoose = require('mongoose');
const { calculateBmi, classifyBmi } = require('../utils/bmi');

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      unique: true,
    },
    height: {
      type: Number,
      required: [true, 'height is required'],
      min: [100, 'height must be at least 100 cm'],
      max: [250, 'height must be at most 250 cm'],
    },
    weight: {
      type: Number,
      required: [true, 'weight is required'],
      min: [20, 'weight must be at least 20 kg'],
      max: [300, 'weight must be at most 300 kg'],
    },
    age: {
      type: Number,
      required: [true, 'age is required'],
      min: [10, 'age must be at least 10'],
      max: [100, 'age must be at most 100'],
      validate: {
        validator: Number.isInteger,
        message: 'age must be an integer',
      },
    },
    gender: {
      type: String,
      required: [true, 'gender is required'],
      enum: {
        values: ['male', 'female'],
        message: 'gender must be male or female',
      },
    },
    bmi: {
      type: Number,
    },
    bodyClassification: {
      type: String,
      enum: ['underweight', 'normal', 'overweight', 'obese'],
    },
  },
  { timestamps: true }
);

// BR-02: BMI is always computed server-side on .save().
// Do NOT use findOneAndUpdate() to update height/weight — the hook will not run.
// Route handlers must: find() the document then call .save() to ensure recomputation.
userProfileSchema.pre('save', function (next) {
  this.bmi = calculateBmi(this.height, this.weight);
  this.bodyClassification = classifyBmi(this.bmi);
  next();
});

// Guard: reject findOneAndUpdate calls that touch height/weight to prevent stale BMI.
// Mongoose normalizes bare updates to $set before this hook runs, so checking $set is sufficient.
userProfileSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const setFields = Object.keys((update && update.$set) || {});
  if (setFields.includes('height') || setFields.includes('weight')) {
    return next(new Error('Use .save() when updating height or weight to ensure BMI recomputation (BR-02)'));
  }
  next();
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
