/**
 * Todo el dinero de DentalRank se representa en céntimos de euro como enteros.
 * Nunca usar Float para importes.
 */

const EUR = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const EUR_COMPACT = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCents(cents: number): string {
  return EUR.format(cents / 100);
}

/** Formato sin decimales, para importes redondos de puja o saldo. */
export function formatCentsCompact(cents: number): string {
  return cents % 100 === 0 ? EUR_COMPACT.format(cents / 100) : formatCents(cents);
}


export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

export function centsToEuros(cents: number): number {
  return Math.round(cents) / 100;
}

/** Coste por lead: gasto / leads válidos. Devuelve null si no hay leads. */
export function cpl(spendCents: number, validLeads: number): number | null {
  if (validLeads <= 0) return null;
  return Math.round(spendCents / validLeads);
}

/** Coste por clic: gasto / clics válidos. */
export function cpc(spendCents: number, validClicks: number): number | null {
  if (validClicks <= 0) return null;
  return Math.round(spendCents / validClicks);
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-ES").format(value);
}
