import type { Category } from '@prisma/client';

import { Badge } from '@/components/ui/Badge';
import { CATEGORY_LABELS } from '@/lib/constants';

export function CategoryBadge({ category }: { category: Category }) {
  return <Badge variant="neutral">{CATEGORY_LABELS[category]}</Badge>;
}
