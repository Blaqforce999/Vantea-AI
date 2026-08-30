'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

/**
 * cookies().set() is only callable from a Server Action or Route Handler,
 * never during a Server Component render — so the (app) layout (a Server
 * Component) cannot create a guest session itself. This client bootstrap
 * calls the guest-session route handler once, then refreshes so the page
 * re-renders with the session cookie the browser just received.
 *
 * Failure handling matters here: this is the very first screen a new visitor
 * sees. A dropped request, a 429, a transient 500, or a refresh that somehow
 * doesn't pick up the new cookie must never leave them staring at
 * "Loading your journal…" forever — so anything other than a clean success
 * surfaces a real message and a Retry button. The startedRef guard keeps
 * React's double-invoked effect (and any re-render) from firing a second
 * POST while the first is still in flight.
 */
const STALL_MS = 6000;

export function GuestBootstrap() {
  const router = useRouter();
  const startedRef = useRef(false);
  // Once the POST has succeeded the session cookie is set — a retry then only
  // needs another refresh (e.g. read-replica lag briefly hid the new row),
  // never a second POST that would mint a throwaway guest user.
  const sessionCreatedRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  const bootstrap = useCallback(async () => {
    setStatus('loading');

    if (sessionCreatedRef.current) {
      router.refresh();
      return;
    }

    try {
      const res = await fetch('/api/auth/guest-session', { method: 'POST' });
      if (!res.ok) {
        setStatus('error');
        return;
      }
      sessionCreatedRef.current = true;
      router.refresh();
    } catch {
      setStatus('error');
    }
  }, [router]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void bootstrap();
  }, [bootstrap]);

  // If the POST succeeded but this component is still mounted well after the
  // router.refresh() — the new session isn't being seen — stop waiting and
  // let the visitor retry rather than hang indefinitely.
  useEffect(() => {
    if (status !== 'loading') return;
    const timer = window.setTimeout(() => setStatus('error'), STALL_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-16 bg-parchment px-24 text-center">
      {status === 'loading' ? (
        <p className="text-body-regular text-on-surface-variant">Loading your journal…</p>
      ) : (
        <>
          <p className="text-body-regular text-warm-ink">We couldn&apos;t start your journal just now.</p>
          <p className="max-w-sm text-body-small text-on-surface-variant">
            Check your connection and try again — nothing you&apos;ve saved is lost.
          </p>
          <button
            type="button"
            onClick={() => void bootstrap()}
            className="rounded-lg bg-primary px-24 py-12 text-body-small font-medium text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}
