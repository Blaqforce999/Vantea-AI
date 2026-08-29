'use client';

import { useState } from 'react';

import Link from 'next/link';

import { Button } from '@/components/ui/Button';

import { EmailChangeModal } from './EmailChangeModal';

type EmailSectionProps = { email: string | null; isGuest: boolean; onSaved?: () => void };

export function EmailSection({ email, isGuest, onSaved }: EmailSectionProps) {
  const [open, setOpen] = useState(false);

  if (isGuest) {
    return (
      <div className="flex flex-col gap-8">
        <p className="text-label text-warm-ink">Email</p>
        <p className="text-body-small text-on-surface-variant">
          You&apos;re using Vantea as a guest. No email is set.{' '}
          <Link href="/privacy" className="font-medium text-warm-ink underline underline-offset-2">
            Save your account
          </Link>{' '}
          to add one.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-label text-warm-ink">Email</p>
      <div className="flex h-44 items-center rounded-lg border border-outline-variant bg-surface-container-low px-12 text-body-regular text-on-surface-variant">
        {email}
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)} className="self-start">
        Change email
      </Button>
      <EmailChangeModal open={open} onClose={() => setOpen(false)} onSaved={onSaved} />
    </div>
  );
}
