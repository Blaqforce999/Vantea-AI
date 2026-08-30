import crypto from 'crypto';

import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { LoginInput, SignupInput } from '@/lib/validators/auth';

const SESSION_COOKIE = 'vantea_session';
// Not set anywhere under the current guest model (a guest is a real Session
// row like any other) — cleared defensively on logout in case a future
// change introduces it, so logout never leaves a stale identity cookie behind.
const GUEST_COOKIE = 'vantea_guest_id';
const SESSION_TTL_DAYS = 30;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export type Session = { userId: string; isGuest: boolean };

type Result<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

/**
 * True when the failure is Prisma unable to reach or recognise the database
 * itself — an unreachable host, a missing/blank DATABASE_URL, or a schema
 * that was never migrated (no `users` table). Every one of these is an
 * environment problem, not a bad request, so callers log it under a distinct
 * event (grep `db_unavailable` in the deploy's function logs) while still
 * returning a generic message to the client.
 */
function isDatabaseUnavailable(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P1xxx: connection/auth/timeout. P2021: table missing. P2022: column missing.
    return err.code.startsWith('P1') || err.code === 'P2021' || err.code === 'P2022';
  }
  return false;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

async function issueSession(userId: string): Promise<void> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.session.create({ data: { userId, tokenHash, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

/** Resolves the current guest-or-account session from the request cookie, or null if there isn't one. */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await db.session.findUnique({
    where: { tokenHash },
    include: { user: { select: { isGuest: true } } },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    // Garbage-collect the expired row here rather than leaving it for a
    // background job that doesn't exist yet — every expired session gets
    // cleaned up the next time anyone happens to present its cookie.
    // deleteMany (not delete) so a concurrent request that already removed
    // this same row is a no-op, not a thrown "record not found".
    await db.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  return { userId: session.userId, isGuest: session.user.isGuest };
}

/** Creates a brand-new guest user and session, with no signup wall. */
export async function createGuestSession(): Promise<Session> {
  const user = await db.user.create({ data: { isGuest: true } });
  await issueSession(user.id);
  return { userId: user.id, isGuest: true };
}

/** Returns the current session, creating a guest session if none exists yet. */
export async function getOrCreateSession(): Promise<Session> {
  return (await getSession()) ?? createGuestSession();
}

export async function signup(input: SignupInput): Promise<Result<{ userId: string }>> {
  try {
    const existing = await db.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return { ok: false, error: { code: 'EMAIL_TAKEN', message: 'An account with that email already exists.' } };
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await db.user.create({
      data: { email: input.email, name: input.name, passwordHash, isGuest: false },
    });
    await issueSession(user.id);
    logger.info('auth.signup', { userId: user.id });
    return { ok: true, data: { userId: user.id } };
  } catch (err) {
    logger.error(isDatabaseUnavailable(err) ? 'auth.signup.db_unavailable' : 'auth.signup.failed', { error: err });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not create an account.' } };
  }
}

export async function login(input: LoginInput): Promise<Result<{ userId: string }>> {
  try {
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user || !user.passwordHash) {
      return { ok: false, error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' } };
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      return { ok: false, error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' } };
    }

    await issueSession(user.id);
    logger.info('auth.login', { userId: user.id });
    return { ok: true, data: { userId: user.id } };
  } catch (err) {
    logger.error(isDatabaseUnavailable(err) ? 'auth.login.db_unavailable' : 'auth.login.failed', { error: err });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not log in.' } };
  }
}

/** Deletes the session record server-side, not just the cookie — a stolen cookie is then useless. */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    await db.session.deleteMany({ where: { tokenHash } });
  }

  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(GUEST_COOKIE);
}

/**
 * Guards the post-auth redirect target against open-redirect attacks.
 * Only a same-app relative path is trusted — `//evil.com` and
 * `https://evil.com` both parse as absolute/protocol-relative and are
 * rejected, along with anything that isn't a plain `/path`.
 */
export function sanitizeNext(next: string | null | undefined): string {
  const fallback = '/dashboard';
  if (!next) return fallback;
  if (!next.startsWith('/') || next.startsWith('//')) return fallback;
  return next;
}

export type AccountProfile = {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  baseCurrency: string;
  createdAt: Date;
  isGuest: boolean;
};

/**
 * Read-only profile info for the dashboard header/Profile page. Deliberately
 * separate from Session/getSession() — the session's job is auth gating, not
 * carrying display fields, and every other page-level data need (worth,
 * items, etc.) already follows this same "page fetches what it needs"
 * pattern rather than growing the session shape.
 */
export async function getAccountProfile(userId: string): Promise<AccountProfile | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, avatarUrl: true, baseCurrency: true, createdAt: true, isGuest: true },
  });
}

/**
 * Upgrades the current guest session to a real account. The guest's rows
 * never move — they already belong to this userId — so the "migration" is
 * just filling in email/password on the same User row, atomically. The old
 * session is invalidated and a fresh one issued.
 */
export async function upgradeGuestToAccount(input: SignupInput): Promise<Result<{ userId: string }>> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'No session.' } };
  }
  if (!session.isGuest) {
    return { ok: false, error: { code: 'ALREADY_UPGRADED', message: 'This session is already a full account.' } };
  }

  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) {
    return { ok: false, error: { code: 'EMAIL_TAKEN', message: 'An account with that email already exists.' } };
  }

  try {
    const passwordHash = await bcrypt.hash(input.password, 12);
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.userId },
        data: { email: input.email, name: input.name, passwordHash, isGuest: false },
      });
      await tx.session.deleteMany({ where: { userId: session.userId } });
    });

    await issueSession(session.userId);
    logger.info('auth.guest_upgraded', { userId: session.userId });
    return { ok: true, data: { userId: session.userId } };
  } catch (err) {
    logger.error('auth.guest_upgrade.failed', { userId: session.userId, error: err });
    return { ok: false, error: { code: 'SERVER_ERROR', message: 'Could not upgrade this session.' } };
  }
}
