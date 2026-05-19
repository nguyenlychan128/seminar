'use strict';

const mongoose = require('mongoose');
const WorkoutSession = require('../models/WorkoutSession');
const ValidationError = require('../errors/ValidationError');
const DuplicateSessionError = require('../errors/DuplicateSessionError');
const DatabaseError = require('../errors/DatabaseError');
const logger = require('../utils/logger');

// ── Input validators ─────────────────────────────────────────────────────────

const VALID_MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
const VALID_STATUSES = ['completed', 'skipped'];
const VALID_MOODS = ['great', 'good', 'ok', 'tired'];

function validateSessionInput(sessionData) {
  const { planId, weekNumber, dayNumber, sessionDate, exercises, totalDuration, mood, notes } =
    sessionData;

  // Required fields
  if (!planId || typeof planId !== 'string' || planId.trim() === '') {
    throw new ValidationError('Validation failed: planId is required');
  }
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    throw new ValidationError('Validation failed: planId must be a valid ObjectId');
  }

  if (weekNumber === undefined || weekNumber === null) {
    throw new ValidationError('Validation failed: weekNumber is required');
  }
  if (!Number.isInteger(weekNumber) || weekNumber < 1) {
    throw new ValidationError('Validation failed: weekNumber must be a positive integer');
  }

  if (dayNumber === undefined || dayNumber === null) {
    throw new ValidationError('Validation failed: dayNumber is required');
  }
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 7) {
    throw new ValidationError('Validation failed: dayNumber must be between 1 and 7');
  }

  if (!sessionDate) {
    throw new ValidationError('Validation failed: sessionDate is required');
  }
  const parsedDate = new Date(sessionDate);
  if (isNaN(parsedDate.getTime())) {
    throw new ValidationError('Validation failed: sessionDate is not a valid date');
  }

  // BR-02: sessionDate must not be in the future
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const sessionDay = new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate()
  );
  if (sessionDay > todayStart) {
    throw new ValidationError('Validation failed: sessionDate cannot be in the future');
  }

  if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
    throw new ValidationError('Validation failed: exercises must be a non-empty array');
  }

  // Validate each exercise
  exercises.forEach((ex, idx) => {
    validateExercise(ex, idx);
  });

  // Optional fields
  if (totalDuration !== undefined && totalDuration !== null) {
    if (typeof totalDuration !== 'number' || !Number.isFinite(totalDuration)) {
      throw new ValidationError('Validation failed: totalDuration must be a number');
    }
    if (totalDuration < 0 || totalDuration > 300) {
      throw new ValidationError('Validation failed: totalDuration must be between 0 and 300');
    }
  }

  if (mood !== undefined && mood !== null) {
    if (!VALID_MOODS.includes(mood)) {
      throw new ValidationError(
        `Validation failed: mood must be one of: ${VALID_MOODS.join(', ')}`
      );
    }
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      throw new ValidationError('Validation failed: notes must be a string');
    }
    if (notes.length > 500) {
      throw new ValidationError('Validation failed: notes cannot exceed 500 characters');
    }
  }
}

function validateExercise(ex, idx) {
  const label = `exercises[${idx}]`;

  if (!ex.exerciseId || typeof ex.exerciseId !== 'string' || ex.exerciseId.trim() === '') {
    throw new ValidationError(`Validation failed: ${label}.exerciseId is required`);
  }
  if (!mongoose.Types.ObjectId.isValid(ex.exerciseId)) {
    throw new ValidationError(`Validation failed: ${label}.exerciseId must be a valid ObjectId`);
  }

  if (!ex.name || typeof ex.name !== 'string' || ex.name.trim() === '') {
    throw new ValidationError(`Validation failed: ${label}.name is required`);
  }

  if (!ex.muscleGroup || !VALID_MUSCLE_GROUPS.includes(ex.muscleGroup)) {
    throw new ValidationError(
      `Validation failed: ${label}.muscleGroup must be one of: ${VALID_MUSCLE_GROUPS.join(', ')}`
    );
  }

  if (!ex.status || !VALID_STATUSES.includes(ex.status)) {
    throw new ValidationError(
      `Validation failed: ${label}.status must be completed or skipped`
    );
  }

  if (ex.plannedSets === undefined || ex.plannedSets === null) {
    throw new ValidationError(`Validation failed: ${label}.plannedSets is required`);
  }
  if (!Number.isInteger(ex.plannedSets) || ex.plannedSets < 1) {
    throw new ValidationError(`Validation failed: ${label}.plannedSets must be a positive integer`);
  }

  if (!ex.plannedReps || typeof ex.plannedReps !== 'string' || ex.plannedReps.trim() === '') {
    throw new ValidationError(`Validation failed: ${label}.plannedReps is required`);
  }

  // BR-03: completed exercises must have >= 1 set
  if (ex.status === 'completed') {
    if (!ex.sets || !Array.isArray(ex.sets) || ex.sets.length === 0) {
      throw new ValidationError(
        `Validation failed: ${label} is marked completed but has no sets recorded`
      );
    }
  }

  // Validate sets
  if (ex.sets && Array.isArray(ex.sets)) {
    ex.sets.forEach((set, setIdx) => {
      validateSet(set, idx, setIdx);
    });
  }

  // Optional notes
  if (ex.notes !== undefined && ex.notes !== null) {
    if (typeof ex.notes !== 'string') {
      throw new ValidationError(`Validation failed: ${label}.notes must be a string`);
    }
    if (ex.notes.length > 300) {
      throw new ValidationError(`Validation failed: ${label}.notes cannot exceed 300 characters`);
    }
  }
}

function validateSet(set, exIdx, setIdx) {
  const label = `exercises[${exIdx}].sets[${setIdx}]`;

  if (set.setNumber === undefined || set.setNumber === null) {
    throw new ValidationError(`Validation failed: ${label}.setNumber is required`);
  }
  if (!Number.isInteger(set.setNumber) || set.setNumber < 1) {
    throw new ValidationError(`Validation failed: ${label}.setNumber must be a positive integer`);
  }

  if (set.actualReps === undefined || set.actualReps === null) {
    throw new ValidationError(`Validation failed: ${label}.actualReps is required`);
  }
  if (typeof set.actualReps !== 'number' || !Number.isInteger(set.actualReps)) {
    throw new ValidationError(`Validation failed: ${label}.actualReps must be an integer`);
  }
  if (set.actualReps < 0 || set.actualReps > 100) {
    throw new ValidationError(`Validation failed: ${label}.actualReps must be between 0 and 100`);
  }

  if (set.weight === undefined || set.weight === null) {
    throw new ValidationError(`Validation failed: ${label}.weight is required`);
  }
  if (typeof set.weight !== 'number' || !Number.isFinite(set.weight)) {
    throw new ValidationError(`Validation failed: ${label}.weight must be a number`);
  }
  if (set.weight < 0 || set.weight > 500) {
    throw new ValidationError(`Validation failed: ${label}.weight must be between 0 and 500`);
  }

  // Optional rpe
  if (set.rpe !== undefined && set.rpe !== null) {
    if (typeof set.rpe !== 'number' || !Number.isFinite(set.rpe)) {
      throw new ValidationError(`Validation failed: ${label}.rpe must be a number`);
    }
    if (set.rpe < 1 || set.rpe > 10) {
      throw new ValidationError(`Validation failed: ${label}.rpe must be between 1 and 10`);
    }
  }

  // Optional notes
  if (set.notes !== undefined && set.notes !== null) {
    if (typeof set.notes !== 'string') {
      throw new ValidationError(`Validation failed: ${label}.notes must be a string`);
    }
    if (set.notes.length > 200) {
      throw new ValidationError(`Validation failed: ${label}.notes cannot exceed 200 characters`);
    }
  }
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Create a new workout session.
 * userId comes ONLY from the JWT (SR-01 security rule).
 *
 * @param {string} userId - From JWT token, never from request body
 * @param {object} sessionData - Request body
 * @returns {object} Saved session document
 */
async function createSession(userId, sessionData) {
  // Validate all inputs
  validateSessionInput(sessionData);

  const { planId, weekNumber, dayNumber, sessionDate, exercises, totalDuration, mood, notes } =
    sessionData;

  const parsedDate = new Date(sessionDate);

  // Duplicate check: same (userId, planId, weekNumber, dayNumber, sessionDate)
  // Normalize sessionDate to start of day for comparison
  const dayStart = new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate()
  );
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  try {
    const existing = await WorkoutSession.findOne({
      userId,
      planId: planId.trim(),
      weekNumber,
      dayNumber,
      sessionDate: { $gte: dayStart, $lt: dayEnd },
    });

    if (existing) {
      throw new DuplicateSessionError();
    }
  } catch (err) {
    if (err instanceof DuplicateSessionError) throw err;
    logger.error('Error checking duplicate session', { userId, error: err.message });
    throw new DatabaseError('Failed to check for duplicate session');
  }

  // Denormalize: build exercises array with name/muscleGroup snapshot from request
  const denormalizedExercises = exercises.map((ex) => ({
    exerciseId: ex.exerciseId.trim(),
    name: ex.name.trim(),
    muscleGroup: ex.muscleGroup,
    status: ex.status,
    plannedSets: ex.plannedSets,
    plannedReps: ex.plannedReps.trim(),
    sets: (ex.sets || []).map((set) => ({
      setNumber: set.setNumber,
      actualReps: set.actualReps,
      weight: set.weight,
      ...(set.rpe !== undefined && set.rpe !== null ? { rpe: set.rpe } : {}),
      ...(set.notes !== undefined && set.notes !== null ? { notes: set.notes } : { notes: '' }),
    })),
    notes: ex.notes !== undefined && ex.notes !== null ? ex.notes : '',
  }));

  // Build document
  const sessionDoc = {
    userId,
    planId: planId.trim(),
    weekNumber,
    dayNumber,
    sessionDate: parsedDate,
    exercises: denormalizedExercises,
    ...(totalDuration !== undefined && totalDuration !== null ? { totalDuration } : {}),
    ...(mood !== undefined && mood !== null ? { mood } : {}),
    ...(notes !== undefined && notes !== null ? { notes } : {}),
  };

  try {
    const session = new WorkoutSession(sessionDoc);
    const saved = await session.save();

    logger.info('Workout session created', {
      userId,
      sessionId: saved._id.toString(),
      planId,
      weekNumber,
      dayNumber,
    });

    return saved;
  } catch (err) {
    // Mongoose duplicate key error (race condition)
    if (err.code === 11000) {
      throw new DuplicateSessionError();
    }
    if (err.name === 'ValidationError') {
      throw new ValidationError(`Validation failed: ${err.message}`);
    }
    logger.error('Error saving workout session', { userId, error: err.message });
    throw new DatabaseError('Failed to save workout session');
  }
}

/**
 * Get a specific workout session by planId, weekNumber, dayNumber, and sessionDate.
 * userId comes from JWT (session belongs to authenticated user).
 *
 * @param {string} userId - From JWT token
 * @param {string} planId - Plan ID
 * @param {number} weekNumber - Week number
 * @param {number} dayNumber - Day number (1-7)
 * @param {string} sessionDate - Session date (YYYY-MM-DD format)
 * @returns {object|null} Session document or null if not found
 */
async function getSession(userId, planId, weekNumber, dayNumber, sessionDate) {
  // Validate inputs
  if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
    throw new ValidationError('Validation failed: planId must be a valid ObjectId');
  }

  if (!Number.isInteger(weekNumber) || weekNumber < 1) {
    throw new ValidationError('Validation failed: weekNumber must be a positive integer');
  }

  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 7) {
    throw new ValidationError('Validation failed: dayNumber must be between 1 and 7');
  }

  if (!sessionDate) {
    throw new ValidationError('Validation failed: sessionDate is required');
  }

  const parsedDate = new Date(sessionDate);
  if (isNaN(parsedDate.getTime())) {
    throw new ValidationError('Validation failed: sessionDate is not a valid date');
  }

  // Normalize sessionDate to start of day for query
  const dayStart = new Date(
    parsedDate.getFullYear(),
    parsedDate.getMonth(),
    parsedDate.getDate()
  );
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  try {
    const session = await WorkoutSession.findOne({
      userId,
      planId: planId.trim(),
      weekNumber,
      dayNumber,
      sessionDate: { $gte: dayStart, $lt: dayEnd },
    });

    return session || null;
  } catch (err) {
    logger.error('Error fetching workout session', { userId, planId, error: err.message });
    throw new DatabaseError('Failed to fetch workout session');
  }
}

module.exports = {
  createSession,
  getSession,
  // Exported for testing
  _validateSessionInput: validateSessionInput,
};
