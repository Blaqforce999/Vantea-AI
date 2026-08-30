'use client';

import { useState } from 'react';

import { Check, ChevronDown } from 'lucide-react';

import { DonutChart, type DonutSegment } from '@/components/ui/DonutChart';
import { LineChart, type LineChartPoint } from '@/components/ui/LineChart';
import { Menu } from '@/components/ui/Menu';
import { formatMoney } from '@/lib/format';

type ChartMode = 'growth' | 'breakdown';

type WorthChartSectionProps = {
  history: LineChartPoint[];
  donutSegments: DonutSegment[];
  currency: string;
  totalLabel: string;
  /** e.g. "₦1.4M more than last year" — null when there isn't a year-old snapshot to compare against. */
  yearChangeLabel: string | null;
};

const MODE_LABELS: Record<ChartMode, string> = { growth: 'Growth', breakdown: 'Breakdown' };

/** Growth (line chart) / Breakdown (donut) toggle — the client-interactive half of the dashboard's chart card. */
export function WorthChartSection({ history, donutSegments, currency, totalLabel, yearChangeLabel }: WorthChartSectionProps) {
  const [mode, setMode] = useState<ChartMode>('growth');
  const donutTotal = donutSegments.reduce((sum, s) => sum + s.value, 0);

  return (
    <section className="flex flex-col gap-16 rounded-xl border border-outline-variant bg-surface p-16 md:p-24">
      <div className="flex flex-wrap items-center justify-between gap-16">
        <div>
          <p className="text-body-small text-on-surface-variant">Total worth over time</p>
          <p className="font-serif text-heading-h2 text-warm-ink md:text-worth-medium">{totalLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-8">
          {yearChangeLabel && (
            <span className="flex items-center gap-6 whitespace-nowrap rounded-full bg-surface-container-low px-12 py-6 text-caption text-warm-ink">
              <span className="h-8 w-8 shrink-0 rounded-full bg-achievement" aria-hidden="true" />
              {yearChangeLabel}
            </span>
          )}
          <Menu
            trigger={
              <span className="flex items-center gap-6 rounded-full border border-outline-variant bg-surface px-12 py-6 text-body-small text-warm-ink hover:bg-surface-container">
                {MODE_LABELS[mode]}
                <ChevronDown size={14} aria-hidden="true" />
              </span>
            }
          >
            {(Object.keys(MODE_LABELS) as ChartMode[]).map((option) => (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={mode === option}
                onClick={() => setMode(option)}
                className="flex w-full items-center justify-between gap-12 rounded-lg px-12 py-10 text-left text-body-small text-warm-ink hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {MODE_LABELS[option]}
                {mode === option && <Check size={16} className="text-achievement" aria-hidden="true" />}
              </button>
            ))}
          </Menu>
        </div>
      </div>

      {mode === 'growth' ? (
        <LineChart points={history} currency={currency} />
      ) : donutSegments.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-center text-body-small text-on-surface-variant">
          Add a value to one of your things to see a breakdown.
        </div>
      ) : (
        <div className="flex flex-col items-center gap-24 sm:flex-row sm:items-start sm:justify-center">
          <DonutChart segments={donutSegments} centerLabel="Total Worth" centerValue={totalLabel} />
          <ul className="flex w-full max-w-xs flex-col gap-8">
            {donutSegments.map((segment, i) => {
              const pct = donutTotal > 0 ? (segment.value / donutTotal) * 100 : 0;
              return (
                <li key={`${segment.label}-${i}`} className="flex items-center justify-between gap-8 text-body-small">
                  <span className="flex items-center gap-8 text-warm-ink">
                    <span className="h-8 w-8 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} aria-hidden="true" />
                    {segment.label}
                  </span>
                  <span className="shrink-0 text-on-surface-variant">
                    {formatMoney(segment.value, currency)} ({pct.toFixed(1)}%)
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
