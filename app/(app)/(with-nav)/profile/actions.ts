'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { changeEmailSchema, updateProfileSchema } from '@/lib/validators/profile';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

/** Updates the session user's name and/or avatar. Guests can use this too — it doesn't touch email/password. */
export async function updateProfile(raw: unknown): Promise<ActionResult<null>> {
  const session = await getSession();
  if (!session) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_INPUT', message: 'Please check the details.' } };
  }

  try {
    await db.user.update({
      where: { id: session.userId },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.avatarUrl !== undefined && { avatarUrl: parsed.data.avatarUrl }),
      },
    });

    revalidatePath('/profile');
    revalidatePath('/dashboard');
    logger.info('profile.updated', { userId: session.userId });
    return { ok: true, data: null };
  } catch (err) {
    logger.error('profile.update.failed', { userId: session.userId, error: err instanceof Error ? err.message : 'unknown' });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not update your profile.' } };
  }
}

/**
 * Changes the account email. Requires the current password as a step-up
 * check — there's no working email-verification pipeline in this app
 * (RESEND_API_KEY is unset, see lib/password-reset.ts), so a "check your
 * inbox" flow would silently do nothing. Confirming the password is a real,
 * meaningful verification step instead of a fake one.
 */
export async function changeEmail(raw: unknown): Promise<ActionResult<null>> {
  const session = await getSession();
  if (!session) return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } };
  if (session.isGuest) {
    return { ok: false, error: { code: 'GUEST_ACCOUNT', message: 'Save your account first to set an email.' } };
  }

  const parsed = changeEmailSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID_INPUT', message: 'Please check the details.' } };
  }

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.passwordHash) {
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not verify your password.' } };
  }

  const validPassword = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!validPassword) {
    return { ok: false, error: { code: 'INVALID_PASSWORD', message: 'That password is incorrect.' } };
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.newEmail } });
  if (existing && existing.id !== session.userId) {
    return { ok: false, error: { code: 'EMAIL_TAKEN', message: 'An account with that email already exists.' } };
  }

  try {
    await db.user.update({ where: { id: session.userId }, data: { email: parsed.data.newEmail } });
    revalidatePath('/profile');
    logger.info('profile.email_changed', { userId: session.userId });
    return { ok: true, data: null };
  } catch (err) {
    logger.error('profile.email_change.failed', { userId: session.userId, error: err instanceof Error ? err.message : 'unknown' });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not update your email.' } };
  }
}
