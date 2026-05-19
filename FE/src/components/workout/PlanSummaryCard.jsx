import React from 'react';

const statusConfig = {
  active: { label: 'Active', bgClass: 'bg-emerald-500/20', textClass: 'text-emerald-300', borderClass: 'border-emerald-500/40' },
  completed: { label: 'Completed', bgClass: 'bg-slate-500/20', textClass: 'text-slate-300', borderClass: 'border-slate-500/40' },
  cancelled: { label: 'Cancelled', bgClass: 'bg-red-500/20', textClass: 'text-red-300', borderClass: 'border-red-500/40' },
};

const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startMonth = start.toLocaleString('en-US', { month: 'short' });
  const endMonth = end.toLocaleString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
};

export default function PlanSummaryCard({ name, startDate, endDate, durationWeeks, daysPerWeek, status }) {
  const config = statusConfig[status] || statusConfig.active;
  const dateRange = formatDateRange(startDate, endDate);

  return (
    <div
      data-testid="plan-summary-card"
      className="w-full p-6 sm:p-8 rounded-2xl border border-slate-600 bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">{name}</h2>
          <p className="text-sm sm:text-base text-slate-400">{dateRange}</p>
        </div>
        <div
          className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
        >
          {config.label}
        </div>
      </div>

      <div className="flex items-center gap-6 pt-4 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-slate-300 font-medium">{durationWeeks} weeks</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-slate-300 font-medium">{daysPerWeek} days/week</span>
        </div>
      </div>
    </div>
  );
}
