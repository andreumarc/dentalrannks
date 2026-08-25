import { prisma } from "@/lib/prisma";
import { rankBids, outbidQuote, type RankedBid } from "@/lib/ranking";

/**
 * Cálculo de posiciones patrocinadas. SIEMPRE en servidor.
 * El cliente jamás decide el orden.
 */
export async function computePositions(marketId: string): Promise<RankedBid[]> {
  const market = await prisma.auctionMarket.findUnique({
    where: { id: marketId },
    select: { sponsoredSlots: true, status: true },
  });
  if (!market || market.status !== "ACTIVE") return [];

  const bids = await prisma.bid.findMany({
    where: { marketId, status: "ACTIVE", amountCents: { gt: 0 } },
    select: {
      id: true,
      clinicId: true,
      amountCents: true,
      reachedAmountAt: true,
      status: true,
      clinic: { select: { status: true } },
    },
  });

  const eligible = bids
    .filter((b) => b.clinic.status === "PUBLISHED")
    .map((b) => ({
      bidId: b.id,
      clinicId: b.clinicId,
      amountCents: b.amountCents,
      reachedAmountAt: b.reachedAmountAt,
      status: b.status,
    }));

  return rankBids(eligible, market.sponsoredSlots);
}

/** Persiste la instantánea de posiciones para poder auditar y mostrar histórico. */
export async function persistPositions(marketId: string) {
  const ranked = await computePositions(marketId);
  await prisma.$transaction([
    prisma.sponsoredPosition.deleteMany({ where: { marketId } }),
    ...ranked.map((r) =>
      prisma.sponsoredPosition.create({
        data: {
          marketId,
          clinicId: r.clinicId,
          bidId: r.bidId,
          position: r.position,
          amountCents: r.amountCents,
        },
      }),
    ),
  ]);
  return ranked;
}

export async function getOutbidQuote(marketId: string, clinicId: string, targetPosition: number) {
  const [market, ranked] = await Promise.all([
    prisma.auctionMarket.findUnique({
      where: { id: marketId },
      select: { bidIncrementCents: true, minimumBidCents: true },
    }),
    computePositions(marketId),
  ]);
  if (!market) return null;

  const quote = outbidQuote(ranked, clinicId, targetPosition, market.bidIncrementCents);
  if (!quote) return null;

  return {
    ...quote,
    requiredTotalCents: Math.max(quote.requiredTotalCents, market.minimumBidCents),
    payNowCents: Math.max(
      quote.payNowCents,
      market.minimumBidCents - quote.currentCents > 0
        ? market.minimumBidCents - quote.currentCents
        : quote.payNowCents,
    ),
  };
}

/** Métricas agregadas de un mercado. Solo se publican con volumen suficiente. */
export const MIN_MARKET_SAMPLE = 4;

export async function marketInsights(marketId: string) {
  const [bids, clicks, leads, market] = await Promise.all([
    prisma.bid.findMany({
      where: { marketId, status: "ACTIVE", amountCents: { gt: 0 } },
      select: { amountCents: true },
    }),
    prisma.click.count({ where: { marketId, valid: true } }),
    prisma.lead.findMany({
      where: { marketId, quality: { in: ["VALID", "UNREVIEWED"] } },
      select: { priceCents: true },
    }),
    prisma.auctionMarket.findUnique({
      where: { id: marketId },
      select: { minimumBidCents: true, sponsoredSlots: true },
    }),
  ]);

  const amounts = bids.map((b) => b.amountCents).sort((a, b) => b - a);
  const enoughSample = amounts.length >= MIN_MARKET_SAMPLE;
  const leadSpend = leads.reduce((s, l) => s + l.priceCents, 0);

  return {
    sponsoredClinics: amounts.length,
    sponsoredSlots: market?.sponsoredSlots ?? 3,
    minimumBidCents: market?.minimumBidCents ?? 0,
    enoughSample,
    averageBidCents: enoughSample
      ? Math.round(amounts.reduce((s, a) => s + a, 0) / amounts.length)
      : null,
    topBidCents: enoughSample ? (amounts[0] ?? null) : null,
    clicks: enoughSample ? clicks : null,
    leads: enoughSample ? leads.length : null,
    averageCplCents:
      enoughSample && leads.length > 0 ? Math.round(leadSpend / leads.length) : null,
  };
}

/** Crea (si no existe) el mercado tratamiento×municipio. */
export async function ensureMarket(treatmentId: string, cityId: string) {
  return prisma.auctionMarket.upsert({
    where: { treatmentId_cityId: { treatmentId, cityId } },
    create: { treatmentId, cityId },
    update: {},
  });
}
