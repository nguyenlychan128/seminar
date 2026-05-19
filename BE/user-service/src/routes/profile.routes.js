'use strict';

const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { validateCreateProfile, validateUpdateProfile } = require('../middleware/validateProfile');
const controller = require('../controllers/profile.controller');

router.get('/bmi', authenticate, controller.getBmi);
router.get('/', authenticate, controller.getProfile);
router.post('/', authenticate, validateCreateProfile, controller.createProfile);
router.put('/', authenticate, validateUpdateProfile, controller.updateProfile);

module.exports = router;
