'use strict';

const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { validateExerciseCreate, validateExerciseUpdate } = require('../middleware/adminValidation');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Exercise management endpoints
router.get(
  '/',
  authenticate,
  authorize(['Admin']),
  (req, res, next) => adminController.getExerciseList(req, res, next)
);

router.post(
  '/',
  authenticate,
  authorize(['Admin']),
  validateExerciseCreate,
  (req, res, next) => adminController.createExercise(req, res, next)
);

router.patch(
  '/:exerciseId',
  authenticate,
  authorize(['Admin']),
  validateExerciseUpdate,
  (req, res, next) => adminController.updateExercise(req, res, next)
);

router.delete(
  '/:exerciseId',
  authenticate,
  authorize(['Admin']),
  (req, res, next) => adminController.deleteExercise(req, res, next)
);

module.exports = router;
