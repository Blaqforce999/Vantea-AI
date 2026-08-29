import type { MilestoneType } from '@prisma/client';

import { Badge } from '@/components/ui/Badge';
import { MILESTONE_LABELS } from '@/lib/constants';

export function MilestoneBadge({ type }: { type: MilestoneType }) {
  return <Badge variant="achievement">{MILESTONE_LABELS[type]}</Badge>;
}
