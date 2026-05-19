'use strict';

const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');
const { validateUserDeactivate } = require('../middleware/adminValidation');
const adminController = require('../controllers/adminController');

const router = express.Router();

// User management endpoints
router.get(
  '/',
  authenticate,
  requireRole(['Admin']),
  adminController.getUserList
);

router.patch(
  '/:userId',
  authenticate,
  requireRole(['Admin']),
  validateUserDeactivate,
  adminController.deactivateUser
);

module.exports = router;
