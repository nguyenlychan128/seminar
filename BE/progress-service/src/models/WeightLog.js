'use strict';

const mongoose = require('mongoose');

const weightLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [30, 'Weight must be between 30-200 kg'],
      max: [200, 'Weight must be between 30-200 kg'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      validate: {
        validator(value) {
          const today = new Date();
          today.setUTCHours(23, 59, 59, 999); // accept anything up to end of today UTC
          return value <= today;
        },
        message: 'Date cannot be in the future',
      },
    },
    trend: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes must not exceed 200 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: one entry per user per day
weightLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// Sorting index for efficient queries
weightLogSchema.index({ userId: 1, date: -1 });

// Pre-save hook to calculate trend (current - previous day)
// Note: create only, not update — guard ensures we don't recalculate on updates
weightLogSchema.pre('save', async function preSave(next) {
  if (!this.isNew) {
    return next();
  }

  try {
    // Calculate previous day's date in UTC
    const previousDate = new Date(this.date);
    previousDate.setUTCDate(previousDate.getUTCDate() - 1);

    // Find entry for previous day (same user) — using UTC-safe boundaries
    const dayStart = new Date(previousDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 86400000); // +1 day

    const previousEntry = await mongoose.model('WeightLog').findOne({
      userId: this.userId,
      date: {
        $gte: dayStart,
        $lt: dayEnd,
      },
    });

    // Set trend: current - previous (or 0 if no previous entry)
    if (previousEntry) {
      this.trend = Number((this.weight - previousEntry.weight).toFixed(1));
    } else {
      this.trend = 0;
    }

    next();
  } catch (err) {
    next(err);
  }
});

const WeightLog = mongoose.model('WeightLog', weightLogSchema);

module.exports = WeightLog;
