import { StartCta } from '@/components/landing/StartCta';

const PRODUCT_LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#priv', label: 'Private' },
  { href: '#start', label: 'Free' },
];
const COMPANY_LINKS = [
  { href: '#', label: 'About' },
  { href: '#', label: 'Blog' },
  { href: '#', label: 'Contact' },
];
const LEGAL_LINKS = [
  { href: '#', label: 'Privacy' },
  { href: '#', label: 'Terms' },
];

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="mb-16 font-mono text-caption uppercase tracking-wide text-slate">{title}</h4>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className="mb-10 block text-body-small text-warm-ink opacity-85 last:mb-0 hover:text-gold hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer id="start" className="relative mt-40 overflow-hidden border-t border-outline-variant bg-surface-container pb-56 pt-80">
      <div className="mx-auto max-w-[1180px] px-40 max-[759px]:px-24">
        <div className="grid grid-cols-1 items-start gap-44 min-[821px]:grid-cols-[1fr_auto] min-[821px]:gap-40">
          <div className="flex flex-col items-start">
            <p className="font-serif text-[clamp(1.875rem,4.4vw,3.125rem)] font-normal leading-[1.02] tracking-[-0.02em] text-warm-ink">
              A diary that
              <br />
              <em className="italic text-gold">happens to add up.</em>
            </p>
            <StartCta className="mt-36 rounded-lg bg-primary px-24 py-12 text-body-small font-medium text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              See your worth
            </StartCta>
          </div>
          <div className="flex gap-56 max-[520px]:flex-wrap max-[520px]:gap-36">
            <FooterColumn title="Product" links={PRODUCT_LINKS} />
            <FooterColumn title="Company" links={COMPANY_LINKS} />
            <FooterColumn title="Legal" links={LEGAL_LINKS} />
          </div>
        </div>

        <div className="mt-64 flex items-center gap-16 border-t border-[color-mix(in_srgb,var(--color-outline-variant)_35%,transparent)] pb-40 pt-24">
          <picture>
            <source media="(max-width: 759px)" srcSet="/vantea-logo-mobile.svg" />
            <img src="/vantea-logo-desktop.svg" alt="Vantea AI" className="h-64 w-auto flex-none" />
          </picture>
          <p className="font-mono text-caption leading-[1.7] text-slate">
            &copy; 2026 Vantea AI. Private by default.
            <br />
            Made for people who build.
          </p>
        </div>
      </div>

      {/* The prompt scopes the gold gradient to exactly three moments — the
          foil CTA, the Worth number, and this wordmark — sourced from the
          one gold token, rather than the reference's separate muted
          light-gold pair used only here. */}
      <div
        aria-hidden="true"
        className="select-none bg-gradient-gold-foil bg-clip-text pt-[22px] text-center font-serif text-[clamp(6.875rem,23vw,21.25rem)] font-medium leading-[0.9] tracking-[-0.1em] text-transparent"
      >
        Vantea
      </div>
    </footer>
  );
}
