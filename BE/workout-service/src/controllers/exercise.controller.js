'use strict';

const Exercise = require('../models/Exercise');
const WorkoutPlan = require('../models/WorkoutPlan');

async function getExercises(req, res) {
  try {
    const { muscleGroup, equipment, difficulty } = req.query;
    const filter = { isActive: true };

    const VALID_MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
    const VALID_EQUIPMENT = ['barbell', 'dumbbell', 'bodyweight', 'cable', 'machine'];
    const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

    if (muscleGroup) {
      if (!VALID_MUSCLE_GROUPS.includes(muscleGroup)) {
        return res.status(400).json({ success: false, message: 'Invalid muscleGroup value' });
      }
      filter.muscleGroup = muscleGroup;
    }
    if (equipment) {
      if (!VALID_EQUIPMENT.includes(equipment)) {
        return res.status(400).json({ success: false, message: 'Invalid equipment value' });
      }
      filter.equipment = equipment;
    }
    if (difficulty) {
      if (!VALID_DIFFICULTIES.includes(difficulty)) {
        return res.status(400).json({ success: false, message: 'Invalid difficulty value' });
      }
      filter.difficulty = difficulty;
    }

    const exercises = await Exercise.find(filter).select('-tips').limit(500);
    const total = await Exercise.countDocuments(filter);

    res.status(200).json({ success: true, exercises, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch exercises', error: error.message });
  }
}

async function getExerciseById(req, res) {
  try {
    const { exerciseId } = req.params;

    const exercise = await Exercise.findById(exerciseId);

    if (!exercise || !exercise.isActive) {
      return res.status(404).json({ success: false, message: 'Exercise not found' });
    }

    res.status(200).json({ success: true, ...exercise.toObject() });
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid exercise ID' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch exercise', error: error.message });
  }
}

async function createExercise(req, res) {
  try {
    const { name, muscleGroup, equipment, difficulty, videoUrl } = req.body;

    const exercise = new Exercise({
      name: name.trim(),
      muscleGroup,
      equipment,
      difficulty,
      videoUrl: videoUrl || null,
      isActive: true,
    });

    await exercise.save();

    res.status(201).json({ success: true, ...exercise.toObject() });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ success: false, message: `Exercise with this ${field} already exists` });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return res.status(400).json({ success: false, errors });
    }
    res.status(500).json({ success: false, message: 'Failed to create exercise', error: error.message });
  }
}

async function updateExercise(req, res) {
  try {
    const { exerciseId } = req.params;
    const updates = req.body;

    const exercise = await Exercise.findById(exerciseId);

    if (!exercise || !exercise.isActive) {
      return res.status(404).json({ success: false, message: 'Exercise not found' });
    }

    // Apply partial updates using allowlist of updatable fields
    const ALLOWED_UPDATE_FIELDS = ['name', 'muscleGroup', 'equipment', 'difficulty', 'videoUrl'];

    ALLOWED_UPDATE_FIELDS.forEach((field) => {
      if (updates[field] === undefined) return;
      if (field === 'name') {
        exercise[field] = updates[field].trim();
      } else {
        exercise[field] = updates[field];
      }
    });

    await exercise.save();

    res.status(200).json({ success: true, ...exercise.toObject() });
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid exercise ID' });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ success: false, message: `Exercise with this ${field} already exists` });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return res.status(400).json({ success: false, errors });
    }
    res.status(500).json({ success: false, message: 'Failed to update exercise', error: error.message });
  }
}

async function deleteExercise(req, res) {
  try {
    const { exerciseId } = req.params;

    const exercise = await Exercise.findById(exerciseId);

    if (!exercise || !exercise.isActive) {
      return res.status(404).json({ success: false, message: 'Exercise not found' });
    }

    // Check if exercise is used in any active plan (BR-08)
    const activePlan = await WorkoutPlan.findOne({
      status: 'active',
      'weeks.days.exercises.exerciseId': exerciseId,
    });

    if (activePlan) {
      return res.status(409).json({ success: false, message: 'Exercise is currently used in an active plan and cannot be deleted' });
    }

    // Soft delete
    exercise.isActive = false;
    await exercise.save();

    res.status(200).json({ success: true, message: 'Exercise deleted' });
  } catch (error) {
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid exercise ID' });
    }
    res.status(500).json({ success: false, message: 'Failed to delete exercise', error: error.message });
  }
}

module.exports = {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
};
