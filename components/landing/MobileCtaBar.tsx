import { StartCta } from '@/components/landing/StartCta';

/**
 * Fixed to the bottom below 760px only. The reference blurs a translucent
 * ink bar here; a solid bg-on-background is used instead — nothing scrolls
 * meaningfully behind a bottom-docked bar, so the blur added no real
 * legibility benefit and this avoids another one-off color-mix() for a
 * detail this minor.
 */
export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] hidden items-center justify-between gap-12 bg-on-background px-18 py-12 max-[759px]:flex">
      <span className="text-body-small text-parchment">Free &middot; no bank connection</span>
      <StartCta className="whitespace-nowrap rounded-lg bg-primary px-16 py-8 text-caption font-medium text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        See your worth
      </StartCta>
    </div>
  );
}
