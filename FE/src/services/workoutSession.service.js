import api from './api';

const workoutSessionService = {
  async createSession(sessionData) {
    const response = await api.post('/workouts/sessions', sessionData);
    return response.data;
  },

  async getSession(planId, weekNumber, dayNumber, sessionDate) {
    try {
      const response = await api.get('/workouts/sessions', {
        params: {
          planId,
          weekNumber,
          dayNumber,
          sessionDate,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No session found
      }
      throw error;
    }
  },
};

export default workoutSessionService;
