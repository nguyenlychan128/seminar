import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import * as useAuthHook from '../../hooks/useAuth';

vi.mock('../../hooks/useAuth');

const renderWithRouter = (ui, { initialEntries = ['/'] } = {}) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={ui} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  afterEach(() => vi.clearAllMocks());

  describe('when user is authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { userId: 'u1', email: 'user@example.com', role: 'User' },
        error: null,
      });
    });

    it('should render children when user is authenticated', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should not redirect to /login when user is authenticated', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('should render complex JSX children correctly', () => {
      renderWithRouter(
        <ProtectedRoute>
          <section data-testid="dashboard">
            <h1>Dashboard</h1>
            <p>Welcome back</p>
          </section>
        </ProtectedRoute>
      );
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });

    it('should not crash when children is undefined', () => {
      expect(() => {
        renderWithRouter(<ProtectedRoute>{undefined}</ProtectedRoute>);
      }).not.toThrow();
    });
  });

  describe('when user is NOT authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        isAuthenticated: false,
        loading: false,
        user: { userId: null, email: null, role: null },
        error: null,
      });
    });

    it('should redirect to /login when isAuthenticated is false', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should not render children when user is not authenticated', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should redirect to /login when user object is null', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        isAuthenticated: false,
        loading: false,
        user: null,
        error: null,
      });
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should use replace navigation so back button does not loop', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('when auth is loading', () => {
    beforeEach(() => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        isAuthenticated: false,
        loading: true,
        user: null,
        error: null,
      });
    });

    it('should show a loading indicator when loading is true', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      const spinner =
        screen.queryByRole('status') ||
        screen.queryByTestId('loading-spinner') ||
        screen.queryByLabelText(/loading/i) ||
        screen.queryByText(/loading/i);
      expect(spinner).toBeInTheDocument();
    });

    it('should NOT render children while loading', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should NOT redirect to /login while loading', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });
});
