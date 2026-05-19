'use strict';

const mongoose = require('mongoose');
const adminService = require('../services/adminService');

async function getUserList(req, res, next) {
  try {
    const { page = 1, email, status = 'active' } = req.query;

    const result = await adminService.getUserList(
      page,
      email || null,
      status || 'active'
    );

    return res.status(200).json({
      data: result.users,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

async function deactivateUser(req, res, next) {
  try {
    const { userId } = req.params;
    const { action } = req.body;
    const adminUserId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    if (action === 'deactivate') {
      if (adminUserId === userId) {
        return res.status(400).json({ message: 'You cannot deactivate your own account' });
      }
      const user = await adminService.deactivateUser(userId, adminUserId);
      return res.status(200).json({
        message: 'User deactivated',
        user: {
          _id: user._id,
          email: user.email,
          isDeleted: user.isDeleted,
        },
      });
    } else if (action === 'reactivate') {
      const user = await adminService.reactivateUser(userId);
      return res.status(200).json({
        message: 'User reactivated',
        user: {
          _id: user._id,
          email: user.email,
          isDeleted: user.isDeleted,
        },
      });
    }
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ message: err.message });
    }
    if (err.statusCode === 404) {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
}

module.exports = {
  getUserList,
  deactivateUser,
};
