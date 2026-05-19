'use strict';

const VALID_MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
const VALID_EQUIPMENT = ['barbell', 'dumbbell', 'bodyweight', 'cable', 'machine'];
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'all'];

function validateExerciseCreate(req, res, next) {
  const { name, muscleGroup, equipment, difficulty } = req.body;
  const errors = [];

  // Check required fields
  if (!name) errors.push('name is required');
  if (!muscleGroup) errors.push('muscleGroup is required');
  if (!equipment) errors.push('equipment is required');
  if (!difficulty) errors.push('difficulty is required');

  if (errors.length > 0) {
    return res.status(400).json({ message: `Validation failed: ${errors.join(', ')}` });
  }

  // Validate name
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    return res.status(400).json({
      message: 'name must be a string between 1 and 100 characters',
    });
  }

  // Validate muscleGroup
  if (!VALID_MUSCLE_GROUPS.includes(muscleGroup)) {
    return res.status(400).json({
      message: `muscleGroup must be one of: ${VALID_MUSCLE_GROUPS.join(', ')}`,
    });
  }

  // Validate equipment
  if (!VALID_EQUIPMENT.includes(equipment)) {
    return res.status(400).json({
      message: `equipment must be one of: ${VALID_EQUIPMENT.join(', ')}`,
    });
  }

  // Validate difficulty
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({
      message: `difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
    });
  }

  // Validate videoUrl if provided (optional)
  if (req.body.videoUrl !== undefined && req.body.videoUrl !== null) {
    if (typeof req.body.videoUrl !== 'string' || req.body.videoUrl.length > 500) {
      return res.status(400).json({
        message: 'videoUrl must be a string not exceeding 500 characters',
      });
    }
  }

  next();
}

function validateExerciseUpdate(req, res, next) {
  const { name, muscleGroup, equipment, difficulty } = req.body;

  // Validate name if provided
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      return res.status(400).json({
        message: 'name must be a string between 1 and 100 characters',
      });
    }
  }

  // Validate muscleGroup if provided
  if (muscleGroup !== undefined) {
    if (!VALID_MUSCLE_GROUPS.includes(muscleGroup)) {
      return res.status(400).json({
        message: `muscleGroup must be one of: ${VALID_MUSCLE_GROUPS.join(', ')}`,
      });
    }
  }

  // Validate equipment if provided
  if (equipment !== undefined) {
    if (!VALID_EQUIPMENT.includes(equipment)) {
      return res.status(400).json({
        message: `equipment must be one of: ${VALID_EQUIPMENT.join(', ')}`,
      });
    }
  }

  // Validate difficulty if provided
  if (difficulty !== undefined) {
    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({
        message: `difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
      });
    }
  }

  // Validate videoUrl if provided (optional)
  if (req.body.videoUrl !== undefined && req.body.videoUrl !== null) {
    if (typeof req.body.videoUrl !== 'string' || req.body.videoUrl.length > 500) {
      return res.status(400).json({
        message: 'videoUrl must be a string not exceeding 500 characters',
      });
    }
  }

  next();
}

module.exports = {
  validateExerciseCreate,
  validateExerciseUpdate,
};
