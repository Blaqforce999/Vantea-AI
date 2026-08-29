/**
 * Secondary path — visually quiet, never competing with "Create account."
 * A plain link, not a fetch-then-redirect button: /collection already
 * bootstraps a guest session on arrival with no existing session (see
 * app/(app)/_components/GuestBootstrap.tsx), so this reuses that existing
 * mechanism instead of duplicating cookie-setting logic here.
 */
export function GuestButton({ next }: { next: string }) {
  return (
    <div className="flex flex-col items-center gap-8">
      <a
        href={next}
        className="w-full rounded-xl border border-outline-variant py-12 text-center text-body-small font-medium text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        Continue as guest
      </a>
      <p className="text-caption text-on-surface-variant">No account needed. You can save your data later.</p>
    </div>
  );
}
