import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from '../../src/pages/admin/AdminLayout';
import UsersPage from '../../src/pages/admin/UsersPage';
import ExercisesPage from '../../src/pages/admin/ExercisesPage';
import RoleRoute from '../../src/components/RoleRoute';

// Mock auth hooks
vi.mock('../../src/hooks/useAuth');
vi.mock('../../src/hooks/useGetMe');

import { useAuth } from '../../src/hooks/useAuth';
import { useGetMe } from '../../src/hooks/useGetMe';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (ui, { initialEntries = ['/admin/users'] } = {}) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized</div>} />
        <Route
          element={
            <RoleRoute requiredRole="Admin">
              <AdminLayout />
            </RoleRoute>
          }
        >
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/exercises" element={<ExercisesPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { userId: 'admin-001', email: 'admin@example.com', role: 'Admin' },
      loading: false,
      error: null,
    });
    useGetMe.mockReturnValue({
      loading: false,
      error: null,
    });
  });

  describe('Rendering', () => {
    it('should render the header with title "Admin Dashboard"', () => {
      renderWithRouter(null);
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    it('should render the header subtitle "Manage users and exercises"', () => {
      renderWithRouter(null);
      expect(screen.getByText('Manage users and exercises')).toBeInTheDocument();
    });

    it('should render the AdminSidebar component', () => {
      renderWithRouter(null);
      expect(screen.getByText('FitGainer')).toBeInTheDocument();
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    it('should render an Outlet (child route content) in the main area', () => {
      renderWithRouter(null);
      expect(screen.getByText('Users Management')).toBeInTheDocument();
    });
  });

  describe('AdminSidebar', () => {
    it('should render a navigation link to /admin/users labeled "Users"', () => {
      renderWithRouter(null);
      const usersLink = screen.getByText(/👥 Users/);
      expect(usersLink).toBeInTheDocument();
    });

    it('should render a navigation link to /admin/exercises labeled "Exercises"', () => {
      renderWithRouter(null);
      const exercisesLink = screen.getByText(/🏋️ Exercises/);
      expect(exercisesLink).toBeInTheDocument();
    });

    it('should render a Logout button', () => {
      renderWithRouter(null);
      const logoutBtn = screen.getByRole('button', { name: /Logout/i });
      expect(logoutBtn).toBeInTheDocument();
    });

    it('should highlight the Users link when current route is /admin/users', () => {
      renderWithRouter(null, { initialEntries: ['/admin/users'] });
      const usersLink = screen.getByText(/👥 Users/).closest('a');
      expect(usersLink).toHaveClass('bg-emerald-900');
    });

    it('should highlight the Exercises link when current route is /admin/exercises', () => {
      renderWithRouter(null, { initialEntries: ['/admin/exercises'] });
      const exercisesLink = screen.getByText(/🏋️ Exercises/).closest('a');
      expect(exercisesLink).toHaveClass('bg-emerald-900');
    });

    it('should NOT highlight Users link when on /admin/exercises route', () => {
      renderWithRouter(null, { initialEntries: ['/admin/exercises'] });
      const usersLink = screen.getByText(/👥 Users/).closest('a');
      expect(usersLink).not.toHaveClass('bg-emerald-900');
    });
  });

  describe('Non-admin Access', () => {
    it('should redirect to /unauthorized when user role is "User" (non-admin)', () => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
        user: { userId: 'user-001', email: 'user@example.com', role: 'User' },
        loading: false,
        error: null,
      });
      renderWithRouter(null);
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });

    it('should redirect to /login when user is not authenticated', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
      renderWithRouter(null);
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });
});
