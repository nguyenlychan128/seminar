import { useMemo } from 'react';

export default function WeightChart({ data = [] }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;
    return data;
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
        <p className="text-slate-400">No weight data yet</p>
      </div>
    );
  }

  // Calculate chart dimensions and scale
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const width = 600;
  const height = 300;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Get min and max weights, use fixed range 30-200
  const minWeight = 30;
  const maxWeight = 200;
  const weightRange = maxWeight - minWeight;

  // Calculate points
  const points = chartData.map((entry, index) => {
    const x = padding.left + (index / (chartData.length - 1 || 1)) * innerWidth;
    const y = padding.top + ((maxWeight - entry.weight) / weightRange) * innerHeight;
    return { x, y, weight: entry.weight, date: entry.date, trend: entry.trend };
  });

  // Create line path
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Create area path (for gradient fill)
  const areaData = `${pathData} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-200">Weight Trend</h3>

      <div className="overflow-x-auto">
        <svg width={width} height={height} className="mx-auto">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {Array.from({ length: 5 }).map((_, i) => {
            const y = padding.top + (i / 4) * innerHeight;
            return (
              <line
                key={`hgrid-${i}`}
                x1={padding.left}
                y1={y}
                x2={padding.left + innerWidth}
                y2={y}
                stroke="#475569"
                strokeDasharray="4"
                opacity="0.3"
              />
            );
          })}

          {/* Area under line */}
          <path d={areaData} fill="url(#areaGradient)" />

          {/* Line */}
          <path d={pathData} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((point, i) => (
            <g key={`point-${i}`}>
              <circle cx={point.x} cy={point.y} r="4" fill="#10b981" stroke="#0f172a" strokeWidth="2" />
              {/* Tooltip on hover */}
              <g className="group cursor-pointer">
                <rect x={point.x - 30} y={point.y - 40} width="60" height="30" rx="4" fill="#1e293b" opacity="0" className="group-hover:opacity-100" />
                <text
                  x={point.x}
                  y={point.y - 20}
                  textAnchor="middle"
                  className="text-xs fill-slate-200 opacity-0 group-hover:opacity-100"
                >
                  {point.weight.toFixed(1)} kg
                </text>
                <text
                  x={point.x}
                  y={point.y - 10}
                  textAnchor="middle"
                  className="text-xs fill-slate-400 opacity-0 group-hover:opacity-100"
                >
                  {point.date}
                </text>
              </g>
            </g>
          ))}

          {/* Y-axis */}
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerHeight} stroke="#475569" strokeWidth="1" />

          {/* X-axis */}
          <line x1={padding.left} y1={padding.top + innerHeight} x2={padding.left + innerWidth} y2={padding.top + innerHeight} stroke="#475569" strokeWidth="1" />

          {/* Y-axis labels */}
          {Array.from({ length: 5 }).map((_, i) => {
            const weight = maxWeight - (i / 4) * weightRange;
            const y = padding.top + (i / 4) * innerHeight;
            return (
              <text key={`ylabel-${i}`} x={padding.left - 10} y={y + 4} textAnchor="end" className="text-xs fill-slate-400">
                {weight.toFixed(0)}
              </text>
            );
          })}

          {/* X-axis labels (first, middle, last) */}
          {Array.from(new Set([0, Math.floor(points.length / 2), points.length - 1])).map((i) => {
            if (points[i]) {
              return (
                <text
                  key={`xlabel-${points[i].date}`}
                  x={points[i].x}
                  y={padding.top + innerHeight + 20}
                  textAnchor="middle"
                  className="text-xs fill-slate-400"
                >
                  {points[i].date}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>

      {/* Y-axis label */}
      <div className="text-center text-xs text-slate-400 mt-2">Weight (kg)</div>
    </div>
  );
}
