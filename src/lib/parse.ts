/** Coercion helpers for untrusted JSON request bodies. */

export function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Non-negative integer, or null when absent/invalid. */
export function parseNullableInt(value: unknown): number | null {
  const n = parseNullableNumber(value);
  if (n == null) return null;
  return Math.max(0, Math.round(n));
}

export function parseString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Integer quantity of at least 1 (defaults to 1 when absent or invalid). */
export function parseQuantity(value: unknown): number {
  const n = parseNullableInt(value);
  return n != null && n >= 1 ? n : 1;
}
