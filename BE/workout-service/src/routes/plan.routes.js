'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const {
  getMyPlan,
  generatePlan,
  updateDifficulty,
  getWeek,
  getTodayWorkout,
} = require('../controllers/plan.controller');

// GET /plans/my - Fetch active plan
router.get('/my', authenticate, getMyPlan);

// POST /plans/generate - Create new plan
router.post('/generate', authenticate, generatePlan);

// PATCH /plans/my/difficulty - Update plan difficulty
router.patch('/my/difficulty', authenticate, updateDifficulty);

// GET /plans/my/week/:weekNumber - Fetch week detail
router.get('/my/week/:weekNumber', authenticate, getWeek);

// GET /plans/my/today - Fetch today's workout
router.get('/my/today', authenticate, getTodayWorkout);

module.exports = router;
