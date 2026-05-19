import React from 'react';

const CLASSIFICATION_CONFIG = {
  underweight: {
    label: 'Underweight',
    badgeClass: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    iconClass: 'text-amber-400',
    glowClass: 'shadow-amber-500/20',
  },
  normal: {
    label: 'Normal',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    iconClass: 'text-emerald-400',
    glowClass: 'shadow-emerald-500/20',
  },
  overweight: {
    label: 'Overweight',
    badgeClass: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    iconClass: 'text-orange-400',
    glowClass: 'shadow-orange-500/20',
  },
  obese: {
    label: 'Obese',
    badgeClass: 'bg-red-500/20 text-red-400 border border-red-500/30',
    iconClass: 'text-red-400',
    glowClass: 'shadow-red-500/20',
  },
};

export default function BmiResultCard({ bmi, bodyClassification }) {
  if (bmi === null || bmi === undefined || bmi <= 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 border border-slate-700/50 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700/60">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm text-slate-400">Enter your measurements to see your BMI</p>
      </div>
    );
  }

  const config = CLASSIFICATION_CONFIG[bodyClassification] ?? {
    label: 'Unknown',
    badgeClass: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
    iconClass: 'text-slate-400',
    glowClass: 'shadow-slate-500/20',
  };
  const bmiDisplay = Number(bmi).toFixed(1);

  return (
    <div className={`flex items-center justify-between rounded-xl bg-slate-800/60 border border-slate-700/50 px-5 py-4 shadow-lg ${config.glowClass}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-slate-700/60 ${config.iconClass}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">BMI Score</p>
          <p className={`text-2xl font-bold ${config.iconClass}`}>{bmiDisplay}</p>
        </div>
      </div>
      <span
        data-testid="bmi-badge"
        className={`rounded-full px-3 py-1 text-sm font-medium ${config.badgeClass}`}
      >
        {config.label}
      </span>
    </div>
  );
}
