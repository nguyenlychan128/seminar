import api from './api';

const createWorkoutError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  err.code = `HTTP_${status}`;
  return err;
};

const mapHttpError = (error) => {
  const status = error.response?.status;
  const serverMessage = error.response?.data?.message;

  if (status === 404) throw createWorkoutError('No workout plan found', 404);
  if (status === 409) throw createWorkoutError('You already have an active workout plan', 409);
  if (status === 401) throw createWorkoutError('Please log in again', 401);
  if (status === 400) {
    // Sanitize server message to English only (strip Vietnamese messages)
    const message = serverMessage?.replace(/[^\x00-\x7F]/g, '').trim() || 'Invalid request. Please ensure your profile is complete.';
    throw createWorkoutError(message, 400);
  }
  if (status === 500) throw createWorkoutError('Server error. Please try again later', 500);
  throw createWorkoutError('An unexpected error occurred. Please try again', status || 500);
};

const workoutService = {
  getMyPlan: async () => {
    try {
      const response = await api.get('/workouts/plans/my');
      return response.data;
    } catch (error) {
      mapHttpError(error);
    }
  },

  generatePlan: async (difficulty = 'beginner') => {
    try {
      const response = await api.post('/workouts/plans/generate', { difficulty });
      return response.data;
    } catch (error) {
      mapHttpError(error);
    }
  },

  updateDifficulty: async (difficulty) => {
    try {
      const response = await api.patch('/workouts/plans/my/difficulty', { difficulty });
      return response.data;
    } catch (error) {
      mapHttpError(error);
    }
  },

  getWeek: async (weekNumber) => {
    try {
      const response = await api.get(`/workouts/plans/my/week/${weekNumber}`);
      return response.data;
    } catch (error) {
      mapHttpError(error);
    }
  },

  getTodayWorkout: async () => {
    try {
      const response = await api.get('/workouts/plans/my/today');
      return response.data;
    } catch (error) {
      mapHttpError(error);
    }
  },
};

export default workoutService;
