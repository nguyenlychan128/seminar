import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import WorkoutDayPage from '../../../pages/workout/WorkoutDayPage';
import useWorkoutStore from '../../../stores/workout.store';

vi.mock('../../../stores/workout.store');

const mockPlan = {
  planId: 'plan_123',
  weeks: [
    {
      weekNumber: 1,
      days: [
        {
          dayNumber: 1,
          dayLabel: 'Day A — Push',
          scheduledDate: '2026-05-18',
          isRestDay: false,
          exercises: [
            {
              exerciseId: 'ex_1',
              name: 'Bench Press',
              muscleGroup: 'chest',
              equipment: 'barbell',
              sets: 3,
              reps: '8-12',
              restSeconds: 90,
              order: 1,
              instructions: 'Lie flat on bench.',
              tips: ['Keep back flat'],
            },
            {
              exerciseId: 'ex_2',
              name: 'Overhead Press',
              muscleGroup: 'shoulders',
              equipment: 'barbell',
              sets: 3,
              reps: '8-12',
              restSeconds: 90,
              order: 2,
              instructions: 'Stand and press overhead.',
              tips: [],
            },
          ],
        },
        {
          dayNumber: 2,
          dayLabel: 'Rest Day',
          scheduledDate: '2026-05-19',
          isRestDay: true,
          exercises: [],
        },
      ],
    },
  ],
};

describe('WorkoutDayPage', () => {

  describe('rest day screen', () => {
    it('shows rest day message when isRestDay=true', () => {
      useWorkoutStore.mockReturnValue({ plan: mockPlan });

      render(
        <MemoryRouter initialEntries={['/workout/day/1/2']}>
          <Routes>
            <Route path="/workout/day/:weekNumber/:dayNumber" element={<WorkoutDayPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText(/Recovery is Part of the Plan/)).toBeInTheDocument();
    });

    it('does NOT show ExerciseCard list on rest day', () => {
      useWorkoutStore.mockReturnValue({ plan: mockPlan });

      render(
        <MemoryRouter initialEntries={['/workout/day/1/2']}>
          <Routes>
            <Route path="/workout/day/:weekNumber/:dayNumber" element={<WorkoutDayPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
    });

    it('does NOT show "Start Workout" button on rest day', () => {
      useWorkoutStore.mockReturnValue({ plan: mockPlan });

      render(
        <MemoryRouter initialEntries={['/workout/day/1/2']}>
          <Routes>
            <Route path="/workout/day/:weekNumber/:dayNumber" element={<WorkoutDayPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.queryByText(/start workout/i)).not.toBeInTheDocument();
    });
  });

  describe('workout day screen', () => {
    it('renders ExerciseCard for each exercise', () => {
      useWorkoutStore.mockReturnValue({ plan: mockPlan });

      render(
        <MemoryRouter initialEntries={['/workout/day/1/1']}>
          <Routes>
            <Route path="/workout/day/:weekNumber/:dayNumber" element={<WorkoutDayPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Overhead Press')).toBeInTheDocument();
    });

    it('renders Details button for expanding exercise info', () => {
      useWorkoutStore.mockReturnValue({ plan: mockPlan });

      render(
        <MemoryRouter initialEntries={['/workout/day/1/1']}>
          <Routes>
            <Route path="/workout/day/:weekNumber/:dayNumber" element={<WorkoutDayPage />} />
          </Routes>
        </MemoryRouter>
      );
      // Exercise cards should have Details buttons
      expect(screen.getAllByText('Details').length).toBeGreaterThan(0);
    });

    it('shows day label as heading', () => {
      useWorkoutStore.mockReturnValue({ plan: mockPlan });

      render(
        <MemoryRouter initialEntries={['/workout/day/1/1']}>
          <Routes>
            <Route path="/workout/day/:weekNumber/:dayNumber" element={<WorkoutDayPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('Day A — Push')).toBeInTheDocument();
    });

    it('shows "Start Workout" button', () => {
      useWorkoutStore.mockReturnValue({ plan: mockPlan });

      render(
        <MemoryRouter initialEntries={['/workout/day/1/1']}>
          <Routes>
            <Route path="/workout/day/:weekNumber/:dayNumber" element={<WorkoutDayPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText(/start workout/i)).toBeInTheDocument();
    });

    it('shows estimated workout time', () => {
      useWorkoutStore.mockReturnValue({ plan: mockPlan });

      render(
        <MemoryRouter initialEntries={['/workout/day/1/1']}>
          <Routes>
            <Route path="/workout/day/:weekNumber/:dayNumber" element={<WorkoutDayPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText(/Estimated Time/)).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('"Back" button exists and is clickable', () => {
      useWorkoutStore.mockReturnValue({ plan: mockPlan });

      render(
        <MemoryRouter initialEntries={['/workout/day/1/1']}>
          <Routes>
            <Route path="/workout/day/:weekNumber/:dayNumber" element={<WorkoutDayPage />} />
          </Routes>
        </MemoryRouter>
      );
      const backButton = screen.getByText('Back to Plan');
      expect(backButton).toBeInTheDocument();
      expect(backButton).not.toBeDisabled();
    });

    it('renders "Back" button on rest day', () => {
      useWorkoutStore.mockReturnValue({ plan: mockPlan });

      render(
        <MemoryRouter initialEntries={['/workout/day/1/2']}>
          <Routes>
            <Route path="/workout/day/:weekNumber/:dayNumber" element={<WorkoutDayPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('Back to Plan')).toBeInTheDocument();
    });

    it('renders "Back" button on workout day', () => {
      useWorkoutStore.mockReturnValue({ plan: mockPlan });

      render(
        <MemoryRouter initialEntries={['/workout/day/1/1']}>
          <Routes>
            <Route path="/workout/day/:weekNumber/:dayNumber" element={<WorkoutDayPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('Back to Plan')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('shows not found message when plan is null', () => {
      useWorkoutStore.mockReturnValue({ plan: null });

      render(
        <MemoryRouter initialEntries={['/workout/day/1/1']}>
          <Routes>
            <Route path="/workout/day/:weekNumber/:dayNumber" element={<WorkoutDayPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText(/Workout Not Found/)).toBeInTheDocument();
    });

    it('shows not found message for out of bounds params', () => {
      useWorkoutStore.mockReturnValue({ plan: mockPlan });

      render(
        <MemoryRouter initialEntries={['/workout/day/99/99']}>
          <Routes>
            <Route path="/workout/day/:weekNumber/:dayNumber" element={<WorkoutDayPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText(/Workout Not Found/)).toBeInTheDocument();
    });
  });
});
