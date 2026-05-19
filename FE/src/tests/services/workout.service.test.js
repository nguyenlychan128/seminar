import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup';
import workoutService from '../../services/workout.service';
import {
  mockPlan,
  mockPlanSummary,
  mockWeek,
  mockTodayWorkout,
  mockTodayRestDay,
} from '../mocks/workout.handlers';

const BASE = '/api';

describe('workoutService', () => {
  describe('getMyPlan()', () => {
    it('should return plan object on 200', async () => {
      const result = await workoutService.getMyPlan();
      expect(result).toEqual(mockPlan);
    });

    it('should throw "No workout plan found" on 404', async () => {
      server.use(
        http.get(`${BASE}/workouts/plans/my`, () =>
          HttpResponse.json({ message: 'Not found' }, { status: 404 })
        )
      );
      await expect(workoutService.getMyPlan()).rejects.toThrow('No workout plan found');
    });

    it('should throw error with status 404 on 404 response', async () => {
      server.use(
        http.get(`${BASE}/workouts/plans/my`, () =>
          HttpResponse.json({ message: 'Not found' }, { status: 404 })
        )
      );
      try {
        await workoutService.getMyPlan();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.status).toBe(404);
      }
    });

    it('should throw "Please log in again" on 401', async () => {
      server.use(
        http.get(`${BASE}/workouts/plans/my`, () =>
          HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        )
      );
      await expect(workoutService.getMyPlan()).rejects.toThrow('Please log in again');
    });

    it('should throw "Server error. Please try again later" on 500', async () => {
      server.use(
        http.get(`${BASE}/workouts/plans/my`, () =>
          HttpResponse.json({ message: 'Server error' }, { status: 500 })
        )
      );
      await expect(workoutService.getMyPlan()).rejects.toThrow(
        'Server error. Please try again later'
      );
    });
  });

  describe('generatePlan()', () => {
    it('should return plan summary on 201', async () => {
      const result = await workoutService.generatePlan();
      expect(result).toEqual(mockPlanSummary);
    });

    it('should send POST request', async () => {
      let requestWasCalled = false;
      server.use(
        http.post(`${BASE}/workouts/plans/generate`, () => {
          requestWasCalled = true;
          return HttpResponse.json(mockPlanSummary, { status: 201 });
        })
      );
      await workoutService.generatePlan();
      expect(requestWasCalled).toBe(true);
    });

    it('should throw "You already have an active workout plan" on 409', async () => {
      server.use(
        http.post(`${BASE}/workouts/plans/generate`, () =>
          HttpResponse.json({ message: 'Conflict' }, { status: 409 })
        )
      );
      await expect(workoutService.generatePlan()).rejects.toThrow(
        'You already have an active workout plan'
      );
    });

    it('should throw server message on 400 when message field is present', async () => {
      server.use(
        http.post(`${BASE}/workouts/plans/generate`, () =>
          HttpResponse.json({ message: 'Profile not found' }, { status: 400 })
        )
      );
      await expect(workoutService.generatePlan()).rejects.toThrow('Profile not found');
    });

    it('should throw "Invalid request" on 400 when no message field', async () => {
      server.use(
        http.post(`${BASE}/workouts/plans/generate`, () =>
          HttpResponse.json({}, { status: 400 })
        )
      );
      await expect(workoutService.generatePlan()).rejects.toThrow('Invalid request');
    });
  });

  describe('getWeek(weekNumber)', () => {
    it('should return week data on 200 for week 1', async () => {
      const result = await workoutService.getWeek(1);
      expect(result).toEqual(mockWeek);
    });

    it('should send request to correct URL with weekNumber in path', async () => {
      let capturedUrl = '';
      server.use(
        http.get(`${BASE}/workouts/plans/my/week/:weekNumber`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockWeek);
        })
      );
      await workoutService.getWeek(2);
      expect(capturedUrl).toContain('/workouts/plans/my/week/2');
    });

    it('should throw "No workout plan found" on 404', async () => {
      server.use(
        http.get(`${BASE}/workouts/plans/my/week/:weekNumber`, () =>
          HttpResponse.json({ message: 'Not found' }, { status: 404 })
        )
      );
      await expect(workoutService.getWeek(1)).rejects.toThrow('No workout plan found');
    });

    it('should throw "Invalid request" on 400 (weekNumber out of range)', async () => {
      server.use(
        http.get(`${BASE}/workouts/plans/my/week/:weekNumber`, () =>
          HttpResponse.json({}, { status: 400 })
        )
      );
      await expect(workoutService.getWeek(0)).rejects.toThrow('Invalid request');
    });
  });

  describe('getTodayWorkout()', () => {
    it('should return today workout with exercises when not rest day', async () => {
      const result = await workoutService.getTodayWorkout();
      expect(result.isRestDay).toBe(false);
      expect(result.exercises).toHaveLength(1);
    });

    it('should return today workout with isRestDay = true and empty exercises on rest day', async () => {
      server.use(
        http.get(`${BASE}/workouts/plans/my/today`, () =>
          HttpResponse.json(mockTodayRestDay)
        )
      );
      const result = await workoutService.getTodayWorkout();
      expect(result.isRestDay).toBe(true);
      expect(result.exercises).toHaveLength(0);
    });

    it('should throw "No workout plan found" on 404', async () => {
      server.use(
        http.get(`${BASE}/workouts/plans/my/today`, () =>
          HttpResponse.json({ message: 'Not found' }, { status: 404 })
        )
      );
      await expect(workoutService.getTodayWorkout()).rejects.toThrow(
        'No workout plan found'
      );
    });
  });
});
