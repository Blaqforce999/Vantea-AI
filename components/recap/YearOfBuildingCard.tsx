import { RecapCard } from '@/components/recap/RecapCard';
import { getYearOfBuildingRecap } from '@/lib/recap';

export async function YearOfBuildingCard({ userId }: { userId: string }) {
  const recap = await getYearOfBuildingRecap(userId);

  return (
    <RecapCard
      headline={`Your ${recap.year} of Building`}
      itemsAddedCount={recap.itemsAddedCount}
      milestonesCount={recap.milestonesCount}
      worth={recap.currentWorth}
      highlightNote={recap.highlightNote}
    />
  );
}
