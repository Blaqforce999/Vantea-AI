/**
 * A fixed 4-color cycle for chart segments, built only from existing token
 * roles (never achievement/gold — reserved for milestone moments, matching
 * lib/constants.ts's CATEGORY_COLORS rule).
 */
export const CHART_COLOR_CYCLE = [
  'var(--color-tertiary)',
  'var(--color-secondary)',
  'var(--color-primary)',
  'var(--color-outline)',
];

export type DonutSegment = { label: string; value: number; color: string };

type DonutChartProps = {
  segments: DonutSegment[];
  centerLabel: string;
  centerValue: string;
  size?: number;
  strokeWidth?: number;
};

/** No chart library in this project by design — a plain SVG ring built from stroke-dasharray segments. */
export function DonutChart({ segments, centerLabel, centerValue, size = 240, strokeWidth = 32 }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-container-high)"
          strokeWidth={strokeWidth}
        />
        {total > 0 &&
          segments.map((segment, i) => {
            const fraction = segment.value / total;
            const dash = fraction * circumference;
            const el = (
              <circle
                key={`${segment.label}-${i}`}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return el;
          })}
      </svg>
      <div className="absolute flex flex-col items-center text-center">
        <p className="text-caption uppercase tracking-wide text-on-surface-variant">{centerLabel}</p>
        <p className="text-heading-h3 font-serif text-warm-ink">{centerValue}</p>
      </div>
    </div>
  );
}
