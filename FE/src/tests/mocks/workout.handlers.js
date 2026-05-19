import { http, HttpResponse } from 'msw';

const BASE = '/api';

const mockPlan = {
  planId: 'plan_abc',
  userId: 'user_123',
  name: 'Beginner Weight Gain Plan',
  startDate: '2026-05-18',
  endDate: '2026-06-14',
  durationWeeks: 4,
  daysPerWeek: 3,
  status: 'active',
  weeks: [],
  createdAt: '2026-05-18T10:00:00Z',
};

const mockPlanSummary = {
  planId: 'plan_abc',
  name: 'Beginner Weight Gain Plan',
  durationWeeks: 4,
  daysPerWeek: 3,
  startDate: '2026-05-18',
  endDate: '2026-06-14',
  status: 'active',
};

const mockWeek = {
  planId: 'plan_abc',
  weekNumber: 1,
  days: [
    {
      dayNumber: 1,
      dayLabel: 'Day A — Push',
      scheduledDate: '2026-05-19',
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
        },
      ],
    },
    {
      dayNumber: 2,
      dayLabel: 'Rest Day',
      scheduledDate: '2026-05-20',
      isRestDay: true,
      exercises: [],
    },
  ],
};

const mockTodayWorkout = {
  planId: 'plan_abc',
  today: '2026-05-19',
  isRestDay: false,
  dayLabel: 'Day A — Push',
  exercises: [
    {
      exerciseId: 'ex_1',
      name: 'Bench Press',
      muscleGroup: 'chest',
      sets: 3,
      reps: '8-12',
      restSeconds: 90,
      order: 1,
    },
  ],
};

const mockTodayRestDay = {
  planId: 'plan_abc',
  today: '2026-05-20',
  isRestDay: true,
  dayLabel: 'Rest Day',
  exercises: [],
};

export const workoutHandlers = [
  http.get(`${BASE}/workouts/plans/my`, () =>
    HttpResponse.json(mockPlan)
  ),

  http.post(`${BASE}/workouts/plans/generate`, () =>
    HttpResponse.json(mockPlanSummary, { status: 201 })
  ),

  http.get(`${BASE}/workouts/plans/my/week/:weekNumber`, ({ params }) => {
    if (params.weekNumber === '1') {
      return HttpResponse.json(mockWeek);
    }
    return HttpResponse.json({ message: 'Invalid week' }, { status: 400 });
  }),

  http.get(`${BASE}/workouts/plans/my/today`, () =>
    HttpResponse.json(mockTodayWorkout)
  ),
];

export {
  mockPlan,
  mockPlanSummary,
  mockWeek,
  mockTodayWorkout,
  mockTodayRestDay,
};
