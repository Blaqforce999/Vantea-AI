import { format, formatDistanceStrict, subMonths } from 'date-fns';
import type { Category, MilestoneType } from '@prisma/client';

import { CATEGORY_LABELS, MILESTONE_LABELS } from '@/lib/constants';
import { formatMoney } from '@/lib/format';
import { CATEGORY_KEYWORDS } from '@/lib/local-nlu';

/**
 * The local, deterministic stand-in for what used to be an Anthropic call
 * behind "Ask Vantea." Pattern-matches the question against a set of
 * templates computed directly from the user's own recorded data — no
 * network call, no model. Anything outside the recognized patterns gets an
 * honest "I don't have a way to answer that" reply rather than a fabricated
 * one, preserving the product's original "never invent an answer" rule.
 */

export type AskContext = {
  joinedAt: string;
  baseCurrency: string;
  today: string;
  items: {
    name: string;
    category: string;
    value: string | null;
    currency: string | null;
    acquiredDate: string | null;
    whyNote: string | null;
    addedAt: string;
  }[];
  wishlist: { name: string; category: string; estimatedValue: string | null; currency: string | null; priority: string; status: string }[];
  goals: { title: string; targetValue: string | null; currentProgress: string | null; currency: string | null; status: string }[];
  milestones: { type: string; achievedAt: string }[];
};

function describeWorth(context: AskContext): string {
  const totals = new Map<string, number>();
  for (const item of context.items) {
    if (item.value === null || item.currency === null) continue;
    totals.set(item.currency, (totals.get(item.currency) ?? 0) + Number(item.value));
  }
  if (totals.size === 0) return "You don't have any valued things recorded yet.";

  const parts = [...totals.entries()].map(([currency, total]) => formatMoney(total, currency));
  return totals.size === 1
    ? `Your recorded worth is ${parts[0]}.`
    : `Your recorded worth is ${parts.join(' and ')}. They're kept separate since Vantea doesn't convert between currencies.`;
}

function describeHighestValueItem(context: AskContext): string {
  const valued = context.items.filter((i) => i.value !== null && i.currency !== null);
  if (valued.length === 0) return "You don't have any valued things recorded yet.";

  const byCurrency = new Map<string, typeof valued>();
  for (const item of valued) {
    const list = byCurrency.get(item.currency!) ?? [];
    list.push(item);
    byCurrency.set(item.currency!, list);
  }

  const featuredList = byCurrency.get(context.baseCurrency) ?? valued;
  const top = featuredList.reduce((max, item) => (Number(item.value) > Number(max.value) ? item : max));
  return `Your highest recorded value is ${top.name} at ${formatMoney(Number(top.value), top.currency!)}.`;
}

function describeTenure(context: AskContext): string {
  const joined = new Date(context.joinedAt);
  const now = new Date(context.today);
  return `You joined Vantea ${formatDistanceStrict(joined, now)} ago, on ${format(joined, 'MMMM d, yyyy')}.`;
}

function describeWishlist(context: AskContext): string {
  if (context.wishlist.length === 0) return 'Your wishlist is empty right now.';
  const names = context.wishlist.slice(0, 6).map((w) => w.name);
  const suffix = context.wishlist.length > 6 ? ', and more' : '';
  return `On your wishlist: ${names.join(', ')}${suffix}.`;
}

function describeGoals(context: AskContext): string {
  if (context.goals.length === 0) return "You don't have any goals set yet.";
  return `Your goals: ${context.goals.map((g) => g.title).join(', ')}.`;
}

function describeMilestones(context: AskContext): string {
  if (context.milestones.length === 0) return "You haven't hit any milestones yet. They show up as you keep recording things.";
  const labels = context.milestones.map((m) => MILESTONE_LABELS[m.type as MilestoneType] ?? m.type);
  return `You've achieved: ${labels.join(', ')}.`;
}

function findMentionedCategory(question: string): Category | null {
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => question.includes(kw))) return category;
  }
  for (const [value, label] of Object.entries(CATEGORY_LABELS)) {
    if (question.includes(label.toLowerCase())) return value as Category;
  }
  return null;
}

function describeCategory(context: AskContext, category: Category): string {
  const matches = context.items.filter((i) => i.category === category);
  if (matches.length === 0) return `You don't have anything recorded under ${CATEGORY_LABELS[category]} yet.`;
  return `Under ${CATEGORY_LABELS[category]}: ${matches.map((i) => i.name).join(', ')}.`;
}

function describeRecentlyAdded(context: AskContext): string {
  const now = new Date(context.today);
  const cutoff = subMonths(now, 1);
  const recent = context.items.filter((i) => new Date(i.addedAt) >= cutoff);
  if (recent.length === 0) return "You haven't added anything in the last month.";
  return `In the last month you added: ${recent.map((i) => i.name).join(', ')}.`;
}

export function answerLocally(context: AskContext, question: string): string {
  const q = question.toLowerCase();

  if (/^(hi|hello|hey)\b/.test(q) && q.length < 20) {
    return "Hi! Ask me about your things, your worth, your milestones, or your wishlist. I can only answer from what you've actually recorded.";
  }
  if (/(most valuable|highest value|biggest thing|most expensive)/.test(q)) return describeHighestValueItem(context);
  if (/(how many|number of).*(thing|item)/.test(q)) {
    return `You have ${context.items.length} recorded thing${context.items.length === 1 ? '' : 's'}.`;
  }
  if (/(net worth|total worth|my worth|worth\b)/.test(q)) return describeWorth(context);
  if (/(how long|since when|when did i (join|start))/.test(q)) return describeTenure(context);
  if (/wishlist/.test(q)) return describeWishlist(context);
  if (/\bgoal/.test(q)) return describeGoals(context);
  if (/(milestone|achieve)/.test(q)) return describeMilestones(context);
  if (/(what did i add|added).*(month|week|recently|lately)/.test(q)) return describeRecentlyAdded(context);

  const category = findMentionedCategory(q);
  if (category) return describeCategory(context, category);

  return "I don't have a way to answer that from what's recorded yet. Try asking about your total worth, your things, your milestones, or your wishlist.";
}
