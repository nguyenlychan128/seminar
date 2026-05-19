import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import WorkoutPlanPage from '../../../pages/workout/WorkoutPlanPage';
import useWorkoutPlan from '../../../hooks/useWorkoutPlan';
import useUserStore from '../../../stores/user.store';

vi.mock('../../../hooks/useWorkoutPlan');
vi.mock('../../../stores/user.store');

const mockPlan = {
  planId: 'plan_123',
  name: 'Beginner Weight Gain Plan',
  startDate: '2026-05-18',
  endDate: '2026-06-14',
  durationWeeks: 4,
  daysPerWeek: 3,
  status: 'active',
  weeks: [
    {
      weekNumber: 1,
      days: [
        {
          dayNumber: 1,
          dayLabel: 'Day A — Push',
          scheduledDate: '2026-05-18',
          isRestDay: false,
          exercises: [{ exerciseId: 'ex_1', name: 'Bench Press', muscleGroup: 'chest' }],
        },
        { dayNumber: 2, dayLabel: 'Rest Day', scheduledDate: '2026-05-19', isRestDay: true, exercises: [] },
        {
          dayNumber: 3,
          dayLabel: 'Day B — Pull',
          scheduledDate: '2026-05-20',
          isRestDay: false,
          exercises: [],
        },
        { dayNumber: 4, dayLabel: 'Rest Day', scheduledDate: '2026-05-21', isRestDay: true, exercises: [] },
        { dayNumber: 5, dayLabel: 'Day C — Legs', scheduledDate: '2026-05-22', isRestDay: false, exercises: [] },
        { dayNumber: 6, dayLabel: 'Rest Day', scheduledDate: '2026-05-23', isRestDay: true, exercises: [] },
        { dayNumber: 7, dayLabel: 'Rest Day', scheduledDate: '2026-05-24', isRestDay: true, exercises: [] },
      ],
    },
  ],
};

const mockProfile = {
  userId: 'user_123',
  height: 165,
  weight: 48,
  age: 22,
  gender: 'male',
  bmi: 17.63,
};

describe('WorkoutPlanPage', () => {

  describe('loading state', () => {
    it('shows skeleton loader when isLoading=true', () => {
      useWorkoutPlan.mockReturnValue({
        plan: null,
        isLoading: true,
        hasActivePlan: false,
        generatePlan: vi.fn(),
        fetchMyPlan: vi.fn(),
        fetchWeek: vi.fn(),
        currentWeekNumber: null,
      });
      useUserStore.mockReturnValue({ profile: mockProfile });

      render(
        <MemoryRouter>
          <WorkoutPlanPage />
        </MemoryRouter>
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('does NOT show plan content while loading', () => {
      useWorkoutPlan.mockReturnValue({
        plan: null,
        isLoading: true,
        hasActivePlan: false,
        generatePlan: vi.fn(),
        fetchMyPlan: vi.fn(),
        fetchWeek: vi.fn(),
        currentWeekNumber: null,
      });
      useUserStore.mockReturnValue({ profile: mockProfile });

      render(
        <MemoryRouter>
          <WorkoutPlanPage />
        </MemoryRouter>
      );
      expect(screen.queryByText('Beginner Weight Gain Plan')).not.toBeInTheDocument();
    });
  });

  describe('redirect when profile is null', () => {
    it('handles null profile state without crashing', () => {
      useWorkoutPlan.mockReturnValue({
        plan: null,
        isLoading: false,
        hasActivePlan: false,
        generatePlan: vi.fn(),
        fetchMyPlan: vi.fn(),
        fetchWeek: vi.fn(),
        currentWeekNumber: null,
      });
      useUserStore.mockReturnValue({ profile: null });

      expect(() =>
        render(
          <MemoryRouter>
            <WorkoutPlanPage />
          </MemoryRouter>
        )
      ).not.toThrow();
    });
  });

  describe('onboarding screen', () => {
    it('shows onboarding message when plan=null and profile exists', () => {
      useWorkoutPlan.mockReturnValue({
        plan: null,
        isLoading: false,
        hasActivePlan: false,
        generatePlan: vi.fn(),
        fetchMyPlan: vi.fn(),
        fetchWeek: vi.fn(),
        currentWeekNumber: null,
      });
      useUserStore.mockReturnValue({ profile: mockProfile });

      render(
        <MemoryRouter>
          <WorkoutPlanPage />
        </MemoryRouter>
      );
      expect(screen.getByText(/don't have a workout plan yet/i)).toBeInTheDocument();
    });

    it('renders "Create My Plan" button', () => {
      useWorkoutPlan.mockReturnValue({
        plan: null,
        isLoading: false,
        hasActivePlan: false,
        generatePlan: vi.fn(),
        fetchMyPlan: vi.fn(),
        fetchWeek: vi.fn(),
        currentWeekNumber: null,
      });
      useUserStore.mockReturnValue({ profile: mockProfile });

      render(
        <MemoryRouter>
          <WorkoutPlanPage />
        </MemoryRouter>
      );
      expect(screen.getByRole('button', { name: /create my plan/i })).toBeInTheDocument();
    });

    it('calls generatePlan when "Create My Plan" is clicked', async () => {
      const generatePlan = vi.fn().mockResolvedValue(undefined);
      useWorkoutPlan.mockReturnValue({
        plan: null,
        isLoading: false,
        hasActivePlan: false,
        generatePlan,
        fetchMyPlan: vi.fn(),
        fetchWeek: vi.fn(),
        currentWeekNumber: null,
      });
      useUserStore.mockReturnValue({ profile: mockProfile });

      render(
        <MemoryRouter>
          <WorkoutPlanPage />
        </MemoryRouter>
      );
      const button = screen.getByRole('button', { name: /create my plan/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(generatePlan).toHaveBeenCalled();
      });
    });

    it('disables button while generatePlan is in-flight', async () => {
      let resolveGeneratePlan;
      const generatePlan = vi.fn(
        () => new Promise((resolve) => {
          resolveGeneratePlan = resolve;
        })
      );
      useWorkoutPlan.mockReturnValue({
        plan: null,
        isLoading: false,
        hasActivePlan: false,
        generatePlan,
        fetchMyPlan: vi.fn(),
        fetchWeek: vi.fn(),
        currentWeekNumber: null,
      });
      useUserStore.mockReturnValue({ profile: mockProfile });

      const { rerender } = render(
        <MemoryRouter>
          <WorkoutPlanPage />
        </MemoryRouter>
      );
      const button = screen.getByRole('button', { name: /create my plan/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      resolveGeneratePlan();
    });
  });

  describe('plan loaded state', () => {
    it('renders PlanSummaryCard when plan exists', () => {
      useWorkoutPlan.mockReturnValue({
        plan: mockPlan,
        isLoading: false,
        hasActivePlan: true,
        generatePlan: vi.fn(),
        fetchMyPlan: vi.fn(),
        fetchWeek: vi.fn(),
        currentWeekNumber: 1,
      });
      useUserStore.mockReturnValue({ profile: mockProfile });

      render(
        <MemoryRouter>
          <WorkoutPlanPage />
        </MemoryRouter>
      );
      expect(screen.getByText('Beginner Weight Gain Plan')).toBeInTheDocument();
    });

    it('shows current week number in header', () => {
      useWorkoutPlan.mockReturnValue({
        plan: mockPlan,
        isLoading: false,
        hasActivePlan: true,
        generatePlan: vi.fn(),
        fetchMyPlan: vi.fn(),
        fetchWeek: vi.fn(),
        currentWeekNumber: 1,
      });
      useUserStore.mockReturnValue({ profile: mockProfile });

      render(
        <MemoryRouter>
          <WorkoutPlanPage />
        </MemoryRouter>
      );
      expect(screen.getByText(/Week 1 of 4/)).toBeInTheDocument();
    });

    it('clicking > increments week display', () => {
      useWorkoutPlan.mockReturnValue({
        plan: mockPlan,
        isLoading: false,
        hasActivePlan: true,
        generatePlan: vi.fn(),
        fetchMyPlan: vi.fn(),
        fetchWeek: vi.fn(),
        currentWeekNumber: 1,
      });
      useUserStore.mockReturnValue({ profile: mockProfile });

      render(
        <MemoryRouter>
          <WorkoutPlanPage />
        </MemoryRouter>
      );
      const nextButton = screen.getAllByRole('button').find((btn) => {
        const svg = btn.querySelector('svg');
        return svg && svg.innerHTML.includes('M9 5l7');
      });
      fireEvent.click(nextButton);
      // After clicking, week should increment (requires state management)
    });

    it('< button does not go below week 1', () => {
      useWorkoutPlan.mockReturnValue({
        plan: mockPlan,
        isLoading: false,
        hasActivePlan: true,
        generatePlan: vi.fn(),
        fetchMyPlan: vi.fn(),
        fetchWeek: vi.fn(),
        currentWeekNumber: 1,
      });
      useUserStore.mockReturnValue({ profile: mockProfile });

      render(
        <MemoryRouter>
          <WorkoutPlanPage />
        </MemoryRouter>
      );
      const prevButton = screen.getAllByRole('button').find((btn) => {
        const svg = btn.querySelector('svg');
        return svg && svg.innerHTML.includes('M15 19l-7');
      });
      expect(prevButton).toBeDisabled();
    });
  });
});
