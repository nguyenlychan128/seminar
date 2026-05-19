import { http, HttpResponse } from 'msw';

const getInitialUsers = () => [
  {
    _id: 'user-001',
    email: 'alice@example.com',
    role: 'User',
    isDeleted: false,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    _id: 'user-002',
    email: 'bob@example.com',
    role: 'User',
    isDeleted: false,
    createdAt: '2026-02-15T10:00:00.000Z',
  },
  {
    _id: 'user-003',
    email: 'charlie@example.com',
    role: 'User',
    isDeleted: true,
    createdAt: '2026-03-01T09:00:00.000Z',
  },
];

const getInitialExercises = () => [
  {
    _id: 'ex-001',
    name: 'Bench Press',
    description: 'Chest compound movement',
    muscleGroup: 'chest',
    sets: 4,
    reps: '8-10',
    restTime: 90,
    difficulty: 'intermediate',
    isDeleted: false,
    createdAt: '2026-01-05T07:00:00.000Z',
  },
  {
    _id: 'ex-002',
    name: 'Pull-Up',
    description: 'Back and biceps movement',
    muscleGroup: 'back',
    sets: 3,
    reps: '6-8',
    restTime: 60,
    difficulty: 'advanced',
    isDeleted: false,
    createdAt: '2026-01-06T07:00:00.000Z',
  },
];

let MOCK_USERS = getInitialUsers();
let MOCK_EXERCISES = getInitialExercises();

export const resetAdminMockData = () => {
  MOCK_USERS = getInitialUsers();
  MOCK_EXERCISES = getInitialExercises();
};

export const adminHandlers = [
  // GET /api/admin/users
  http.get('http://localhost/api/admin/users', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const email = url.searchParams.get('email') || '';
    const status = url.searchParams.get('status') || 'active';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;

    let filtered = MOCK_USERS;
    if (email) {
      filtered = filtered.filter((u) => u.email.toLowerCase().includes(email.toLowerCase()));
    }
    if (status === 'active') {
      filtered = filtered.filter((u) => !u.isDeleted);
    }

    return HttpResponse.json({
      data: filtered.slice(0, limit),
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit),
      },
    });
  }),

  // PATCH /api/admin/users/:userId
  http.patch('http://localhost/api/admin/users/:userId', async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = params;
    const body = await request.json();

    const validActions = ['deactivate', 'reactivate'];
    if (!validActions.includes(body.action)) {
      return HttpResponse.json(
        { message: "Invalid action. Must be 'deactivate' or 'reactivate'" },
        { status: 400 }
      );
    }

    const user = MOCK_USERS.find((u) => u._id === userId);
    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (body.action === 'deactivate') {
      user.isDeleted = true;
      return HttpResponse.json({
        message: 'User deactivated',
        user,
      });
    } else if (body.action === 'reactivate') {
      user.isDeleted = false;
      return HttpResponse.json({
        message: 'User reactivated',
        user,
      });
    }
  }),

  // GET /api/admin/exercises
  http.get('http://localhost/api/admin/exercises', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const muscleGroup = url.searchParams.get('muscleGroup') || '';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;

    let filtered = MOCK_EXERCISES;
    if (search) {
      filtered = filtered.filter(
        (ex) =>
          ex.name.toLowerCase().includes(search.toLowerCase()) ||
          ex.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (muscleGroup) {
      filtered = filtered.filter((ex) => ex.muscleGroup === muscleGroup);
    }

    return HttpResponse.json({
      data: filtered.slice(0, limit),
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit),
      },
    });
  }),

  // POST /api/admin/exercises
  http.post('http://localhost/api/admin/exercises', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.name || !body.muscleGroup || !body.sets || !body.reps || !body.restTime) {
      return HttpResponse.json(
        { message: 'Validation failed: name, muscleGroup, sets, reps, restTime required' },
        { status: 400 }
      );
    }

    if (MOCK_EXERCISES.find((ex) => ex.name === body.name)) {
      return HttpResponse.json(
        { message: 'Exercise name already exists' },
        { status: 409 }
      );
    }

    const newExercise = {
      _id: `ex-${Date.now()}`,
      ...body,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    MOCK_EXERCISES.push(newExercise);

    return HttpResponse.json(
      {
        message: 'Exercise created',
        exercise: newExercise,
      },
      { status: 201 }
    );
  }),

  // PATCH /api/admin/exercises/:exerciseId
  http.patch('http://localhost/api/admin/exercises/:exerciseId', async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { exerciseId } = params;
    const body = await request.json();

    const exercise = MOCK_EXERCISES.find((ex) => ex._id === exerciseId);
    if (!exercise) {
      return HttpResponse.json({ message: 'Exercise not found' }, { status: 404 });
    }

    Object.assign(exercise, body);

    return HttpResponse.json({
      message: 'Exercise updated',
      exercise,
    });
  }),

  // DELETE /api/admin/exercises/:exerciseId
  http.delete('http://localhost/api/admin/exercises/:exerciseId', ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { exerciseId } = params;
    const exercise = MOCK_EXERCISES.find((ex) => ex._id === exerciseId);
    if (!exercise) {
      return HttpResponse.json({ message: 'Exercise not found' }, { status: 404 });
    }

    exercise.isDeleted = true;
    return HttpResponse.json({
      message: 'Exercise deleted',
      exercise,
    });
  }),
];
