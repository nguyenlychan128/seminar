'use strict';

const workoutSessionService = require('../services/workoutSessionService');
const ValidationError = require('../errors/ValidationError');
const DuplicateSessionError = require('../errors/DuplicateSessionError');
const logger = require('../utils/logger');

/**
 * POST /api/workouts/sessions
 * Create a new workout session log.
 * userId is extracted from JWT (req.user), never from request body (SR-01).
 */
async function createSession(req, res) {
  try {
    const { userId } = req.user;

    const saved = await workoutSessionService.createSession(userId, req.body);

    return res.status(201).json({
      success: true,
      data: {
        sessionId: saved._id.toString(),
        userId: saved.userId,
        planId: saved.planId,
        weekNumber: saved.weekNumber,
        dayNumber: saved.dayNumber,
        sessionDate: saved.sessionDate.toISOString().split('T')[0],
        exercises: saved.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          status: ex.status,
          plannedSets: ex.plannedSets,
          plannedReps: ex.plannedReps,
          sets: ex.sets.map((set) => ({
            setNumber: set.setNumber,
            actualReps: set.actualReps,
            weight: set.weight,
            ...(set.rpe !== undefined ? { rpe: set.rpe } : {}),
            notes: set.notes || '',
          })),
          notes: ex.notes || '',
        })),
        ...(saved.totalDuration !== undefined ? { totalDuration: saved.totalDuration } : {}),
        ...(saved.mood ? { mood: saved.mood } : {}),
        notes: saved.notes || '',
        completedAt: saved.completedAt ? saved.completedAt.toISOString() : null,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      logger.warn('Workout session validation failed', { error: err.message });
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (err instanceof DuplicateSessionError) {
      logger.warn('Duplicate workout session', { error: err.message });
      return res.status(409).json({
        success: false,
        message: 'Duplicate session - already logged for this date/plan/week/day',
      });
    }

    logger.error('Unhandled error in createSession', { error: err.message, stack: err.stack });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * GET /api/workouts/sessions
 * Get a specific workout session by planId, weekNumber, dayNumber, and sessionDate.
 * Query params: planId, weekNumber, dayNumber, sessionDate
 */
async function getSession(req, res) {
  try {
    const { userId } = req.user;
    const { planId, weekNumber, dayNumber, sessionDate } = req.query;

    // Validate query params
    if (!planId || !weekNumber || !dayNumber || !sessionDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameters: planId, weekNumber, dayNumber, sessionDate',
      });
    }

    const session = await workoutSessionService.getSession(
      userId,
      planId,
      parseInt(weekNumber, 10),
      parseInt(dayNumber, 10),
      sessionDate
    );

    // If no session found, return 404
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No session found for the given parameters',
      });
    }

    // Return session with consistent format
    return res.status(200).json({
      success: true,
      data: {
        sessionId: session._id.toString(),
        userId: session.userId,
        planId: session.planId,
        weekNumber: session.weekNumber,
        dayNumber: session.dayNumber,
        sessionDate: session.sessionDate.toISOString().split('T')[0],
        exercises: session.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          status: ex.status,
          plannedSets: ex.plannedSets,
          plannedReps: ex.plannedReps,
          sets: ex.sets.map((set) => ({
            setNumber: set.setNumber,
            actualReps: set.actualReps,
            weight: set.weight,
            ...(set.rpe !== undefined ? { rpe: set.rpe } : {}),
            notes: set.notes || '',
          })),
          notes: ex.notes || '',
        })),
        ...(session.totalDuration !== undefined ? { totalDuration: session.totalDuration } : {}),
        ...(session.mood ? { mood: session.mood } : {}),
        notes: session.notes || '',
        completedAt: session.completedAt ? session.completedAt.toISOString() : null,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      logger.warn('Get session validation failed', { error: err.message });
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    logger.error('Unhandled error in getSession', { error: err.message, stack: err.stack });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

module.exports = {
  createSession,
  getSession,
};
