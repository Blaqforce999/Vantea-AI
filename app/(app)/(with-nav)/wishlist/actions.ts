'use server';

import { revalidateTag } from 'next/cache';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { addWishlistItemSchema, deleteWishlistItemSchema, editWishlistItemSchema } from '@/lib/validators/wishlist';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

export async function addWishlistItem(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } };

  const parsed = addWishlistItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_INPUT', message: 'Please check the details.' } };
  }

  try {
    const item = await db.wishlistItem.create({
      data: {
        userId: session.userId,
        name: parsed.data.name,
        category: parsed.data.category,
        estimatedValue: parsed.data.estimatedValue?.toFixed(2),
        currency: parsed.data.currency,
        priority: parsed.data.priority,
      },
    });

    revalidateTag(`wishlist:${session.userId}`);
    logger.info('wishlist.created', { userId: session.userId, wishlistItemId: item.id });
    return { ok: true, data: { id: item.id } };
  } catch (err) {
    logger.error('wishlist.create.failed', { userId: session.userId, error: err instanceof Error ? err.message : 'unknown' });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not add this.' } };
  }
}

export async function editWishlistItem(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } };

  const parsed = editWishlistItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_INPUT', message: 'Please check the details.' } };
  }

  const existing = await db.wishlistItem.findUnique({ where: { id: parsed.data.id } });
  if (!existing || existing.userId !== session.userId) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Could not find that item.' } };
  }

  try {
    const { id, ...fields } = parsed.data;
    const item = await db.wishlistItem.update({
      where: { id },
      data: {
        ...(fields.name !== undefined && { name: fields.name }),
        ...(fields.category !== undefined && { category: fields.category }),
        ...(fields.estimatedValue !== undefined && { estimatedValue: fields.estimatedValue.toFixed(2) }),
        ...(fields.currency !== undefined && { currency: fields.currency }),
        ...(fields.priority !== undefined && { priority: fields.priority }),
        ...(fields.status !== undefined && { status: fields.status }),
      },
    });

    revalidateTag(`wishlist:${session.userId}`);
    logger.info('wishlist.updated', { userId: session.userId, wishlistItemId: item.id });
    return { ok: true, data: { id: item.id } };
  } catch (err) {
    logger.error('wishlist.update.failed', { userId: session.userId, error: err instanceof Error ? err.message : 'unknown' });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not update this.' } };
  }
}

export async function deleteWishlistItem(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } };

  const parsed = deleteWishlistItemSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_INPUT', message: 'Invalid request.' } };
  }

  const existing = await db.wishlistItem.findUnique({ where: { id: parsed.data.id } });
  // Already gone — a retried delete is a no-op success, not an error.
  if (!existing) return { ok: true, data: { id: parsed.data.id } };
  if (existing.userId !== session.userId) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Could not find that item.' } };
  }

  try {
    await db.wishlistItem.delete({ where: { id: parsed.data.id } });
    revalidateTag(`wishlist:${session.userId}`);
    logger.info('wishlist.deleted', { userId: session.userId, wishlistItemId: parsed.data.id });
    return { ok: true, data: { id: parsed.data.id } };
  } catch (err) {
    logger.error('wishlist.delete.failed', { userId: session.userId, error: err instanceof Error ? err.message : 'unknown' });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not delete this.' } };
  }
}
