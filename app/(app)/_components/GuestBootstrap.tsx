'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

/**
 * cookies().set() is only callable from a Server Action or Route Handler,
 * never during a Server Component render — so the (app) layout (a Server
 * Component) cannot create a guest session itself. This client bootstrap
 * calls the guest-session route handler once, then refreshes so the page
 * re-renders with the session cookie the browser just received.
 */
export function GuestBootstrap() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/guest-session', { method: 'POST' }).then(() => router.refresh());
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment">
      <p className="text-body-regular text-on-surface-variant">Loading your journal…</p>
    </div>
  );
}
