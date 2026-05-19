import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useWorkoutPlan from '../../hooks/useWorkoutPlan';
import useUserStore from '../../stores/user.store';
import PlanSummaryCard from '../../components/workout/PlanSummaryCard';
import WeekCalendar from '../../components/workout/WeekCalendar';

export default function WorkoutPlanPage() {
  const navigate = useNavigate();
  const { profile } = useUserStore();
  const { plan, isLoading, hasActivePlan, currentWeekNumber, generatePlan, fetchMyPlan, fetchWeek, updateDifficulty } =
    useWorkoutPlan();

  const [selectedWeek, setSelectedWeek] = useState(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [difficultyLoading, setDifficultyLoading] = useState(false);
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);

  // Fetch plan on mount
  useEffect(() => {
    fetchMyPlan();
  }, [fetchMyPlan]);

  // Set selectedWeek to currentWeekNumber once loaded
  useEffect(() => {
    if (!isLoading && currentWeekNumber) {
      setSelectedWeek(currentWeekNumber);
    }
  }, [isLoading, currentWeekNumber]);

  // Redirect if no profile
  useEffect(() => {
    if (!isLoading && profile === null) {
      navigate('/profile/setup', { replace: true });
    }
  }, [isLoading, profile, navigate]);

  const handleGeneratePlan = async () => {
    if (generateLoading) return;
    setGenerateLoading(true);
    setGenerateError('');

    try {
      await generatePlan();
      setGenerateLoading(false);
    } catch (err) {
      setGenerateError(err.message || 'Failed to generate plan');
      setGenerateLoading(false);
    }
  };

  const handleDaySelect = (dayNumber) => {
    navigate(`/workout/day/${selectedWeek}/${dayNumber}`);
  };

  const handleWeekChange = (direction) => {
    const newWeek = selectedWeek + direction;
    if (newWeek >= 1 && newWeek <= (plan?.durationWeeks || 1)) {
      setSelectedWeek(newWeek);
      // Fetch week data if not already loaded
      if (plan?.weeks && !plan.weeks[newWeek - 1]) {
        fetchWeek(newWeek);
      }
    }
  };

  const handleDifficultyChange = async (newDifficulty) => {
    if (difficultyLoading || newDifficulty === plan?.difficulty) return;

    setDifficultyLoading(true);
    try {
      await updateDifficulty(newDifficulty);
      setShowDifficultySelector(false);
    } catch (error) {
      setGenerateError(error.message || 'Failed to update difficulty');
    } finally {
      setDifficultyLoading(false);
    }
  };

  // Loading state
  if (isLoading && !hasActivePlan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <span role="status" aria-label="Loading" className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />
          <p className="text-sm text-slate-400">Loading your plan...</p>
        </div>
      </div>
    );
  }

  // Redirect if no profile (safety check)
  if (profile === null) {
    return null;
  }

  // Onboarding state
  if (!hasActivePlan) {
    return (
      <div className="min-h-screen bg-slate-900 px-4 py-12 sm:px-6 flex items-center justify-center">
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40">
              <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-100 mb-3">Ready to Get Started?</h1>
          <p className="text-slate-400 mb-8">
            You don't have a workout plan yet. Let's create a personalized plan tailored to your fitness goals.
          </p>

          {generateError && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
              <p className="font-semibold mb-1">Error creating plan:</p>
              <p>{generateError}</p>
              <p className="text-xs mt-2 text-red-400">Please ensure the API server is running and try again.</p>
            </div>
          )}

          <button
            onClick={handleGeneratePlan}
            disabled={generateLoading}
            className="w-full px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {generateLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {generateLoading ? 'Creating Plan...' : 'Create My Plan'}
          </button>
        </div>
      </div>
    );
  }

  // Plan loaded state
  const currentWeekData = plan?.weeks?.[selectedWeek - 1];

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Summary Card */}
        <div className="mb-8 sm:mb-12">
          <PlanSummaryCard
            name={plan.name}
            startDate={plan.startDate}
            endDate={plan.endDate}
            durationWeeks={plan.durationWeeks}
            daysPerWeek={plan.daysPerWeek}
            status={plan.status}
          />
        </div>

        {/* Difficulty Selector */}
        <div className="mb-8 sm:mb-12">
          {!showDifficultySelector ? (
            <button
              onClick={() => setShowDifficultySelector(true)}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg transition-colors"
            >
              Change Difficulty ({plan.difficulty || 'beginner'})
            </button>
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-100">Select Plan Difficulty</h3>
              <div className="flex gap-3">
                {['beginner', 'intermediate', 'advanced'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => handleDifficultyChange(diff)}
                    disabled={difficultyLoading || diff === plan?.difficulty}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      diff === plan?.difficulty
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50'
                    }`}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowDifficultySelector(false)}
                disabled={difficultyLoading}
                className="text-sm text-slate-400 hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Week Navigation & Calendar */}
        <div className="space-y-6 sm:space-y-8">
          {/* Week Selector */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => handleWeekChange(-1)}
              disabled={selectedWeek <= 1}
              aria-label="Previous week"
              className="flex-shrink-0 p-2 rounded-lg bg-slate-800 border border-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-slate-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 text-center flex-1">
              Week {selectedWeek} of {plan.durationWeeks}
            </h2>

            <button
              onClick={() => handleWeekChange(1)}
              disabled={selectedWeek >= plan.durationWeeks}
              aria-label="Next week"
              className="flex-shrink-0 p-2 rounded-lg bg-slate-800 border border-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-slate-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar */}
          {currentWeekData && (
            <WeekCalendar
              days={currentWeekData.days}
              onDaySelect={handleDaySelect}
              selectedDayNumber={null}
            />
          )}
        </div>
      </div>
    </div>
  );
}
