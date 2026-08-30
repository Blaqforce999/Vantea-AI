import { StartCta } from '@/components/landing/StartCta';

const NAV_LINKS = [
  { href: '#reveal', label: 'The reveal' },
  { href: '#how', label: 'How it works' },
  { href: '#faq', label: 'FAQ' },
];

/**
 * Sticky nav with a translucent, blurred parchment veil. The veil color is a
 * one-off color-mix() of the existing `--color-background` token (not a new
 * named color) — see RevealScrubber.tsx for the same pattern used more
 * heavily, and ConfirmDialog.tsx's `bg-scrim-50` for the precedent: Tailwind
 * cannot fade our 8-digit-hex tokens via the `bg-x/50` opacity syntax at all.
 */
export function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[color-mix(in_srgb,var(--color-outline-variant)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-background)_82%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-40 max-[759px]:h-[64px] max-[759px]:px-24">
        <a href="#" className="flex items-center" aria-label="Vantea home">
          <picture>
            <source media="(max-width: 759px)" srcSet="/vantea-logo-mobile.svg" />
            <img src="/vantea-logo-desktop.svg" alt="Vantea AI" className="h-32 w-auto max-[759px]:h-24" />
          </picture>
        </a>
        <div className="flex items-center gap-[34px] text-body-small text-slate">
          <ul className="flex gap-[34px] max-[759px]:hidden">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="hover:text-warm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <StartCta className="whitespace-nowrap rounded-lg bg-primary px-16 py-8 text-caption font-medium text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            See your worth
          </StartCta>
        </div>
      </div>
    </nav>
  );
}
