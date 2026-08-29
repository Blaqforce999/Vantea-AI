import type { Prisma } from '@prisma/client';

/** A Prisma client bound to an in-flight transaction, as passed to db.$transaction callbacks. */
export type PrismaTx = Prisma.TransactionClient;

/** The shape the AI layer parses a conversational add/edit into, before zod validation. */
export type ParsedItemDraft = {
  name: string;
  category: string;
  value?: number;
  currency?: string;
  acquiredDate?: string;
  whyNote?: string;
};

export type CurrencyTotal = {
  currency: string;
  total: string; // Decimal serialized as a string — never pass Decimal instances to client components.
  itemCount: number;
};
