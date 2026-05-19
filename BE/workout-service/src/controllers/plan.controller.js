'use strict';

const planService = require('../services/planService');
const logger = require('../utils/logger');

async function getMyPlan(req, res) {
  try {
    const { userId } = req.user;

    const plan = await planService.getActivePlan(userId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'No active workout plan found',
      });
    }

    return res.status(200).json({
      success: true,
      planId: plan._id.toString(),
      userId: plan.userId,
      name: plan.name,
      difficulty: plan.difficulty,
      startDate: plan.startDate.toISOString().split('T')[0],
      endDate: plan.endDate.toISOString().split('T')[0],
      durationWeeks: plan.durationWeeks,
      daysPerWeek: plan.daysPerWeek,
      status: plan.status,
      weeks: plan.weeks.map((week) => ({
        weekNumber: week.weekNumber,
        days: week.days.map((day) => ({
          dayNumber: day.dayNumber,
          dayLabel: day.dayLabel,
          scheduledDate: day.scheduledDate.toISOString().split('T')[0],
          isRestDay: day.isRestDay,
          exercises: day.exercises.map((ex) => ({
            exerciseId: ex.exerciseId.toString(),
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            equipment: ex.equipment,
            videoUrl: ex.videoUrl,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds,
            order: ex.order,
          })),
        })),
      })),
      createdAt: plan.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error('Error in getMyPlan', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

async function generatePlan(req, res) {
  try {
    const { userId } = req.user;
    const { difficulty = 'beginner' } = req.body;

    // Extract access token from Authorization header (authenticate middleware already verified it)
    const authHeader = req.get('Authorization');
    const accessToken = authHeader.slice(7); // Remove 'Bearer ' prefix

    const result = await planService.generateNewPlan(userId, accessToken, difficulty);

    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error.status === 400) {
      logger.warn('Plan generation - user error', { error: error.message });
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.status === 409) {
      logger.warn('Plan generation - conflict', { error: error.message });
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (error.status === 500) {
      logger.error('Plan generation - insufficient data', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Insufficient exercises to generate a plan',
      });
    }

    logger.error('Error in generatePlan', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

async function getWeek(req, res) {
  try {
    const { userId } = req.user;
    const weekNumber = parseInt(req.params.weekNumber, 10);

    if (Number.isNaN(weekNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid week number',
      });
    }

    const weekDetail = await planService.getWeekDetail(userId, weekNumber);

    return res.status(200).json({
      success: true,
      ...weekDetail,
    });
  } catch (error) {
    if (error.status === 400) {
      logger.warn('Week detail - invalid input', { error: error.message });
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.status === 404) {
      logger.warn('Week detail - not found', { error: error.message });
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    logger.error('Error in getWeek', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

async function getTodayWorkout(req, res) {
  try {
    const { userId } = req.user;

    const todayWorkout = await planService.getTodayWorkout(userId);

    return res.status(200).json({
      success: true,
      ...todayWorkout,
    });
  } catch (error) {
    if (error.status === 404) {
      logger.warn('Today workout - not found', { error: error.message });
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    logger.error('Error in getTodayWorkout', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

async function updateDifficulty(req, res) {
  try {
    const { userId } = req.user;
    const { difficulty } = req.body;

    if (!difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Difficulty is required',
      });
    }

    const result = await planService.updatePlanDifficulty(userId, difficulty);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error.status === 404) {
      logger.warn('Difficulty update - not found', { error: error.message });
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.status === 400) {
      logger.warn('Difficulty update - user error', { error: error.message });
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.status === 500) {
      logger.error('Difficulty update - insufficient data', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Insufficient exercises to update plan',
      });
    }

    logger.error('Error in updateDifficulty', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

module.exports = {
  getMyPlan,
  generatePlan,
  updateDifficulty,
  getWeek,
  getTodayWorkout,
};
