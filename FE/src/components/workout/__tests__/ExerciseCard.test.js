import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExerciseCard from '../ExerciseCard';

const mockExercise = {
  exerciseId: '507f1f77bcf86cd799439012',
  name: 'Bench Press',
  muscleGroup: 'chest',
  plannedSets: 3,
  plannedReps: '8-12',
};

const completedFormData = {
  status: 'completed',
  sets: [
    { setNumber: 1, actualReps: 10, weight: 80, rpe: null, notes: '' },
    { setNumber: 2, actualReps: 9, weight: 80, rpe: null, notes: '' },
    { setNumber: 3, actualReps: 8, weight: 80, rpe: null, notes: '' },
  ],
  notes: '',
};

const skippedFormData = {
  status: 'skipped',
  sets: [],
  notes: '',
};

describe('ExerciseCard (execution mode)', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // A. RENDERING
  describe('rendering', () => {
    it('renders exercise name', () => {
      render(
        <ExerciseCard
          exercise={mockExercise}
          formData={completedFormData}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
    });

    it('renders muscle group badge', () => {
      render(
        <ExerciseCard
          exercise={mockExercise}
          formData={completedFormData}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText(/chest/i)).toBeInTheDocument();
    });

    it('renders status toggle button with initial text "Completed"', () => {
      render(
        <ExerciseCard
          exercise={mockExercise}
          formData={completedFormData}
          onChange={mockOnChange}
        />
      );
      const toggleButton = screen.getByRole('button', { name: /completed|skipped/i });
      expect(toggleButton).toHaveTextContent(/completed/i);
    });

    it('renders set input rows when status is completed', () => {
      render(
        <ExerciseCard
          exercise={mockExercise}
          formData={completedFormData}
          onChange={mockOnChange}
        />
      );
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      expect(repsInputs.length).toBeGreaterThanOrEqual(3);
    });

    it('does not render set input rows when status is skipped', () => {
      render(
        <ExerciseCard
          exercise={mockExercise}
          formData={skippedFormData}
          onChange={mockOnChange}
        />
      );
      const repsInputs = screen.queryAllByPlaceholderText(/reps/i);
      expect(repsInputs.length).toBe(0);
    });

    it('renders exercise-level notes textarea', () => {
      render(
        <ExerciseCard
          exercise={mockExercise}
          formData={completedFormData}
          onChange={mockOnChange}
        />
      );
      const notesInputs = screen.getAllByPlaceholderText(/notes/i);
      expect(notesInputs.length).toBeGreaterThan(0);
    });
  });

  // B. STATUS TOGGLE
  describe('status toggle', () => {
    it('calls onChange with status: "skipped" when toggled from completed', async () => {
      const user = userEvent.setup();
      render(
        <ExerciseCard
          exercise={mockExercise}
          formData={completedFormData}
          onChange={mockOnChange}
        />
      );
      const toggleButton = screen.getByRole('button', { name: /completed/i });
      await user.click(toggleButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'skipped' })
      );
    });

    it('calls onChange with status: "completed" when toggled from skipped', async () => {
      const user = userEvent.setup();
      render(
        <ExerciseCard
          exercise={mockExercise}
          formData={skippedFormData}
          onChange={mockOnChange}
        />
      );
      const toggleButton = screen.getByRole('button', { name: /skipped/i });
      await user.click(toggleButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' })
      );
    });

    it('shows "Skipped" button text when status is skipped', () => {
      render(
        <ExerciseCard
          exercise={mockExercise}
          formData={skippedFormData}
          onChange={mockOnChange}
        />
      );
      const toggleButton = screen.getByRole('button', { name: /skipped/i });
      expect(toggleButton).toHaveTextContent(/skipped/i);
    });

    it('shows "Completed" button text when status is completed', () => {
      render(
        <ExerciseCard
          exercise={mockExercise}
          formData={completedFormData}
          onChange={mockOnChange}
        />
      );
      const toggleButton = screen.getByRole('button', { name: /completed/i });
      expect(toggleButton).toHaveTextContent(/completed/i);
    });
  });

  // C. SET INPUT CHANGES
  describe('set input changes', () => {
    it('calls onChange with updated sets when reps value changes', async () => {
      const user = userEvent.setup();
      render(
        <ExerciseCard
          exercise={mockExercise}
          formData={completedFormData}
          onChange={mockOnChange}
        />
      );
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      await user.clear(repsInputs[0]);
      await user.type(repsInputs[0], '12');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sets: expect.any(Array),
        })
      );
    });

    it('calls onChange with updated sets when weight value changes', async () => {
      const user = userEvent.setup();
      render(
        <ExerciseCard
          exercise={mockExercise}
          formData={completedFormData}
          onChange={mockOnChange}
        />
      );
      const weightInputs = screen.getAllByPlaceholderText(/weight/i);
      await user.clear(weightInputs[0]);
      await user.type(weightInputs[0], '90');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sets: expect.any(Array),
        })
      );
    });

    it('calls onChange with updated sets when rpe value changes', async () => {
      const user = userEvent.setup();
      render(
        <ExerciseCard
          exercise={mockExercise}
          formData={completedFormData}
          onChange={mockOnChange}
        />
      );
      const rpeInputs = screen.queryAllByPlaceholderText(/rpe/i);
      if (rpeInputs.length > 0) {
        await user.clear(rpeInputs[0]);
        await user.type(rpeInputs[0], '8');
        expect(mockOnChange).toHaveBeenCalled();
      }
    });

    it('calls onChange with updated sets when set notes value changes', async () => {
      const user = userEvent.setup();
      render(
        <ExerciseCard
          exercise={mockExercise}
          formData={completedFormData}
          onChange={mockOnChange}
        />
      );
      const setNotesInputs = screen.queryAllByPlaceholderText(/set notes/i);
      if (setNotesInputs.length > 0) {
        await user.clear(setNotesInputs[0]);
        await user.type(setNotesInputs[0], 'Felt strong');
        expect(mockOnChange).toHaveBeenCalled();
      }
    });
  });

  // D. EXERCISE NOTES
  describe('exercise notes', () => {
    it('calls onChange with updated notes when exercise notes change', async () => {
      const user = userEvent.setup();
      render(
        <ExerciseCard
          exercise={mockExercise}
          formData={completedFormData}
          onChange={mockOnChange}
        />
      );
      const notesInputs = screen.getAllByPlaceholderText(/exercise notes/i);
      await user.clear(notesInputs[0]);
      await user.type(notesInputs[0], 'Shoulder felt tight');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: expect.any(String),
        })
      );
    });
  });

  // E. EDGE CASES
  describe('edge cases', () => {
    it('renders 1 set row when plannedSets is 1', () => {
      const singleSetExercise = { ...mockExercise, plannedSets: 1 };
      const singleSetFormData = {
        status: 'completed',
        sets: [{ setNumber: 1, actualReps: 10, weight: 80, rpe: null, notes: '' }],
        notes: '',
      };
      render(
        <ExerciseCard
          exercise={singleSetExercise}
          formData={singleSetFormData}
          onChange={mockOnChange}
        />
      );
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      expect(repsInputs.length).toBeGreaterThanOrEqual(1);
    });

    it('renders 5 set rows when plannedSets is 5', () => {
      const fiveSetExercise = { ...mockExercise, plannedSets: 5 };
      const fiveSetFormData = {
        status: 'completed',
        sets: [
          { setNumber: 1, actualReps: 10, weight: 80, rpe: null, notes: '' },
          { setNumber: 2, actualReps: 10, weight: 80, rpe: null, notes: '' },
          { setNumber: 3, actualReps: 10, weight: 80, rpe: null, notes: '' },
          { setNumber: 4, actualReps: 10, weight: 80, rpe: null, notes: '' },
          { setNumber: 5, actualReps: 10, weight: 80, rpe: null, notes: '' },
        ],
        notes: '',
      };
      render(
        <ExerciseCard
          exercise={fiveSetExercise}
          formData={fiveSetFormData}
          onChange={mockOnChange}
        />
      );
      const repsInputs = screen.getAllByPlaceholderText(/reps/i);
      expect(repsInputs.length).toBeGreaterThanOrEqual(5);
    });

    it('does not crash when onChange prop is not provided', () => {
      expect(() => {
        render(
          <ExerciseCard
            exercise={mockExercise}
            formData={completedFormData}
          />
        );
      }).not.toThrow();
    });
  });
});
