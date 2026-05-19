'use strict';

const mongoose = require('mongoose');

// ── SetResult sub-schema ────────────────────────────────────────────────────
const setResultSchema = new mongoose.Schema(
  {
    setNumber: {
      type: Number,
      required: [true, 'setNumber is required'],
      min: [1, 'setNumber must be at least 1'],
    },
    actualReps: {
      type: Number,
      required: [true, 'actualReps is required'],
      min: [0, 'actualReps cannot be negative'],
      max: [100, 'actualReps cannot exceed 100'],
    },
    weight: {
      type: Number,
      required: [true, 'weight is required'],
      min: [0, 'weight cannot be negative'],
      max: [500, 'weight cannot exceed 500'],
    },
    rpe: {
      type: Number,
      required: false,
      min: [1, 'rpe must be at least 1'],
      max: [10, 'rpe cannot exceed 10'],
    },
    notes: {
      type: String,
      required: false,
      maxlength: [200, 'set notes cannot exceed 200 characters'],
      default: '',
    },
  },
  { _id: false }
);

// ── ExerciseSession sub-schema ──────────────────────────────────────────────
const exerciseSessionSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: String,
      required: [true, 'exerciseId is required'],
    },
    name: {
      type: String,
      required: [true, 'exercise name is required'],
    },
    muscleGroup: {
      type: String,
      required: [true, 'muscleGroup is required'],
      enum: {
        values: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'],
        message: 'muscleGroup must be one of: chest, back, shoulders, arms, legs, core',
      },
    },
    status: {
      type: String,
      required: [true, 'exercise status is required'],
      enum: {
        values: ['completed', 'skipped'],
        message: 'status must be completed or skipped',
      },
    },
    plannedSets: {
      type: Number,
      required: [true, 'plannedSets is required'],
      min: [1, 'plannedSets must be at least 1'],
    },
    plannedReps: {
      type: String,
      required: [true, 'plannedReps is required'],
    },
    sets: {
      type: [setResultSchema],
      default: [],
    },
    notes: {
      type: String,
      required: false,
      maxlength: [300, 'exercise notes cannot exceed 300 characters'],
      default: '',
    },
  },
  { _id: false }
);

// ── WorkoutSession root schema ──────────────────────────────────────────────
const workoutSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
    },
    planId: {
      type: String,
      required: [true, 'planId is required'],
    },
    weekNumber: {
      type: Number,
      required: [true, 'weekNumber is required'],
      min: [1, 'weekNumber must be at least 1'],
    },
    dayNumber: {
      type: Number,
      required: [true, 'dayNumber is required'],
      min: [1, 'dayNumber must be at least 1'],
      max: [7, 'dayNumber cannot exceed 7'],
    },
    sessionDate: {
      type: Date,
      required: [true, 'sessionDate is required'],
    },
    exercises: {
      type: [exerciseSessionSchema],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: 'exercises must have at least 1 item',
      },
    },
    totalDuration: {
      type: Number,
      required: false,
      min: [0, 'totalDuration cannot be negative'],
      max: [300, 'totalDuration cannot exceed 300 minutes'],
    },
    mood: {
      type: String,
      required: false,
      enum: {
        values: ['great', 'good', 'ok', 'tired'],
        message: 'mood must be one of: great, good, ok, tired',
      },
    },
    notes: {
      type: String,
      required: false,
      maxlength: [500, 'session notes cannot exceed 500 characters'],
      default: '',
    },
    completedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// Unique compound index: one session per user/plan/week/day/date
workoutSessionSchema.index(
  { userId: 1, planId: 1, weekNumber: 1, dayNumber: 1, sessionDate: 1 },
  { unique: true }
);

// Single-field indexes for query performance
workoutSessionSchema.index({ userId: 1 });
workoutSessionSchema.index({ sessionDate: 1 });

// ── Pre-save hooks ───────────────────────────────────────────────────────────
workoutSessionSchema.pre('save', function (next) {
  // BR-02: sessionDate must not be in the future
  // Normalize sessionDate to midnight UTC for consistent duplicate detection
  const sessionDate = new Date(this.sessionDate);
  const dayStart = new Date(Date.UTC(
    sessionDate.getUTCFullYear(),
    sessionDate.getUTCMonth(),
    sessionDate.getUTCDate()
  ));
  this.sessionDate = dayStart;

  // Check date is not in future
  const now = new Date();
  const todayStart = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));
  if (dayStart > todayStart) {
    return next(new Error('sessionDate cannot be in the future'));
  }

  // BR-03: completed exercises must have at least 1 set recorded
  if (Array.isArray(this.exercises)) {
    for (const ex of this.exercises) {
      if (ex.status === 'completed' && (!ex.sets || ex.sets.length === 0)) {
        return next(
          new Error(
            `Exercise "${ex.name || ex.exerciseId}" is marked completed but has no sets recorded`
          )
        );
      }
    }
  }

  // Set completedAt timestamp on first save
  if (!this.completedAt) {
    this.completedAt = new Date();
  }

  next();
});

const WorkoutSession = mongoose.model('WorkoutSession', workoutSessionSchema);

module.exports = WorkoutSession;
