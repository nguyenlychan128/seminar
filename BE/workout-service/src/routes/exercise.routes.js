'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { validateCreateExercise, validateUpdateExercise } = require('../validators/exercise.validator');
const {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
} = require('../controllers/exercise.controller');

// GET /exercises - list with optional filters (authenticated users)
router.get('/', authenticate, getExercises);

// GET /exercises/:exerciseId - detail (authenticated users)
router.get('/:exerciseId', authenticate, getExerciseById);

// POST /exercises - create (admin only)
router.post('/', authenticate, authorize(['admin']), validateCreateExercise, createExercise);

// PUT /exercises/:exerciseId - update (admin only)
router.put('/:exerciseId', authenticate, authorize(['admin']), validateUpdateExercise, updateExercise);

// DELETE /exercises/:exerciseId - soft delete (admin only)
router.delete('/:exerciseId', authenticate, authorize(['admin']), deleteExercise);

module.exports = router;
