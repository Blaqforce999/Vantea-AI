/**
 * Symbol-first currency formatting (₦3,650,000) for the redesigned dashboard
 * surfaces. Kept separate from the plain `Number(x).toLocaleString()` calls
 * already used on /worth and /timeline — changing those would be an
 * unrelated visual change to pages this overhaul intentionally leaves alone.
 *
 * Intl.NumberFormat needs a locale that actually maps to the currency's
 * short symbol — under the default (effectively en-US) locale it silently
 * renders the ISO code instead of a symbol for anything that isn't a small
 * set of Western currencies (confirmed: `new
 * Intl.NumberFormat(undefined, {style:'currency', currency:'NGN'})` prints
 * "NGN 3,650,000", not "₦3,650,000" — only passing 'en-NG' gets the symbol).
 * This is not the same failure mode as an invalid/unsupported currency code
 * (that throws, handled by the catch below) — it's Intl silently doing the
 * wrong thing for a *valid* code under the wrong locale, so the fix is
 * picking the right locale per currency, not just trapping errors.
 */
const CURRENCY_LOCALES: Record<string, string> = {
  NGN: 'en-NG',
  USD: 'en-US',
  GBP: 'en-GB',
  EUR: 'de-DE',
  CAD: 'en-CA',
  GHS: 'en-GH',
  KES: 'en-KE',
  ZAR: 'en-ZA',
};

export function formatMoney(value: string | number, currency: string): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  const locale = CURRENCY_LOCALES[currency];
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Unknown/invalid ISO currency code — fall back rather than throw.
    return `${currency} ${amount.toLocaleString()}`;
  }
}
