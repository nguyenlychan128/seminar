import { http, HttpResponse } from 'msw';

export const mockWeightLogEntry = {
  _id: '670a1b2c3d4e5f6a7b8c9d0e',
  userId: 'user_001',
  weight: 65.5,
  date: '2026-05-18',
  trend: 0.5,
  createdAt: '2026-05-18T10:00:00Z',
};

export const mockWeightHistoryResponse = {
  data: [
    { _id: 'id1', weight: 65.5, date: '2026-05-18', trend: 0.5, createdAt: '2026-05-18T10:00:00Z' },
    { _id: 'id2', weight: 65.0, date: '2026-05-17', trend: 0.2, createdAt: '2026-05-17T10:00:00Z' },
    { _id: 'id3', weight: 64.0, date: '2026-05-10', trend: 0.3, createdAt: '2026-05-10T10:00:00Z' },
  ],
  count: 3,
  startDate: '2026-04-18',
  endDate: '2026-05-18',
};

export const progressHandlers = [
  http.post('/api/progress/weight', async ({ request }) => {
    const body = await request.json();
    if (!body.weight || body.weight < 30 || body.weight > 200) {
      return HttpResponse.json(
        { error: 'Weight must be between 30-200 kg', field: 'weight' },
        { status: 400 }
      );
    }
    return HttpResponse.json(mockWeightLogEntry, { status: 201 });
  }),

  http.get('/api/progress/weight', () => {
    return HttpResponse.json(mockWeightHistoryResponse);
  }),
];
