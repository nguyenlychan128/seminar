'use strict';

const WorkoutPlan = require('../models/WorkoutPlan');
const Exercise = require('../models/Exercise');
const userServiceClient = require('../config/userServiceClient');
const { generatePlan } = require('./planGenerator');
const logger = require('../utils/logger');

async function getActivePlan(userId) {
  try {
    const plan = await WorkoutPlan.findOne({ userId, status: 'active' });
    return plan;
  } catch (error) {
    logger.error('Error fetching active plan', { userId, error: error.message });
    throw error;
  }
}

async function generateNewPlan(userId, accessToken, difficulty = 'beginner') {
  try {
    // Step 1: Fetch user profile from user-service
    let userProfile;
    try {
      userProfile = await userServiceClient.getUserProfile(accessToken);
    } catch (error) {
      if (error.message === 'User profile not found') {
        const err = new Error('Please create your body profile before generating a plan');
        err.status = 400;
        throw err;
      }
      logger.error('User service error', { error: error.message });
      throw error;
    }

    // Step 2: Check if user already has an active plan (BR-01)
    const existingPlan = await getActivePlan(userId);
    if (existingPlan) {
      const err = new Error('You already have an active workout plan');
      err.status = 409;
      throw err;
    }

    // Step 3: Fetch all active exercises
    const exercises = await Exercise.find({ isActive: true });

    // Step 4: Validate sufficient exercises per muscle group
    const muscleGroups = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
    for (const group of muscleGroups) {
      const count = exercises.filter((ex) => ex.muscleGroup === group).length;
      if (count < 5) {
        const err = new Error('Insufficient exercises in library');
        err.status = 500;
        throw err;
      }
    }

    // Step 5: Generate plan using planGenerator
    const planData = generatePlan(userProfile, exercises, difficulty);

    // Step 6: Enforce userId from JWT (not from profile) for security
    planData.userId = userId;

    // Step 7: Save to database
    const newPlan = new WorkoutPlan(planData);
    await newPlan.save();

    logger.info('Plan generated successfully', { userId, planId: newPlan._id, difficulty });

    return {
      planId: newPlan._id.toString(),
      name: newPlan.name,
      difficulty: newPlan.difficulty,
      durationWeeks: newPlan.durationWeeks,
      daysPerWeek: newPlan.daysPerWeek,
      startDate: newPlan.startDate.toISOString().split('T')[0],
      endDate: newPlan.endDate.toISOString().split('T')[0],
      status: newPlan.status,
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    logger.error('Error generating plan', { userId, error: error.message });
    throw error;
  }
}

async function getWeekDetail(userId, weekNumber) {
  try {
    // Step 1: Get active plan
    const plan = await WorkoutPlan.findOne({ userId, status: 'active' });
    if (!plan) {
      const err = new Error('No active workout plan found');
      err.status = 404;
      throw err;
    }

    // Step 2: Validate weekNumber
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > plan.durationWeeks) {
      const err = new Error('Invalid week number');
      err.status = 400;
      throw err;
    }

    // Step 3: Find week in plan
    const week = plan.weeks.find((w) => w.weekNumber === weekNumber);
    if (!week) {
      const err = new Error('Week not found');
      err.status = 404;
      throw err;
    }

    return {
      planId: plan._id.toString(),
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
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    logger.error('Error fetching week detail', { userId, weekNumber, error: error.message });
    throw error;
  }
}

async function getTodayWorkout(userId) {
  try {
    // Step 1: Get active plan
    const plan = await WorkoutPlan.findOne({ userId, status: 'active' });
    if (!plan) {
      const err = new Error('No active workout plan found');
      err.status = 404;
      throw err;
    }

    // Step 2: Get today's date (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Step 3: Search for matching day in all weeks
    for (const week of plan.weeks) {
      for (const day of week.days) {
        const dayDate = new Date(day.scheduledDate);
        dayDate.setUTCHours(0, 0, 0, 0);

        if (dayDate.getTime() === today.getTime()) {
          return {
            planId: plan._id.toString(),
            today: today.toISOString().split('T')[0],
            isRestDay: day.isRestDay,
            dayLabel: day.dayLabel,
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
          };
        }
      }
    }

    // Step 4: If no matching day found, return rest day response
    return {
      planId: plan._id.toString(),
      today: today.toISOString().split('T')[0],
      isRestDay: true,
      dayLabel: 'Rest Day',
      exercises: [],
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    logger.error('Error fetching today workout', { userId, error: error.message });
    throw error;
  }
}

async function updatePlanDifficulty(userId, difficulty) {
  try {
    // Step 1: Get active plan
    const plan = await WorkoutPlan.findOne({ userId, status: 'active' });
    if (!plan) {
      const err = new Error('No active workout plan found');
      err.status = 404;
      throw err;
    }

    // Step 2: Fetch all active exercises
    const exercises = await Exercise.find({ isActive: true });

    // Step 3: Validate sufficient exercises per muscle group
    const muscleGroups = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
    for (const group of muscleGroups) {
      const count = exercises.filter((ex) => ex.muscleGroup === group).length;
      if (count < 5) {
        const err = new Error('Insufficient exercises in library');
        err.status = 500;
        throw err;
      }
    }

    // Step 4: Rebuild plan with new difficulty
    const newPlanData = generatePlan(plan.generatedFrom, exercises, difficulty);

    // Step 5: Update plan in-place (keep planId, startDate, endDate)
    plan.difficulty = difficulty;
    plan.weeks = newPlanData.weeks;
    plan.name = newPlanData.name;
    await plan.save();

    logger.info('Plan difficulty updated', { userId, planId: plan._id, difficulty });

    return {
      planId: plan._id.toString(),
      name: plan.name,
      difficulty: plan.difficulty,
      durationWeeks: plan.durationWeeks,
      daysPerWeek: plan.daysPerWeek,
      startDate: plan.startDate.toISOString().split('T')[0],
      endDate: plan.endDate.toISOString().split('T')[0],
      status: plan.status,
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    logger.error('Error updating plan difficulty', { userId, error: error.message });
    throw error;
  }
}

module.exports = {
  getActivePlan,
  generateNewPlan,
  updatePlanDifficulty,
  getWeekDetail,
  getTodayWorkout,
};
