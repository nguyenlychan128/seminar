import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DayCard from '../../../components/workout/DayCard';

const mockWorkoutDay = {
  dayNumber: 1,
  dayLabel: 'Day A — Push',
  scheduledDate: '2026-05-18',
  isRestDay: false,
  exercises: [
    { exerciseId: 'ex_1', name: 'Bench Press', muscleGroup: 'chest' },
    { exerciseId: 'ex_2', name: 'Overhead Press', muscleGroup: 'shoulders' },
    { exerciseId: 'ex_3', name: 'Tricep Pushdown', muscleGroup: 'arms' },
  ],
};

const mockRestDay = {
  dayNumber: 2,
  dayLabel: 'Rest Day',
  scheduledDate: '2026-05-19',
  isRestDay: true,
  exercises: [],
};

describe('DayCard', () => {
  describe('workout day rendering', () => {
    it('displays day label', () => {
      render(<DayCard day={mockWorkoutDay} isToday={false} onClick={() => {}} />);
      expect(screen.getByText('Day A — Push')).toBeInTheDocument();
    });

    it('displays exercise count', () => {
      render(<DayCard day={mockWorkoutDay} isToday={false} onClick={() => {}} />);
      expect(screen.getByText('3 exercises')).toBeInTheDocument();
    });

    it('shows first 2 exercise names as preview', () => {
      render(<DayCard day={mockWorkoutDay} isToday={false} onClick={() => {}} />);
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Overhead Press')).toBeInTheDocument();
    });

    it('shows "+1 more" when there are more than 2 exercises', () => {
      render(<DayCard day={mockWorkoutDay} isToday={false} onClick={() => {}} />);
      expect(screen.getByText(/\+1 more/)).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      render(<DayCard day={mockWorkoutDay} isToday={false} onClick={onClick} />);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('rest day rendering', () => {
    it('displays "Rest Day" text when isRestDay=true', () => {
      render(<DayCard day={mockRestDay} isToday={false} onClick={() => {}} />);
      expect(screen.getAllByText('Rest Day').length).toBeGreaterThan(0);
    });

    it('does NOT show exercise count for rest day', () => {
      render(<DayCard day={mockRestDay} isToday={false} onClick={() => {}} />);
      expect(screen.queryByText(/exercises/)).not.toBeInTheDocument();
    });

    it('is disabled and cannot be clicked', () => {
      const onClick = vi.fn();
      render(<DayCard day={mockRestDay} isToday={false} onClick={onClick} />);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('today badge', () => {
    it('shows "Today" badge when isToday=true', () => {
      render(<DayCard day={mockWorkoutDay} isToday={true} onClick={() => {}} />);
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('"Today" badge has amber color', () => {
      render(<DayCard day={mockWorkoutDay} isToday={true} onClick={() => {}} />);
      const badge = screen.getByText('Today');
      expect(badge).toHaveClass('bg-amber-500/20');
      expect(badge).toHaveClass('text-amber-300');
    });

    it('does NOT show "Today" badge when isToday=false', () => {
      render(<DayCard day={mockWorkoutDay} isToday={false} onClick={() => {}} />);
      expect(screen.queryByText('Today')).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('does not crash when exercises array is empty on workout day', () => {
      const dayWithNoExercises = { ...mockWorkoutDay, exercises: [] };
      expect(() => render(<DayCard day={dayWithNoExercises} isToday={false} onClick={() => {}} />)).not.toThrow();
    });

    it('handles null day gracefully', () => {
      render(<DayCard day={null} isToday={false} onClick={() => {}} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
