/** Shared formatting helpers. Currency is fixed to EUR for this app. */

const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

export function formatEUR(value: number): string {
  return eur.format(value);
}

const dateLong = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const dateShort = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function parseISO(iso: string): Date {
  // Treat plain YYYY-MM-DD as a local date (no timezone shift).
  return new Date(`${iso.slice(0, 10)}T00:00:00`);
}

export function formatDateLong(iso: string): string {
  return dateLong.format(parseISO(iso));
}

export function formatDateShort(iso: string): string {
  return dateShort.format(parseISO(iso));
}

/** Returns a YYYY-MM-DD string `days` after the given date. */
export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Today as YYYY-MM-DD in local time. */
export function todayISO(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
