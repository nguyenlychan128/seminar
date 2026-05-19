import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import weightLogService from '../weightLog.service';
import { mockWeightLogEntry, mockWeightHistoryResponse, progressHandlers } from '../../tests/mocks/progress.handlers';

const server = setupServer(...progressHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('weightLogService', () => {
  // --- createWeightLog ---

  describe('createWeightLog(weight, date)', () => {
    describe('happy path', () => {
      it('sends POST to /api/progress/weight', async () => {
        let requestCalled = false;
        server.use(
          http.post('/api/progress/weight', () => {
            requestCalled = true;
            return HttpResponse.json(mockWeightLogEntry, { status: 201 });
          })
        );
        await weightLogService.createWeightLog(65.5, '2026-05-18');
        expect(requestCalled).toBe(true);
      });

      it('returns response object with _id, weight, date, trend, createdAt', async () => {
        const result = await weightLogService.createWeightLog(65.5, '2026-05-18');
        expect(result).toMatchObject({
          _id: expect.any(String),
          weight: 65.5,
          date: '2026-05-18',
          trend: expect.any(Number),
          createdAt: expect.any(String),
        });
      });

      it('accepts decimal weight like 65.5', async () => {
        const result = await weightLogService.createWeightLog(65.5, '2026-05-18');
        expect(result.weight).toBe(65.5);
      });

      it('returns 201 response body directly (not nested)', async () => {
        const result = await weightLogService.createWeightLog(65.5, '2026-05-18');
        expect(result._id).toBeDefined();
        expect(result.data).toBeUndefined();
      });
    });

    describe('error mapping', () => {
      it('throws { code: VALIDATION_ERROR } on 400 response', async () => {
        server.use(
          http.post('/api/progress/weight', () =>
            HttpResponse.json(
              { error: 'Weight must be between 30-200 kg', field: 'weight' },
              { status: 400 }
            )
          )
        );
        try {
          await weightLogService.createWeightLog(5, '2026-05-18');
          expect.fail('Should throw error');
        } catch (err) {
          expect(err.code).toBe('VALIDATION_ERROR');
        }
      });

      it('throws { code: DUPLICATE_ENTRY } on 409 response', async () => {
        server.use(
          http.post('/api/progress/weight', () =>
            HttpResponse.json(
              { error: 'Weight entry already exists for this date' },
              { status: 409 }
            )
          )
        );
        try {
          await weightLogService.createWeightLog(65.5, '2026-05-18');
          expect.fail('Should throw error');
        } catch (err) {
          expect(err.code).toBe('DUPLICATE_ENTRY');
        }
      });

      it('throws { code: UNAUTHORIZED } on 401 response', async () => {
        server.use(
          http.post('/api/progress/weight', () =>
            HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
          )
        );
        try {
          await weightLogService.createWeightLog(65.5, '2026-05-18');
          expect.fail('Should throw error');
        } catch (err) {
          expect(err.code).toBe('UNAUTHORIZED');
        }
      });

      it('throws { code: SERVER_ERROR } on 500 response', async () => {
        server.use(
          http.post('/api/progress/weight', () =>
            HttpResponse.json({ error: 'Failed to save weight log' }, { status: 500 })
          )
        );
        try {
          await weightLogService.createWeightLog(65.5, '2026-05-18');
          expect.fail('Should throw error');
        } catch (err) {
          expect(err.code).toBe('SERVER_ERROR');
        }
      });

      it('error message matches backend error text', async () => {
        const backendMessage = 'Weight must be between 30-200 kg';
        server.use(
          http.post('/api/progress/weight', () =>
            HttpResponse.json({ error: backendMessage, field: 'weight' }, { status: 400 })
          )
        );
        try {
          await weightLogService.createWeightLog(5, '2026-05-18');
          expect.fail('Should throw error');
        } catch (err) {
          expect(err.message).toBe(backendMessage);
        }
      });
    });
  });

  // --- getWeightHistory ---

  describe('getWeightHistory(startDate, endDate, limit)', () => {
    describe('happy path', () => {
      it('sends GET to /api/progress/weight', async () => {
        let requestCalled = false;
        server.use(
          http.get('/api/progress/weight', () => {
            requestCalled = true;
            return HttpResponse.json(mockWeightHistoryResponse);
          })
        );
        await weightLogService.getWeightHistory();
        expect(requestCalled).toBe(true);
      });

      it('returns object with data array, count, startDate, endDate', async () => {
        const result = await weightLogService.getWeightHistory();
        expect(result).toMatchObject({
          data: expect.any(Array),
          count: expect.any(Number),
          startDate: expect.any(String),
          endDate: expect.any(String),
        });
      });

      it('includes startDate query param when provided', async () => {
        let capturedUrl = '';
        server.use(
          http.get('/api/progress/weight', ({ request }) => {
            capturedUrl = request.url;
            return HttpResponse.json(mockWeightHistoryResponse);
          })
        );
        await weightLogService.getWeightHistory('2026-04-18', null, null);
        expect(capturedUrl).toContain('startDate=2026-04-18');
      });

      it('includes endDate query param when provided', async () => {
        let capturedUrl = '';
        server.use(
          http.get('/api/progress/weight', ({ request }) => {
            capturedUrl = request.url;
            return HttpResponse.json(mockWeightHistoryResponse);
          })
        );
        await weightLogService.getWeightHistory(null, '2026-05-18', null);
        expect(capturedUrl).toContain('endDate=2026-05-18');
      });

      it('includes limit query param when provided', async () => {
        let capturedUrl = '';
        server.use(
          http.get('/api/progress/weight', ({ request }) => {
            capturedUrl = request.url;
            return HttpResponse.json(mockWeightHistoryResponse);
          })
        );
        await weightLogService.getWeightHistory(null, null, 7);
        expect(capturedUrl).toContain('limit=7');
      });

      it('does NOT include startDate param when null', async () => {
        let capturedUrl = '';
        server.use(
          http.get('/api/progress/weight', ({ request }) => {
            capturedUrl = request.url;
            return HttpResponse.json(mockWeightHistoryResponse);
          })
        );
        await weightLogService.getWeightHistory(null, null, null);
        expect(capturedUrl).not.toContain('startDate');
      });

      it('includes all 3 params when all provided', async () => {
        let capturedUrl = '';
        server.use(
          http.get('/api/progress/weight', ({ request }) => {
            capturedUrl = request.url;
            return HttpResponse.json(mockWeightHistoryResponse);
          })
        );
        await weightLogService.getWeightHistory('2026-04-18', '2026-05-18', 30);
        expect(capturedUrl).toContain('startDate=2026-04-18');
        expect(capturedUrl).toContain('endDate=2026-05-18');
        expect(capturedUrl).toContain('limit=30');
      });
    });

    describe('error mapping', () => {
      it('throws { code: VALIDATION_ERROR } on 400', async () => {
        server.use(
          http.get('/api/progress/weight', () =>
            HttpResponse.json({ error: 'Invalid date format' }, { status: 400 })
          )
        );
        try {
          await weightLogService.getWeightHistory('bad-date');
          expect.fail('Should throw error');
        } catch (err) {
          expect(err.code).toBe('VALIDATION_ERROR');
        }
      });

      it('throws { code: UNAUTHORIZED } on 401', async () => {
        server.use(
          http.get('/api/progress/weight', () =>
            HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
          )
        );
        try {
          await weightLogService.getWeightHistory();
          expect.fail('Should throw error');
        } catch (err) {
          expect(err.code).toBe('UNAUTHORIZED');
        }
      });

      it('throws { code: SERVER_ERROR } on 500', async () => {
        server.use(
          http.get('/api/progress/weight', () =>
            HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
          )
        );
        try {
          await weightLogService.getWeightHistory();
          expect.fail('Should throw error');
        } catch (err) {
          expect(err.code).toBe('SERVER_ERROR');
        }
      });
    });
  });
});
