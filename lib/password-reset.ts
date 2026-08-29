import crypto from 'crypto';

import bcrypt from 'bcryptjs';

import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * The whole feature stays off until both are configured. Checked by the
 * forgot-password and reset-password route handlers, which return
 * 404 NOT_AVAILABLE while this is false — this module's logic is real and
 * exercised by nothing until then.
 */
export const EMAIL_ENABLED = Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function sendResetEmail(_email: string, _token: string): Promise<void> {
  // Not implemented — no email provider dependency has been added, since
  // nothing calls this while EMAIL_ENABLED is false. When the flag goes on,
  // this builds `${NEXT_PUBLIC_APP_URL}/auth?mode=reset&token=...` and sends
  // it via Resend (RESEND_API_KEY, from EMAIL_FROM).
  throw new Error('sendResetEmail is not implemented — unreachable while EMAIL_ENABLED is false.');
}

/**
 * Always resolves the same way regardless of whether the email exists —
 * the caller (the route handler) returns one generic success message
 * either way, so this never leaks which emails have accounts.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.email) {
    logger.info('auth.password_reset_requested.unknown_email');
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await db.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
  await sendResetEmail(user.email, token);

  logger.info('auth.password_reset_requested', { userId: user.id });
}

type ResetResult = { ok: true } | { ok: false; error: { code: string; message: string } };

export async function resetPassword(token: string, newPassword: string): Promise<ResetResult> {
  const tokenHash = hashToken(token);
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: { code: 'INVALID_TOKEN', message: 'This reset link is invalid or has expired.' } };
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db.$transaction(async (tx) => {
      // Guarded by usedAt: null so a concurrent double-submit of the same
      // token can consume it at most once.
      const stamped = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (stamped.count === 0) {
        throw new Error('TOKEN_ALREADY_USED');
      }

      await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });

      // A reset implies the password may have been compromised — every
      // existing session is invalidated, not just the one making this request.
      await tx.session.deleteMany({ where: { userId: record.userId } });
    });

    logger.info('auth.password_reset_completed', { userId: record.userId });
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === 'TOKEN_ALREADY_USED') {
      return { ok: false, error: { code: 'INVALID_TOKEN', message: 'This reset link is invalid or has expired.' } };
    }
    logger.error('auth.password_reset_failed', { userId: record.userId, error: err });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not reset your password.' } };
  }
}
