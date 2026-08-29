import { subDays, subMonths, subWeeks, subYears } from 'date-fns';
import { Category } from '@prisma/client';

/**
 * A local, deterministic stand-in for what used to be an Anthropic call —
 * no API key, no network request, no third-party dependency. Pulls a
 * structured item record out of free text using regexes and keyword
 * matching. This is intentionally a "demo agent," not a real language
 * model: it covers common phrasing well (digits or spelled-out numbers,
 * common currency symbols/codes, simple relative dates, a keyword-based
 * category guess) but will miss genuinely unusual phrasing — that ceiling
 * is a known, accepted tradeoff, not a bug to chase indefinitely.
 */

export type ParsedItem = {
  name: string;
  category: Category;
  value?: number;
  currency?: string;
  acquiredDate?: string; // YYYY-MM-DD
  whyNote?: string;
};

export type ParseResult = { type: 'item'; item: ParsedItem } | { type: 'reply'; message: string };

// ---------------------------------------------------------------------------
// Greetings / filler — stripped off the front before looking for an item.
// ---------------------------------------------------------------------------

const GREETING_WORDS = [
  'hi',
  'hello',
  'hey',
  'yo',
  'good morning',
  'good afternoon',
  'good evening',
  'how are you',
  'how are you doing',
  "how's it going",
  'how is it going',
  "what's up",
  'okay',
  'ok',
  'so',
  'well',
  'um',
  'uh',
  'like',
  'anyhow',
  'anyway',
];

// Longest-first so a specific phrase ("how are you doing") is tried before
// a shorter phrase that happens to be its own prefix ("how are you") —
// otherwise the shorter one matches first and leaves a dangling fragment
// ("doing?") that then gets mistaken for the start of an item name.
const GREETING_WORDS_BY_LENGTH = [...GREETING_WORDS].sort((a, b) => b.length - a.length);

function stripFiller(text: string): string {
  let result = text.trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const phrase of GREETING_WORDS_BY_LENGTH) {
      // \b after the phrase is required — without it, a short filler word
      // like "so" matches as a bare prefix of an unrelated word ("sold" ->
      // "so" + "ld"), silently mangling real content.
      const re = new RegExp(`^${phrase}\\b[,.!?]*\\s*`, 'i');
      const next = result.replace(re, '').trim();
      if (next !== result) {
        result = next;
        changed = true;
        break;
      }
    }
  }
  return result;
}

function looksLikeGreeting(text: string): boolean {
  const lower = text.trim().toLowerCase();
  if (!lower) return false;
  return GREETING_WORDS.some((phrase) => lower === phrase || lower.startsWith(`${phrase} `) || lower.startsWith(`${phrase},`));
}

// ---------------------------------------------------------------------------
// Amount + currency extraction
// ---------------------------------------------------------------------------

const SCALE_WORDS: Record<string, number> = {
  k: 1_000,
  thousand: 1_000,
  m: 1_000_000,
  million: 1_000_000,
  b: 1_000_000_000,
  billion: 1_000_000_000,
};

const CURRENCY_SYMBOLS: Record<string, string> = { '₦': 'NGN', $: 'USD', '£': 'GBP', '€': 'EUR' };

const CURRENCY_WORDS: Record<string, string> = {
  ngn: 'NGN',
  naira: 'NGN',
  usd: 'USD',
  dollar: 'USD',
  dollars: 'USD',
  gbp: 'GBP',
  pound: 'GBP',
  pounds: 'GBP',
  eur: 'EUR',
  euro: 'EUR',
  euros: 'EUR',
  ghs: 'GHS',
  cedis: 'GHS',
  kes: 'KES',
  shillings: 'KES',
  zar: 'ZAR',
  rand: 'ZAR',
};

const UNITS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};
const NUMBER_WORD_RE = new RegExp(
  `\\b(${[...Object.keys(UNITS), ...Object.keys(TENS), 'hundred', 'thousand', 'million', 'billion', 'and'].join('|')})\\b`,
  'gi',
);

function wordsToNumber(words: string[]): number | null {
  let total = 0;
  let current = 0;
  let matched = false;

  for (const raw of words) {
    const w = raw.toLowerCase();
    if (w === 'and') continue;
    if (w in UNITS) {
      current += UNITS[w];
      matched = true;
    } else if (w in TENS) {
      current += TENS[w];
      matched = true;
    } else if (w === 'hundred') {
      current = (current || 1) * 100;
      matched = true;
    } else if (w === 'thousand' || w === 'million' || w === 'billion') {
      total += (current || 1) * SCALE_WORDS[w];
      current = 0;
      matched = true;
    }
  }

  total += current;
  return matched ? total : null;
}

/** Finds the single longest run of consecutive number-words in the text. */
function findWordNumber(text: string): { value: number; index: number; length: number } | null {
  const matches = [...text.matchAll(NUMBER_WORD_RE)];
  if (matches.length === 0) return null;

  let runStart = 0;
  let best: { value: number; index: number; length: number } | null = null;

  for (let i = 0; i < matches.length; i++) {
    const isLast = i === matches.length - 1;
    const gapToNext = isLast ? null : matches[i + 1].index! - (matches[i].index! + matches[i][0].length);
    const breaksRun = isLast || gapToNext === null || gapToNext > 1; // more than a single space between words breaks the run

    if (breaksRun) {
      const run = matches.slice(runStart, i + 1);
      const value = wordsToNumber(run.map((m) => m[0]));
      if (value !== null) {
        const first = run[0];
        const lastMatch = run[run.length - 1];
        const length = lastMatch.index! + lastMatch[0].length - first.index!;
        if (!best || length > best.length) best = { value, index: first.index!, length };
      }
      runStart = i + 1;
    }
  }

  return best;
}

function resolveCurrency(symbol?: string, word?: string): string | undefined {
  if (symbol && CURRENCY_SYMBOLS[symbol]) return CURRENCY_SYMBOLS[symbol];
  if (word && CURRENCY_WORDS[word.toLowerCase()]) return CURRENCY_WORDS[word.toLowerCase()];
  return undefined;
}

// The digit group is deliberately permissive about comma placement
// ([\d,]+, not a strict \d{1,3}(?:,\d{3})+ grouping) — real people mistype
// separators ("3,500000" meaning 3,500,000), and commas are stripped before
// parsing anyway, so validating "proper" grouping only rejects input a
// human would still read correctly.
const DIGIT_AMOUNT_RE =
  /(₦|\$|£|€)?\s?(\d[\d,]*(?:\.\d+)?)\s*(thousand|million|billion|k|m|b)?\s*(ngn|naira|usd|dollars?|gbp|pounds?|eur|euros?|ghs|cedis|kes|shillings|zar|rand)?/i;

type AmountMatch = { value: number; currency?: string; index: number; length: number };

function findAmount(text: string): AmountMatch | null {
  const digitMatch = text.match(DIGIT_AMOUNT_RE);
  if (digitMatch && digitMatch[2] && digitMatch.index !== undefined) {
    const value = Number(digitMatch[2].replace(/,/g, '')) * (digitMatch[3] ? SCALE_WORDS[digitMatch[3].toLowerCase()] : 1);
    if (!Number.isNaN(value) && value > 0) {
      return {
        value,
        currency: resolveCurrency(digitMatch[1], digitMatch[4]),
        index: digitMatch.index,
        length: digitMatch[0].length,
      };
    }
  }

  const wordMatch = findWordNumber(text);
  if (wordMatch) {
    // Look for a currency symbol/word immediately around the word-number span.
    const before = text.slice(Math.max(0, wordMatch.index - 2), wordMatch.index);
    const after = text.slice(wordMatch.index + wordMatch.length, wordMatch.index + wordMatch.length + 12);
    const symbol = Object.keys(CURRENCY_SYMBOLS).find((s) => before.includes(s));
    const wordCurrencyMatch = after.match(/^\s*(ngn|naira|usd|dollars?|gbp|pounds?|eur|euros?|ghs|cedis|kes|shillings|zar|rand)/i);
    return {
      value: wordMatch.value,
      currency: resolveCurrency(symbol, wordCurrencyMatch?.[1]),
      index: wordMatch.index,
      length: wordMatch.length,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Category guessing
// ---------------------------------------------------------------------------

export const CATEGORY_KEYWORDS: [Category, string[]][] = [
  [Category.HOME_AND_LAND, ['land', 'house', 'apartment', 'plot', 'property', 'flat', 'home', 'duplex', 'bungalow']],
  [Category.CARS_AND_VEHICLES, ['car', 'vehicle', 'bike', 'motorcycle', 'truck', 'jeep', 'suv', 'bus', 'keke']],
  [
    Category.TECH,
    ['laptop', 'macbook', 'phone', 'iphone', 'computer', 'pc', 'camera', 'tv', 'television', 'tablet', 'ipad', 'monitor', 'console', 'playstation', 'headphones'],
  ],
  [Category.MONEY, ['savings', 'cash', 'fund', 'bank account', 'jar', 'investment']],
  [Category.JEWELRY_AND_LUXURY, ['chain', 'gold', 'jewelry', 'jewellery', 'watch', 'necklace', 'bracelet', 'ring', 'earrings', 'diamond']],
  [Category.BUSINESS, ['business', 'shop', 'store', 'company', 'startup', 'brand']],
  [Category.COLLECTIONS, ['collection', 'vinyl', 'cards', 'sneakers', 'art', 'painting', 'antique']],
  [Category.SKILLS, ['skill', 'course', 'certification', 'certificate', 'degree', 'diploma', 'learned', 'training']],
  [Category.PLACES, ['trip', 'visited', 'travel', 'vacation', 'holiday']],
];

function guessCategory(text: string): Category {
  const lower = text.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return Category.OTHER;
}

// ---------------------------------------------------------------------------
// Item name extraction
// ---------------------------------------------------------------------------

const ACQUISITION_VERBS = ['bought', 'purchased', 'got', 'acquired', 'saved', 'built', 'made', 'earned', 'received', 'saved up for'];

function extractName(text: string, amountSpan: { index: number; length: number } | null): string | null {
  const verbRe = new RegExp(`\\b(?:${ACQUISITION_VERBS.join('|')})\\b\\s*(?:a|an|the)?\\s*`, 'i');
  const verbMatch = text.match(verbRe);

  // No acquisition verb ("bought"/"got"/etc.) and no amount mentioned means
  // there's no real signal this is about an item at all — plain chit-chat
  // like "what a nice day" would otherwise get swallowed whole as a
  // fabricated item name. Bail out to the conversational-reply path instead.
  if (!verbMatch && !amountSpan) return null;

  let start = 0;
  if (verbMatch && verbMatch.index !== undefined) {
    start = verbMatch.index + verbMatch[0].length;
  }

  let end = amountSpan && amountSpan.index >= start ? amountSpan.index : text.length;

  // Cut off at connecting words/clauses between the name and the
  // price/reason ("for", "worth", "at", "because", "it's five million").
  const boundaryRe = /\b(for|worth|at|because|since|last|yesterday|today|ago|it's|it is|that's|thats|which is)\b/i;
  const remainder = text.slice(start, end);
  const boundaryMatch = remainder.match(boundaryRe);
  if (boundaryMatch && boundaryMatch.index !== undefined) {
    end = start + boundaryMatch.index;
  }

  // A comma almost always separates the item name from a trailing clause
  // ("laptop, it's five million" / "laptop, bought it last week") — cut
  // there too, whichever boundary comes first.
  const commaIndex = text.slice(start, end).indexOf(',');
  if (commaIndex !== -1) {
    end = Math.min(end, start + commaIndex);
  }

  const name = text
    .slice(start, end)
    .replace(/[,.!?]+$/, '')
    .trim();

  if (!name || name.length < 2) return null;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// ---------------------------------------------------------------------------
// Date extraction
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function extractDate(text: string, now: Date): string | undefined {
  const lower = text.toLowerCase();

  if (/\btoday\b/.test(lower)) return toIsoDate(now);
  if (/\byesterday\b/.test(lower)) return toIsoDate(subDays(now, 1));
  if (/\blast week\b/.test(lower)) return toIsoDate(subWeeks(now, 1));
  if (/\blast month\b/.test(lower)) return toIsoDate(subMonths(now, 1));
  if (/\blast year\b/.test(lower)) return toIsoDate(subYears(now, 1));

  const agoMatch = lower.match(/(\d+)\s+(day|week|month|year)s?\s+ago/);
  if (agoMatch) {
    const amount = Number(agoMatch[1]);
    const unit = agoMatch[2];
    if (unit === 'day') return toIsoDate(subDays(now, amount));
    if (unit === 'week') return toIsoDate(subWeeks(now, amount));
    if (unit === 'month') return toIsoDate(subMonths(now, amount));
    if (unit === 'year') return toIsoDate(subYears(now, amount));
  }

  const monthRe = new RegExp(`\\b(${MONTH_NAMES.join('|')})\\b(?:\\s+(\\d{4}))?`, 'i');
  const monthMatch = lower.match(monthRe);
  if (monthMatch) {
    const monthIndex = MONTH_NAMES.indexOf(monthMatch[1].toLowerCase());
    const year = monthMatch[2] ? Number(monthMatch[2]) : now.getFullYear();
    return toIsoDate(new Date(Date.UTC(year, monthIndex, 1)));
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Why-note extraction
// ---------------------------------------------------------------------------

function extractWhyNote(text: string): string | undefined {
  const match = text.match(/\bbecause\s+(.+?)([.!?]|$)/i);
  if (!match) return undefined;
  const note = match[1].trim();
  return note.length > 0 ? note : undefined;
}

// ---------------------------------------------------------------------------
// Conversational fallback replies (no item found)
// ---------------------------------------------------------------------------

const GREETING_REPLIES = [
  "Hey! I'm here whenever you want to add something you've built, bought, or acquired.",
  "Hi there! Tell me about something you've got, and I'll add it to your things.",
];

const NO_MATCH_REPLIES = [
  'I didn\'t catch anything to add there. Try something like "I bought a new laptop for 500k."',
  "Not sure what to record from that yet. Describe what you got and, if you know it, what it was worth.",
];

function pick(replies: string[]): string {
  return replies[Math.floor(Math.random() * replies.length)];
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export function parseItemLocally(rawText: string, now: Date = new Date()): ParseResult {
  const text = stripFiller(rawText);

  if (!text) {
    return { type: 'reply', message: pick(GREETING_REPLIES) };
  }

  const amount = findAmount(text);
  const name = extractName(text, amount ? { index: amount.index, length: amount.length } : null);

  if (!name) {
    if (looksLikeGreeting(rawText)) {
      return { type: 'reply', message: pick(GREETING_REPLIES) };
    }
    return { type: 'reply', message: pick(NO_MATCH_REPLIES) };
  }

  const item: ParsedItem = {
    name,
    category: guessCategory(text),
    value: amount?.value,
    // Naira only, per product decision — every account's baseCurrency is
    // NGN and there's no UI anywhere to pick a different one, so a stated
    // value with no explicit currency word defaults to NGN rather than
    // being left undefined. Leaving it undefined would silently exclude the
    // item from every worth total (getCurrentWorthByCurrency filters
    // `currency: { not: null }`), which is worse than assuming NGN.
    currency: amount?.value !== undefined ? (amount.currency ?? 'NGN') : undefined,
    acquiredDate: extractDate(text, now),
    whyNote: extractWhyNote(text),
  };

  return { type: 'item', item };
}
