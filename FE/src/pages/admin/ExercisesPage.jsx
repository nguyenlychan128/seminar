import { useEffect, useState } from 'react';
import useAdminStore from '../../stores/adminStore';
import ExercisesTable from './components/ExercisesTable';
import ExerciseFormModal from './components/ExerciseFormModal';
import DeleteExerciseModal from './components/DeleteExerciseModal';

const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];

export default function ExercisesPage() {
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    exercises,
    exercisesLoading,
    exercisesError,
    exercisesPagination,
    exercisesFilters,
    fetchExercises,
    setExercisesFilters,
    clearExercisesError,
    exerciseFormModal,
    openExerciseFormModal,
    closeExerciseFormModal,
    deleteExerciseModal,
    openDeleteExerciseModal,
    closeDeleteExerciseModal,
    performCreateExercise,
    performUpdateExercise,
    performDeleteExercise,
  } = useAdminStore();

  useEffect(() => {
    fetchExercises(1, exercisesFilters);
  }, []);

  const handleSearchChange = (e) => {
    const search = e.target.value;
    setExercisesFilters({ search });
    fetchExercises(1, { ...exercisesFilters, search });
  };

  const handleMuscleGroupChange = (e) => {
    const muscleGroup = e.target.value;
    setExercisesFilters({ muscleGroup });
    fetchExercises(1, { ...exercisesFilters, muscleGroup });
  };

  const handleAddClick = () => {
    openExerciseFormModal('add');
  };

  const handleEditClick = (exerciseId, exercise) => {
    openExerciseFormModal('edit', exerciseId, exercise);
  };

  const handleDeleteClick = (exerciseId, exerciseName) => {
    openDeleteExerciseModal(exerciseId, exerciseName);
  };

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (exerciseFormModal.mode === 'add') {
        await performCreateExercise(formData);
      } else {
        await performUpdateExercise(exerciseFormModal.exerciseId, formData);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await performDeleteExercise(deleteExerciseModal.exerciseId);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (exercisesPagination.page > 1) {
      fetchExercises(exercisesPagination.page - 1, exercisesFilters);
    }
  };

  const handleNextPage = () => {
    if (exercisesPagination.page < exercisesPagination.pages) {
      fetchExercises(exercisesPagination.page + 1, exercisesFilters);
    }
  };

  const handlePageClick = (page) => {
    fetchExercises(page, exercisesFilters);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-emerald-400 mb-2">Exercises Management</h1>
          <p className="text-slate-400">Manage all exercises in the system</p>
        </div>
        <button
          onClick={handleAddClick}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded transition-colors"
        >
          + Add Exercise
        </button>
      </div>

      {/* Error Toast */}
      {exercisesError && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded flex justify-between items-center">
          <span>{exercisesError}</span>
          <button
            onClick={clearExercisesError}
            className="text-red-400 hover:text-red-300 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Search Exercise
            </label>
            <input
              type="text"
              value={exercisesFilters.search}
              onChange={handleSearchChange}
              placeholder="e.g., Bench Press"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Muscle Group
            </label>
            <select
              value={exercisesFilters.muscleGroup}
              onChange={handleMuscleGroupChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 focus:outline-none focus:border-emerald-400"
            >
              <option value="">All Groups</option>
              {MUSCLE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group.charAt(0).toUpperCase() + group.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {exercisesLoading && !exercises.length ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <ExercisesTable
              exercises={exercises}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          </div>

          {/* Pagination */}
          {exercisesPagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={exercisesPagination.page === 1}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded disabled:opacity-50"
              >
                Previous
              </button>

              {Array.from({ length: exercisesPagination.pages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageClick(page)}
                    className={`px-3 py-2 rounded ${
                      exercisesPagination.page === page
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={handleNextPage}
                disabled={exercisesPagination.page === exercisesPagination.pages}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Form Modal */}
      <ExerciseFormModal
        open={exerciseFormModal.open}
        mode={exerciseFormModal.mode}
        formData={exerciseFormModal.formData}
        loading={formLoading}
        error={exercisesError}
        onSubmit={handleFormSubmit}
        onCancel={closeExerciseFormModal}
      />

      {/* Delete Modal */}
      <DeleteExerciseModal
        open={deleteExerciseModal.open}
        exerciseName={deleteExerciseModal.exerciseName}
        loading={deleteLoading}
        error={exercisesError}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteExerciseModal}
      />
    </div>
  );
}
