import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import useAuthStore from '../stores/auth.store';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleRoute from '../components/RoleRoute';
import { useLogout } from '../hooks/useLogout';

const LoginPage      = () => <div>Login Page</div>;
const DashboardPage  = () => <div>Dashboard Page</div>;
const AdminPage      = () => <div>Admin Page</div>;
const UnauthorizedPage = () => <div>Unauthorized Page</div>;

const LogoutButton = () => {
  const logout = useLogout();
  return <button onClick={logout}>Logout</button>;
};

const renderApp = (initialEntries = ['/']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleRoute requiredRole="Admin">
              <AdminPage />
            </RoleRoute>
          }
        />
        <Route
          path="/logout-test"
          element={
            <ProtectedRoute>
              <LogoutButton />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

const BASE_URL = 'http://localhost/api';

const server = setupServer(
  http.post(`${BASE_URL}/auth/logout`, () =>
    HttpResponse.json({ success: true })
  ),
  http.post(`${BASE_URL}/auth/refresh`, async ({ request }) => {
    const { refreshToken } = await request.json();
    if (refreshToken === 'valid_refresh_token') {
      return HttpResponse.json({
        accessToken: 'refreshed_access_token',
        refreshToken: 'valid_refresh_token',
      });
    }
    return HttpResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
  })
);

const resetStore = () =>
  useAuthStore.setState({
    tokens: { accessToken: null, refreshToken: null },
    user: { userId: null, email: null, role: null },
    loading: false,
    error: null,
    isAuthenticated: false,
  });

const seedUserAuth = () =>
  useAuthStore.setState({
    tokens: { accessToken: 'user_access_token', refreshToken: 'valid_refresh_token' },
    user: { userId: 'u1', email: 'user@example.com', role: 'User' },
    loading: false,
    error: null,
    isAuthenticated: true,
  });

const seedAdminAuth = () =>
  useAuthStore.setState({
    tokens: { accessToken: 'admin_access_token', refreshToken: 'valid_refresh_token' },
    user: { userId: 'a1', email: 'admin@example.com', role: 'Admin' },
    loading: false,
    error: null,
    isAuthenticated: true,
  });

describe('Auth Flow — End-to-End Integration', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
    resetStore();
    vi.clearAllMocks();
  });

  afterAll(() => server.close());

  describe('unauthenticated user visiting protected routes', () => {
    it('should redirect to /login when visiting /dashboard without auth', () => {
      renderApp(['/dashboard']);
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should not render dashboard content for unauthenticated user', () => {
      renderApp(['/dashboard']);
      expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
    });

    it('should redirect to /login when visiting /admin without auth', () => {
      renderApp(['/admin']);
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should not render admin content for unauthenticated user', () => {
      renderApp(['/admin']);
      expect(screen.queryByText('Admin Page')).not.toBeInTheDocument();
    });
  });

  describe('authenticated user with User role', () => {
    beforeEach(seedUserAuth);

    it('should render /dashboard for authenticated User', () => {
      renderApp(['/dashboard']);
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });

    it('should not redirect to /login for authenticated User on /dashboard', () => {
      renderApp(['/dashboard']);
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('should redirect to /unauthorized when User visits /admin', () => {
      renderApp(['/admin']);
      expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
    });

    it('should not render admin content when User visits /admin', () => {
      renderApp(['/admin']);
      expect(screen.queryByText('Admin Page')).not.toBeInTheDocument();
    });

    it('should not redirect to /login when User visits /admin (goes to /unauthorized instead)', () => {
      renderApp(['/admin']);
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });

  describe('authenticated user with Admin role', () => {
    beforeEach(seedAdminAuth);

    it('should render /admin for Admin user', () => {
      renderApp(['/admin']);
      expect(screen.getByText('Admin Page')).toBeInTheDocument();
    });

    it('should also grant Admin access to /dashboard', () => {
      renderApp(['/dashboard']);
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });

    it('should not show unauthorized page for Admin on /admin', () => {
      renderApp(['/admin']);
      expect(screen.queryByText('Unauthorized Page')).not.toBeInTheDocument();
    });
  });

  describe('logout flow', () => {
    beforeEach(() => {
      seedUserAuth();
      localStorage.setItem('fitgainer_access_token', 'user_access_token');
      localStorage.setItem('fitgainer_refresh_token', 'valid_refresh_token');
    });

    it('should clear isAuthenticated in store after logout', async () => {
      renderApp(['/logout-test']);
      await userEvent.click(screen.getByText('Logout'));
      await waitFor(() => {
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
      });
    });

    it('should remove fitgainer_access_token from localStorage after logout', async () => {
      renderApp(['/logout-test']);
      await userEvent.click(screen.getByText('Logout'));
      await waitFor(() => {
        expect(localStorage.getItem('fitgainer_access_token')).toBeNull();
      });
    });

    it('should remove fitgainer_refresh_token from localStorage after logout', async () => {
      renderApp(['/logout-test']);
      await userEvent.click(screen.getByText('Logout'));
      await waitFor(() => {
        expect(localStorage.getItem('fitgainer_refresh_token')).toBeNull();
      });
    });

    it('should navigate to /login after logout', async () => {
      renderApp(['/logout-test']);
      await userEvent.click(screen.getByText('Logout'));
      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('should still clear auth state when logout API returns 500', async () => {
      server.use(
        http.post(`${BASE_URL}/auth/logout`, () =>
          HttpResponse.json({ message: 'Server Error' }, { status: 500 })
        )
      );
      renderApp(['/logout-test']);
      await userEvent.click(screen.getByText('Logout'));
      await waitFor(() => {
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
      });
    });

    it('should still navigate to /login even if logout API fails', async () => {
      server.use(
        http.post(`${BASE_URL}/auth/logout`, () =>
          HttpResponse.json({ message: 'Server Error' }, { status: 500 })
        )
      );
      renderApp(['/logout-test']);
      await userEvent.click(screen.getByText('Logout'));
      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });
  });

  describe('loading state during auth initialization', () => {
    it('should show a loading indicator while auth is being resolved', () => {
      useAuthStore.setState({ loading: true, isAuthenticated: false });
      renderApp(['/dashboard']);
      const spinner =
        screen.queryByRole('status') ||
        screen.queryByTestId('loading-spinner') ||
        screen.queryByLabelText(/loading/i) ||
        screen.queryByText(/loading/i);
      expect(spinner).toBeInTheDocument();
    });

    it('should not show dashboard content while loading', () => {
      useAuthStore.setState({ loading: true, isAuthenticated: false });
      renderApp(['/dashboard']);
      expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
    });

    it('should not redirect to /login while loading (waits for auth to resolve)', () => {
      useAuthStore.setState({ loading: true, isAuthenticated: false });
      renderApp(['/dashboard']);
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });
});
