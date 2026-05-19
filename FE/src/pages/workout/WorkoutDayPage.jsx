import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useWorkoutStore from '../../stores/workout.store';
import ExerciseCard from '../../components/workout/ExerciseCard';
import WorkoutExecutionForm from '../../components/workout/WorkoutExecutionForm';

export default function WorkoutDayPage() {
  const navigate = useNavigate();
  const { weekNumber, dayNumber } = useParams();
  const { plan } = useWorkoutStore();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const dayData = useMemo(() => {
    if (!plan?.weeks) return null;
    const week = plan.weeks[parseInt(weekNumber, 10) - 1];
    if (!week?.days) return null;
    return week.days.find((d) => d.dayNumber === parseInt(dayNumber, 10)) ?? null;
  }, [plan, weekNumber, dayNumber]);

  if (!dayData) {
    return (
      <div className="min-h-screen bg-slate-900 px-4 py-12 sm:px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Workout Not Found</h1>
          <p className="text-slate-400 mb-6">We couldn't find the workout data for this day.</p>
          <button
            onClick={() => navigate('/workout')}
            className="px-6 py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors duration-200"
          >
            Back to Plan
          </button>
        </div>
      </div>
    );
  }

  const isRestDay = dayData.isRestDay;

  // Only allow logging workout for today
  const today = new Date().toISOString().split('T')[0];
  const scheduledDate = dayData?.scheduledDate
    ? new Date(dayData.scheduledDate).toISOString().split('T')[0]
    : null;
  const isToday = scheduledDate === today;
  const canStartWorkout = !isRestDay && isToday;

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex-1">
            <button
              onClick={() => navigate('/workout')}
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors duration-200 mb-4 font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Plan
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-100">
              {isRestDay ? 'Rest Day' : dayData.dayLabel}
            </h1>
          </div>
        </div>

        {/* Rest Day Message */}
        {isRestDay ? (
          <div className="max-w-2xl">
            <div className="p-8 rounded-2xl border border-emerald-500/40 bg-emerald-500/5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-4xl">💤</div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100 mb-2">Recovery is Part of the Plan</h2>
                  <p className="text-slate-300 leading-relaxed">
                    Rest days are crucial for muscle recovery and growth. Use this time to relax, eat well, and
                    prepare for your next workout. Listen to your body and take it easy today!
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Workout Info */}
            <div className="mb-8 p-4 sm:p-6 rounded-xl bg-slate-800 border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 uppercase tracking-wide font-semibold mb-1">Today's Workout</p>
                  <p className="text-lg sm:text-xl font-bold text-slate-100">
                    {dayData.exercises?.length || 0} exercises
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400 uppercase tracking-wide font-semibold mb-1">Estimated Time</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-300">
                    {dayData.exercises?.reduce((acc, ex) => acc + ex.sets * 2 + ex.restSeconds / 60, 0).toFixed(0) || 0}
                    min
                  </p>
                </div>
              </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-4 sm:space-y-6 mb-8">
              {dayData.exercises && dayData.exercises.length > 0 ? (
                dayData.exercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.exerciseId}
                    exercise={exercise}
                    showInstructions={true}
                  />
                ))
              ) : (
                <p className="text-slate-400">No exercises planned for this day.</p>
              )}
            </div>

            {/* Start Workout Button */}
            <div className="flex gap-4">
              <button
                onClick={() => setIsFormOpen(true)}
                disabled={!canStartWorkout}
                title={!isToday ? 'You can only log workouts for today' : 'Start logging your workout'}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                  canStartWorkout
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 cursor-pointer'
                    : 'bg-slate-600 opacity-50 cursor-not-allowed'
                }`}
              >
                {isToday ? 'Start Workout' : 'Not Today'}
              </button>
            </div>

            {/* Execution Form Modal */}
            {isFormOpen && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="relative bg-slate-900 rounded-2xl border border-slate-700 p-6 sm:p-8 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
                  {/* Close Button */}
                  <button
                    onClick={() => setIsFormOpen(false)}
                    aria-label="Đóng"
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Form Title */}
                  <h2 className="text-2xl font-bold text-slate-100 mb-6 pr-10">{dayData.dayLabel}</h2>

                  {/* Form */}
                  <WorkoutExecutionForm
                    exercises={dayData.exercises || []}
                    planId={plan?._id || plan?.planId}
                    weekNumber={parseInt(weekNumber, 10)}
                    dayNumber={parseInt(dayNumber, 10)}
                    sessionDate={new Date().toISOString().split('T')[0]}
                    onSuccess={() => {
                      setIsFormOpen(false);
                      // Optionally reload or refresh data
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
