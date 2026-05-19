'use strict';

const User = require('../models/User');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getUserList(page = 1, emailFilter = null, statusFilter = 'active') {
  // Validate pagination
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = 10; // Fixed limit per spec

  // Build filter object
  const filter = {};

  // Apply status filter
  if (statusFilter === 'active') {
    filter.isDeleted = false;
  } else if (statusFilter === 'all') {
    // Include both active and deleted users
  } else {
    // Default to active
    filter.isDeleted = false;
  }

  // Apply email filter (case-insensitive partial match) with validation
  if (emailFilter && emailFilter.trim() && emailFilter.length <= 254) {
    const escapedEmail = escapeRegex(emailFilter.trim());
    filter.email = new RegExp(escapedEmail, 'i');
  }

  // Execute query
  const total = await User.countDocuments(filter);
  const pages = Math.ceil(total / limitNum);
  const skip = (pageNum - 1) * limitNum;

  const users = await User.find(filter)
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  return {
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages,
    },
  };
}

async function deactivateUser(userId, adminUserId) {
  // Check if trying to deactivate own account (explicit string comparison)
  if (userId.toString() === adminUserId.toString()) {
    const error = new Error('Cannot deactivate own account');
    error.statusCode = 400;
    throw error;
  }

  // Find user by ID
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // If already deleted, return success (idempotent)
  if (user.isDeleted) {
    return user.toObject();
  }

  // Soft delete: set isDeleted and deletedAt
  user.isDeleted = true;
  user.deletedAt = new Date();
  await user.save();

  return user.toObject();
}

async function reactivateUser(userId) {
  // Find user by ID
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // If not deleted, return success (idempotent)
  if (!user.isDeleted) {
    return user.toObject();
  }

  // Soft undelete: clear isDeleted and deletedAt
  user.isDeleted = false;
  user.deletedAt = null;
  await user.save();

  return user.toObject();
}

module.exports = {
  getUserList,
  deactivateUser,
  reactivateUser,
};
