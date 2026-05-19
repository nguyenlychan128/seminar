import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';
import useWorkoutStore from '../../stores/workout.store';

vi.mock('../../services/workout.service');
import workoutService from '../../services/workout.service';

const mockPlan = {
  planId: 'plan_abc',
  name: 'Beginner Weight Gain Plan',
  startDate: '2026-05-18',
  endDate: '2026-06-14',
  durationWeeks: 4,
  daysPerWeek: 3,
  status: 'active',
  weeks: [],
};

const mockPlanSummary = {
  planId: 'plan_abc',
  name: 'Beginner Weight Gain Plan',
  durationWeeks: 4,
  daysPerWeek: 3,
  startDate: '2026-05-18',
  endDate: '2026-06-14',
  status: 'active',
};

const mockWeekData = {
  planId: 'plan_abc',
  weekNumber: 1,
  days: [],
};

const mockTodayWorkout = {
  isRestDay: false,
  dayLabel: 'Day A',
  exercises: [{ name: 'Bench Press' }],
};

const initialState = {
  plan: null,
  todayWorkout: null,
  isLoading: false,
  error: null,
};

describe('useWorkoutStore', () => {
  beforeEach(() => {
    useWorkoutStore.setState(initialState);
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have plan = null', () => {
      expect(useWorkoutStore.getState().plan).toBeNull();
    });

    it('should have todayWorkout = null', () => {
      expect(useWorkoutStore.getState().todayWorkout).toBeNull();
    });

    it('should have isLoading = false', () => {
      expect(useWorkoutStore.getState().isLoading).toBe(false);
    });

    it('should have error = null', () => {
      expect(useWorkoutStore.getState().error).toBeNull();
    });
  });

  describe('fetchMyPlan()', () => {
    it('should set isLoading = true during API call', async () => {
      let loadingDuringCall = false;
      workoutService.getMyPlan.mockImplementation(async () => {
        loadingDuringCall = useWorkoutStore.getState().isLoading;
        return mockPlan;
      });

      await act(async () => {
        await useWorkoutStore.getState().fetchMyPlan();
      });

      expect(loadingDuringCall).toBe(true);
    });

    it('should set isLoading = false after successful call', async () => {
      workoutService.getMyPlan.mockResolvedValue(mockPlan);

      await act(async () => {
        await useWorkoutStore.getState().fetchMyPlan();
      });

      expect(useWorkoutStore.getState().isLoading).toBe(false);
    });

    it('should set plan in state after success', async () => {
      workoutService.getMyPlan.mockResolvedValue(mockPlan);

      await act(async () => {
        await useWorkoutStore.getState().fetchMyPlan();
      });

      expect(useWorkoutStore.getState().plan).toEqual(mockPlan);
      expect(useWorkoutStore.getState().error).toBeNull();
    });

    it('should set plan = null (does not throw) when service throws 404 error', async () => {
      const err = new Error('No workout plan found');
      err.status = 404;
      workoutService.getMyPlan.mockRejectedValue(err);

      await act(async () => {
        await useWorkoutStore.getState().fetchMyPlan();
      });

      expect(useWorkoutStore.getState().plan).toBeNull();
      expect(useWorkoutStore.getState().error).toBeNull();
    });

    it('should not throw when 404', async () => {
      const err = new Error('No workout plan found');
      err.status = 404;
      workoutService.getMyPlan.mockRejectedValue(err);

      await expect(
        act(async () => {
          await useWorkoutStore.getState().fetchMyPlan();
        })
      ).resolves.not.toThrow();
    });

    it('should set isLoading = false after 404 (not stuck loading)', async () => {
      const err = new Error('No workout plan found');
      err.status = 404;
      workoutService.getMyPlan.mockRejectedValue(err);

      await act(async () => {
        await useWorkoutStore.getState().fetchMyPlan();
      });

      expect(useWorkoutStore.getState().isLoading).toBe(false);
    });

    it('should set error when non-404 error occurs', async () => {
      const err = new Error('Session expired');
      err.status = 401;
      workoutService.getMyPlan.mockRejectedValue(err);

      await act(async () => {
        await useWorkoutStore.getState().fetchMyPlan();
      });

      expect(useWorkoutStore.getState().error).toBe('Session expired');
      expect(useWorkoutStore.getState().isLoading).toBe(false);
    });

    it('should clear error before new call', async () => {
      useWorkoutStore.setState({ error: 'old error' });
      let capturedError = null;

      workoutService.getMyPlan.mockImplementation(async () => {
        capturedError = useWorkoutStore.getState().error;
        return mockPlan;
      });

      await act(async () => {
        await useWorkoutStore.getState().fetchMyPlan();
      });

      expect(capturedError).toBeNull();
    });
  });

  describe('generatePlan()', () => {
    it('should call getMyPlan service after successful generatePlan to fetch full plan', async () => {
      workoutService.generatePlan.mockResolvedValue(mockPlanSummary);
      workoutService.getMyPlan.mockResolvedValue(mockPlan);

      await act(async () => {
        await useWorkoutStore.getState().generatePlan();
      });

      expect(workoutService.getMyPlan).toHaveBeenCalledTimes(1);
      expect(useWorkoutStore.getState().plan).toEqual(mockPlan);
    });

    it('should set isLoading = true during generatePlan call', async () => {
      let loadingDuringCall = false;
      workoutService.generatePlan.mockImplementation(async () => {
        loadingDuringCall = useWorkoutStore.getState().isLoading;
        return mockPlanSummary;
      });
      workoutService.getMyPlan.mockResolvedValue(mockPlan);

      await act(async () => {
        await useWorkoutStore.getState().generatePlan();
      });

      expect(loadingDuringCall).toBe(true);
    });

    it('should set isLoading = false after generatePlan success', async () => {
      workoutService.generatePlan.mockResolvedValue(mockPlanSummary);
      workoutService.getMyPlan.mockResolvedValue(mockPlan);

      await act(async () => {
        await useWorkoutStore.getState().generatePlan();
      });

      expect(useWorkoutStore.getState().isLoading).toBe(false);
    });

    it('should set error and not call fetchMyPlan when generatePlan fails (409)', async () => {
      const err = new Error('Active plan already exists');
      err.status = 409;
      workoutService.generatePlan.mockRejectedValue(err);

      await act(async () => {
        try {
          await useWorkoutStore.getState().generatePlan();
        } catch (e) {
          // Expected to throw
        }
      });

      expect(workoutService.getMyPlan).not.toHaveBeenCalled();
      expect(useWorkoutStore.getState().error).toBe('Active plan already exists');
    });

    it('should throw error to caller when generatePlan fails', async () => {
      const err = new Error('Active plan already exists');
      err.status = 409;
      workoutService.generatePlan.mockRejectedValue(err);

      await expect(
        act(async () => {
          await useWorkoutStore.getState().generatePlan();
        })
      ).rejects.toBeDefined();
    });
  });

  describe('fetchWeek(weekNumber)', () => {
    it('should set isLoading lifecycle correctly', async () => {
      let capturedLoading = false;
      workoutService.getWeek.mockImplementation(async () => {
        capturedLoading = useWorkoutStore.getState().isLoading;
        return mockWeekData;
      });

      await act(async () => {
        await useWorkoutStore.getState().fetchWeek(1);
      });

      expect(capturedLoading).toBe(true);
      expect(useWorkoutStore.getState().isLoading).toBe(false);
    });

    it('should merge week data into plan.weeks at correct index (weekNumber - 1)', async () => {
      useWorkoutStore.setState({ plan: mockPlan });
      workoutService.getWeek.mockResolvedValue(mockWeekData);

      await act(async () => {
        await useWorkoutStore.getState().fetchWeek(1);
      });

      expect(useWorkoutStore.getState().plan.weeks[0]).toEqual(mockWeekData);
    });

    it('should set error when getWeek fails', async () => {
      useWorkoutStore.setState({ plan: mockPlan });
      const err = new Error('No workout plan found');
      workoutService.getWeek.mockRejectedValue(err);

      await act(async () => {
        await useWorkoutStore.getState().fetchWeek(1);
      });

      expect(useWorkoutStore.getState().error).toBe('No workout plan found');
    });
  });

  describe('fetchTodayWorkout()', () => {
    it('should set todayWorkout on success', async () => {
      workoutService.getTodayWorkout.mockResolvedValue(mockTodayWorkout);

      await act(async () => {
        await useWorkoutStore.getState().fetchTodayWorkout();
      });

      expect(useWorkoutStore.getState().todayWorkout).toEqual(mockTodayWorkout);
    });

    it('should set todayWorkout with isRestDay = true for rest days', async () => {
      const restDay = { isRestDay: true, dayLabel: 'Rest Day', exercises: [] };
      workoutService.getTodayWorkout.mockResolvedValue(restDay);

      await act(async () => {
        await useWorkoutStore.getState().fetchTodayWorkout();
      });

      expect(useWorkoutStore.getState().todayWorkout.isRestDay).toBe(true);
      expect(useWorkoutStore.getState().todayWorkout.exercises).toHaveLength(0);
    });

    it('should set isLoading = false after fetchTodayWorkout success', async () => {
      workoutService.getTodayWorkout.mockResolvedValue(mockTodayWorkout);

      await act(async () => {
        await useWorkoutStore.getState().fetchTodayWorkout();
      });

      expect(useWorkoutStore.getState().isLoading).toBe(false);
    });

    it('should set error when getTodayWorkout fails', async () => {
      const err = new Error('No workout plan found');
      err.status = 404;
      workoutService.getTodayWorkout.mockRejectedValue(err);

      await act(async () => {
        await useWorkoutStore.getState().fetchTodayWorkout();
      });

      expect(useWorkoutStore.getState().error).toBe('No workout plan found');
    });
  });

  describe('clearPlan()', () => {
    it('should reset plan to null', () => {
      useWorkoutStore.setState({ plan: mockPlan });
      useWorkoutStore.getState().clearPlan();
      expect(useWorkoutStore.getState().plan).toBeNull();
    });

    it('should reset todayWorkout to null', () => {
      useWorkoutStore.setState({ todayWorkout: mockTodayWorkout });
      useWorkoutStore.getState().clearPlan();
      expect(useWorkoutStore.getState().todayWorkout).toBeNull();
    });

    it('should reset isLoading to false', () => {
      useWorkoutStore.setState({ isLoading: true });
      useWorkoutStore.getState().clearPlan();
      expect(useWorkoutStore.getState().isLoading).toBe(false);
    });

    it('should reset error to null', () => {
      useWorkoutStore.setState({ error: 'some error' });
      useWorkoutStore.getState().clearPlan();
      expect(useWorkoutStore.getState().error).toBeNull();
    });

    it('should be synchronous', () => {
      useWorkoutStore.setState({
        plan: mockPlan,
        todayWorkout: mockTodayWorkout,
        isLoading: true,
        error: 'some error',
      });

      useWorkoutStore.getState().clearPlan();

      const state = useWorkoutStore.getState();
      expect(state.plan).toBeNull();
      expect(state.todayWorkout).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
