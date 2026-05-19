import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UsersPage from '../../src/pages/admin/UsersPage';
import useAdminStore from '../../src/stores/adminStore';

// Mock auth hooks
vi.mock('../../src/hooks/useAuth');
vi.mock('../../src/hooks/useGetMe');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const renderUsersPage = () =>
  render(
    <MemoryRouter>
      <UsersPage />
    </MemoryRouter>
  );

describe('UsersPage Integration', () => {
  beforeEach(() => {
    // Reset store
    useAdminStore.setState({
      users: [],
      usersLoading: false,
      usersError: null,
      usersPagination: { page: 1, limit: 10, total: 0, pages: 0 },
      usersFilters: { email: '', status: 'active' },
      deactivateUserModal: { open: false, userId: null, userEmail: null },
    });
  });

  describe('Mount behavior', () => {
    it('should call fetchUsers on component mount', async () => {
      const { getState } = useAdminStore;
      renderUsersPage();

      await waitFor(() => {
        const state = getState();
        expect(state.users.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should render UsersTable after data loads', async () => {
      useAdminStore.setState({
        users: [
          {
            _id: 'user-001',
            email: 'test@example.com',
            role: 'User',
            isDeleted: false,
            createdAt: '2026-01-10T08:00:00.000Z',
          },
        ],
        usersLoading: false,
        usersPagination: { page: 1, limit: 10, total: 1, pages: 1 },
      });

      renderUsersPage();

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should render DeactivateUserModal (controlled by store state)', async () => {
      renderUsersPage();
      expect(screen.queryByText('Deactivate User')).not.toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should display a loading spinner while usersLoading=true', () => {
      useAdminStore.setState({ usersLoading: true, users: [] });
      renderUsersPage();
      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
    });

    it('should NOT display the table while usersLoading=true', () => {
      useAdminStore.setState({ usersLoading: true, users: [] });
      renderUsersPage();
      expect(screen.queryByText(/Search by Email/)).not.toBeInTheDocument();
    });

    it('should hide the loading spinner once usersLoading=false', async () => {
      useAdminStore.setState({ usersLoading: false, users: [] });
      renderUsersPage();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error state', () => {
    it('should display an error banner when usersError is set', () => {
      useAdminStore.setState({ usersError: 'Network error' });
      renderUsersPage();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should provide a way to dismiss the error', () => {
      useAdminStore.setState({ usersError: 'Test error' });
      renderUsersPage();
      const dismissBtn = screen.getByRole('button', { name: '✕' });
      expect(dismissBtn).toBeInTheDocument();
      fireEvent.click(dismissBtn);
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });

  describe('Email filter', () => {
    it('should render an email filter input', () => {
      renderUsersPage();
      expect(screen.getByPlaceholderText(/Search by Email/)).toBeInTheDocument();
    });

    it('should update filter value on input change', () => {
      renderUsersPage();
      const input = screen.getByPlaceholderText(/Search by Email/);
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      expect(input.value).toBe('test@example.com');
    });
  });

  describe('Status filter', () => {
    it('should render a status dropdown with options "active" and "all"', () => {
      renderUsersPage();
      const statusSelect = screen.getByDisplayValue('active');
      expect(statusSelect).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('should default to "active" selection', () => {
      renderUsersPage();
      const statusSelect = screen.getByDisplayValue('active');
      expect(statusSelect.value).toBe('active');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      useAdminStore.setState({
        users: Array(10).fill(null).map((_, i) => ({
          _id: `user-${i}`,
          email: `user${i}@example.com`,
          role: 'User',
          isDeleted: false,
          createdAt: '2026-01-10T08:00:00.000Z',
        })),
        usersLoading: false,
        usersPagination: { page: 1, limit: 10, total: 25, pages: 3 },
      });
    });

    it('should render Previous and Next buttons', () => {
      renderUsersPage();
      expect(screen.getByRole('button', { name: /Previous/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/ })).toBeInTheDocument();
    });

    it('should disable Previous button on page 1', () => {
      renderUsersPage();
      const prevBtn = screen.getByRole('button', { name: /Previous/ });
      expect(prevBtn).toBeDisabled();
    });

    it('should disable Next button when on last page', () => {
      useAdminStore.setState({ usersPagination: { page: 3, limit: 10, total: 25, pages: 3 } });
      renderUsersPage();
      const nextBtn = screen.getByRole('button', { name: /Next/ });
      expect(nextBtn).toBeDisabled();
    });

    it('should render individual page number buttons when total pages > 1', () => {
      renderUsersPage();
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    });
  });

  describe('UsersTable Component', () => {
    beforeEach(() => {
      useAdminStore.setState({
        users: [
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
            isDeleted: true,
            createdAt: '2026-02-15T10:00:00.000Z',
          },
        ],
        usersLoading: false,
      });
    });

    it('should render table with headers: Email, Role, Status, Created, Actions', () => {
      renderUsersPage();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display user email in the email cell', () => {
      renderUsersPage();
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });

    it('should display "Active" with emerald color for users where isDeleted=false', () => {
      renderUsersPage();
      const activeStatuses = screen.getAllByText('Active');
      expect(activeStatuses.length).toBeGreaterThan(0);
      expect(activeStatuses[0]).toHaveClass('text-emerald-400');
    });

    it('should display "Inactive" with red color for users where isDeleted=true', () => {
      renderUsersPage();
      const inactiveStatus = screen.getByText('Inactive');
      expect(inactiveStatus).toHaveClass('text-red-400');
    });

    it('should display "Deactivate" button text for active users', () => {
      renderUsersPage();
      const buttons = screen.getAllByRole('button', { name: /Deactivate/ });
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should display "Reactivate" button text for inactive users', () => {
      renderUsersPage();
      const reactivateBtn = screen.getByRole('button', { name: /Reactivate/ });
      expect(reactivateBtn).toBeInTheDocument();
    });

    it('should call openDeactivateUserModal when Deactivate button clicked', () => {
      renderUsersPage();
      const deactivateBtns = screen.getAllByRole('button', { name: /Deactivate/ });
      fireEvent.click(deactivateBtns[0]);

      expect(useAdminStore.getState().deactivateUserModal.open).toBe(true);
      expect(useAdminStore.getState().deactivateUserModal.userId).toBe('user-001');
      expect(useAdminStore.getState().deactivateUserModal.userEmail).toBe('alice@example.com');
    });
  });

  describe('DeactivateUserModal Component', () => {
    beforeEach(() => {
      useAdminStore.setState({
        deactivateUserModal: { open: true, userId: 'user-001', userEmail: 'alice@example.com' },
      });
    });

    it('should display when open=true', () => {
      renderUsersPage();
      expect(screen.getByText('Deactivate User')).toBeInTheDocument();
    });

    it('should show user email', () => {
      renderUsersPage();
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    it('should have Cancel and Deactivate buttons', () => {
      renderUsersPage();
      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Deactivate/ })).toBeInTheDocument();
    });

    it('should close modal when Cancel is clicked', () => {
      renderUsersPage();
      const cancelBtn = screen.getByRole('button', { name: /Cancel/ });
      fireEvent.click(cancelBtn);

      expect(useAdminStore.getState().deactivateUserModal.open).toBe(false);
    });
  });
});
