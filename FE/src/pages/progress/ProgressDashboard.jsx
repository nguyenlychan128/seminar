import { useEffect } from 'react';
import { useProgress } from '../../hooks/useProgress';
import WeightInputForm from '../../components/WeightInputForm';
import WeightChart from '../../components/WeightChart';
import WeightStatistics from '../../components/WeightStatistics';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <svg className="h-10 w-10 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-slate-400">Loading your progress...</p>
      </div>
    </div>
  );
}

function ErrorToast({ message, onDismiss }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-500/20 border border-red-500/50 p-4 text-red-300">
      <svg className="h-5 w-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-red-300 hover:text-red-200 transition-colors"
        aria-label="Dismiss error"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export default function ProgressDashboard() {
  const { weightLogs, loading, error, currentWeight, previousWeight, totalGain, averageGain, fetchWeightHistory, clearError } = useProgress();

  // Fetch weight history on mount
  useEffect(() => {
    fetchWeightHistory(null, null, 30);
  }, []);

  const handleFormSuccess = async () => {
    // Refresh the weight history after successful log
    await fetchWeightHistory(null, null, 30);
  };

  if (loading && weightLogs.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 p-4 md:p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-400">Progress Tracking</h1>
        <p className="mt-2 text-slate-400">Monitor your weight journey</p>
      </header>

      {/* Error display */}
      {error && <ErrorToast message={error} onDismiss={clearError} />}

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sidebar: Form + Stats */}
        <div className="space-y-6 lg:col-span-1">
          <WeightInputForm onSuccess={handleFormSuccess} />
          <WeightStatistics stats={{ currentWeight, previousWeight, totalGain, averageGain }} />
        </div>

        {/* Main: Chart */}
        <div className="lg:col-span-2">
          <WeightChart data={weightLogs} />
        </div>
      </div>
    </div>
  );
}
