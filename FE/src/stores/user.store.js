import { create } from 'zustand';
import userService from '../services/user.service';

const initialState = {
  profile: null,
  isLoading: false,
  error: null,
};

const useUserStore = create((set) => ({
  ...initialState,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await userService.getProfile();
      set({ profile, isLoading: false });
    } catch (error) {
      // 404 is a valid state — user simply hasn't created a profile yet
      if (error.status === 404) {
        set({ profile: null, isLoading: false, error: null });
      } else {
        set({ error: error.message, isLoading: false });
      }
    }
  },

  createProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await userService.createProfile(data);
      set({ profile, isLoading: false });
      return profile;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await userService.updateProfile(data);
      set((state) => ({
        profile: updated ? { ...state.profile, ...updated } : state.profile,
        isLoading: false,
      }));
      return updated;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearProfile: () => {
    set(initialState);
  },
}));

export default useUserStore;
