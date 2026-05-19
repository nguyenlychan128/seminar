'use strict';

const mongoose = require('mongoose');

const planExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    muscleGroup: {
      type: String,
      required: true,
      enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'],
    },
    equipment: {
      type: String,
      required: false,
    },
    videoUrl: {
      type: String,
      default: null,
    },
    sets: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    reps: {
      type: String,
      required: true,
    },
    restSeconds: {
      type: Number,
      required: true,
      min: 30,
      max: 300,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },
    dayLabel: {
      type: String,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    isRestDay: {
      type: Boolean,
      required: true,
      default: false,
    },
    exercises: {
      type: [planExerciseSchema],
      default: [],
    },
  },
  { _id: false }
);

const weekSchema = new mongoose.Schema(
  {
    weekNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    days: {
      type: [daySchema],
      required: true,
    },
  },
  { _id: false }
);

const workoutPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    durationWeeks: {
      type: Number,
      required: true,
      default: 4,
    },
    daysPerWeek: {
      type: Number,
      required: true,
      default: 3,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    weeks: {
      type: [weekSchema],
      required: true,
      validate: {
        validator: function (arr) {
          return arr && arr.length > 0;
        },
        message: 'weeks array must contain at least one week',
      },
    },
    generatedFrom: {
      type: {
        weight: Number,
        height: Number,
        bmi: Number,
        gender: String,
      },
      default: {},
    },
  },
  { timestamps: true }
);

workoutPlanSchema.index({ userId: 1 });
workoutPlanSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
