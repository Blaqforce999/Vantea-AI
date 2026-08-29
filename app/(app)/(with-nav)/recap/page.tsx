import { YearOfBuildingCard } from '@/components/recap/YearOfBuildingCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { getSession } from '@/lib/auth';

export default async function RecapPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="flex flex-col gap-32">
      <PageHeader title="Your Recap" description="A screenshot-worthy look at your year of building." />
      <YearOfBuildingCard userId={session.userId} />
    </div>
  );
}
