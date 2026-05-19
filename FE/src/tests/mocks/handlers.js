import { http, HttpResponse } from 'msw';
import { workoutHandlers } from './workout.handlers';
import { adminHandlers } from './admin.handlers';

export const handlers = [
  ...adminHandlers,
  ...workoutHandlers,
  // Login endpoint
  http.post('/auth/login', async ({ request }) => {
    const { email, password } = await request.json();

    if (!email || !password) {
      return HttpResponse.json(
        { message: 'Email and password required' },
        { status: 400 }
      );
    }

    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        user: {
          userId: 'test_user_id',
          email: 'test@example.com',
          role: 'user',
        },
      });
    }

    return HttpResponse.json(
      { message: 'Invalid email or password' },
      { status: 401 }
    );
  }),

  // Register endpoint
  http.post('/auth/register', async ({ request }) => {
    const { email, password, confirmPassword } = await request.json();

    if (!email || !password || !confirmPassword) {
      return HttpResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (email === 'existing@example.com') {
      return HttpResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }

    if (password !== confirmPassword) {
      return HttpResponse.json(
        { message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return HttpResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      {
        user: {
          userId: 'new_user_id',
          email,
          role: 'user',
        },
      },
      { status: 201 }
    );
  }),

  // Logout endpoint
  http.post('/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  // Refresh endpoint
  http.post('/auth/refresh', async ({ request }) => {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return HttpResponse.json(
        { message: 'Refresh token required' },
        { status: 400 }
      );
    }

    if (refreshToken === 'valid_refresh' || refreshToken === 'test_refresh_token') {
      return HttpResponse.json({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
    }

    return HttpResponse.json(
      { message: 'Invalid refresh token' },
      { status: 401 }
    );
  }),

  // Get me endpoint
  http.get('/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { message: 'Missing authorization header' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      user: {
        userId: 'test_user_id',
        email: 'test@example.com',
        role: 'user',
      },
    });
  }),

  // User profile endpoints
  http.get('/users/profile', () =>
    HttpResponse.json({
      userId: 'test_user_id',
      height: 170,
      weight: 60,
      age: 25,
      gender: 'male',
      bmi: 20.7,
      classification: 'normal',
    })
  ),

  http.post('/users/profile', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      userId: 'test_user_id',
      ...body,
    });
  }),

  http.put('/users/profile', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      userId: 'test_user_id',
      height: 170,
      weight: 60,
      age: 25,
      gender: 'male',
      ...body,
    });
  }),
];
