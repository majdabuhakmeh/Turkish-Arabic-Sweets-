import type { Locale } from "@/context/i18n";

/** Format a price in the storefront's fixed currency (NIS / شيكل). */
export function formatPrice(amount: number | string | null | undefined, locale: Locale) {
  const n = amount == null ? 0 : Number(amount);
  const value = (Number.isFinite(n) ? n : 0).toFixed(2);
  return locale === "ar" ? `${value} شيكل` : `${value} NIS`;
}

/**
 * Format a monetary amount in the given ISO currency code.
 * Falls back to "SAR" so we never render a bare number.
 */
export function formatCurrency(amount: number | string | null | undefined, code: string | null | undefined = "SAR") {
  const n = amount == null ? 0 : Number(amount);
  const c = (code || "SAR").toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: c,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(n) ? n : 0);
  } catch {
    return `${(Number.isFinite(n) ? n : 0).toFixed(2)} ${c}`;
  }
}
