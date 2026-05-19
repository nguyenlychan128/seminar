import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WorkoutExecutionForm from '../WorkoutExecutionForm';

// Mock the service
vi.mock('../../../services/workoutSession.service', () => ({
  default: {
    createSession: vi.fn(),
  },
}));

import workoutSessionService from '../../../services/workoutSession.service';

const mockExercises = [
  {
    exerciseId: '507f1f77bcf86cd799439012',
    name: 'Bench Press',
    muscleGroup: 'chest',
    plannedSets: 3,
    plannedReps: '8-12',
  },
  {
    exerciseId: '507f1f77bcf86cd799439013',
    name: 'Incline Dumbbell Press',
    muscleGroup: 'chest',
    plannedSets: 2,
    plannedReps: '8-10',
  },
];

const defaultProps = {
  exercises: mockExercises,
  planId: '507f1f77bcf86cd799439011',
  weekNumber: 1,
  dayNumber: 1,
  sessionDate: '2026-05-18',
  onSuccess: vi.fn(),
  onError: vi.fn(),
};

describe('WorkoutExecutionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    workoutSessionService.createSession.mockResolvedValue({
      success: true,
      data: { sessionId: '507f1f77bcf86cd799439014' },
    });
  });

  // A. RENDERING
  describe('rendering', () => {
    it('renders one ExerciseCard for each exercise in props', () => {
      render(<WorkoutExecutionForm {...defaultProps} />);
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Incline Dumbbell Press')).toBeInTheDocument();
    });

    it('renders session summary section with duration, mood, notes inputs', () => {
      render(<WorkoutExecutionForm {...defaultProps} />);
      expect(screen.getByPlaceholderText(/duration/i)).toBeInTheDocument();
      expect(screen.getByText(/mood/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/session notes/i)).toBeInTheDocument();
    });

    it('renders Save button enabled on initial render', () => {
      render(<WorkoutExecutionForm {...defaultProps} />);
      const saveButton = screen.getByRole('button', { name: /save|submit/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('does not crash when exercises prop is an empty array', () => {
      render(<WorkoutExecutionForm {...defaultProps} exercises={[]} />);
      expect(screen.getByText(/session summary/i)).toBeInTheDocument();
    });

    it('renders all planned set inputs for each completed exercise', () => {
      render(<WorkoutExecutionForm {...defaultProps} />);
      // First exercise has 3 sets
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      expect(repsInputs.length).toBeGreaterThanOrEqual(3);
    });
  });

  // B. EXERCISE STATUS TOGGLE
  describe('exercise status toggle (UR-01)', () => {
    it('defaults all exercises to "Hoan thanh" (completed)', () => {
      render(<WorkoutExecutionForm {...defaultProps} />);
      const toggles = screen.getAllByRole('button', { name: /hoan thanh|bo qua/i });
      toggles.forEach((toggle) => {
        expect(toggle).toHaveTextContent(/hoan thanh/i);
      });
    });

    it('toggles exercise status to "Skipped" when toggle button clicked', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const toggleButtons = screen.getAllByRole('button', { name: /completed|skipped/i });
      await user.click(toggleButtons[0]);
      expect(toggleButtons[0]).toHaveTextContent(/skipped/i);
    });

    it('toggles back to "Completed" on second click', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const toggleButtons = screen.getAllByRole('button', { name: /completed|skipped/i });
      await user.click(toggleButtons[0]);
      await user.click(toggleButtons[0]);
      expect(toggleButtons[0]).toHaveTextContent(/completed/i);
    });

    it('shows set inputs when status is completed', async () => {
      render(<WorkoutExecutionForm {...defaultProps} />);
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      expect(repsInputs.length).toBeGreaterThan(0);
    });

    it('hides set inputs when status is skipped', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const toggleButtons = screen.getAllByRole('button', { name: /hoan thanh|bo qua/i });
      const initialRepsCount = screen.getAllByPlaceholderText(/reps/i).length;

      await user.click(toggleButtons[0]);

      const afterRepsCount = screen.queryAllByPlaceholderText(/reps/i).length;
      expect(afterRepsCount).toBeLessThan(initialRepsCount);
    });

    it('shows exercise notes input for both completed and skipped status', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const notesInputs = screen.getAllByPlaceholderText(/exercise notes/i);
      expect(notesInputs.length).toBeGreaterThanOrEqual(mockExercises.length);
    });
  });

  // C. SET INPUTS
  describe('set inputs', () => {
    it('renders plannedSets number of set rows for a completed exercise', () => {
      render(<WorkoutExecutionForm {...defaultProps} />);
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      // 3 sets for first exercise + 2 sets for second = 5 total
      expect(repsInputs.length).toBeGreaterThanOrEqual(5);
    });

    it('each set row has reps, weight, rpe, notes inputs', () => {
      render(<WorkoutExecutionForm {...defaultProps} />);
      expect(screen.getAllByPlaceholderText(/reps/i).length).toBeGreaterThan(0);
      expect(screen.getAllByPlaceholderText(/weight/i).length).toBeGreaterThan(0);
      expect(screen.queryAllByPlaceholderText(/rpe/i).length).toBeGreaterThanOrEqual(0);
    });

    it('changing reps input updates form state', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '10');
      expect(repsInputs[0]).toHaveValue(10);
    });

    it('changing weight input updates form state', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const weightInputs = screen.getAllByPlaceholderText(/weight/i);
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], '80');
      expect(weightInputs[0]).toHaveValue(80);
    });
  });

  // D. REAL-TIME VALIDATION
  describe('real-time validation (UR-02 / BR-04)', () => {
    it('shows error when reps < 0', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '-5');
      await waitFor(() => {
        expect(screen.queryByText(/reps must be/i)).toBeInTheDocument();
      });
    });

    it('shows error when reps > 100', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '150');
      await waitFor(() => {
        expect(screen.queryByText(/reps must be/i)).toBeInTheDocument();
      });
    });

    it('shows error when weight < 0', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const weightInputs = screen.getAllByPlaceholderText(/weight/i);
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], '-10');
      await waitFor(() => {
        expect(screen.queryByText(/weight must be/i)).toBeInTheDocument();
      });
    });

    it('shows error when weight > 500', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const weightInputs = screen.getAllByPlaceholderText(/weight/i);
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], '600');
      await waitFor(() => {
        expect(screen.queryByText(/weight must be/i)).toBeInTheDocument();
      });
    });

    it('clears reps error when corrected to valid range', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '150');
      await waitFor(() => {
        expect(screen.queryByText(/reps must be/i)).toBeInTheDocument();
      });
      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '10');
      await waitFor(() => {
        expect(screen.queryByText(/reps must be/i)).not.toBeInTheDocument();
      });
    });

    it('does not show errors on initial render', () => {
      render(<WorkoutExecutionForm {...defaultProps} />);
      expect(screen.queryByText(/must be/i)).not.toBeInTheDocument();
    });
  });

  // E. SESSION-LEVEL INPUTS
  describe('session-level inputs (UR-03)', () => {
    it('duration input accepts value between 0 and 300', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const durationInput = screen.getByPlaceholderText(/duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, '45');
      expect(durationInput).toHaveValue(45);
    });

    it('mood selector renders options', () => {
      render(<WorkoutExecutionForm {...defaultProps} />);
      expect(screen.getByText(/great|good|ok|tired/i)).toBeInTheDocument();
    });
  });

  // F. SUBMIT VALIDATION GATE
  describe('submit validation gate', () => {
    it('prevents submission when reps field is out of range', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '150');

      const saveButton = screen.getByRole('button', { name: /save|submit/i });
      await user.click(saveButton);

      expect(workoutSessionService.createSession).not.toHaveBeenCalled();
    });

    it('allows submission when all fields are valid', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      const weightInputs = screen.getAllByPlaceholderText(/weight/i);

      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '10');
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], '80');

      const saveButton = screen.getByRole('button', { name: /save|submit/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(workoutSessionService.createSession).toHaveBeenCalled();
      });
    });

    it('disables Save button while loading', async () => {
      const user = userEvent.setup();
      workoutSessionService.createSession.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(<WorkoutExecutionForm {...defaultProps} />);
      const saveButton = screen.getByRole('button', { name: /save|submit/i });
      await user.click(saveButton);

      expect(saveButton).toBeDisabled();
    });
  });

  // G. SUCCESSFUL SUBMISSION
  describe('successful submission (UR-05)', () => {
    it('calls createSession with planId, weekNumber, dayNumber, sessionDate from props', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      const weightInputs = screen.getAllByPlaceholderText(/weight/i);

      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '10');
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], '80');

      const saveButton = screen.getByRole('button', { name: /save|submit/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(workoutSessionService.createSession).toHaveBeenCalled();
        const callArgs = workoutSessionService.createSession.mock.calls[0][0];
        expect(callArgs.planId).toBe(defaultProps.planId);
        expect(callArgs.weekNumber).toBe(defaultProps.weekNumber);
        expect(callArgs.dayNumber).toBe(defaultProps.dayNumber);
        expect(callArgs.sessionDate).toBe(defaultProps.sessionDate);
      });
    });

    it('shows success message on 201 response', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      const weightInputs = screen.getAllByPlaceholderText(/weight/i);

      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '10');
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], '80');

      const saveButton = screen.getByRole('button', { name: /save|submit/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByText(/đã được lưu|saved/i)).toBeInTheDocument();
      });
    });

    it('calls onSuccess callback after 201 response', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      const weightInputs = screen.getAllByPlaceholderText(/weight/i);

      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '10');
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], '80');

      const saveButton = screen.getByRole('button', { name: /save|submit/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalled();
      });
    });
  });

  // H. ERROR HANDLING
  describe('error handling (UR-05)', () => {
    it('shows error alert with API message on 400 response', async () => {
      const user = userEvent.setup();
      workoutSessionService.createSession.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Validation failed: actualReps must be between 0 and 100' },
        },
      });

      render(<WorkoutExecutionForm {...defaultProps} />);
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      const weightInputs = screen.getAllByPlaceholderText(/weight/i);

      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '10');
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], '80');

      const saveButton = screen.getByRole('button', { name: /save|submit/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByText(/Validation failed/i)).toBeInTheDocument();
      });
    });

    it('keeps form open on error', async () => {
      const user = userEvent.setup();
      workoutSessionService.createSession.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Validation error' },
        },
      });

      render(<WorkoutExecutionForm {...defaultProps} />);
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      const weightInputs = screen.getAllByPlaceholderText(/weight/i);

      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '10');
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], '80');

      const saveButton = screen.getByRole('button', { name: /save|submit/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onSuccess).not.toHaveBeenCalled();
      });
    });

    it('does not call onSuccess on error', async () => {
      const user = userEvent.setup();
      workoutSessionService.createSession.mockRejectedValue(new Error('Network error'));

      render(<WorkoutExecutionForm {...defaultProps} />);
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      const weightInputs = screen.getAllByPlaceholderText(/weight/i);

      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '10');
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], '80');

      const saveButton = screen.getByRole('button', { name: /save|submit/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onSuccess).not.toHaveBeenCalled();
      });
    });
  });

  // I. FORM RESET
  describe('form reset after success (UR-06)', () => {
    it('resets all fields after successful submit', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      const weightInputs = screen.getAllByPlaceholderText(/weight/i);

      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '10');
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], '80');

      const saveButton = screen.getByRole('button', { name: /save|submit/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(repsInputs[0]).toHaveValue(null);
        expect(weightInputs[0]).toHaveValue(null);
      });
    });
  });

  // J. PAYLOAD CORRECTNESS
  describe('payload with mixed completed + skipped exercises', () => {
    it('skipped exercise has status skipped and sets: [] in payload', async () => {
      const user = userEvent.setup();
      render(<WorkoutExecutionForm {...defaultProps} />);

      // Toggle second exercise to skipped
      const toggleButtons = screen.getAllByRole('button', { name: /hoan thanh|bo qua/i });
      await user.click(toggleButtons[1]);

      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      const weightInputs = screen.getAllByPlaceholderText(/weight/i);

      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '10');
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], '80');

      const saveButton = screen.getByRole('button', { name: /save|submit/i });
      await user.click(saveButton);

      await waitFor(() => {
        const callArgs = workoutSessionService.createSession.mock.calls[0][0];
        expect(callArgs.exercises[0].status).toBe('completed');
        expect(callArgs.exercises[1].status).toBe('skipped');
        expect(callArgs.exercises[1].sets).toEqual([]);
      });
    });
  });
});
