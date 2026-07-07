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
