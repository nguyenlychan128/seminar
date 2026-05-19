import { useEffect, useRef, useMemo } from 'react';
import useWorkoutStore from '../stores/workout.store';
import useAuthStore from '../stores/auth.store';

const useWorkoutPlan = () => {
  const {
    plan,
    todayWorkout,
    isLoading,
    error,
    fetchMyPlan,
    generatePlan,
    updateDifficulty,
    fetchWeek,
    fetchTodayWorkout,
    clearPlan,
  } = useWorkoutStore();

  const { isAuthenticated } = useAuthStore();
  const prevAuthRef = useRef(isAuthenticated);

  // Clear plan when user logs out (transition from true to false)
  useEffect(() => {
    if (prevAuthRef.current === true && isAuthenticated === false) {
      clearPlan();
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, clearPlan]);

  // Computed: hasActivePlan
  const hasActivePlan = useMemo(() => plan !== null && plan.status === 'active', [plan]);

  // Computed: currentWeekNumber
  const currentWeekNumber = useMemo(() => {
    if (!plan) return null;
    return Math.min(
      Math.floor((Date.now() - new Date(plan.startDate)) / 86400000 / 7) + 1,
      plan.durationWeeks
    );
  }, [plan]);

  return {
    plan,
    todayWorkout,
    isLoading,
    error,
    fetchMyPlan,
    generatePlan,
    updateDifficulty,
    fetchWeek,
    fetchTodayWorkout,
    clearPlan,
    hasActivePlan,
    currentWeekNumber,
  };
};

export default useWorkoutPlan;
