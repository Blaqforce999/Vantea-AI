import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthCard } from '@/components/auth/AuthCard';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { AuthForm } from '@/components/auth/AuthForm';
import { GuestButton } from '@/components/auth/GuestButton';
import { getSession, sanitizeNext } from '@/lib/auth';

const COPY = {
  signup: {
    heading: 'Start keeping track.',
    subtitle: 'No bank connections. No advice. Just your record.',
    toggle: 'Already have an account?',
    toggleLink: 'Log in',
  },
  login: {
    heading: 'Welcome back.',
    subtitle: 'Pick up where you left off.',
    toggle: "Don't have an account?",
    toggleLink: 'Create one',
  },
} as const;

type AuthPageProps = {
  searchParams: Promise<{ mode?: string; next?: string }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const next = sanitizeNext(params.next);

  // Already-authenticated visitors never see the form — redirected before
  // anything renders, not just hidden client-side.
  const session = await getSession();
  if (session) {
    redirect(next);
  }

  const mode: 'signup' | 'login' = params.mode === 'login' ? 'login' : 'signup';
  const copy = COPY[mode];
  const otherMode = mode === 'signup' ? 'login' : 'signup';
  const nextQuery = params.next ? `&next=${encodeURIComponent(params.next)}` : '';
  const toggleHref = `/auth?mode=${otherMode}${nextQuery}`;

  return (
    <AuthCard>
      <div className="mb-32 text-center">
        <h1 className="font-serif text-display-medium text-on-surface">{copy.heading}</h1>
        <p className="mt-8 text-body-regular text-on-surface-variant">{copy.subtitle}</p>
      </div>

      <AuthForm mode={mode} next={next} />

      {mode === 'signup' && (
        <>
          <AuthDivider />
          <GuestButton next={next} />
        </>
      )}

      <p className="mt-24 text-center text-body-small text-on-surface-variant">
        {copy.toggle}{' '}
        <Link href={toggleHref} className="font-medium text-on-surface underline-offset-2 hover:underline">
          {copy.toggleLink}
        </Link>
      </p>

      {mode === 'signup' && (
        <p className="mt-24 text-center text-body-small text-on-surface-variant">
          By continuing, you agree to our{' '}
          <a href="#" className="underline underline-offset-2 hover:text-on-surface">
            Terms of Service
          </a>
          .
        </p>
      )}
    </AuthCard>
  );
}
