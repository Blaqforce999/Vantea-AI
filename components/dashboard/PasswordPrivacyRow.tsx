'use client';

import { useState } from 'react';

import { KeyRound } from 'lucide-react';

import { PrivacyRow } from '@/components/dashboard/PrivacyRow';

import { ChangePasswordModal } from './ChangePasswordModal';

export function PasswordPrivacyRow() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PrivacyRow
        icon={KeyRound}
        title="Password"
        description="Update the password you use to log in."
        onClick={() => setOpen(true)}
      />
      <ChangePasswordModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
