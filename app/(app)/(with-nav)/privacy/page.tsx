import { UserPlus, ShieldCheck } from 'lucide-react';

import { UpgradeAccountForm } from '@/app/(app)/(with-nav)/privacy/_components/UpgradeAccountForm';
import { DeleteAccountRow } from '@/components/dashboard/DeleteAccountRow';
import { ExportDataRow } from '@/components/dashboard/ExportDataRow';
import { PasswordPrivacyRow } from '@/components/dashboard/PasswordPrivacyRow';
import { PrivacyRow } from '@/components/dashboard/PrivacyRow';
import { PageHeader } from '@/components/shared/PageHeader';
import { getSession } from '@/lib/auth';

export default async function PrivacyPage() {
  const session = await getSession();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-16">
      <PageHeader
        title="Privacy"
        description="What Vantea stores about you, explained clearly, and fully in your control."
      />

      {session?.isGuest && (
        <PrivacyRow
          icon={UserPlus}
          title="Save your account"
          description="You're using Vantea as a guest. If you clear your cookies or switch devices, this data is gone. Add an email and password to keep it safe. Nothing about your collection changes."
        >
          <UpgradeAccountForm />
        </PrivacyRow>
      )}

      {session && !session.isGuest && <PasswordPrivacyRow />}

      <PrivacyRow
        icon={ShieldCheck}
        title="What Vantea stores"
        description="The things you've recorded (name, category, your own value estimate, currency, date, and why it mattered), plus your worth history, wishlist, goals, and milestones. That's all. Vantea never connects to a bank, never sells your data, and never uses it to target you with financial products or advice."
      />

      <ExportDataRow />
      <DeleteAccountRow />
    </div>
  );
}
