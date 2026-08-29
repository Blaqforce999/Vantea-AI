import {
  Briefcase,
  Car,
  Gem,
  GraduationCap,
  Home,
  Laptop,
  Layers,
  MapPin,
  Users,
  Wallet,
  Box,
  type LucideIcon,
} from 'lucide-react';

import { Category, MilestoneType } from '@prisma/client';

export const CATEGORY_LABELS: Record<Category, string> = {
  HOME_AND_LAND: 'Home and Land',
  CARS_AND_VEHICLES: 'Cars and Vehicles',
  TECH: 'Tech',
  MONEY: 'Money',
  JEWELRY_AND_LUXURY: 'Jewelry and Luxury',
  BUSINESS: 'Business',
  COLLECTIONS: 'Collections',
  SKILLS: 'Skills',
  PLACES: 'Places',
  PEOPLE: 'People',
  OTHER: 'Other',
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

// Applied whenever a value is entered but no currency is given — matches
// User.baseCurrency's own schema default. Without this, a value can be
// saved with an empty currency, which silently hides the item's money line
// everywhere it's rendered (the render condition requires both).
export const DEFAULT_CURRENCY = 'NGN';

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  HOME_AND_LAND: Home,
  CARS_AND_VEHICLES: Car,
  TECH: Laptop,
  MONEY: Wallet,
  JEWELRY_AND_LUXURY: Gem,
  BUSINESS: Briefcase,
  COLLECTIONS: Layers,
  SKILLS: GraduationCap,
  PLACES: MapPin,
  PEOPLE: Users,
  OTHER: Box,
};

/**
 * One distinct pair per category — not a short cycle. The previous 4-role
 * cycle repeated every 4th category (HOME_AND_LAND and JEWELRY_AND_LUXURY
 * ended up identical, etc.), which is exactly what looked wrong. Every pair
 * below is still built only from existing primitive tokens already
 * generated in tokens/tokens.css (varying the tonal *step* within the
 * warm-ink/deep-teal/soft-slate ramps) — never `achievement`/gold or
 * `error`, which are reserved for milestones and destructive actions
 * respectively, not routine category chrome.
 */
export const CATEGORY_COLORS: Record<Category, { text: string; bg: string }> = {
  HOME_AND_LAND: { bg: 'bg-[var(--color-primitive-deep-teal-95)]', text: 'text-[var(--color-primitive-deep-teal-20)]' },
  CARS_AND_VEHICLES: { bg: 'bg-[var(--color-primitive-soft-slate-96)]', text: 'text-[var(--color-primitive-soft-slate-30)]' },
  TECH: { bg: 'bg-[var(--color-primitive-warm-ink-95)]', text: 'text-[var(--color-primitive-warm-ink-30)]' },
  MONEY: { bg: 'bg-[var(--color-primitive-deep-teal-90)]', text: 'text-[var(--color-primitive-deep-teal-10)]' },
  JEWELRY_AND_LUXURY: { bg: 'bg-[var(--color-primitive-soft-slate-90)]', text: 'text-[var(--color-primitive-soft-slate-20)]' },
  BUSINESS: { bg: 'bg-[var(--color-primitive-warm-ink-90)]', text: 'text-[var(--color-primitive-warm-ink-20)]' },
  COLLECTIONS: { bg: 'bg-[var(--color-primitive-deep-teal-80)]', text: 'text-[var(--color-primitive-deep-teal-10)]' },
  SKILLS: { bg: 'bg-[var(--color-primitive-soft-slate-80)]', text: 'text-[var(--color-primitive-soft-slate-10)]' },
  PLACES: { bg: 'bg-[var(--color-primitive-warm-ink-80)]', text: 'text-[var(--color-primitive-warm-ink-10)]' },
  PEOPLE: { bg: 'bg-[var(--color-primitive-deep-teal-70)]', text: 'text-[var(--color-primitive-deep-teal-10)]' },
  OTHER: { bg: 'bg-[var(--color-primitive-soft-slate-70)]', text: 'text-[var(--color-primitive-soft-slate-10)]' },
};

// Categories that are conventionally unvalued — the product still allows a
// value on any category, but these render gracefully with no number by
// default. See .agents/rules/architecture.md "Non-Valued Records".
export const UNVALUED_CATEGORIES: Category[] = [Category.SKILLS, Category.PLACES, Category.PEOPLE];

export const REVEAL_ITEM_THRESHOLD = 5;

// Celebratory but restrained — never framed as a financial reward. See
// .agents/rules/design-system.md "Milestones".
export const MILESTONE_LABELS: Record<MilestoneType, string> = {
  FIRST_THING: 'First thing',
  TEN_THINGS: 'Ten things',
  FIRST_PROPERTY: 'First property',
  CATEGORY_FILLED: 'Every category',
  NEW_HIGH: 'New high',
  ONE_YEAR: 'One year',
};

export const MILESTONE_DESCRIPTIONS: Record<MilestoneType, string> = {
  FIRST_THING: 'The start of your record. Everything builds from here.',
  TEN_THINGS: 'Ten things recorded. Your collection is taking shape.',
  FIRST_PROPERTY: 'Your first property is officially on the record.',
  CATEGORY_FILLED: "You've touched every category. That's the whole picture.",
  NEW_HIGH: 'Your recorded worth just reached a new high.',
  ONE_YEAR: 'A full year of building, all in one place.',
};
