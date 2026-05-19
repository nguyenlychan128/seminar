import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from 'react';
import useProgressStore from '../progressStore';

vi.mock('../../services/weightLog.service');
import weightLogService from '../../services/weightLog.service';

const mockLogs = [
  { _id: 'id1', weight: 65.5, date: '2026-05-18', trend: 0.5, createdAt: '2026-05-18T10:00:00Z' },
  { _id: 'id2', weight: 65.0, date: '2026-05-17', trend: 0.2, createdAt: '2026-05-17T10:00:00Z' },
  { _id: 'id3', weight: 64.0, date: '2026-05-10', trend: 0.3, createdAt: '2026-05-10T10:00:00Z' },
];

const initialState = {
  weightLogs: [],
  loading: false,
  error: null,
};

describe('progressStore', () => {
  beforeEach(() => {
    useProgressStore.setState(initialState);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // --- Initial State ---

  describe('initial state', () => {
    it('has weightLogs = []', () => {
      expect(useProgressStore.getState().weightLogs).toEqual([]);
    });

    it('has loading = false', () => {
      expect(useProgressStore.getState().loading).toBe(false);
    });

    it('has error = null', () => {
      expect(useProgressStore.getState().error).toBeNull();
    });

    it('currentWeight is null when weightLogs is empty', () => {
      const state = useProgressStore.getState();
      expect(state.getCurrentWeight()).toBeNull();
    });

    it('totalGain is null when weightLogs is empty', () => {
      const state = useProgressStore.getState();
      expect(state.getTotalGain()).toBeNull();
    });
  });

  // --- Primitive Actions ---

  describe('setWeightLogs(logs)', () => {
    it('replaces weightLogs state', () => {
      useProgressStore.getState().setWeightLogs(mockLogs);
      expect(useProgressStore.getState().weightLogs).toEqual(mockLogs);
    });

    it('accepts empty array to clear logs', () => {
      useProgressStore.setState({ weightLogs: mockLogs });
      useProgressStore.getState().setWeightLogs([]);
      expect(useProgressStore.getState().weightLogs).toEqual([]);
    });
  });

  describe('setLoading(isLoading)', () => {
    it('sets loading = true', () => {
      useProgressStore.getState().setLoading(true);
      expect(useProgressStore.getState().loading).toBe(true);
    });

    it('sets loading = false', () => {
      useProgressStore.setState({ loading: true });
      useProgressStore.getState().setLoading(false);
      expect(useProgressStore.getState().loading).toBe(false);
    });
  });

  describe('setError(message)', () => {
    it('sets error to provided message string', () => {
      useProgressStore.getState().setError('Network error');
      expect(useProgressStore.getState().error).toBe('Network error');
    });

    it('can set error to null explicitly', () => {
      useProgressStore.setState({ error: 'old error' });
      useProgressStore.getState().setError(null);
      expect(useProgressStore.getState().error).toBeNull();
    });
  });

  describe('clearError()', () => {
    it('sets error = null', () => {
      useProgressStore.setState({ error: 'some error' });
      useProgressStore.getState().clearError();
      expect(useProgressStore.getState().error).toBeNull();
    });
  });

  // --- Computed Properties ---

  describe('computed: currentWeight', () => {
    it('returns weightLogs[0].weight (latest entry)', () => {
      useProgressStore.getState().setWeightLogs(mockLogs);
      expect(useProgressStore.getState().getCurrentWeight()).toBe(65.5);
    });

    it('returns null when weightLogs is empty', () => {
      expect(useProgressStore.getState().getCurrentWeight()).toBeNull();
    });

    it('returns the only weight when exactly one entry exists', () => {
      useProgressStore.getState().setWeightLogs([mockLogs[0]]);
      expect(useProgressStore.getState().getCurrentWeight()).toBe(65.5);
    });
  });

  describe('computed: previousWeight', () => {
    it('returns weightLogs[1].weight', () => {
      useProgressStore.getState().setWeightLogs(mockLogs);
      expect(useProgressStore.getState().getPreviousWeight()).toBe(65.0);
    });

    it('returns null when weightLogs has only 1 entry', () => {
      useProgressStore.getState().setWeightLogs([mockLogs[0]]);
      expect(useProgressStore.getState().getPreviousWeight()).toBeNull();
    });

    it('returns null when weightLogs is empty', () => {
      expect(useProgressStore.getState().getPreviousWeight()).toBeNull();
    });
  });

  describe('computed: totalGain', () => {
    it('returns currentWeight minus first entry weight', () => {
      useProgressStore.getState().setWeightLogs(mockLogs);
      // 65.5 - 64.0 = 1.5
      expect(useProgressStore.getState().getTotalGain()).toBeCloseTo(1.5);
    });

    it('returns null when weightLogs is empty', () => {
      expect(useProgressStore.getState().getTotalGain()).toBeNull();
    });

    it('returns 0 when only one entry', () => {
      useProgressStore.getState().setWeightLogs([mockLogs[0]]);
      expect(useProgressStore.getState().getTotalGain()).toBe(0);
    });
  });

  describe('computed: averageGain', () => {
    it('returns totalGain divided by number of entries', () => {
      useProgressStore.getState().setWeightLogs(mockLogs);
      const avgGain = useProgressStore.getState().getAverageGain();
      expect(avgGain).toBeCloseTo(1.5 / 3);
    });

    it('returns null when weightLogs is empty', () => {
      expect(useProgressStore.getState().getAverageGain()).toBeNull();
    });

    it('returns 0 when only one entry', () => {
      useProgressStore.getState().setWeightLogs([mockLogs[0]]);
      expect(useProgressStore.getState().getAverageGain()).toBe(0);
    });
  });

  // --- Async Actions ---

  describe('fetchWeightHistory(startDate, endDate, limit)', () => {
    it('sets loading = true during call', async () => {
      let loadingDuringCall = false;
      weightLogService.getWeightHistory.mockImplementation(async () => {
        loadingDuringCall = useProgressStore.getState().loading;
        return { data: mockLogs, count: 3, startDate: null, endDate: null };
      });
      await act(async () => {
        await useProgressStore.getState().fetchWeightHistory();
      });
      expect(loadingDuringCall).toBe(true);
    });

    it('sets loading = false after successful call', async () => {
      weightLogService.getWeightHistory.mockResolvedValue({ data: mockLogs, count: 3 });
      await act(async () => {
        await useProgressStore.getState().fetchWeightHistory();
      });
      expect(useProgressStore.getState().loading).toBe(false);
    });

    it('updates weightLogs with response.data on success', async () => {
      weightLogService.getWeightHistory.mockResolvedValue({ data: mockLogs, count: 3 });
      await act(async () => {
        await useProgressStore.getState().fetchWeightHistory();
      });
      expect(useProgressStore.getState().weightLogs).toEqual(mockLogs);
    });

    it('passes startDate, endDate, limit arguments to service', async () => {
      weightLogService.getWeightHistory.mockResolvedValue({ data: [], count: 0 });
      await act(async () => {
        await useProgressStore.getState().fetchWeightHistory('2026-04-01', '2026-05-01', 7);
      });
      expect(weightLogService.getWeightHistory).toHaveBeenCalledWith('2026-04-01', '2026-05-01', 7);
    });

    it('clears error before making call', async () => {
      useProgressStore.setState({ error: 'old error' });
      let capturedErrorDuringCall = 'not-cleared';
      weightLogService.getWeightHistory.mockImplementation(async () => {
        capturedErrorDuringCall = useProgressStore.getState().error;
        return { data: mockLogs, count: 3 };
      });
      await act(async () => {
        await useProgressStore.getState().fetchWeightHistory();
      });
      expect(capturedErrorDuringCall).toBeNull();
    });

    it('sets error message on service failure', async () => {
      const err = new Error('Network failure');
      weightLogService.getWeightHistory.mockRejectedValue(err);
      await act(async () => {
        try {
          await useProgressStore.getState().fetchWeightHistory();
        } catch {
          // Expected to throw
        }
      });
      expect(useProgressStore.getState().error).toBe('Network failure');
    });

    it('sets loading = false after service failure', async () => {
      weightLogService.getWeightHistory.mockRejectedValue(new Error('fail'));
      await act(async () => {
        try {
          await useProgressStore.getState().fetchWeightHistory();
        } catch {
          // Expected to throw
        }
      });
      expect(useProgressStore.getState().loading).toBe(false);
    });
  });

  describe('logWeight(weight, date)', () => {
    it('calls weightLogService.createWeightLog with correct arguments', async () => {
      weightLogService.createWeightLog.mockResolvedValue({
        _id: 'new_id',
        weight: 66.0,
        date: '2026-05-19',
        trend: 0.5,
        createdAt: '...',
      });
      await act(async () => {
        await useProgressStore.getState().logWeight(66.0, '2026-05-19');
      });
      expect(weightLogService.createWeightLog).toHaveBeenCalledWith(66.0, '2026-05-19');
    });

    it('adds new log entry to weightLogs after success', async () => {
      useProgressStore.setState({ weightLogs: [mockLogs[1]] });
      const newEntry = {
        _id: 'new_id',
        weight: 66.0,
        date: '2026-05-19',
        trend: 1.0,
        createdAt: '...',
      };
      weightLogService.createWeightLog.mockResolvedValue(newEntry);
      await act(async () => {
        await useProgressStore.getState().logWeight(66.0, '2026-05-19');
      });
      const logs = useProgressStore.getState().weightLogs;
      expect(logs.some((l) => l._id === 'new_id')).toBe(true);
    });

    it('places new entry at beginning of weightLogs (newest first)', async () => {
      useProgressStore.setState({ weightLogs: [mockLogs[1]] });
      const newEntry = {
        _id: 'new_id',
        weight: 66.0,
        date: '2026-05-19',
        trend: 1.0,
        createdAt: '...',
      };
      weightLogService.createWeightLog.mockResolvedValue(newEntry);
      await act(async () => {
        await useProgressStore.getState().logWeight(66.0, '2026-05-19');
      });
      expect(useProgressStore.getState().weightLogs[0]._id).toBe('new_id');
    });

    it('recalculates currentWeight after logWeight success', async () => {
      useProgressStore.setState({ weightLogs: mockLogs });
      const newEntry = {
        _id: 'new_id',
        weight: 66.0,
        date: '2026-05-19',
        trend: 0.5,
        createdAt: '...',
      };
      weightLogService.createWeightLog.mockResolvedValue(newEntry);
      await act(async () => {
        await useProgressStore.getState().logWeight(66.0, '2026-05-19');
      });
      expect(useProgressStore.getState().getCurrentWeight()).toBe(66.0);
    });

    it('sets error and throws on service failure', async () => {
      const err = new Error('Weight entry already exists for this date');
      err.code = 'DUPLICATE_ENTRY';
      weightLogService.createWeightLog.mockRejectedValue(err);
      let threwError = false;
      await act(async () => {
        try {
          await useProgressStore.getState().logWeight(65.5, '2026-05-18');
        } catch (e) {
          threwError = true;
        }
      });
      expect(threwError).toBe(true);
      expect(useProgressStore.getState().error).toBe(
        'Weight entry already exists for this date'
      );
    });

    it('does not modify weightLogs on failure', async () => {
      useProgressStore.setState({ weightLogs: mockLogs });
      weightLogService.createWeightLog.mockRejectedValue(new Error('fail'));
      await act(async () => {
        try {
          await useProgressStore.getState().logWeight(65.5, '2026-05-18');
        } catch {
          // ignore
        }
      });
      expect(useProgressStore.getState().weightLogs).toEqual(mockLogs);
    });
  });
});
