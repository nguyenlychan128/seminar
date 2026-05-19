import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RoleRoute from '../RoleRoute';
import * as useAuthHook from '../../hooks/useAuth';

vi.mock('../../hooks/useAuth');

const renderWithRouter = (ui, { initialEntries = ['/'] } = {}) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        <Route path="/" element={ui} />
      </Routes>
    </MemoryRouter>
  );

describe('RoleRoute', () => {
  afterEach(() => vi.clearAllMocks());

  describe('when authenticated user has the required role', () => {
    it('should render children for Admin user accessing Admin route', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { userId: 'a1', email: 'admin@example.com', role: 'Admin' },
        error: null,
      });
      renderWithRouter(
        <RoleRoute requiredRole="Admin">
          <div>Admin Dashboard</div>
        </RoleRoute>
      );
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    it('should render children for User role accessing User-only route', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { userId: 'u1', email: 'user@example.com', role: 'User' },
        error: null,
      });
      renderWithRouter(
        <RoleRoute requiredRole="User">
          <div>User Content</div>
        </RoleRoute>
      );
      expect(screen.getByText('User Content')).toBeInTheDocument();
    });

    it('should not redirect when role matches exactly', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { userId: 'a1', email: 'admin@example.com', role: 'Admin' },
        error: null,
      });
      renderWithRouter(
        <RoleRoute requiredRole="Admin">
          <div>Admin Content</div>
        </RoleRoute>
      );
      expect(screen.queryByText('Unauthorized Page')).not.toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
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

    it('should redirect to /login when not authenticated', () => {
      renderWithRouter(
        <RoleRoute requiredRole="Admin">
          <div>Admin Content</div>
        </RoleRoute>
      );
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should not render children when not authenticated', () => {
      renderWithRouter(
        <RoleRoute requiredRole="Admin">
          <div>Admin Content</div>
        </RoleRoute>
      );
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should not show /unauthorized page for unauthenticated user (/login takes priority)', () => {
      renderWithRouter(
        <RoleRoute requiredRole="Admin">
          <div>Admin Content</div>
        </RoleRoute>
      );
      expect(screen.queryByText('Unauthorized Page')).not.toBeInTheDocument();
    });

    it('should redirect to /login when user is null', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        isAuthenticated: false,
        loading: false,
        user: null,
        error: null,
      });
      renderWithRouter(
        <RoleRoute requiredRole="Admin">
          <div>Admin Content</div>
        </RoleRoute>
      );
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('when authenticated user has the wrong role', () => {
    it('should redirect to /unauthorized when User accesses Admin route', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { userId: 'u1', email: 'user@example.com', role: 'User' },
        error: null,
      });
      renderWithRouter(
        <RoleRoute requiredRole="Admin">
          <div>Admin Content</div>
        </RoleRoute>
      );
      expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
    });

    it('should not render children when role does not match', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { userId: 'u1', email: 'user@example.com', role: 'User' },
        error: null,
      });
      renderWithRouter(
        <RoleRoute requiredRole="Admin">
          <div>Admin Content</div>
        </RoleRoute>
      );
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should NOT redirect to /login for authenticated user with wrong role', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { userId: 'u1', email: 'user@example.com', role: 'User' },
        error: null,
      });
      renderWithRouter(
        <RoleRoute requiredRole="Admin">
          <div>Admin Content</div>
        </RoleRoute>
      );
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('should redirect to /unauthorized when user.role is null but user is authenticated', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { userId: 'u1', email: 'user@example.com', role: null },
        error: null,
      });
      renderWithRouter(
        <RoleRoute requiredRole="Admin">
          <div>Admin Content</div>
        </RoleRoute>
      );
      expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
    });

    it('should be case-sensitive: "admin" should NOT match requiredRole "Admin"', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { userId: 'u1', email: 'user@example.com', role: 'admin' },
        error: null,
      });
      renderWithRouter(
        <RoleRoute requiredRole="Admin">
          <div>Admin Content</div>
        </RoleRoute>
      );
      expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
    });

    it('should redirect to /unauthorized when requiredRole is undefined', () => {
      vi.mocked(useAuthHook.useAuth).mockReturnValue({
        isAuthenticated: true,
        loading: false,
        user: { userId: 'u1', email: 'user@example.com', role: 'User' },
        error: null,
      });
      renderWithRouter(
        <RoleRoute requiredRole={undefined}>
          <div>Content</div>
        </RoleRoute>
      );
      expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
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
        <RoleRoute requiredRole="Admin">
          <div>Admin Content</div>
        </RoleRoute>
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
        <RoleRoute requiredRole="Admin">
          <div>Admin Content</div>
        </RoleRoute>
      );
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should NOT redirect while loading', () => {
      renderWithRouter(
        <RoleRoute requiredRole="Admin">
          <div>Admin Content</div>
        </RoleRoute>
      );
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
      expect(screen.queryByText('Unauthorized Page')).not.toBeInTheDocument();
    });
  });
});
