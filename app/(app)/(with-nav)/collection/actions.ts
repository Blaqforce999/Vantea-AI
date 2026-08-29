'use server';

import { revalidateTag } from 'next/cache';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { checkMilestones, type AwardedMilestone } from '@/lib/milestones';
import { addItemSchema, deleteItemSchema, editItemSchema } from '@/lib/validators/item';
import { recordWorthSnapshot } from '@/lib/worth';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

export async function addItem(
  raw: unknown,
): Promise<ActionResult<{ id: string; newMilestones: AwardedMilestone[] }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } };

  const parsed = addItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_INPUT', message: 'Please check the details.' } };
  }

  try {
    const item = await db.$transaction(async (tx) => {
      const created = await tx.item.create({
        data: {
          userId: session.userId,
          name: parsed.data.name,
          category: parsed.data.category,
          value: parsed.data.value?.toFixed(2),
          currency: parsed.data.currency,
          acquiredDate: parsed.data.acquiredDate,
          whyNote: parsed.data.whyNote,
          imageUrl: parsed.data.imageUrl,
        },
      });
      await recordWorthSnapshot(tx, session.userId);
      return created;
    });

    const newMilestones = await checkMilestones(session.userId);
    revalidateTag(`collection:${session.userId}`);
    revalidateTag(`worth:${session.userId}`);

    logger.info('item.created', { userId: session.userId, itemId: item.id });
    return { ok: true, data: { id: item.id, newMilestones } };
  } catch (err) {
    logger.error('item.create.failed', { userId: session.userId, error: err });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not add this.' } };
  }
}

export async function editItem(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } };

  const parsed = editItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_INPUT', message: 'Please check the details.' } };
  }

  const existing = await db.item.findUnique({ where: { id: parsed.data.id } });
  if (!existing || existing.userId !== session.userId) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Could not find that item.' } };
  }

  try {
    const { id, ...fields } = parsed.data;
    const item = await db.$transaction(async (tx) => {
      const updated = await tx.item.update({
        where: { id },
        data: {
          ...(fields.name !== undefined && { name: fields.name }),
          ...(fields.category !== undefined && { category: fields.category }),
          ...(fields.value !== undefined && { value: fields.value.toFixed(2) }),
          ...(fields.currency !== undefined && { currency: fields.currency }),
          ...(fields.acquiredDate !== undefined && { acquiredDate: fields.acquiredDate }),
          ...(fields.whyNote !== undefined && { whyNote: fields.whyNote }),
          ...(fields.imageUrl !== undefined && { imageUrl: fields.imageUrl }),
        },
      });
      await recordWorthSnapshot(tx, session.userId);
      return updated;
    });

    await checkMilestones(session.userId);
    revalidateTag(`collection:${session.userId}`);
    revalidateTag(`worth:${session.userId}`);

    logger.info('item.updated', { userId: session.userId, itemId: item.id });
    return { ok: true, data: { id: item.id } };
  } catch (err) {
    logger.error('item.update.failed', { userId: session.userId, error: err });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not update this.' } };
  }
}

export async function deleteItem(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } };

  const parsed = deleteItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid request.' } };
  }

  const existing = await db.item.findUnique({ where: { id: parsed.data.id } });
  if (!existing || existing.userId !== session.userId) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Could not find that item.' } };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.item.delete({ where: { id: parsed.data.id } });
      await recordWorthSnapshot(tx, session.userId);
    });

    revalidateTag(`collection:${session.userId}`);
    revalidateTag(`worth:${session.userId}`);

    logger.info('item.deleted', { userId: session.userId, itemId: parsed.data.id });
    return { ok: true, data: { id: parsed.data.id } };
  } catch (err) {
    logger.error('item.delete.failed', { userId: session.userId, error: err });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not delete this.' } };
  }
}
