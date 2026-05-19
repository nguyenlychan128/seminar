import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ExerciseCard from '../../../components/workout/ExerciseCard';

const mockExerciseChest = {
  exerciseId: 'ex_1',
  name: 'Bench Press',
  muscleGroup: 'chest',
  equipment: 'barbell',
  sets: 3,
  reps: '8-12',
  restSeconds: 90,
  order: 1,
  instructions: 'Lie flat on bench and lower the bar to your chest.',
  tips: ['Keep your back flat', 'Grip slightly wider than shoulders'],
};

const mockExerciseLegs = {
  exerciseId: 'ex_2',
  name: 'Squat',
  muscleGroup: 'legs',
  equipment: 'barbell',
  sets: 4,
  reps: '8-10',
  restSeconds: 120,
  order: 1,
  instructions: 'Stand with feet shoulder-width apart.',
  tips: [],
};

describe('ExerciseCard', () => {
  describe('compact mode (showInstructions=false)', () => {
    it('renders exercise name in bold', () => {
      render(<ExerciseCard exercise={mockExerciseChest} showInstructions={false} />);
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
    });

    it('renders exercise with muscle group badge', () => {
      render(<ExerciseCard exercise={mockExerciseChest} showInstructions={false} />);
      expect(screen.getByText('chest')).toBeInTheDocument();
    });

    it('renders rest time in seconds', () => {
      render(<ExerciseCard exercise={mockExerciseChest} showInstructions={false} />);
      expect(screen.getByText('90s')).toBeInTheDocument();
    });

    it('renders equipment', () => {
      render(<ExerciseCard exercise={mockExerciseChest} showInstructions={false} />);
      expect(screen.getByText(/barbell/i)).toBeInTheDocument();
    });
  });

  describe('detail mode (showInstructions=true)', () => {
    it('expands to show instructions when Details button clicked', () => {
      render(<ExerciseCard exercise={mockExerciseChest} showInstructions={true} />);
      expect(screen.getByText(/Lie flat on bench/)).toBeInTheDocument();
    });

    it('renders tips list when showInstructions=true', () => {
      render(<ExerciseCard exercise={mockExerciseChest} showInstructions={true} />);
      expect(screen.getByText(/Keep your back flat/)).toBeInTheDocument();
      expect(screen.getByText(/Grip slightly wider/)).toBeInTheDocument();
    });

    it('does not crash when tips array is empty', () => {
      expect(() =>
        render(<ExerciseCard exercise={mockExerciseLegs} showInstructions={true} />)
      ).not.toThrow();
    });
  });

  describe('muscle group badge colours', () => {
    it('chest badge has red color', () => {
      render(<ExerciseCard exercise={mockExerciseChest} showInstructions={false} />);
      const badge = screen.getByText('chest');
      expect(badge).toHaveClass('bg-red-500/20');
      expect(badge).toHaveClass('text-red-300');
    });

    it('back badge has blue color', () => {
      const backExercise = { ...mockExerciseChest, muscleGroup: 'back' };
      render(<ExerciseCard exercise={backExercise} showInstructions={false} />);
      const badge = screen.getByText('back');
      expect(badge).toHaveClass('bg-blue-500/20');
      expect(badge).toHaveClass('text-blue-300');
    });

    it('shoulders badge has yellow color', () => {
      const shoulderExercise = { ...mockExerciseChest, muscleGroup: 'shoulders' };
      render(<ExerciseCard exercise={shoulderExercise} showInstructions={false} />);
      const badge = screen.getByText('shoulders');
      expect(badge).toHaveClass('bg-yellow-500/20');
      expect(badge).toHaveClass('text-yellow-300');
    });

    it('arms badge has purple color', () => {
      const armExercise = { ...mockExerciseChest, muscleGroup: 'arms' };
      render(<ExerciseCard exercise={armExercise} showInstructions={false} />);
      const badge = screen.getByText('arms');
      expect(badge).toHaveClass('bg-purple-500/20');
      expect(badge).toHaveClass('text-purple-300');
    });

    it('legs badge has orange color', () => {
      render(<ExerciseCard exercise={mockExerciseLegs} showInstructions={false} />);
      const badge = screen.getByText('legs');
      expect(badge).toHaveClass('bg-orange-500/20');
      expect(badge).toHaveClass('text-orange-300');
    });

    it('core badge has emerald color', () => {
      const coreExercise = { ...mockExerciseChest, muscleGroup: 'core' };
      render(<ExerciseCard exercise={coreExercise} showInstructions={false} />);
      const badge = screen.getByText('core');
      expect(badge).toHaveClass('bg-emerald-500/20');
      expect(badge).toHaveClass('text-emerald-300');
    });
  });

  describe('edge cases', () => {
    it('does not crash when instructions is undefined', () => {
      const exerciseNoInstructions = { ...mockExerciseChest, instructions: undefined };
      expect(() =>
        render(<ExerciseCard exercise={exerciseNoInstructions} showInstructions={true} />)
      ).not.toThrow();
    });

    it('does not crash when tips is undefined', () => {
      const exerciseNoTips = { ...mockExerciseChest, tips: undefined };
      expect(() =>
        render(<ExerciseCard exercise={exerciseNoTips} showInstructions={true} />)
      ).not.toThrow();
    });

    it('handles unknown muscleGroup gracefully', () => {
      const unknownMuscleGroup = { ...mockExerciseChest, muscleGroup: 'unknown' };
      expect(() =>
        render(<ExerciseCard exercise={unknownMuscleGroup} showInstructions={false} />)
      ).not.toThrow();
    });

    it('handles null exercise gracefully', () => {
      render(<ExerciseCard exercise={null} showInstructions={false} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('expandable details', () => {
    it('toggles details panel when Details button is clicked', () => {
      const { rerender } = render(<ExerciseCard exercise={mockExerciseChest} showInstructions={false} />);
      const detailsButton = screen.getByText('Details');
      expect(screen.queryByText(/Lie flat on bench/)).not.toBeInTheDocument();

      fireEvent.click(detailsButton);
      rerender(<ExerciseCard exercise={mockExerciseChest} showInstructions={false} />);
    });
  });
});
