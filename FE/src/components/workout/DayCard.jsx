import React from 'react';

export default function DayCard({ day, isToday, onClick }) {
  if (!day) return null;

  const exerciseCount = day.exercises?.length || 0;
  const exercisePreview = day.exercises?.slice(0, 2).map((ex) => ex.name) || [];

  return (
    <button
      onClick={onClick}
      disabled={day.isRestDay}
      className={`w-full p-4 sm:p-6 rounded-xl border transition-all duration-200 text-left ${
        day.isRestDay
          ? 'cursor-not-allowed bg-slate-800 border-slate-600 opacity-70'
          : 'cursor-pointer bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-emerald-500/50 active:scale-95'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100">{day.dayLabel}</h3>
          {day.isRestDay ? (
            <p className="text-sm text-slate-400 mt-1">Rest Day</p>
          ) : (
            <p className="text-sm text-slate-400 mt-1">
              {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
            </p>
          )}
        </div>
        {isToday && (
          <span className="flex-shrink-0 px-2.5 py-1 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
            Today
          </span>
        )}
      </div>

      {!day.isRestDay && exercisePreview.length > 0 && (
        <div className="pt-3 border-t border-slate-700">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Preview</p>
          <ul className="space-y-1">
            {exercisePreview.map((name, idx) => (
              <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{name}</span>
              </li>
            ))}
            {exerciseCount > 2 && (
              <li className="text-sm text-slate-400 italic">+{exerciseCount - 2} more</li>
            )}
          </ul>
        </div>
      )}
    </button>
  );
}
