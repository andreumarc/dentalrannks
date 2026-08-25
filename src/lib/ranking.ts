/**
 * Ordenación de resultados. Dos escalas SEPARADAS por diseño:
 *
 *  1. Posición patrocinada  → la determina la puja. Se etiqueta siempre como PATROCINADO.
 *  2. DentalRank Score      → señal editorial/de datos. NO depende del dinero pagado.
 *
 * Nunca se mezclan: el dinero no puede presentarse como calidad clínica.
 */

export type BidLike = {
  clinicId: string;
  bidId: string;
  amountCents: number;
  reachedAmountAt: Date;
  status: string;
};

export type RankedBid = BidLike & { position: number };

/**
 * Orden canónico de las posiciones patrocinadas.
 * Importe descendente; a igualdad de importe, gana quien lo alcanzó antes.
 * Este cálculo vive SIEMPRE en el servidor.
 */
export function rankBids(bids: BidLike[], slots?: number): RankedBid[] {
  const eligible = bids
    .filter((b) => b.status === "ACTIVE" && b.amountCents > 0)
    .sort((a, b) => {
      if (b.amountCents !== a.amountCents) return b.amountCents - a.amountCents;
      const ta = a.reachedAmountAt.getTime();
      const tb = b.reachedAmountAt.getTime();
      if (ta !== tb) return ta - tb;
      return a.clinicId.localeCompare(b.clinicId);
    });

  const limited = typeof slots === "number" ? eligible.slice(0, slots) : eligible;
  return limited.map((b, i) => ({ ...b, position: i + 1 }));
}

/**
 * Importe total necesario para alcanzar una posición objetivo, y diferencia a pagar.
 * Devuelve null si la clínica ya ocupa esa posición o mejor.
 */
export function outbidQuote(
  ranked: RankedBid[],
  clinicId: string,
  targetPosition: number,
  incrementCents: number,
): { requiredTotalCents: number; payNowCents: number; currentCents: number } | null {
  const current = ranked.find((r) => r.clinicId === clinicId);
  const currentCents = current?.amountCents ?? 0;
  const currentPosition = current?.position ?? Number.POSITIVE_INFINITY;
  if (currentPosition <= targetPosition) return null;

  const others = ranked.filter((r) => r.clinicId !== clinicId);
  const occupant = others[targetPosition - 1];
  const requiredTotalCents = occupant
    ? occupant.amountCents + incrementCents
    : Math.max(incrementCents, currentCents + incrementCents);

  return {
    requiredTotalCents,
    payNowCents: Math.max(0, requiredTotalCents - currentCents),
    currentCents,
  };
}

export type OrganicClinic = {
  id: string;
  dentalRankScore: number;
  distanceKm: number | null;
  verified: boolean;
  externalRating: number | null;
  externalReviewCount: number;
};

/**
 * Orden de los resultados NO patrocinados.
 * Prioriza verificación, después score, después proximidad. El dinero no interviene.
 */
export function sortOrganic(clinics: OrganicClinic[]): OrganicClinic[] {
  return [...clinics].sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    if (b.dentalRankScore !== a.dentalRankScore) return b.dentalRankScore - a.dentalRankScore;
    const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
    const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    return (b.externalRating ?? 0) - (a.externalRating ?? 0);
  });
}
