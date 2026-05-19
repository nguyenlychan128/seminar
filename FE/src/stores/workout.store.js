import { create } from 'zustand';
import workoutService from '../services/workout.service';

const initialState = {
  plan: null,
  todayWorkout: null,
  isLoading: false,
  error: null,
};

const useWorkoutStore = create((set) => ({
  ...initialState,

  fetchMyPlan: async () => {
    set({ isLoading: true, error: null });
    try {
      const plan = await workoutService.getMyPlan();
      set({ plan, isLoading: false });
    } catch (error) {
      // 404 is a valid state — user simply hasn't created a plan yet
      if (error.status === 404) {
        set({ plan: null, isLoading: false, error: null });
      } else {
        set({ error: error.message, isLoading: false });
      }
    }
  },

  generatePlan: async (difficulty = 'beginner') => {
    set({ isLoading: true, error: null });
    try {
      await workoutService.generatePlan(difficulty);
      // After successful generation, fetch the full plan directly
      const plan = await workoutService.getMyPlan();
      set({ plan, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateDifficulty: async (difficulty) => {
    set({ isLoading: true, error: null });
    try {
      await workoutService.updateDifficulty(difficulty);
      // After successful update, fetch the full plan directly
      const plan = await workoutService.getMyPlan();
      set({ plan, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchWeek: async (weekNumber) => {
    set({ isLoading: true, error: null });
    try {
      const weekData = await workoutService.getWeek(weekNumber);
      set((state) => {
        if (!state.plan) return { isLoading: false };
        const weeks = [...state.plan.weeks];
        weeks[weekNumber - 1] = weekData;
        return {
          plan: { ...state.plan, weeks },
          isLoading: false,
        };
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchTodayWorkout: async () => {
    set({ isLoading: true, error: null });
    try {
      const todayWorkout = await workoutService.getTodayWorkout();
      set({ todayWorkout, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  clearPlan: () => {
    set(initialState);
  },
}));

export default useWorkoutStore;
