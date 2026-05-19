import { useCallback, useMemo } from 'react';
import useProgressStore from '../stores/progressStore';

export const useProgress = () => {
  const {
    weightLogs,
    loading,
    error,
    getCurrentWeight,
    getPreviousWeight,
    getTotalGain,
    getAverageGain,
    fetchWeightHistory,
    logWeight,
    clearError,
  } = useProgressStore();

  // Compute values from store
  const computedValues = useMemo(() => ({
    currentWeight: getCurrentWeight(),
    previousWeight: getPreviousWeight(),
    totalGain: getTotalGain(),
    averageGain: getAverageGain(),
  }), [weightLogs]); // Re-compute when weightLogs change

  const handleFetchHistory = useCallback(async (startDate, endDate, limit) => {
    try {
      await fetchWeightHistory(startDate, endDate, limit);
    } catch (err) {
      // Error is already in store, don't re-throw
    }
  }, [fetchWeightHistory]);

  const handleLogWeight = useCallback(async (weight, date) => {
    try {
      await logWeight(weight, date);
    } catch (err) {
      // Error is already in store, don't re-throw
    }
  }, [logWeight]);

  return {
    weightLogs,
    loading,
    error,
    currentWeight: computedValues.currentWeight,
    previousWeight: computedValues.previousWeight,
    totalGain: computedValues.totalGain,
    averageGain: computedValues.averageGain,
    fetchWeightHistory: handleFetchHistory,
    logWeight: handleLogWeight,
    clearError,
  };
};
