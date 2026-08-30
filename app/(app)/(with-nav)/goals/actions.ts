'use server';

import { revalidateTag } from 'next/cache';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { addGoalSchema, deleteGoalSchema, editGoalSchema } from '@/lib/validators/goal';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

export async function addGoal(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } };

  const parsed = addGoalSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_INPUT', message: 'Please check the details.' } };
  }

  try {
    const goal = await db.goal.create({
      data: {
        userId: session.userId,
        title: parsed.data.title,
        targetValue: parsed.data.targetValue?.toFixed(2),
        currentProgress: parsed.data.currentProgress?.toFixed(2),
        currency: parsed.data.currency,
      },
    });

    revalidateTag(`goals:${session.userId}`);
    logger.info('goal.created', { userId: session.userId, goalId: goal.id });
    return { ok: true, data: { id: goal.id } };
  } catch (err) {
    logger.error('goal.create.failed', { userId: session.userId, error: err instanceof Error ? err.message : 'unknown' });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not add this goal.' } };
  }
}

export async function editGoal(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } };

  const parsed = editGoalSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_INPUT', message: 'Please check the details.' } };
  }

  const existing = await db.goal.findUnique({ where: { id: parsed.data.id } });
  if (!existing || existing.userId !== session.userId) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Could not find that goal.' } };
  }

  try {
    const { id, ...fields } = parsed.data;
    const goal = await db.goal.update({
      where: { id },
      data: {
        ...(fields.title !== undefined && { title: fields.title }),
        ...(fields.targetValue !== undefined && { targetValue: fields.targetValue.toFixed(2) }),
        ...(fields.currentProgress !== undefined && { currentProgress: fields.currentProgress.toFixed(2) }),
        ...(fields.currency !== undefined && { currency: fields.currency }),
        ...(fields.status !== undefined && {
          status: fields.status,
          completedAt: fields.status === 'COMPLETED' ? new Date() : undefined,
        }),
      },
    });

    revalidateTag(`goals:${session.userId}`);
    logger.info('goal.updated', { userId: session.userId, goalId: goal.id });
    return { ok: true, data: { id: goal.id } };
  } catch (err) {
    logger.error('goal.update.failed', { userId: session.userId, error: err instanceof Error ? err.message : 'unknown' });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not update this goal.' } };
  }
}

export async function deleteGoal(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } };

  const parsed = deleteGoalSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid request.' } };
  }

  const existing = await db.goal.findUnique({ where: { id: parsed.data.id } });
  // Already gone — a retried delete is a no-op success, not an error.
  if (!existing) return { ok: true, data: { id: parsed.data.id } };
  if (existing.userId !== session.userId) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Could not find that goal.' } };
  }

  try {
    await db.goal.delete({ where: { id: parsed.data.id } });
    revalidateTag(`goals:${session.userId}`);
    logger.info('goal.deleted', { userId: session.userId, goalId: parsed.data.id });
    return { ok: true, data: { id: parsed.data.id } };
  } catch (err) {
    logger.error('goal.delete.failed', { userId: session.userId, error: err instanceof Error ? err.message : 'unknown' });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not delete this goal.' } };
  }
}
