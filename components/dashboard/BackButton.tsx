'use client';

import { usePathname, useRouter } from 'next/navigation';

import { ArrowLeft } from 'lucide-react';

const HOME_PATH = '/dashboard';

// Only the app's home has nothing to go back to. Every other page — Profile
// included — uses this exact same button, so "back" looks and behaves
// identically everywhere instead of each page inventing its own variant.
const HIDDEN_ON = new Set([HOME_PATH]);

/**
 * A persistent way back, available on every page reached deeper in the app —
 * users should never be stuck relying on the browser's own back button.
 * Prefers real browser history (so "back" means what it visually looks
 * like), but falls back to the dashboard when there's no history to unwind
 * (e.g. the page was opened directly from a link).
 */
export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (HIDDEN_ON.has(pathname)) return null;

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(HOME_PATH);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="mb-16 inline-flex items-center gap-6 rounded-full py-4 pr-8 text-body-small text-on-surface-variant hover:text-warm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      Back
    </button>
  );
}
