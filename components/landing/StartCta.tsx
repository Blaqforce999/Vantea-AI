import Link from 'next/link';

/**
 * The reference's four "See your worth" buttons are `href="#start"` anchors
 * that scroll to the footer (a static single-page mockup, no backend). This
 * is a real product: they link to /auth, the combined signup/login gate
 * (now a single route with the two auth pages consolidated — signup is the
 * default mode). Uses next/link (not a plain <a>) so the transition is a
 * fast client-side navigation rather than a full page reload — with a
 * hard <a>, every click re-fetches and re-renders the whole document from
 * scratch, which reads as "nothing happened" long enough that people click
 * again. next/link still renders a real <a href> under the hood, so it
 * still works with JavaScript disabled. The secondary hero CTA ("Drag
 * through your years") stays a plain anchor to #reveal — that one is
 * genuinely just in-page scroll.
 */
export function StartCta({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <Link href="/auth" className={className}>
      {children}
    </Link>
  );
}
