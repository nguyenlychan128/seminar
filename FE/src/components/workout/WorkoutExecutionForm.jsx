import React, { useState, useEffect } from 'react';
import ExerciseCard from './ExerciseCard';
import workoutSessionService from '../../services/workoutSession.service';

const SUCCESS_TOAST_DURATION = 3000;

export default function WorkoutExecutionForm({
  exercises = [],
  planId,
  weekNumber,
  dayNumber,
  sessionDate,
  onSuccess,
  onError,
}) {
  const initialFormData = {
    exercises: exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      status: 'completed',
      sets: Array(ex.plannedSets || 0)
        .fill(null)
        .map((_, i) => ({
          setNumber: i + 1,
          actualReps: null,
          weight: null,
          rpe: null,
          notes: '',
        })),
      notes: '',
    })),
    totalDuration: null,
    mood: null,
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [savedSession, setSavedSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch previous session if exists
  useEffect(() => {
    const fetchPreviousSession = async () => {
      try {
        setIsLoadingSession(true);
        const session = await workoutSessionService.getSession(
          planId,
          weekNumber,
          dayNumber,
          sessionDate
        );
        if (session && session.data) {
          setSavedSession(session.data);
        }
      } catch (err) {
        console.error('Failed to fetch previous session:', err);
        // Silent fail - no previous session
      } finally {
        setIsLoadingSession(false);
      }
    };

    if (planId && weekNumber && dayNumber && sessionDate) {
      fetchPreviousSession();
    }
  }, [planId, weekNumber, dayNumber, sessionDate]);

  // Auto-dismiss success message
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), SUCCESS_TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [successMessage]);

  // Validation helper
  const getSetErrors = () => {
    const errors = [];
    formData.exercises.forEach((exData) => {
      if (exData.status === 'completed') {
        // BR-03: Completed exercise must have at least one set with reps and weight
        const hasAtLeastOneSet = exData.sets.some(
          (s) => s.actualReps !== null && s.weight !== null
        );
        if (!hasAtLeastOneSet) {
          errors.push('Completed exercise must have at least one set with reps and weight');
        }

        exData.sets.forEach((set) => {
          if (set.actualReps !== null && (set.actualReps < 0 || set.actualReps > 100)) {
            errors.push('Reps must be between 0 and 100');
          }
          if (set.weight !== null && (set.weight < 0 || set.weight > 500)) {
            errors.push('Weight must be between 0 and 500');
          }
          if (set.rpe !== null && (set.rpe < 1 || set.rpe > 10)) {
            errors.push('RPE must be between 1 and 10');
          }
        });
      }
    });

    if (formData.totalDuration !== null) {
      if (formData.totalDuration < 0 || formData.totalDuration > 300) {
        errors.push('Duration must be between 0 and 300 minutes');
      }
    }

    return errors;
  };

  const isFormValid = () => {
    const errors = getSetErrors();
    return errors.length === 0;
  };

  const handleExerciseChange = (exIndex, exData) => {
    const newExercises = [...formData.exercises];
    newExercises[exIndex] = {
      ...newExercises[exIndex],
      ...exData,
    };
    setFormData({
      ...formData,
      exercises: newExercises,
    });
  };

  const handleSessionDurationChange = (value) => {
    setFormData({
      ...formData,
      totalDuration: value === '' ? null : parseInt(value),
    });
  };

  const handleMoodChange = (value) => {
    setFormData({
      ...formData,
      mood: value || null,
    });
  };

  const handleSessionNotesChange = (value) => {
    setFormData({
      ...formData,
      notes: value,
    });
  };

  const buildPayload = () => {
    return {
      planId,
      weekNumber,
      dayNumber,
      sessionDate,
      exercises: formData.exercises.map((exData, exIdx) => {
        const ex = exercises[exIdx];
        return {
          exerciseId: ex.exerciseId,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          status: exData.status,
          plannedSets: ex.plannedSets ?? ex.sets,
          plannedReps: ex.plannedReps ?? ex.reps,
          sets: exData.status === 'completed' ? exData.sets : [],
          notes: exData.notes,
        };
      }),
      totalDuration: formData.totalDuration,
      mood: formData.mood,
      notes: formData.notes || null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isFormValid()) {
      setError('Please fix validation errors before submitting');
      return;
    }

    setIsLoading(true);

    try {
      const payload = buildPayload();
      await workoutSessionService.createSession(payload);

      setSuccessMessage('Workout session saved successfully');

      // Reset form
      setFormData({
        exercises: exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          status: 'completed',
          sets: Array(ex.plannedSets || 0)
            .fill(null)
            .map((_, i) => ({
              setNumber: i + 1,
              actualReps: null,
              weight: null,
              rpe: null,
              notes: '',
            })),
          notes: '',
        })),
        totalDuration: null,
        mood: null,
        notes: '',
      });

      // Call onSuccess callback after toast is shown
      if (onSuccess) {
        setTimeout(() => onSuccess(), SUCCESS_TOAST_DURATION);
      }
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'An error occurred while saving';
      setError(errorMsg);
      if (onError) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (isLoadingSession) {
    return (
      <div className="w-full max-w-3xl mx-auto flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-500" />
          <p className="text-sm text-slate-400">Loading workout data...</p>
        </div>
      </div>
    );
  }

  // If session already saved, show read-only view
  if (savedSession) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✓</div>
            <div>
              <h3 className="font-semibold text-emerald-300 mb-1">Workout Already Logged</h3>
              <p className="text-sm text-emerald-200">
                You've already logged your workout for this day. View the details below:
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Saved Exercises */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">
              Exercises - Completed
            </h2>
            {savedSession.exercises && savedSession.exercises.length > 0 ? (
              savedSession.exercises.map((exercise) => (
                <div key={exercise.exerciseId} className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-100">{exercise.name}</h3>
                      <p className="text-xs text-slate-400">{exercise.muscleGroup}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                      {exercise.status === 'completed' ? 'Completed' : 'Skipped'}
                    </span>
                  </div>

                  {exercise.status === 'completed' && exercise.sets && exercise.sets.length > 0 && (
                    <div className="space-y-2">
                      {exercise.sets.map((set) => (
                        <div key={set.setNumber} className="text-sm text-slate-300 bg-slate-900/30 p-2 rounded">
                          <span className="font-semibold">Set {set.setNumber}:</span> {set.actualReps} reps × {set.weight}
                          kg
                          {set.rpe && <span> (RPE {set.rpe})</span>}
                          {set.notes && <span> - {set.notes}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {exercise.notes && (
                    <div className="mt-2 text-sm text-slate-400">
                      <span className="text-slate-500">Notes:</span> {exercise.notes}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No exercises logged</p>
            )}
          </div>

          {/* Saved Summary */}
          <div className="space-y-4 pt-6 border-t border-slate-600">
            <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">
              Workout Summary
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {savedSession.totalDuration && (
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Duration</p>
                  <p className="text-lg font-semibold text-emerald-300">{savedSession.totalDuration} min</p>
                </div>
              )}
              {savedSession.mood && (
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Mood</p>
                  <p className="text-lg font-semibold text-amber-300 capitalize">{savedSession.mood}</p>
                </div>
              )}
            </div>
            {savedSession.notes && (
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-400 mb-2">Notes</p>
                <p className="text-sm text-slate-300">{savedSession.notes}</p>
              </div>
            )}
          </div>

          {/* Completion time */}
          <div className="text-xs text-slate-500 text-center pt-4">
            Logged on {new Date(savedSession.completedAt).toLocaleString()}
          </div>
        </div>
      </div>
    );
  }

  // Show form for new session
  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Exercises */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">
            Exercises - Log Your Results
          </h2>
          {exercises.length === 0 ? (
            <p className="text-slate-400 text-sm">No exercises for this workout day</p>
          ) : (
            exercises.map((exercise, exIdx) => (
              <ExerciseCard
                key={exercise.exerciseId}
                exercise={exercise}
                formData={formData.exercises[exIdx]}
                onChange={(data) => handleExerciseChange(exIdx, data)}
                mode="execution"
              />
            ))
          )}
        </div>

        {/* Session Summary Section */}
        <div className="space-y-4 pt-6 border-t border-slate-600">
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">
            Workout Summary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Duration */}
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">
                Duration (minutes, optional)
              </label>
              <input
                type="number"
                placeholder="e.g. 45"
                value={formData.totalDuration ?? ''}
                onChange={(e) => handleSessionDurationChange(e.target.value)}
                min="0"
                max="300"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Mood */}
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">
                Mood (optional)
              </label>
              <select
                value={formData.mood || ''}
                onChange={(e) => handleMoodChange(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">How did you feel?</option>
                <option value="great">Great - Very energized</option>
                <option value="good">Good - Felt strong</option>
                <option value="ok">OK - Normal day</option>
                <option value="tired">Tired - Need rest</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">
              Notes (optional)
            </label>
            <textarea
              placeholder="Write down your thoughts about the session..."
              value={formData.notes ?? ''}
              onChange={(e) => handleSessionNotesChange(e.target.value)}
              maxLength="500"
              rows="3"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">{(formData.notes ?? '').length}/500</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-lg">
            <p className="text-emerald-300 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-200 uppercase tracking-wide text-sm"
          >
            {isLoading ? 'Saving...' : 'Save Workout'}
          </button>
        </div>
      </form>
    </div>
  );
}
