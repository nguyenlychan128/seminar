'use strict';

const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      default: null,
    },
    muscleGroup: {
      type: String,
      required: true,
      enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'],
    },
    sets: {
      type: Number,
      default: null,
    },
    reps: {
      type: String,
      default: null,
    },
    restTime: {
      type: Number,
      default: null,
    },
    equipment: {
      type: String,
      required: true,
      enum: ['barbell', 'dumbbell', 'bodyweight', 'cable', 'machine'],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced', 'all'],
    },
    videoUrl: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

exerciseSchema.pre('save', function (next) {
  if (this.isDeleted && !this.deletedAt) {
    this.deletedAt = new Date();
  } else if (!this.isDeleted) {
    this.deletedAt = null;
  }
  next();
});

exerciseSchema.index({ name: 1 }, { unique: true });
exerciseSchema.index({ muscleGroup: 1 });
exerciseSchema.index({ equipment: 1 });
exerciseSchema.index({ difficulty: 1 });
exerciseSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Exercise', exerciseSchema);
