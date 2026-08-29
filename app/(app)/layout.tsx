import { getSession } from '@/lib/auth';

import { GuestBootstrap } from './_components/GuestBootstrap';

/**
 * Only responsible for the guest-session gate — no visual chrome. The
 * Reveal ritual needs a full-bleed layout with no nav, while every other
 * page wants the standard nav shell, so that chrome lives one level down in
 * (with-nav)/layout.tsx rather than here.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    return <GuestBootstrap />;
  }

  return children;
}
