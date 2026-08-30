import Link from 'next/link';

import { differenceInYears } from 'date-fns';
import { ArrowRight, Award, Boxes, Sparkles } from 'lucide-react';

import type { MilestoneType } from '@prisma/client';

import { ConversationalAdd } from '@/components/ai/ConversationalAdd';
import { StatChip } from '@/components/dashboard/StatChip';
import { ThingsGrid } from '@/components/dashboard/ThingsGrid';
import { WorthChartSection } from '@/components/dashboard/WorthChartSection';
import type { ItemCardData } from '@/components/item/ItemCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { WorthFigure } from '@/components/reveal/WorthFigure';
import { CHART_COLOR_CYCLE } from '@/components/ui/DonutChart';
import { getAccountProfile, getSession } from '@/lib/auth';
import { CATEGORY_LABELS, MILESTONE_DESCRIPTIONS, MILESTONE_LABELS } from '@/lib/constants';
import type { Category } from '@prisma/client';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/format';
import { getCategoryBreakdown, getFeaturedWorth, getWorthGrowth, getWorthHistory } from '@/lib/worth';

const DONUT_TOP_N = 3;

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null; // (app)/layout.tsx guarantees a session by the time this renders

  const [profile, { featured }] = await Promise.all([getAccountProfile(session.userId), getFeaturedWorth(session.userId)]);

  const [growth, history, categoryBreakdown, items, milestone] = await Promise.all([
    getWorthGrowth(session.userId, featured.currency),
    getWorthHistory(session.userId, featured.currency),
    getCategoryBreakdown(session.userId, featured.currency),
    db.item.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } }),
    db.milestone.findFirst({
      where: { userId: session.userId },
      orderBy: { achievedAt: 'desc' },
      select: { type: true, payload: true },
    }),
  ]);

  const itemCards: ItemCardData[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    value: item.value ? item.value.toFixed(2) : null,
    currency: item.currency,
    acquiredDate: item.acquiredDate,
    whyNote: item.whyNote,
    imageUrl: item.imageUrl,
  }));

  const trackingYears = profile ? differenceInYears(new Date(), profile.createdAt) : 0;
  const trackingLabel = trackingYears >= 1 ? `${trackingYears} yr${trackingYears === 1 ? '' : 's'}` : 'New';
  const yearChangeLabel =
    growth !== null ? `${formatMoney(Math.abs(growth.absolute), featured.currency)} ${growth.absolute >= 0 ? 'more' : 'less'} than last year` : null;

  const sortedCategories = [...categoryBreakdown].sort((a, b) => Number(b.total) - Number(a.total));
  const topCategories = sortedCategories.slice(0, DONUT_TOP_N);
  const otherTotal = sortedCategories.slice(DONUT_TOP_N).reduce((sum, c) => sum + Number(c.total), 0);
  const donutSegments = [
    ...topCategories.map((c, i) => ({
      label: CATEGORY_LABELS[c.category as Category],
      value: Number(c.total),
      color: CHART_COLOR_CYCLE[i % CHART_COLOR_CYCLE.length],
    })),
    ...(otherTotal > 0
      ? [{ label: 'Other categories', value: otherTotal, color: CHART_COLOR_CYCLE[CHART_COLOR_CYCLE.length - 1] }]
      : []),
  ];

  const historyPoints = history.map((h) => ({ date: h.capturedAt, value: Number(h.totalValue) }));

  return (
    <div className="flex flex-col gap-32">
      <div className="flex flex-col items-center gap-16 text-center">
        <div>
          <p className="text-label uppercase tracking-wide text-on-surface-variant">Your Worth</p>
          <WorthFigure currency={featured.currency} total={featured.total} />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <StatChip value={String(itemCards.length)} label="Things" />
          <StatChip
            value={growth !== null ? `${growth.percent >= 0 ? '+' : ''}${Math.round(growth.percent)}%` : 'New'}
            label="This Year"
            tone={growth !== null ? 'positive' : 'neutral'}
          />
          <StatChip value={trackingLabel} label="Tracking" />
        </div>
      </div>

      <ConversationalAdd />

      <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
        <MilestoneBanner milestone={milestone} />
        <Link
          href="/recap"
          className="flex items-center justify-between gap-16 rounded-xl bg-surface-container-low px-16 py-12 transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="flex items-center gap-16">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-achievement text-on-achievement">
              <Sparkles size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="text-body-small font-medium text-warm-ink">Your 2025 Wrapped</p>
              <p className="text-body-small text-on-surface-variant">See your year as a story</p>
            </div>
          </div>
          <ArrowRight size={18} className="shrink-0 text-on-surface-variant" aria-hidden="true" />
        </Link>
      </div>

      {itemCards.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Nothing recorded yet"
          description="Tell Vantea about something you've built or acquired above, and it'll show up here."
        />
      ) : (
        <ThingsGrid items={itemCards} />
      )}

      <WorthChartSection
        history={historyPoints}
        donutSegments={donutSegments}
        currency={featured.currency}
        totalLabel={formatMoney(featured.total, featured.currency)}
        yearChangeLabel={yearChangeLabel}
      />
    </div>
  );
}

function MilestoneBanner({ milestone }: { milestone: { type: MilestoneType; payload: unknown } | null }) {
  if (!milestone) return <div className="hidden sm:block" />;

  // NEW_HIGH is the only milestone type whose payload carries a value —
  // {value, currency} — so it's the only one that can render the
  // screenshot's "You crossed ₦X in total worth" framing. Every other type
  // falls back to the existing generic MILESTONE_LABELS/DESCRIPTIONS copy
  // rather than fabricating numbers that aren't actually stored.
  const payload = milestone.payload as { value?: string; currency?: string } | null;
  const title =
    milestone.type === 'NEW_HIGH' && payload?.value && payload.currency
      ? `You crossed ${formatMoney(payload.value, payload.currency)} in total worth`
      : MILESTONE_LABELS[milestone.type];

  return (
    <div className="flex items-center gap-16 rounded-xl bg-achievement-container px-16 py-12 text-on-achievement-container">
      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-achievement text-on-achievement">
        <Award size={20} aria-hidden="true" />
      </span>
      <div>
        <p className="text-body-small font-medium">{title}</p>
        <p className="text-body-small">{MILESTONE_DESCRIPTIONS[milestone.type]}</p>
      </div>
    </div>
  );
}
