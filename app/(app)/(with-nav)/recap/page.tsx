import { Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/shared/PageHeader';
import { getSession } from '@/lib/auth';

// A placeholder while the feature is being built — not a page to index.
export const metadata = { robots: { index: false, follow: false } };

/**
 * "Your 2025 Wrapped" is not ready yet. Rather than showing half-built data
 * (or a dead link / error page), the dashboard's Wrapped card lands here on
 * a warm, playful "come back soon" state.
 */
export default async function RecapPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="flex flex-col gap-32">
      <PageHeader title="Your 2025 Wrapped" />
      <div className="flex flex-col items-center gap-16 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-48 text-center">
        <span className="flex h-56 w-56 items-center justify-center rounded-full bg-achievement-container text-on-achievement-container">
          <Sparkles size={24} aria-hidden="true" />
        </span>
        <p className="max-w-sm text-body-large text-warm-ink">
          Sorry, you caught us working on this. It&apos;ll be available soon.
        </p>
      </div>
    </div>
  );
}
