'use client';

import { useState } from 'react';

import { Camera } from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

import { AvatarEditModal } from './AvatarEditModal';

type ProfileAvatarSectionProps = { name: string | null; avatarUrl: string | null; onSaved?: () => void };

export function ProfileAvatarSection({ name, avatarUrl, onSaved }: ProfileAvatarSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Avatar name={name} src={avatarUrl} size="lg" />
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Camera size={14} aria-hidden="true" />
        Update avatar
      </Button>
      <AvatarEditModal name={name} currentAvatarUrl={avatarUrl} open={open} onClose={() => setOpen(false)} onSaved={onSaved} />
    </>
  );
}
