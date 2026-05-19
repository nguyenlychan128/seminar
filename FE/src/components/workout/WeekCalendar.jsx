import React, { useMemo } from 'react';

const dayLabelColors = {
  push: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  pull: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  legs: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  rest: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
};

const getDayTypeColor = (label) => {
  if (!label || label.includes('Rest')) return dayLabelColors.rest;
  if (label.includes('Push')) return dayLabelColors.push;
  if (label.includes('Pull')) return dayLabelColors.pull;
  if (label.includes('Legs')) return dayLabelColors.legs;
  return dayLabelColors.rest;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

const getDayName = (dayNumber) => {
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return names[dayNumber - 1] || 'Day';
};

export default function WeekCalendar({ days, onDaySelect, selectedDayNumber }) {
  const isToday = useMemo(() => {
    if (!days || days.length === 0) return {};
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMap = {};
    days.forEach((day) => {
      const dayStr = new Date(day.scheduledDate).toISOString().split('T')[0];
      if (dayStr === todayStr) {
        todayMap[day.dayNumber] = true;
      }
    });
    return todayMap;
  }, [days]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {days && days.map((day) => {
          const isSelected = day.dayNumber === selectedDayNumber;
          const isTodayDay = isToday[day.dayNumber];
          const isClickable = !day.isRestDay;

          return (
            <button
              key={day.dayNumber}
              onClick={() => isClickable && onDaySelect && onDaySelect(day.dayNumber)}
              disabled={!isClickable}
              data-testid={`day-${day.dayNumber}`}
              className={`p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
                isClickable
                  ? 'cursor-pointer hover:scale-105 active:scale-95'
                  : 'cursor-not-allowed opacity-60'
              } ${
                isSelected && isClickable
                  ? 'bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-500/20'
                  : isClickable
                    ? 'border-slate-600 bg-slate-800 hover:bg-slate-700'
                    : 'border-slate-600 bg-slate-800'
              } ${isTodayDay ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : ''}`}
            >
              <div className="flex flex-col items-center gap-2">
                <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {getDayName(day.dayNumber)}
                </span>
                <span className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                  {formatDate(day.scheduledDate)}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-md border ${getDayTypeColor(day.dayLabel)}`}
                >
                  {day.isRestDay ? 'Rest' : day.dayLabel?.split(' — ')[1]?.substring(0, 4) || 'Rest'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
