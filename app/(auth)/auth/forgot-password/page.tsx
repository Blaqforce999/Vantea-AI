import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AuthCard } from '@/components/auth/AuthCard';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { getSession, sanitizeNext } from '@/lib/auth';

type ForgotPasswordPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;
  const next = sanitizeNext(params.next);

  // Already-authenticated visitors have no reason to be here.
  const session = await getSession();
  if (session) {
    redirect(next);
  }

  const loginHref = `/auth?mode=login&next=${encodeURIComponent(next)}`;

  return (
    <AuthCard>
      <div className="mb-32 text-center">
        <h1 className="font-serif text-display-medium text-on-surface">Reset your password.</h1>
        <p className="mt-8 text-body-regular text-on-surface-variant">We&apos;ll send you a link to get back in.</p>
      </div>

      <ForgotPasswordForm next={next} />

      <p className="mt-24 text-center text-body-small text-on-surface-variant">
        <Link href={loginHref} className="font-medium text-on-surface underline-offset-2 hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthCard>
  );
}
