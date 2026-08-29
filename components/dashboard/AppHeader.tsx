import Link from 'next/link';

import { Sparkles } from 'lucide-react';

import { ProfileMenu } from '@/components/dashboard/ProfileMenu';
import { getAccountProfile, getSession } from '@/lib/auth';

/**
 * Replaces the old 9-link AppNav. Per the Figma redesign, the authenticated
 * header is deliberately minimal: brand + "Ask Vantea" + profile avatar.
 * Collection/Timeline/Milestones/Wishlist/Goals stay live in the app but are
 * intentionally unlinked from nav — see .claude/plans/unified-crafting-charm.md
 * Phase 15.
 */
export async function AppHeader() {
  const session = await getSession();
  if (!session) return null;

  const profile = await getAccountProfile(session.userId);

  return (
    <header className="border-b border-outline-variant bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-24 py-16">
        <Link href="/dashboard" aria-label="Vantea home" className="flex items-center">
          <picture>
            <source media="(max-width: 759px)" srcSet="/vantea-logo-mobile.svg" />
            <img src="/vantea-logo-desktop.svg" alt="Vantea AI" className="h-64 w-auto" />
          </picture>
        </Link>
        <div className="flex items-center gap-12">
          <Link
            href="/ask"
            aria-label="Ask Vantea"
            // No semantic token matches this near-black teal — reusing the
            // existing --color-primitive-deep-teal-10 primitive (already
            // defined in tokens/tokens.css) rather than inventing a new hex.
            className="flex h-40 w-40 items-center justify-center gap-8 rounded-full bg-[var(--color-primitive-deep-teal-10)] text-inverse-on-surface hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:h-auto sm:w-auto sm:px-16 sm:py-8"
          >
            <Sparkles size={16} aria-hidden="true" />
            <span className="hidden text-button sm:inline">Ask Vantea</span>
          </Link>
          <ProfileMenu
            profile={{
              name: profile?.name ?? null,
              email: profile?.email ?? null,
              avatarUrl: profile?.avatarUrl ?? null,
              isGuest: profile?.isGuest ?? true,
            }}
          />
        </div>
      </div>
    </header>
  );
}
