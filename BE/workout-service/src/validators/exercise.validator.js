'use strict';

const VALID_MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
const VALID_EQUIPMENT = ['barbell', 'dumbbell', 'bodyweight', 'cable', 'machine'];
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'all'];

function validateCreateExercise(req, res, next) {
  const errors = [];
  const body = req.body;

  // name validation
  if (!body.name) {
    errors.push({ field: 'name', message: 'name is required' });
  } else if (typeof body.name !== 'string') {
    errors.push({ field: 'name', message: 'name must be a string' });
  } else if (body.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'name must be at least 2 characters' });
  } else if (body.name.trim().length > 100) {
    errors.push({ field: 'name', message: 'name must not exceed 100 characters' });
  }

  // muscleGroup validation
  if (!body.muscleGroup) {
    errors.push({ field: 'muscleGroup', message: 'muscleGroup is required' });
  } else if (!VALID_MUSCLE_GROUPS.includes(body.muscleGroup)) {
    errors.push({ field: 'muscleGroup', message: 'muscleGroup must be one of: ' + VALID_MUSCLE_GROUPS.join(', ') });
  }

  // equipment validation
  if (!body.equipment) {
    errors.push({ field: 'equipment', message: 'equipment is required' });
  } else if (!VALID_EQUIPMENT.includes(body.equipment)) {
    errors.push({ field: 'equipment', message: 'equipment must be one of: ' + VALID_EQUIPMENT.join(', ') });
  }

  // difficulty validation
  if (!body.difficulty) {
    errors.push({ field: 'difficulty', message: 'difficulty is required' });
  } else if (!VALID_DIFFICULTIES.includes(body.difficulty)) {
    errors.push({ field: 'difficulty', message: 'difficulty must be one of: ' + VALID_DIFFICULTIES.join(', ') });
  }

  // videoUrl validation (optional)
  if (body.videoUrl !== undefined && body.videoUrl !== null) {
    if (typeof body.videoUrl !== 'string') {
      errors.push({ field: 'videoUrl', message: 'videoUrl must be a string' });
    } else if (body.videoUrl.length > 500) {
      errors.push({ field: 'videoUrl', message: 'videoUrl must not exceed 500 characters' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

function validateUpdateExercise(req, res, next) {
  const errors = [];
  const body = req.body;

  // If body is empty, allow it (partial update)
  if (Object.keys(body).length === 0) {
    return next();
  }

  // name validation (optional for update)
  if (body.name !== undefined) {
    if (typeof body.name !== 'string') {
      errors.push({ field: 'name', message: 'name must be a string' });
    } else if (body.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'name must be at least 2 characters' });
    } else if (body.name.trim().length > 100) {
      errors.push({ field: 'name', message: 'name must not exceed 100 characters' });
    }
  }

  // muscleGroup validation (optional for update)
  if (body.muscleGroup !== undefined) {
    if (!VALID_MUSCLE_GROUPS.includes(body.muscleGroup)) {
      errors.push({ field: 'muscleGroup', message: 'muscleGroup must be one of: ' + VALID_MUSCLE_GROUPS.join(', ') });
    }
  }

  // equipment validation (optional for update)
  if (body.equipment !== undefined) {
    if (!VALID_EQUIPMENT.includes(body.equipment)) {
      errors.push({ field: 'equipment', message: 'equipment must be one of: ' + VALID_EQUIPMENT.join(', ') });
    }
  }

  // difficulty validation (optional for update)
  if (body.difficulty !== undefined) {
    if (!VALID_DIFFICULTIES.includes(body.difficulty)) {
      errors.push({ field: 'difficulty', message: 'difficulty must be one of: ' + VALID_DIFFICULTIES.join(', ') });
    }
  }

  // videoUrl validation (optional for update)
  if (body.videoUrl !== undefined && body.videoUrl !== null) {
    if (typeof body.videoUrl !== 'string') {
      errors.push({ field: 'videoUrl', message: 'videoUrl must be a string' });
    } else if (body.videoUrl.length > 500) {
      errors.push({ field: 'videoUrl', message: 'videoUrl must not exceed 500 characters' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

module.exports = {
  validateCreateExercise,
  validateUpdateExercise,
};
