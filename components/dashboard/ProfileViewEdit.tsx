'use client';

import { useState } from 'react';

import { Pencil } from 'lucide-react';

import { EmailSection } from '@/components/dashboard/EmailSection';
import { NameEditForm } from '@/components/dashboard/NameEditForm';
import { ProfileAvatarSection } from '@/components/dashboard/ProfileAvatarSection';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export type ProfileViewEditData = {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
};

/**
 * View mode first — plain read-only account details, nothing editable —
 * and only after "Edit Profile" is clicked does the interface switch into
 * an editable state. Two distinct states, not one form shown all the time.
 */
export function ProfileViewEdit({ profile }: { profile: ProfileViewEditData }) {
  const [editing, setEditing] = useState(false);
  // Tracks whether an actual save has happened this edit session — not
  // whether a field merely has unsaved text in it. Resets each time edit
  // mode is re-entered, so Done starts inactive again next time too.
  const [hasChanges, setHasChanges] = useState(false);

  function handleStartEditing() {
    setHasChanges(false);
    setEditing(true);
  }

  if (!editing) {
    return (
      <Card className="flex flex-col items-center gap-16 p-24 text-center">
        <Avatar name={profile.name} src={profile.avatarUrl} size="lg" ringed={!profile.isGuest} />
        <div>
          <p className="text-heading-h4 text-warm-ink">{profile.name ?? 'Guest'}</p>
          <p className="mt-4 text-body-small text-on-surface-variant">
            {profile.isGuest ? "You're using Vantea as a guest" : profile.email}
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={handleStartEditing}>
          <Pencil size={14} aria-hidden="true" />
          Edit Profile
        </Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-24 p-24">
      <div className="flex items-center gap-16">
        <ProfileAvatarSection name={profile.name} avatarUrl={profile.avatarUrl} onSaved={() => setHasChanges(true)} />
      </div>

      <NameEditForm currentName={profile.name} onSaved={() => setHasChanges(true)} />

      <EmailSection email={profile.email} isGuest={profile.isGuest} onSaved={() => setHasChanges(true)} />

      <div className="h-px bg-outline-variant" />

      <Button type="button" variant="primary" disabled={!hasChanges} onClick={() => setEditing(false)} className="self-start">
        Done
      </Button>
    </Card>
  );
}
