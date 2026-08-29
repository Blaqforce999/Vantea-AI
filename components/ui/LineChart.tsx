import { format } from 'date-fns';

import { cn } from '@/lib/cn';

export type LineChartPoint = { date: Date; value: number };

type LineChartProps = {
  points: LineChartPoint[];
  currency: string;
  width?: number;
  height?: number;
  className?: string;
};

const GRID_ROWS = [0, 0.25, 0.5, 0.75, 1];
const MAX_AXIS_LABELS = 5;
const Y_AXIS_WIDTH = 48;

function formatAxisValue(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return String(Math.round(value));
  }
}

/** No chart library in this project by design — a plain SVG polyline over WorthSnapshot history. */
export function LineChart({ points, currency, width = 640, height = 220, className }: LineChartProps) {
  if (points.length < 2) {
    return (
      <div className="flex h-[220px] items-center justify-center text-body-small text-on-surface-variant">
        Not enough history yet. This fills in as your worth is recorded over time.
      </div>
    );
  }

  const padding = 24;
  const plotLeft = padding + Y_AXIS_WIDTH;
  const maxValue = Math.max(...points.map((p) => p.value), 1);
  const xStep = (width - plotLeft - padding) / (points.length - 1);

  const xFor = (i: number) => plotLeft + i * xStep;
  const yFor = (value: number) => height - padding - (value / maxValue) * (height - padding * 2);

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.value)}`).join(' ');
  const last = points[points.length - 1];

  const labelStep = Math.max(1, Math.ceil(points.length / MAX_AXIS_LABELS));
  const axisLabels = points.filter((_, i) => i % labelStep === 0 || i === points.length - 1);

  return (
    <div className={cn('flex flex-col gap-8', className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        {GRID_ROWS.map((g) => {
          const y = padding + g * (height - padding * 2);
          const value = maxValue * (1 - g);
          return (
            <g key={g}>
              <line
                x1={plotLeft}
                x2={width - padding}
                y1={y}
                y2={y}
                stroke="var(--color-outline-variant)"
                strokeDasharray="4 4"
              />
              <text x={plotLeft - 8} y={y} textAnchor="end" dominantBaseline="middle" className="fill-[var(--color-on-surface-variant)] text-[10px]">
                {formatAxisValue(value, currency)}
              </text>
            </g>
          );
        })}
        <path d={pathD} fill="none" stroke="var(--color-achievement)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={xFor(points.length - 1)} cy={yFor(last.value)} r={5} fill="var(--color-achievement)" stroke="var(--color-surface)" strokeWidth={2} />
      </svg>
      <div className="flex justify-between pl-[48px] text-caption text-on-surface-variant">
        {axisLabels.map((p, i) => (
          <span key={i}>{format(p.date, 'MMM yy')}</span>
        ))}
      </div>
    </div>
  );
}
