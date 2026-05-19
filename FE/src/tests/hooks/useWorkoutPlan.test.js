import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useWorkoutPlan from '../../hooks/useWorkoutPlan';

vi.mock('../../stores/workout.store');
vi.mock('../../stores/auth.store');

import useWorkoutStore from '../../stores/workout.store';
import useAuthStore from '../../stores/auth.store';

const mockFetchMyPlan = vi.fn();
const mockGeneratePlan = vi.fn();
const mockFetchWeek = vi.fn();
const mockFetchTodayWorkout = vi.fn();
const mockClearPlan = vi.fn();

const activePlan = {
  planId: 'plan_abc',
  name: 'Beginner Weight Gain Plan',
  startDate: '2026-05-18',
  durationWeeks: 4,
  status: 'active',
};

const completedPlan = { ...activePlan, status: 'completed' };

const setupStores = ({
  plan = null,
  todayWorkout = null,
  isLoading = false,
  error = null,
  isAuthenticated = true,
} = {}) => {
  useWorkoutStore.mockReturnValue({
    plan,
    todayWorkout,
    isLoading,
    error,
    fetchMyPlan: mockFetchMyPlan,
    generatePlan: mockGeneratePlan,
    fetchWeek: mockFetchWeek,
    fetchTodayWorkout: mockFetchTodayWorkout,
    clearPlan: mockClearPlan,
  });

  useAuthStore.mockReturnValue({ isAuthenticated });
};

describe('useWorkoutPlan hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('return values — state passthrough', () => {
    it('should expose plan from store', () => {
      setupStores({ plan: activePlan });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.plan).toEqual(activePlan);
    });

    it('should expose todayWorkout from store', () => {
      const todayWorkout = { isRestDay: true, dayLabel: 'Rest Day', exercises: [] };
      setupStores({ todayWorkout });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.todayWorkout).toEqual(todayWorkout);
    });

    it('should expose isLoading from store', () => {
      setupStores({ isLoading: true });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.isLoading).toBe(true);
    });

    it('should expose error from store', () => {
      setupStores({ error: 'Session expired' });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.error).toBe('Session expired');
    });

    it('should expose all 5 actions as functions', () => {
      setupStores();
      const { result } = renderHook(() => useWorkoutPlan());
      expect(typeof result.current.fetchMyPlan).toBe('function');
      expect(typeof result.current.generatePlan).toBe('function');
      expect(typeof result.current.fetchWeek).toBe('function');
      expect(typeof result.current.fetchTodayWorkout).toBe('function');
      expect(typeof result.current.clearPlan).toBe('function');
    });
  });

  describe('computed: hasActivePlan', () => {
    it('should be false when plan is null', () => {
      setupStores({ plan: null });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.hasActivePlan).toBe(false);
    });

    it('should be true when plan.status = "active"', () => {
      setupStores({ plan: activePlan });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.hasActivePlan).toBe(true);
    });

    it('should be false when plan.status = "completed"', () => {
      setupStores({ plan: completedPlan });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.hasActivePlan).toBe(false);
    });

    it('should be false when plan.status = "cancelled"', () => {
      setupStores({ plan: { ...activePlan, status: 'cancelled' } });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.hasActivePlan).toBe(false);
    });

    it('should be false when plan exists but status is undefined (null-safe)', () => {
      setupStores({ plan: { planId: 'x' } });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.hasActivePlan).toBe(false);
    });
  });

  describe('computed: currentWeekNumber', () => {
    it('should return 1 when startDate = today (day 0)', () => {
      vi.setSystemTime(new Date('2026-05-18'));
      setupStores({ plan: activePlan });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.currentWeekNumber).toBe(1);
    });

    it('should return 1 when startDate = 6 days ago (still week 1)', () => {
      vi.setSystemTime(new Date('2026-05-24'));
      setupStores({ plan: activePlan });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.currentWeekNumber).toBe(1);
    });

    it('should return 2 when startDate = 7 days ago', () => {
      vi.setSystemTime(new Date('2026-05-25'));
      setupStores({ plan: activePlan });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.currentWeekNumber).toBe(2);
    });

    it('should return 2 when startDate = 8 days ago (as per TASK-026 spec)', () => {
      vi.setSystemTime(new Date('2026-05-26'));
      setupStores({ plan: activePlan });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.currentWeekNumber).toBe(2);
    });

    it('should return 4 when startDate = 21 days ago (week 4 boundary)', () => {
      vi.setSystemTime(new Date('2026-06-08'));
      setupStores({ plan: activePlan });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.currentWeekNumber).toBe(4);
    });

    it('should be capped at durationWeeks (does not exceed 4)', () => {
      vi.setSystemTime(new Date('2026-07-18'));
      setupStores({ plan: activePlan });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.currentWeekNumber).toBe(4);
    });

    it('should return null when plan is null', () => {
      setupStores({ plan: null });
      const { result } = renderHook(() => useWorkoutPlan());
      expect(result.current.currentWeekNumber).toBeNull();
    });
  });

  describe('authStore integration: clearPlan on logout', () => {
    it('should not call clearPlan on initial mount when authenticated', () => {
      setupStores({ isAuthenticated: true });
      renderHook(() => useWorkoutPlan());
      expect(mockClearPlan).not.toHaveBeenCalled();
    });

    it('should call clearPlan when isAuthenticated transitions from true to false (logout)', () => {
      setupStores({ isAuthenticated: true });
      const { rerender } = renderHook(() => useWorkoutPlan());

      // Simulate logout
      setupStores({ isAuthenticated: false });
      rerender();

      expect(mockClearPlan).toHaveBeenCalled();
    });

    it('should not call clearPlan when isAuthenticated stays true', () => {
      setupStores({ isAuthenticated: true });
      const { rerender } = renderHook(() => useWorkoutPlan());

      // Same auth state
      setupStores({ isAuthenticated: true });
      rerender();

      expect(mockClearPlan).not.toHaveBeenCalled();
    });

    it('should not call clearPlan when user was never authenticated (false → false)', () => {
      setupStores({ isAuthenticated: false });
      const { rerender } = renderHook(() => useWorkoutPlan());

      // Still not authenticated
      setupStores({ isAuthenticated: false });
      rerender();

      expect(mockClearPlan).not.toHaveBeenCalled();
    });
  });

  describe('action delegation', () => {
    it('should delegate fetchMyPlan to store action', async () => {
      mockFetchMyPlan.mockResolvedValue(undefined);
      setupStores();
      const { result } = renderHook(() => useWorkoutPlan());

      await act(async () => {
        await result.current.fetchMyPlan();
      });

      expect(mockFetchMyPlan).toHaveBeenCalledTimes(1);
    });

    it('should delegate generatePlan to store action', async () => {
      mockGeneratePlan.mockResolvedValue(undefined);
      setupStores();
      const { result } = renderHook(() => useWorkoutPlan());

      await act(async () => {
        await result.current.generatePlan();
      });

      expect(mockGeneratePlan).toHaveBeenCalledTimes(1);
    });

    it('should delegate fetchWeek with correct weekNumber argument', async () => {
      mockFetchWeek.mockResolvedValue(undefined);
      setupStores();
      const { result } = renderHook(() => useWorkoutPlan());

      await act(async () => {
        await result.current.fetchWeek(2);
      });

      expect(mockFetchWeek).toHaveBeenCalledWith(2);
    });

    it('should delegate fetchTodayWorkout to store action', async () => {
      mockFetchTodayWorkout.mockResolvedValue(undefined);
      setupStores();
      const { result } = renderHook(() => useWorkoutPlan());

      await act(async () => {
        await result.current.fetchTodayWorkout();
      });

      expect(mockFetchTodayWorkout).toHaveBeenCalledTimes(1);
    });

    it('should delegate clearPlan to store action', () => {
      vi.clearAllMocks();
      setupStores();
      const { result } = renderHook(() => useWorkoutPlan());

      vi.clearAllMocks();
      act(() => {
        result.current.clearPlan();
      });

      expect(mockClearPlan).toHaveBeenCalledTimes(1);
    });
  });
});
