import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WeekCalendar from '../../../components/workout/WeekCalendar';

const mockFullWeek = {
  planId: 'plan_abc',
  weekNumber: 1,
  days: [
    {
      dayNumber: 1,
      dayLabel: 'Day A — Push',
      scheduledDate: '2026-05-18',
      isRestDay: false,
      exercises: [
        { exerciseId: 'ex_1', name: 'Bench Press', muscleGroup: 'chest', sets: 3, reps: '8-12' },
      ],
    },
    {
      dayNumber: 2,
      dayLabel: 'Rest Day',
      scheduledDate: '2026-05-19',
      isRestDay: true,
      exercises: [],
    },
    {
      dayNumber: 3,
      dayLabel: 'Day B — Pull',
      scheduledDate: '2026-05-20',
      isRestDay: false,
      exercises: [],
    },
    {
      dayNumber: 4,
      dayLabel: 'Rest Day',
      scheduledDate: '2026-05-21',
      isRestDay: true,
      exercises: [],
    },
    {
      dayNumber: 5,
      dayLabel: 'Day C — Legs',
      scheduledDate: '2026-05-22',
      isRestDay: false,
      exercises: [],
    },
    {
      dayNumber: 6,
      dayLabel: 'Rest Day',
      scheduledDate: '2026-05-23',
      isRestDay: true,
      exercises: [],
    },
    {
      dayNumber: 7,
      dayLabel: 'Rest Day',
      scheduledDate: '2026-05-24',
      isRestDay: true,
      exercises: [],
    },
  ],
};

describe('WeekCalendar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('renders all 7 days', () => {
    it('renders 7 day items', () => {
      render(
        <WeekCalendar
          days={mockFullWeek.days}
          onDaySelect={() => {}}
          selectedDayNumber={null}
        />
      );
      const dayButtons = screen.getAllByTestId(/day-\d/);
      expect(dayButtons).toHaveLength(7);
    });

    it('shows day labels for workout days', () => {
      render(
        <WeekCalendar
          days={mockFullWeek.days}
          onDaySelect={() => {}}
          selectedDayNumber={null}
        />
      );
      expect(screen.getByText('Push')).toBeInTheDocument();
      expect(screen.getByText('Pull')).toBeInTheDocument();
      expect(screen.getByText('Legs')).toBeInTheDocument();
    });

    it('shows "Rest" badge for rest days', () => {
      render(
        <WeekCalendar
          days={mockFullWeek.days}
          onDaySelect={() => {}}
          selectedDayNumber={null}
        />
      );
      const restBadges = screen.getAllByText('Rest');
      expect(restBadges.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('today highlight', () => {
    it('highlights the day matching today', () => {
      vi.setSystemTime(new Date('2026-05-18'));
      render(
        <WeekCalendar
          days={mockFullWeek.days}
          onDaySelect={() => {}}
          selectedDayNumber={null}
        />
      );
      const todayButton = screen.getByTestId('day-1');
      expect(todayButton).toHaveClass('ring-2');
      expect(todayButton).toHaveClass('ring-amber-400');
    });

    it('does NOT highlight non-today days', () => {
      vi.setSystemTime(new Date('2026-05-18'));
      render(
        <WeekCalendar
          days={mockFullWeek.days}
          onDaySelect={() => {}}
          selectedDayNumber={null}
        />
      );
      const day3Button = screen.getByTestId('day-3');
      expect(day3Button).not.toHaveClass('ring-2');
    });
  });

  describe('click interaction', () => {
    it('calls onDaySelect with dayNumber when workout day is clicked', () => {
      const onDaySelect = vi.fn();
      render(
        <WeekCalendar
          days={mockFullWeek.days}
          onDaySelect={onDaySelect}
          selectedDayNumber={null}
        />
      );
      fireEvent.click(screen.getByTestId('day-1'));
      expect(onDaySelect).toHaveBeenCalledWith(1);
    });

    it('does NOT call onDaySelect when rest day is clicked', () => {
      const onDaySelect = vi.fn();
      render(
        <WeekCalendar
          days={mockFullWeek.days}
          onDaySelect={onDaySelect}
          selectedDayNumber={null}
        />
      );
      fireEvent.click(screen.getByTestId('day-2'));
      expect(onDaySelect).not.toHaveBeenCalled();
    });

    it('rest day cells have disabled cursor', () => {
      render(
        <WeekCalendar
          days={mockFullWeek.days}
          onDaySelect={() => {}}
          selectedDayNumber={null}
        />
      );
      const restDayButton = screen.getByTestId('day-2');
      expect(restDayButton).toBeDisabled();
      expect(restDayButton).toHaveClass('cursor-not-allowed');
    });
  });

  describe('selectedDayNumber highlight', () => {
    it('applies selected background to matching day', () => {
      render(
        <WeekCalendar
          days={mockFullWeek.days}
          onDaySelect={() => {}}
          selectedDayNumber={1}
        />
      );
      const selectedButton = screen.getByTestId('day-1');
      expect(selectedButton).toHaveClass('bg-emerald-600');
      expect(selectedButton).toHaveClass('border-emerald-500');
    });

    it('does not apply selected style to non-selected days', () => {
      render(
        <WeekCalendar
          days={mockFullWeek.days}
          onDaySelect={() => {}}
          selectedDayNumber={1}
        />
      );
      const unselectedButton = screen.getByTestId('day-3');
      expect(unselectedButton).not.toHaveClass('bg-emerald-600');
    });
  });

  describe('badge colours', () => {
    it('Push day badge has blue color', () => {
      render(
        <WeekCalendar
          days={mockFullWeek.days}
          onDaySelect={() => {}}
          selectedDayNumber={null}
        />
      );
      const pushBadge = screen.getByText('Push');
      expect(pushBadge).toHaveClass('text-blue-300');
    });

    it('Pull day badge has purple color', () => {
      render(
        <WeekCalendar
          days={mockFullWeek.days}
          onDaySelect={() => {}}
          selectedDayNumber={null}
        />
      );
      const pullBadge = screen.getByText('Pull');
      expect(pullBadge).toHaveClass('text-purple-300');
    });

    it('Legs day badge has orange color', () => {
      render(
        <WeekCalendar
          days={mockFullWeek.days}
          onDaySelect={() => {}}
          selectedDayNumber={null}
        />
      );
      const legsBadge = screen.getByText('Legs');
      expect(legsBadge).toHaveClass('text-orange-300');
    });

    it('Rest day badge has gray color', () => {
      render(
        <WeekCalendar
          days={mockFullWeek.days}
          onDaySelect={() => {}}
          selectedDayNumber={null}
        />
      );
      const restBadges = screen.getAllByText('Rest');
      expect(restBadges[0]).toHaveClass('text-slate-300');
    });
  });
});
