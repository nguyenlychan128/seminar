'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { createSession, getSession } = require('../controllers/workoutSessionController');

// GET /api/workouts/sessions — retrieve a specific workout session
router.get('/', authenticate, getSession);

// POST /api/workouts/sessions — log a completed workout session
router.post('/', authenticate, createSession);

module.exports = router;
