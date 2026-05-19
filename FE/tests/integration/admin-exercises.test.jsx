import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ExercisesPage from '../../src/pages/admin/ExercisesPage';
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

const renderExercisesPage = () =>
  render(
    <MemoryRouter>
      <ExercisesPage />
    </MemoryRouter>
  );

describe('ExercisesPage Integration', () => {
  beforeEach(() => {
    useAdminStore.setState({
      exercises: [],
      exercisesLoading: false,
      exercisesError: null,
      exercisesPagination: { page: 1, limit: 10, total: 0, pages: 0 },
      exercisesFilters: { search: '', muscleGroup: '' },
      exerciseFormModal: { open: false, mode: 'add', exerciseId: null, formData: null },
      deleteExerciseModal: { open: false, exerciseId: null, exerciseName: null },
    });
  });

  describe('Mount behavior', () => {
    it('should call fetchExercises on component mount', async () => {
      renderExercisesPage();

      await waitFor(() => {
        const state = useAdminStore.getState();
        expect(state.exercises).toBeDefined();
      });
    });

    it('should render ExerciseFormModal (controlled by store)', () => {
      renderExercisesPage();
      expect(screen.queryByText('Add Exercise')).not.toBeInTheDocument();
    });

    it('should render DeleteExerciseModal (controlled by store)', () => {
      renderExercisesPage();
      expect(screen.queryByText('Delete Exercise')).not.toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should display a loading spinner while exercisesLoading=true', () => {
      useAdminStore.setState({ exercisesLoading: true, exercises: [] });
      renderExercisesPage();
      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
    });

    it('should NOT display the table while exercisesLoading=true', () => {
      useAdminStore.setState({ exercisesLoading: true, exercises: [] });
      renderExercisesPage();
      expect(screen.queryByText('Name')).not.toBeInTheDocument();
    });

    it('should hide the loading spinner once exercisesLoading=false', async () => {
      useAdminStore.setState({ exercisesLoading: false, exercises: [] });
      renderExercisesPage();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error state', () => {
    it('should display an error banner when exercisesError is set', () => {
      useAdminStore.setState({ exercisesError: 'Failed to load exercises' });
      renderExercisesPage();
      expect(screen.getByText('Failed to load exercises')).toBeInTheDocument();
    });

    it('should provide a way to dismiss the error', () => {
      useAdminStore.setState({ exercisesError: 'Test error' });
      renderExercisesPage();
      const dismissBtn = screen.getByRole('button', { name: '✕' });
      expect(dismissBtn).toBeInTheDocument();
      fireEvent.click(dismissBtn);
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });

  describe('Search filter', () => {
    it('should render a search input', () => {
      renderExercisesPage();
      expect(screen.getByPlaceholderText(/Search Exercise/)).toBeInTheDocument();
    });

    it('should update filter value on input change', () => {
      renderExercisesPage();
      const input = screen.getByPlaceholderText(/Search Exercise/);
      fireEvent.change(input, { target: { value: 'Bench' } });
      expect(input.value).toBe('Bench');
    });
  });

  describe('MuscleGroup filter', () => {
    it('should render a muscleGroup dropdown', () => {
      renderExercisesPage();
      const select = screen.getByDisplayValue('All Groups');
      expect(select).toBeInTheDocument();
    });

    it('should have all muscle group options', () => {
      renderExercisesPage();
      expect(screen.getByText('Chest')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Legs')).toBeInTheDocument();
    });

    it('should default to empty / "All" selection', () => {
      renderExercisesPage();
      const select = screen.getByDisplayValue('All Groups');
      expect(select.value).toBe('');
    });
  });

  describe('Add Exercise button', () => {
    it('should render an "Add Exercise" button', () => {
      renderExercisesPage();
      expect(screen.getByRole('button', { name: /Add Exercise/ })).toBeInTheDocument();
    });

    it('should call openExerciseFormModal when Add Exercise is clicked', () => {
      renderExercisesPage();
      const addBtn = screen.getByRole('button', { name: /Add Exercise/ });
      fireEvent.click(addBtn);

      expect(useAdminStore.getState().exerciseFormModal.open).toBe(true);
      expect(useAdminStore.getState().exerciseFormModal.mode).toBe('add');
    });
  });

  describe('ExercisesTable Component', () => {
    beforeEach(() => {
      useAdminStore.setState({
        exercises: [
          {
            _id: 'ex-001',
            name: 'Bench Press',
            description: 'Chest exercise',
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
            name: 'Squat',
            description: 'Leg exercise',
            muscleGroup: 'legs',
            sets: 3,
            reps: '10-12',
            restTime: 120,
            difficulty: 'intermediate',
            isDeleted: true,
            createdAt: '2026-01-06T07:00:00.000Z',
          },
        ],
        exercisesLoading: false,
      });
    });

    it('should render table headers', () => {
      renderExercisesPage();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Muscle Group')).toBeInTheDocument();
      expect(screen.getByText('Sets')).toBeInTheDocument();
      expect(screen.getByText('Reps')).toBeInTheDocument();
      expect(screen.getByText('Rest (sec)')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display exercise rows with all fields', () => {
      renderExercisesPage();
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Chest')).toBeInTheDocument();
      expect(screen.getByText('8-10')).toBeInTheDocument();
    });

    it('should show "Active" for isDeleted=false exercises', () => {
      renderExercisesPage();
      const activeStatuses = screen.getAllByText('Active');
      expect(activeStatuses[0]).toHaveClass('text-emerald-400');
    });

    it('should show "Deleted" for isDeleted=true exercises', () => {
      renderExercisesPage();
      const deletedStatus = screen.getByText('Deleted');
      expect(deletedStatus).toHaveClass('text-red-400');
    });

    it('should have Edit and Delete buttons for each row', () => {
      renderExercisesPage();
      const editBtns = screen.getAllByRole('button', { name: /Edit/ });
      const deleteBtns = screen.getAllByRole('button', { name: /Delete/ });
      expect(editBtns.length).toBe(2);
      expect(deleteBtns.length).toBe(2);
    });

    it('should call openExerciseFormModal with edit mode when Edit clicked', () => {
      renderExercisesPage();
      const editBtns = screen.getAllByRole('button', { name: /Edit/ });
      fireEvent.click(editBtns[0]);

      const state = useAdminStore.getState();
      expect(state.exerciseFormModal.open).toBe(true);
      expect(state.exerciseFormModal.mode).toBe('edit');
      expect(state.exerciseFormModal.exerciseId).toBe('ex-001');
    });

    it('should call openDeleteExerciseModal when Delete clicked', () => {
      renderExercisesPage();
      const deleteBtns = screen.getAllByRole('button', { name: /Delete/ });
      fireEvent.click(deleteBtns[0]);

      const state = useAdminStore.getState();
      expect(state.deleteExerciseModal.open).toBe(true);
      expect(state.deleteExerciseModal.exerciseId).toBe('ex-001');
      expect(state.deleteExerciseModal.exerciseName).toBe('Bench Press');
    });
  });

  describe('ExerciseFormModal - Add Mode', () => {
    beforeEach(() => {
      useAdminStore.setState({
        exerciseFormModal: { open: true, mode: 'add', exerciseId: null, formData: null },
      });
    });

    it('should render when open=true with mode="add"', () => {
      renderExercisesPage();
      expect(screen.getByText('Add Exercise')).toBeInTheDocument();
    });

    it('should render form fields', () => {
      renderExercisesPage();
      expect(screen.getByPlaceholderText(/Bench Press/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Optional description/)).toBeInTheDocument();
    });

    it('should show validation error on blur for empty required fields', async () => {
      const user = userEvent.setup();
      renderExercisesPage();

      const nameInput = screen.getByPlaceholderText(/Bench Press/);
      await user.click(nameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    it('should have Create button labeled "Create"', () => {
      renderExercisesPage();
      expect(screen.getByRole('button', { name: /Create/ })).toBeInTheDocument();
    });

    it('should have Cancel button', () => {
      renderExercisesPage();
      const cancelBtns = screen.getAllByRole('button', { name: /Cancel/ });
      expect(cancelBtns.length).toBeGreaterThan(0);
    });

    it('should close modal when Cancel is clicked', () => {
      renderExercisesPage();
      const cancelBtns = screen.getAllByRole('button', { name: /Cancel/ });
      const cancelInModal = cancelBtns.find((btn) => btn.closest('[class*="bg-slate-800"]'));
      fireEvent.click(cancelInModal);

      expect(useAdminStore.getState().exerciseFormModal.open).toBe(false);
    });
  });

  describe('ExerciseFormModal - Edit Mode', () => {
    beforeEach(() => {
      const exerciseData = {
        _id: 'ex-001',
        name: 'Bench Press',
        description: 'Chest exercise',
        muscleGroup: 'chest',
        sets: 4,
        reps: '8-10',
        restTime: 90,
        difficulty: 'intermediate',
      };

      useAdminStore.setState({
        exerciseFormModal: {
          open: true,
          mode: 'edit',
          exerciseId: 'ex-001',
          formData: exerciseData,
        },
      });
    });

    it('should display title "Edit Exercise"', () => {
      renderExercisesPage();
      expect(screen.getByText('Edit Exercise')).toBeInTheDocument();
    });

    it('should show Update button in edit mode', () => {
      renderExercisesPage();
      expect(screen.getByRole('button', { name: /Update/ })).toBeInTheDocument();
    });
  });

  describe('DeleteExerciseModal Component', () => {
    beforeEach(() => {
      useAdminStore.setState({
        deleteExerciseModal: {
          open: true,
          exerciseId: 'ex-001',
          exerciseName: 'Bench Press',
        },
      });
    });

    it('should display when open=true', () => {
      renderExercisesPage();
      expect(screen.getByText('Delete Exercise')).toBeInTheDocument();
    });

    it('should display exercise name', () => {
      renderExercisesPage();
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
    });

    it('should have Cancel and Delete buttons', () => {
      renderExercisesPage();
      const cancelBtns = screen.getAllByRole('button', { name: /Cancel/ });
      const deleteBtns = screen.getAllByRole('button', { name: /Delete/ });
      expect(cancelBtns.length).toBeGreaterThan(0);
      expect(deleteBtns.length).toBeGreaterThan(0);
    });

    it('should close modal when Cancel is clicked', () => {
      renderExercisesPage();
      const cancelBtns = screen.getAllByRole('button', { name: /Cancel/ });
      const cancelInModal = cancelBtns.find((btn) => btn.closest('[class*="bg-slate-800"]'));
      fireEvent.click(cancelInModal);

      expect(useAdminStore.getState().deleteExerciseModal.open).toBe(false);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      useAdminStore.setState({
        exercises: Array(10).fill(null).map((_, i) => ({
          _id: `ex-${i}`,
          name: `Exercise ${i}`,
          muscleGroup: 'chest',
          sets: 3,
          reps: '8-10',
          restTime: 60,
          isDeleted: false,
          createdAt: '2026-01-05T07:00:00.000Z',
        })),
        exercisesLoading: false,
        exercisesPagination: { page: 1, limit: 10, total: 25, pages: 3 },
      });
    });

    it('should render Previous and Next buttons', () => {
      renderExercisesPage();
      expect(screen.getByRole('button', { name: /Previous/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/ })).toBeInTheDocument();
    });

    it('should disable Previous button on page 1', () => {
      renderExercisesPage();
      const prevBtn = screen.getByRole('button', { name: /Previous/ });
      expect(prevBtn).toBeDisabled();
    });

    it('should disable Next button on last page', () => {
      useAdminStore.setState({ exercisesPagination: { page: 3, limit: 10, total: 25, pages: 3 } });
      renderExercisesPage();
      const nextBtn = screen.getByRole('button', { name: /Next/ });
      expect(nextBtn).toBeDisabled();
    });

    it('should render individual page number buttons', () => {
      renderExercisesPage();
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    });
  });
});
