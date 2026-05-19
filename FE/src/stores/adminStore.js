import { create } from 'zustand';
import * as adminService from '../services/admin.service';

const initialState = {
  // Users
  users: [],
  usersLoading: false,
  usersError: null,
  usersPagination: { page: 1, limit: 10, total: 0, pages: 0 },
  usersFilters: { email: '', status: 'active' },

  // Exercises
  exercises: [],
  exercisesLoading: false,
  exercisesError: null,
  exercisesPagination: { page: 1, limit: 10, total: 0, pages: 0 },
  exercisesFilters: { search: '', muscleGroup: '' },

  // Modals
  deactivateUserModal: { open: false, userId: null, userEmail: null, action: 'deactivate' },
  exerciseFormModal: { open: false, mode: 'add', exerciseId: null, formData: null },
  deleteExerciseModal: { open: false, exerciseId: null, exerciseName: null },
};

const useAdminStore = create((set, get) => ({
  ...initialState,

  // User Modal Actions
  openDeactivateUserModal: (userId, userEmail, action = 'deactivate') => {
    set({
      deactivateUserModal: { open: true, userId, userEmail, action },
    });
  },

  closeDeactivateUserModal: () => {
    set({
      deactivateUserModal: { open: false, userId: null, userEmail: null, action: 'deactivate' },
    });
  },

  // Exercise Form Modal Actions
  openExerciseFormModal: (mode, exerciseId = null, formData = null) => {
    set({
      exerciseFormModal: { open: true, mode, exerciseId, formData },
    });
  },

  closeExerciseFormModal: () => {
    set({
      exerciseFormModal: { open: false, mode: 'add', exerciseId: null, formData: null },
    });
  },

  // Delete Exercise Modal Actions
  openDeleteExerciseModal: (exerciseId, exerciseName) => {
    set({
      deleteExerciseModal: { open: true, exerciseId, exerciseName },
    });
  },

  closeDeleteExerciseModal: () => {
    set({
      deleteExerciseModal: { open: false, exerciseId: null, exerciseName: null },
    });
  },

  // User Actions
  fetchUsers: async (page = 1, filters = {}) => {
    const { usersLoading } = get();
    if (usersLoading) return;

    set({ usersLoading: true, usersError: null });
    try {
      const result = await adminService.getUsers(page, filters);
      set({
        users: result.data || [],
        usersPagination: result.pagination || { page: 1, limit: 10, total: 0, pages: 0 },
        usersLoading: false,
      });
    } catch (error) {
      set({
        usersError: error.message,
        usersLoading: false,
      });
      throw error;
    }
  },

  setUsersFilters: (filters) => {
    set((state) => ({
      usersFilters: { ...state.usersFilters, ...filters },
    }));
  },

  performDeactivateUser: async (userId) => {
    try {
      await adminService.deactivateUser(userId);
      get().closeDeactivateUserModal();
      await get().fetchUsers(get().usersPagination.page, get().usersFilters);
    } catch (error) {
      set({ usersError: error.message });
      throw error;
    }
  },

  performReactivateUser: async (userId) => {
    try {
      await adminService.reactivateUser(userId);
      get().closeDeactivateUserModal();
      await get().fetchUsers(get().usersPagination.page, get().usersFilters);
    } catch (error) {
      set({ usersError: error.message });
      throw error;
    }
  },

  clearUsersError: () => {
    set({ usersError: null });
  },

  // Exercise Actions
  fetchExercises: async (page = 1, filters = {}) => {
    const { exercisesLoading } = get();
    if (exercisesLoading) return;

    set({ exercisesLoading: true, exercisesError: null });
    try {
      const result = await adminService.getExercises(page, filters);
      set({
        exercises: result.data || [],
        exercisesPagination: result.pagination || { page: 1, limit: 10, total: 0, pages: 0 },
        exercisesLoading: false,
      });
    } catch (error) {
      set({
        exercisesError: error.message,
        exercisesLoading: false,
      });
      throw error;
    }
  },

  setExercisesFilters: (filters) => {
    set((state) => ({
      exercisesFilters: { ...state.exercisesFilters, ...filters },
    }));
  },

  performCreateExercise: async (data) => {
    try {
      await adminService.createExercise(data);
      get().closeExerciseFormModal();
      await get().fetchExercises(get().exercisesPagination.page, get().exercisesFilters);
    } catch (error) {
      set({ exercisesError: error.message });
      throw error;
    }
  },

  performUpdateExercise: async (exerciseId, data) => {
    try {
      await adminService.updateExercise(exerciseId, data);
      get().closeExerciseFormModal();
      await get().fetchExercises(get().exercisesPagination.page, get().exercisesFilters);
    } catch (error) {
      set({ exercisesError: error.message });
      throw error;
    }
  },

  performDeleteExercise: async (exerciseId) => {
    try {
      await adminService.deleteExercise(exerciseId);
      get().closeDeleteExerciseModal();
      await get().fetchExercises(get().exercisesPagination.page, get().exercisesFilters);
    } catch (error) {
      set({ exercisesError: error.message });
      throw error;
    }
  },

  clearExercisesError: () => {
    set({ exercisesError: null });
  },
}));

export default useAdminStore;
