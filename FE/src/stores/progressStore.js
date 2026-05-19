import { create } from 'zustand';
import weightLogService from '../services/weightLog.service';

const initialState = {
  weightLogs: [],
  loading: false,
  error: null,
};

const useProgressStore = create((set, get) => ({
  ...initialState,

  // Primitive actions
  setWeightLogs: (logs) => {
    set({ weightLogs: logs });
  },

  setLoading: (isLoading) => {
    set({ loading: isLoading });
  },

  setError: (message) => {
    set({ error: message });
  },

  clearError: () => {
    set({ error: null });
  },

  // Computed properties (derived from state)
  getCurrentWeight: () => {
    const state = get();
    return state.weightLogs.length > 0 ? state.weightLogs[0].weight : null;
  },

  getPreviousWeight: () => {
    const state = get();
    return state.weightLogs.length > 1 ? state.weightLogs[1].weight : null;
  },

  getTotalGain: () => {
    const state = get();
    if (state.weightLogs.length === 0) return null;
    const current = state.weightLogs[0].weight;
    const first = state.weightLogs[state.weightLogs.length - 1].weight;
    return current - first;
  },

  getAverageGain: () => {
    const state = get();
    if (state.weightLogs.length === 0) return null;
    const total = state.weightLogs[0].weight - state.weightLogs[state.weightLogs.length - 1].weight;
    return total / state.weightLogs.length;
  },

  // Async actions
  fetchWeightHistory: async (startDate = null, endDate = null, limit = 30) => {
    set({ loading: true, error: null });
    try {
      const response = await weightLogService.getWeightHistory(startDate, endDate, limit);
      set({ weightLogs: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  logWeight: async (weight, date = null) => {
    try {
      const newEntry = await weightLogService.createWeightLog(weight, date);
      set((state) => ({
        weightLogs: [newEntry, ...state.weightLogs],
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
}));

export default useProgressStore;
