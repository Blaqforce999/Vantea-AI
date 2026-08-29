import { StartCta } from '@/components/landing/StartCta';

const FLOW_STEPS = [
  { n: 1, label: 'Add' },
  { n: 2, label: 'Reveal' },
  { n: 3, label: 'Return' },
];

/**
 * Entrance animation uses `motion-safe:animate-rise` only — with reduced
 * motion requested, elements keep their default (visible, static) styling
 * instead of the keyframe's 0%-opacity start state. Pure CSS, no JS, so this
 * whole section renders and is fully visible with JavaScript disabled.
 */
export function Hero() {
  return (
    <header className="pb-80 pt-[120px]">
      <div className="mx-auto max-w-[1180px] px-40 max-[759px]:px-24">
        <div className="grid items-end gap-40 min-[861px]:grid-cols-[1fr_auto]">
          <div>
            <div className="motion-safe:animate-rise mb-28 font-mono text-caption uppercase tracking-wide text-gold">
              A diary that happens to add up
            </div>
            <h1 className="motion-safe:animate-rise motion-safe:[animation-delay:90ms] break-words font-serif text-[clamp(3.25rem,8vw,6.75rem)] font-normal leading-[0.95] tracking-[-0.05em] text-warm-ink">
              Everything you&apos;ve built.
              <br />
              <em className="font-medium italic text-gold">One place.</em>
            </h1>
            <p className="motion-safe:animate-rise motion-safe:[animation-delay:180ms] mt-28 max-w-[440px] text-body-large text-slate">
              What you own, what you&apos;ve made, how far you&apos;ve come. Not a bank. Yours.
            </p>
            <div className="motion-safe:animate-rise motion-safe:[animation-delay:270ms] mt-36 flex flex-wrap gap-14">
              <StartCta className="rounded-lg bg-primary px-24 py-12 text-body-small font-medium text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                See your worth
              </StartCta>
              <a
                href="#reveal"
                className="rounded-lg border border-outline-variant px-24 py-12 text-body-small font-medium text-warm-ink transition-colors hover:border-warm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Drag through your years
              </a>
            </div>
          </div>
          <div className="motion-safe:animate-rise motion-safe:[animation-delay:270ms] mt-20 text-left font-mono text-caption leading-[1.9] text-slate min-[861px]:mt-0 min-[861px]:text-right">
            Free to start
            <br />
            <b className="font-medium text-warm-ink">No bank connection</b>
            <br />
            Private by default
          </div>
        </div>

        <div className="motion-safe:animate-rise motion-safe:[animation-delay:270ms] mt-44 flex flex-wrap items-center gap-8 font-mono text-body-small text-slate">
          {FLOW_STEPS.map((step, index) => (
            <span key={step.n} className="flex items-center gap-8">
              <b className="font-medium text-warm-ink">
                {step.n}&nbsp;{step.label}
              </b>
              {index < FLOW_STEPS.length - 1 && <span className="text-gold">&rarr;</span>}
            </span>
          ))}
          <span className="opacity-70">&middot; about 20 seconds to your first number</span>
        </div>

        <div className="motion-safe:animate-rise motion-safe:[animation-delay:270ms] mt-[70px] h-px bg-outline-variant" />
      </div>
    </header>
  );
}
