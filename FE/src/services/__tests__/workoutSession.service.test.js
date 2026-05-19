import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import workoutSessionService from '../workoutSession.service';

const BASE_URL = 'http://localhost/api';

vi.mock('../../stores/auth.store', () => ({
  default: {
    getState: () => ({
      tokens: { accessToken: 'test_access_token', refreshToken: 'test_refresh' },
    }),
  },
}));

const validPayload = {
  planId: '507f1f77bcf86cd799439011',
  weekNumber: 1,
  dayNumber: 1,
  sessionDate: '2026-05-18',
  exercises: [
    {
      exerciseId: '507f1f77bcf86cd799439012',
      name: 'Bench Press',
      muscleGroup: 'chest',
      status: 'completed',
      plannedSets: 3,
      plannedReps: '8-12',
      sets: [
        { setNumber: 1, actualReps: 10, weight: 80, rpe: null, notes: '' },
      ],
      notes: '',
    },
  ],
  totalDuration: null,
  mood: null,
  notes: '',
};

const successResponse = {
  success: true,
  data: {
    sessionId: '507f1f77bcf86cd799439014',
    userId: 'user001',
    ...validPayload,
    completedAt: '2026-05-18T15:30:00Z',
    createdAt: '2026-05-18T15:30:00Z',
  },
};

const server = setupServer();

describe('workoutSession.service.js', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  // A. HAPPY PATH
  describe('createSession — happy path', () => {
    it('POSTs to /api/workouts/sessions with payload', async () => {
      let capturedRequest = null;
      server.use(
        http.post(`${BASE_URL}/workouts/sessions`, async (req) => {
          capturedRequest = await req.json();
          return HttpResponse.json(successResponse, { status: 201 });
        })
      );

      await workoutSessionService.createSession(validPayload);

      expect(capturedRequest).toBeDefined();
      expect(capturedRequest.planId).toBe(validPayload.planId);
    });

    it('returns response.data on 201', async () => {
      server.use(
        http.post(`${BASE_URL}/workouts/sessions`, () => {
          return HttpResponse.json(successResponse, { status: 201 });
        })
      );

      const result = await workoutSessionService.createSession(validPayload);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('returned data contains sessionId', async () => {
      server.use(
        http.post(`${BASE_URL}/workouts/sessions`, () => {
          return HttpResponse.json(successResponse, { status: 201 });
        })
      );

      const result = await workoutSessionService.createSession(validPayload);

      expect(result.data.sessionId).toBeDefined();
    });
  });

  // B. AUTHORIZATION
  describe('createSession — authorization', () => {
    it('includes Authorization Bearer header from auth store', async () => {
      let capturedHeaders = null;
      server.use(
        http.post(`${BASE_URL}/workouts/sessions`, (req) => {
          capturedHeaders = Object.fromEntries(req.headers);
          return HttpResponse.json(successResponse, { status: 201 });
        })
      );

      await workoutSessionService.createSession(validPayload);

      expect(capturedHeaders['authorization']).toBeDefined();
      expect(capturedHeaders['authorization']).toContain('Bearer');
    });
  });

  // C. ERROR HANDLING
  describe('createSession — error handling', () => {
    it('throws on 400 with server message accessible on thrown error', async () => {
      server.use(
        http.post(`${BASE_URL}/workouts/sessions`, () => {
          return HttpResponse.json(
            { success: false, message: 'Validation failed: actualReps must be between 0 and 100' },
            { status: 400 }
          );
        })
      );

      await expect(workoutSessionService.createSession(validPayload)).rejects.toThrow();
    });

    it('throws on 401 Unauthorized', async () => {
      server.use(
        http.post(`${BASE_URL}/workouts/sessions`, () => {
          return HttpResponse.json(
            { success: false, message: 'Unauthorized - invalid or missing token' },
            { status: 401 }
          );
        })
      );

      await expect(workoutSessionService.createSession(validPayload)).rejects.toThrow();
    });

    it('throws on 409 Duplicate session', async () => {
      server.use(
        http.post(`${BASE_URL}/workouts/sessions`, () => {
          return HttpResponse.json(
            { success: false, message: 'Duplicate session - already logged for this date/plan/week/day' },
            { status: 409 }
          );
        })
      );

      await expect(workoutSessionService.createSession(validPayload)).rejects.toThrow();
    });

    it('throws on 500 Server error', async () => {
      server.use(
        http.post(`${BASE_URL}/workouts/sessions`, () => {
          return HttpResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(workoutSessionService.createSession(validPayload)).rejects.toThrow();
    });

    it('throws on network error (no response)', async () => {
      server.use(
        http.post(`${BASE_URL}/workouts/sessions`, () => {
          return HttpResponse.error();
        })
      );

      await expect(workoutSessionService.createSession(validPayload)).rejects.toThrow();
    });
  });

  // D. RETURN VALUE SHAPE
  describe('createSession — return shape', () => {
    it('returns response.data not full axios response', async () => {
      server.use(
        http.post(`${BASE_URL}/workouts/sessions`, () => {
          return HttpResponse.json(successResponse, { status: 201 });
        })
      );

      const result = await workoutSessionService.createSession(validPayload);

      expect(result).not.toHaveProperty('status');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });

    it('returned object has success: true on 201', async () => {
      server.use(
        http.post(`${BASE_URL}/workouts/sessions`, () => {
          return HttpResponse.json(successResponse, { status: 201 });
        })
      );

      const result = await workoutSessionService.createSession(validPayload);

      expect(result.success).toBe(true);
    });
  });
});
