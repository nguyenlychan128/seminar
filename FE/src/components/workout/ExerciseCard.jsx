import React, { useState } from 'react';

const muscleGroupColors = {
  chest: 'bg-red-500/20 text-red-300 border-red-500/40',
  back: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  shoulders: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  arms: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  legs: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  core: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
};

const getMuscleGroupColor = (muscleGroup) => {
  return muscleGroupColors[muscleGroup?.toLowerCase()] || muscleGroupColors.core;
};

const getEquipmentIcon = (equipment) => {
  const icons = {
    barbell: '⚙️',
    dumbbell: '💪',
    bodyweight: '🏃',
    cable: '🔗',
    machine: '⚡',
  };
  return icons[equipment?.toLowerCase()] || '⚙️';
};

function getEmbedUrl(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

// Display-only mode (existing)
function DisplayMode({ exercise, showInstructions = false }) {
  const [isExpanded, setIsExpanded] = useState(showInstructions);
  const [showVideoModal, setShowVideoModal] = useState(false);

  if (!exercise) return null;

  return (
    <div
      data-testid={`exercise-card-${exercise.exerciseId}`}
      className="w-full p-4 sm:p-6 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700/50 transition-colors duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-2">{exercise.name}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md border ${getMuscleGroupColor(
                exercise.muscleGroup
              )}`}
            >
              {exercise.muscleGroup}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              {getEquipmentIcon(exercise.equipment)} {exercise.equipment}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-900/50 rounded-lg mb-4">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Sets × Reps</p>
          <p className="text-base sm:text-lg font-bold text-emerald-300">
            {exercise.sets} × {exercise.reps}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Rest Time</p>
          <p className="text-base sm:text-lg font-bold text-amber-300">{exercise.restSeconds}s</p>
        </div>
        {exercise.order && (
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Order</p>
            <p className="text-base sm:text-lg font-bold text-slate-300">#{exercise.order}</p>
          </div>
        )}
      </div>

      {/* Video button */}
      {exercise.videoUrl && (
        <button
          type="button"
          onClick={() => setShowVideoModal(true)}
          className="w-full mb-4 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6.5C2 4.57 3.57 3 5.5 3h9C16.43 3 18 4.57 18 6.5v7c0 1.93-1.57 3.5-3.5 3.5h-9C3.57 17 2 15.43 2 13.5v-7zM8 5v8l5.5-4L8 5z" />
          </svg>
          Watch Demo Video
        </button>
      )}

      {/* Video Modal */}
      {showVideoModal && exercise.videoUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full border border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-100">{exercise.name} — Demo</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="relative w-full pt-[56.25%] bg-slate-900">
              <iframe
                className="absolute inset-0 w-full h-full border-0"
                src={getEmbedUrl(exercise.videoUrl)}
                title={`${exercise.name} demo`}
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Execution mode (new for TASK-029)
function ExecutionMode({ exercise, formData = {}, onChange }) {
  const { status = 'completed', sets = [], notes = '' } = formData;
  const isCompleted = status === 'completed';

  const handleStatusToggle = () => {
    const newStatus = isCompleted ? 'skipped' : 'completed';
    onChange?.({
      status: newStatus,
      sets: newStatus === 'completed' ? sets : [],
      notes,
    });
  };

  const handleSetChange = (setNumber, field, value) => {
    const updatedSets = sets.map((s) =>
      s.setNumber === setNumber ? { ...s, [field]: value === '' ? null : value } : s
    );
    onChange?.({
      status,
      sets: updatedSets,
      notes,
    });
  };

  const handleExerciseNotesChange = (value) => {
    onChange?.({
      status,
      sets,
      notes: value,
    });
  };

  const getSetValidationError = (field, value) => {
    if (value === null || value === '') return null;
    if (field === 'actualReps') {
      if (value < 0 || value > 100) return 'Reps must be 0-100';
    }
    if (field === 'weight') {
      if (value < 0 || value > 500) return 'Weight must be 0-500';
    }
    if (field === 'rpe') {
      if (value < 1 || value > 10) return 'RPE must be 1-10';
    }
    return null;
  };

  return (
    <div className="w-full p-4 sm:p-6 rounded-xl border border-emerald-500/30 bg-slate-800/50 hover:bg-slate-800/70 transition-colors duration-200">
      {/* Header with status toggle */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-2">{exercise.name}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md border ${getMuscleGroupColor(
                exercise.muscleGroup
              )}`}
            >
              {exercise.muscleGroup}
            </span>
          </div>
        </div>

        {/* Status toggle button */}
        <button
          type="button"
          onClick={handleStatusToggle}
          aria-label={`${isCompleted ? 'Completed' : 'Skipped'}: ${exercise.name}`}
          className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors duration-200 ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
          }`}
        >
          {isCompleted ? 'Completed' : 'Skipped'}
        </button>
      </div>

      {/* Set inputs (only if completed) */}
      {isCompleted && sets.length > 0 && (
        <div className="space-y-4 mb-6 pb-6 border-b border-slate-600">
          {sets.map((set) => {
            const repsError = getSetValidationError('actualReps', set.actualReps);
            const weightError = getSetValidationError('weight', set.weight);
            const rpeError = getSetValidationError('rpe', set.rpe);

            return (
              <div key={set.setNumber} className="p-4 bg-slate-900/30 rounded-lg space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase text-emerald-400">Set {set.setNumber}</span>
                  <div className="flex-1 h-px bg-slate-600/30" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Reps */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Reps (actual)</label>
                    <input
                      type="number"
                      placeholder="Reps"
                      value={set.actualReps ?? ''}
                      onChange={(e) =>
                        handleSetChange(set.setNumber, 'actualReps', e.target.value ? parseInt(e.target.value) : null)
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      min="0"
                      max="100"
                    />
                    {repsError && <p className="text-xs text-red-400 mt-1">{repsError}</p>}
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Weight (kg)</label>
                    <input
                      type="number"
                      placeholder="Weight"
                      value={set.weight ?? ''}
                      onChange={(e) =>
                        handleSetChange(set.setNumber, 'weight', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      min="0"
                      max="500"
                      step="0.5"
                    />
                    {weightError && <p className="text-xs text-red-400 mt-1">{weightError}</p>}
                  </div>

                  {/* RPE (optional) */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">RPE (optional)</label>
                    <input
                      type="number"
                      placeholder="RPE"
                      value={set.rpe ?? ''}
                      onChange={(e) =>
                        handleSetChange(set.setNumber, 'rpe', e.target.value ? parseInt(e.target.value) : null)
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      min="1"
                      max="10"
                    />
                    {rpeError && <p className="text-xs text-red-400 mt-1">{rpeError}</p>}
                  </div>

                  {/* Set notes (optional) */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Notes (optional)</label>
                    <input
                      type="text"
                      placeholder="Set notes"
                      value={set.notes ?? ''}
                      onChange={(e) => handleSetChange(set.setNumber, 'notes', e.target.value)}
                      maxLength="200"
                      className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exercise notes (always visible) */}
      <div>
        <label className="block text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">
          Exercise Notes (opt)
        </label>
        <textarea
          placeholder="Exercise notes"
          value={notes ?? ''}
          onChange={(e) => handleExerciseNotesChange(e.target.value)}
          maxLength="300"
          rows="2"
          className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">{(notes ?? '').length}/300</p>
      </div>
    </div>
  );
}

export default function ExerciseCard({ exercise, formData, onChange, mode = 'display', showInstructions = false }) {
  if (!exercise) return null;

  if (mode === 'execution') {
    return <ExecutionMode exercise={exercise} formData={formData} onChange={onChange} />;
  }

  return <DisplayMode exercise={exercise} showInstructions={showInstructions} />;
}
