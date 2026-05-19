// No React import needed for JSX in modern React

export default function WeightStatistics({ stats = {} }) {
  const { currentWeight = null, previousWeight = null, totalGain = null, averageGain = null } = stats;

  const formatWeight = (value) => {
    if (value === null || value === undefined) return '—';
    return typeof value === 'number' ? value.toFixed(1) : value;
  };

  const getGainColor = (value) => {
    if (value === null || value === undefined) return 'text-slate-400';
    return value > 0 ? 'text-emerald-400' : value < 0 ? 'text-red-400' : 'text-slate-400';
  };

  const getGainPrefix = (value) => {
    if (value === null || value === undefined) return '';
    return value > 0 ? '+' : '';
  };

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-1 lg:grid-cols-2">
      {/* Current Weight */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <p className="mb-2 text-sm font-medium text-slate-400">Current Weight</p>
        <p className="text-3xl font-bold text-emerald-400">
          {formatWeight(currentWeight)}
          <span className="text-lg text-slate-400"> kg</span>
        </p>
      </div>

      {/* Total Gain */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <p className="mb-2 text-sm font-medium text-slate-400">Total Gain</p>
        <p className={`text-2xl font-bold ${getGainColor(totalGain)}`}>
          {getGainPrefix(totalGain)}{formatWeight(totalGain)}
          <span className="text-base text-slate-400"> kg</span>
        </p>
      </div>

      {/* Average Daily Gain */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <p className="mb-2 text-sm font-medium text-slate-400">Avg Daily Gain</p>
        <p className={`text-2xl font-bold ${getGainColor(averageGain)}`}>
          {getGainPrefix(averageGain)}{formatWeight(averageGain)}
          <span className="text-base text-slate-400">/day</span>
        </p>
      </div>

      {/* Previous Weight */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <p className="mb-2 text-sm font-medium text-slate-400">Previous Weight</p>
        <p className="text-2xl font-bold text-slate-300">
          {formatWeight(previousWeight)}
          <span className="text-base text-slate-400"> kg</span>
        </p>
      </div>
    </div>
  );
}
