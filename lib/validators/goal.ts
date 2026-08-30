import { z } from 'zod';

import { MAX_MONEY } from '@/lib/validators/item';

export const goalStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']);

export const addGoalSchema = z.object({
  title: z.string().min(1).max(200),
  targetValue: z.number().nonnegative().finite().max(MAX_MONEY).optional(),
  currentProgress: z.number().nonnegative().finite().max(MAX_MONEY).optional(),
  currency: z.string().length(3).toUpperCase().optional(),
});

export const editGoalSchema = addGoalSchema.partial().extend({
  id: z.string().cuid(),
  status: goalStatusSchema.optional(),
});

export const deleteGoalSchema = z.object({ id: z.string().cuid() });

export type AddGoalInput = z.infer<typeof addGoalSchema>;
export type EditGoalInput = z.infer<typeof editGoalSchema>;
