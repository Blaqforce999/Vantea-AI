import { db } from '@/lib/db';
import { answerLocally, type AskContext } from '@/lib/local-answers';
import { parseItemLocally, type ParseResult } from '@/lib/local-nlu';

export type { ParseResult, ParsedItem } from '@/lib/local-nlu';

/**
 * No external AI/API call anywhere in this file — this is a local "demo
 * agent": deterministic parsing and templated answers computed from the
 * user's own data. See lib/local-nlu.ts and lib/local-answers.ts for the
 * actual logic. Both keep the same function signatures a real model-backed
 * implementation would have, so the API routes and UI components that call
 * them (app/api/ai/*, ConversationalAdd, AskVantea) don't need to change if
 * this is ever swapped back to a real model later.
 */

/**
 * Parses a conversational add into a structured preview, or a conversational
 * reply when nothing item-like is found (a greeting, or text too ambiguous
 * to extract from). Read-only either way — this never writes to the
 * database. The caller shows an item result as a ParsePreview and only
 * writes it via the ordinary addItem server action after the user
 * explicitly confirms.
 */
export async function parseItemFromText(text: string): Promise<ParseResult> {
  return parseItemLocally(text);
}

/**
 * Answers a question using ONLY the requesting user's own recorded data.
 * Read-only with respect to the database — never assembles context from
 * another user's data, aggregate data, or external data.
 */
export async function askVantea(userId: string, question: string): Promise<string> {
  const [user, items, wishlist, goals, milestones] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { baseCurrency: true, createdAt: true } }),
    // Defensive ceiling — a personal collection never approaches this, but it
    // keeps one huge account from turning every "ask" into an unbounded read.
    db.item.findMany({ where: { userId }, orderBy: { createdAt: 'asc' }, take: 2000 }),
    db.wishlistItem.findMany({ where: { userId }, take: 500 }),
    db.goal.findMany({ where: { userId }, take: 500 }),
    db.milestone.findMany({ where: { userId }, take: 500 }),
  ]);

  const context: AskContext = {
    joinedAt: user.createdAt.toISOString(),
    baseCurrency: user.baseCurrency,
    today: new Date().toISOString(),
    items: items.map((item) => ({
      name: item.name,
      category: item.category,
      value: item.value?.toFixed(2) ?? null,
      currency: item.currency,
      acquiredDate: item.acquiredDate?.toISOString().slice(0, 10) ?? null,
      whyNote: item.whyNote,
      addedAt: item.createdAt.toISOString(),
    })),
    wishlist: wishlist.map((w) => ({
      name: w.name,
      category: w.category,
      estimatedValue: w.estimatedValue?.toFixed(2) ?? null,
      currency: w.currency,
      priority: w.priority,
      status: w.status,
    })),
    goals: goals.map((g) => ({
      title: g.title,
      targetValue: g.targetValue?.toFixed(2) ?? null,
      currentProgress: g.currentProgress?.toFixed(2) ?? null,
      currency: g.currency,
      status: g.status,
    })),
    milestones: milestones.map((m) => ({ type: m.type, achievedAt: m.achievedAt.toISOString() })),
  };

  return answerLocally(context, question);
}
