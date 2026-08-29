import { ProfileViewEdit } from '@/components/dashboard/ProfileViewEdit';
import { PageHeader } from '@/components/shared/PageHeader';
import { getAccountProfile, getSession } from '@/lib/auth';

/**
 * An independent destination, not a container for the avatar menu — no
 * Privacy/Export/Help/Sign Out here. View mode (read-only) first; "Edit
 * Profile" switches to the editable state. See ProfileViewEdit.
 */
export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;

  const profile = await getAccountProfile(session.userId);
  if (!profile) return null;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-24">
      <PageHeader title="Profile" description="Your name, photo, and email." />
      <ProfileViewEdit
        profile={{ name: profile.name, email: profile.email, avatarUrl: profile.avatarUrl, isGuest: profile.isGuest }}
      />
    </div>
  );
}
