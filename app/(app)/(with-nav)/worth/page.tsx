import { WorthFigure } from '@/components/reveal/WorthFigure';
import { PageHeader } from '@/components/shared/PageHeader';
import { getSession } from '@/lib/auth';
import { CATEGORY_LABELS } from '@/lib/constants';
import { getCategoryBreakdown, getFeaturedWorth } from '@/lib/worth';
import type { Category } from '@prisma/client';

// Live but intentionally unlinked from nav — not a page to index.
export const metadata = { robots: { index: false, follow: false } };

export default async function WorthPage() {
  const session = await getSession();
  if (!session) return null;

  const { featured, breakdown } = await getFeaturedWorth(session.userId);
  const categoryBreakdown = await getCategoryBreakdown(session.userId, featured.currency);
  const maxCategoryValue = Math.max(...categoryBreakdown.map((c) => Number(c.total)), 1);
  const otherCurrencies = breakdown.filter((b) => b.currency !== featured.currency);

  return (
    <div className="flex flex-col gap-32">
      <PageHeader title="Your Worth" description="Based on the values you've entered." />

      <div className="flex flex-col items-center gap-8 rounded-xl border border-outline-variant bg-surface-container-low p-48 text-center">
        <p className="text-label uppercase tracking-wide text-on-surface-variant">Your Worth</p>
        <WorthFigure currency={featured.currency} total={featured.total} />
        <p className="text-caption text-on-surface-variant">
          {featured.itemCount} valued {featured.itemCount === 1 ? 'thing' : 'things'} in {featured.currency}
        </p>
      </div>

      {otherCurrencies.length > 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface p-16">
          <p className="text-body-small text-on-surface-variant">
            You also have values recorded in {otherCurrencies.map((c) => c.currency).join(', ')}. Vantea doesn&apos;t
            automatically convert currencies in this version, so they&apos;re kept separate.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {otherCurrencies.map((c) => (
              <li key={c.currency} className="text-body-regular text-warm-ink">
                {c.currency} {Number(c.total).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {categoryBreakdown.length > 0 && (
        <section className="flex flex-col gap-16">
          <h2 className="text-heading-h3 text-warm-ink">By category ({featured.currency})</h2>
          <ul className="flex flex-col gap-12">
            {categoryBreakdown
              .sort((a, b) => Number(b.total) - Number(a.total))
              .map((c) => (
                <li key={c.category} className="flex flex-col gap-4">
                  <div className="flex justify-between text-body-small text-warm-ink">
                    <span>{CATEGORY_LABELS[c.category as Category]}</span>
                    <span>
                      {featured.currency} {Number(c.total).toLocaleString()}
                    </span>
                  </div>
                  <div className="h-8 rounded-md bg-surface-container">
                    <div
                      className="h-8 rounded-md bg-teal"
                      style={{ width: `${(Number(c.total) / maxCategoryValue) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
