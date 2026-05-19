const mongoose = require('mongoose');
const { EMAIL_REGEX } = require('../utils/validators');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Invalid email format'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      minlength: [60, 'Password hash must be at least 60 characters'],
    },
    role: {
      type: String,
      enum: {
        values: ['User', 'Admin'],
        message: 'Role must be either "User" or "Admin"',
      },
      default: 'User',
      required: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
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
  {
    timestamps: true,
  }
);

// Unique index on email
userSchema.index({ email: 1 }, { unique: true });

// Composite index for login query optimization
userSchema.index({ email: 1, isActive: 1 });

// Descending index for activity tracking
userSchema.index({ lastLoginAt: -1 });

// Index on isDeleted for soft delete queries
userSchema.index({ isDeleted: 1 });

// Pre-save hook to set deletedAt when isDeleted is set to true
userSchema.pre('save', function (next) {
  if (this.isDeleted && !this.deletedAt) {
    this.deletedAt = new Date();
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
