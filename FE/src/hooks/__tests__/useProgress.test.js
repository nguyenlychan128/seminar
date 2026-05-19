import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgress } from '../useProgress';

vi.mock('../../stores/progressStore');
import useProgressStore from '../../stores/progressStore';

const mockFetchWeightHistory = vi.fn();
const mockLogWeight = vi.fn();
const mockClearError = vi.fn();

const setupStore = ({
  weightLogs = [],
  loading = false,
  error = null,
  currentWeight = null,
  previousWeight = null,
  totalGain = null,
  averageGain = null,
} = {}) => {
  useProgressStore.mockReturnValue({
    weightLogs,
    loading,
    error,
    getCurrentWeight: () => currentWeight,
    getPreviousWeight: () => previousWeight,
    getTotalGain: () => totalGain,
    getAverageGain: () => averageGain,
    fetchWeightHistory: mockFetchWeightHistory,
    logWeight: mockLogWeight,
    clearError: mockClearError,
  });
};

describe('useProgress hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- State Passthrough ---

  describe('state passthrough', () => {
    it('exposes weightLogs from store', () => {
      const logs = [{ _id: 'id1', weight: 65.5, date: '2026-05-18' }];
      setupStore({ weightLogs: logs });
      const { result } = renderHook(() => useProgress());
      expect(result.current.weightLogs).toEqual(logs);
    });

    it('exposes loading from store', () => {
      setupStore({ loading: true });
      const { result } = renderHook(() => useProgress());
      expect(result.current.loading).toBe(true);
    });

    it('exposes error from store', () => {
      setupStore({ error: 'Something went wrong' });
      const { result } = renderHook(() => useProgress());
      expect(result.current.error).toBe('Something went wrong');
    });

    it('exposes currentWeight from store', () => {
      setupStore({ currentWeight: 65.5 });
      const { result } = renderHook(() => useProgress());
      expect(result.current.currentWeight).toBe(65.5);
    });

    it('exposes previousWeight from store', () => {
      setupStore({ previousWeight: 65.0 });
      const { result } = renderHook(() => useProgress());
      expect(result.current.previousWeight).toBe(65.0);
    });

    it('exposes totalGain from store', () => {
      setupStore({ totalGain: 1.5 });
      const { result } = renderHook(() => useProgress());
      expect(result.current.totalGain).toBe(1.5);
    });

    it('exposes averageGain from store', () => {
      setupStore({ averageGain: 0.5 });
      const { result } = renderHook(() => useProgress());
      expect(result.current.averageGain).toBe(0.5);
    });
  });

  // --- Action Exposure ---

  describe('action exposure', () => {
    it('exposes fetchWeightHistory as a function', () => {
      setupStore();
      const { result } = renderHook(() => useProgress());
      expect(typeof result.current.fetchWeightHistory).toBe('function');
    });

    it('exposes logWeight as a function', () => {
      setupStore();
      const { result } = renderHook(() => useProgress());
      expect(typeof result.current.logWeight).toBe('function');
    });

    it('exposes clearError as a function', () => {
      setupStore();
      const { result } = renderHook(() => useProgress());
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  // --- Action Delegation ---

  describe('fetchWeightHistory delegation', () => {
    it('delegates to store fetchWeightHistory with same args', async () => {
      mockFetchWeightHistory.mockResolvedValue(undefined);
      setupStore();
      const { result } = renderHook(() => useProgress());
      await act(async () => {
        await result.current.fetchWeightHistory('2026-04-01', '2026-05-01', 30);
      });
      expect(mockFetchWeightHistory).toHaveBeenCalledWith('2026-04-01', '2026-05-01', 30);
    });

    it('does not throw when store fetchWeightHistory rejects', async () => {
      mockFetchWeightHistory.mockRejectedValue(new Error('Network fail'));
      setupStore();
      const { result } = renderHook(() => useProgress());
      await expect(
        act(async () => {
          await result.current.fetchWeightHistory();
        })
      ).resolves.not.toThrow();
    });
  });

  describe('logWeight delegation', () => {
    it('delegates to store logWeight with weight and date', async () => {
      mockLogWeight.mockResolvedValue(undefined);
      setupStore();
      const { result } = renderHook(() => useProgress());
      await act(async () => {
        await result.current.logWeight(65.5, '2026-05-18');
      });
      expect(mockLogWeight).toHaveBeenCalledWith(65.5, '2026-05-18');
    });

    it('does not throw when store logWeight rejects', async () => {
      mockLogWeight.mockRejectedValue(new Error('DUPLICATE_ENTRY'));
      setupStore();
      const { result } = renderHook(() => useProgress());
      await expect(
        act(async () => {
          await result.current.logWeight(65.5, '2026-05-18');
        })
      ).resolves.not.toThrow();
    });
  });

  describe('clearError delegation', () => {
    it('calls store clearError', () => {
      setupStore();
      const { result } = renderHook(() => useProgress());
      act(() => {
        result.current.clearError();
      });
      expect(mockClearError).toHaveBeenCalled();
    });
  });
});
