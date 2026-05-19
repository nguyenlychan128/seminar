'use strict';

const express = require('express');
const router = express.Router();
const weightLogController = require('../controllers/weightLogController');
const { authenticate } = require('../middleware/authenticate');
const {
  weightLogValidationMiddleware,
  weightHistoryValidationMiddleware,
} = require('../middleware/weightLogValidation');

/**
 * POST /progress/weight
 * Create a new weight log entry
 * Requires: Authentication, valid weight and optional date
 */
router.post(
  '/weight',
  authenticate,
  weightLogValidationMiddleware,
  (req, res, next) => weightLogController.createWeightLog(req, res, next)
);

/**
 * GET /progress/weight
 * Fetch weight history with optional filtering
 * Requires: Authentication, optional startDate, endDate, limit query params
 */
router.get(
  '/weight',
  authenticate,
  weightHistoryValidationMiddleware,
  (req, res, next) => weightLogController.getWeightHistory(req, res, next)
);

module.exports = router;
