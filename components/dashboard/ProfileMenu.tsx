'use client';

import { useState } from 'react';

import { Download, HelpCircle, LogOut, ShieldCheck, User } from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Menu, MenuItem } from '@/components/ui/Menu';

import { signOut, useProfileActions } from './useProfileActions';

export type ProfileMenuData = { name: string | null; email: string | null; avatarUrl: string | null; isGuest: boolean };

/**
 * The avatar → dropdown. Purely navigation/quick-actions — "Your Profile"
 * and "Privacy" are entry points into their own independent pages, not
 * containers duplicated here.
 */
export function ProfileMenu({ profile }: { profile: ProfileMenuData }) {
  const { exporting, handleExport } = useProfileActions();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleConfirmSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <>
      <Menu
        trigger={
          // Match the "Ask Vantea" button's box exactly: a 40px circle on
          // mobile, 36px (its desktop pill height) at >=640px.
          <Avatar
            name={profile.name}
            src={profile.avatarUrl}
            size="sm"
            className="h-40 w-40 sm:h-36 sm:w-36"
          />
        }
      >
        <MenuItem icon={User} label="Your Profile" href="/profile" />
        <MenuItem icon={ShieldCheck} label="Privacy" href="/privacy" />
        <MenuItem icon={Download} label={exporting ? 'Exporting…' : 'Export Data'} onClick={handleExport} />
        <MenuItem icon={HelpCircle} label="Help & Support" href="mailto:support@vantea.io" />
        <div className="my-4 h-px bg-outline-variant" />
        <MenuItem icon={LogOut} label="Sign Out" onClick={() => setConfirmingSignOut(true)} danger />
      </Menu>

      <ConfirmDialog
        open={confirmingSignOut}
        title="Sign out?"
        description="You'll need to log in again to get back to your things."
        confirmLabel="Sign out"
        destructive
        pending={signingOut}
        onConfirm={handleConfirmSignOut}
        onCancel={() => setConfirmingSignOut(false)}
      />
    </>
  );
}
