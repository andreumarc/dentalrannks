import { describe, expect, it } from "vitest";
import { rankBids, outbidQuote, sortOrganic, type BidLike, type RankedBid, type OrganicClinic } from "./ranking";

function bid(overrides: Partial<BidLike> & Pick<BidLike, "clinicId">): BidLike {
  return {
    bidId: `bid-${overrides.clinicId}`,
    amountCents: 10_000,
    reachedAmountAt: new Date("2026-01-01T00:00:00Z"),
    status: "ACTIVE",
    ...overrides,
  };
}

describe("rankBids", () => {
  it("ordena por importe descendente", () => {
    const bids = [
      bid({ clinicId: "a", amountCents: 5_000 }),
      bid({ clinicId: "b", amountCents: 15_000 }),
      bid({ clinicId: "c", amountCents: 10_000 }),
    ];

    const ranked = rankBids(bids);

    expect(ranked.map((r) => r.clinicId)).toEqual(["b", "c", "a"]);
    expect(ranked.map((r) => r.position)).toEqual([1, 2, 3]);
  });

  it("desempata a favor de quien alcanzó el importe antes (reachedAmountAt ascendente)", () => {
    const bids = [
      bid({ clinicId: "later", amountCents: 10_000, reachedAmountAt: new Date("2026-01-05T00:00:00Z") }),
      bid({ clinicId: "earlier", amountCents: 10_000, reachedAmountAt: new Date("2026-01-01T00:00:00Z") }),
    ];

    const ranked = rankBids(bids);

    expect(ranked.map((r) => r.clinicId)).toEqual(["earlier", "later"]);
  });

  it("excluye pujas pausadas o canceladas", () => {
    const bids = [
      bid({ clinicId: "active", amountCents: 10_000, status: "ACTIVE" }),
      bid({ clinicId: "paused", amountCents: 20_000, status: "PAUSED" }),
      bid({ clinicId: "cancelled", amountCents: 30_000, status: "CANCELLED" }),
    ];

    const ranked = rankBids(bids);

    expect(ranked.map((r) => r.clinicId)).toEqual(["active"]);
  });

  it("excluye pujas de importe cero", () => {
    const bids = [
      bid({ clinicId: "zero", amountCents: 0 }),
      bid({ clinicId: "nonzero", amountCents: 5_000 }),
    ];

    const ranked = rankBids(bids);

    expect(ranked.map((r) => r.clinicId)).toEqual(["nonzero"]);
  });

  it("respeta el límite de sponsoredSlots", () => {
    const bids = [
      bid({ clinicId: "a", amountCents: 40_000 }),
      bid({ clinicId: "b", amountCents: 30_000 }),
      bid({ clinicId: "c", amountCents: 20_000 }),
      bid({ clinicId: "d", amountCents: 10_000 }),
    ];

    const ranked = rankBids(bids, 2);

    expect(ranked).toHaveLength(2);
    expect(ranked.map((r) => r.clinicId)).toEqual(["a", "b"]);
  });
});

describe("outbidQuote", () => {
  const increment = 1_000;

  function makeRanked(): RankedBid[] {
    return [
      { bidId: "b1", clinicId: "first", amountCents: 30_000, reachedAmountAt: new Date(), status: "ACTIVE", position: 1 },
      { bidId: "b2", clinicId: "second", amountCents: 20_000, reachedAmountAt: new Date(), status: "ACTIVE", position: 2 },
      { bidId: "b3", clinicId: "third", amountCents: 10_000, reachedAmountAt: new Date(), status: "ACTIVE", position: 3 },
    ];
  }

  it("devuelve null si la clínica ya ocupa la posición objetivo", () => {
    const ranked = makeRanked();
    expect(outbidQuote(ranked, "second", 2, increment)).toBeNull();
  });

  it("devuelve null si la clínica ya ocupa una posición mejor que la objetivo", () => {
    const ranked = makeRanked();
    expect(outbidQuote(ranked, "first", 2, increment)).toBeNull();
  });

  it("calcula el total requerido y el importe a pagar ahora para superar al ocupante", () => {
    const ranked = makeRanked();
    // "third" (10.000) quiere alcanzar la posición 2, ocupada por "second" (20.000).
    const quote = outbidQuote(ranked, "third", 2, increment);

    expect(quote).not.toBeNull();
    expect(quote!.requiredTotalCents).toBe(20_000 + increment);
    expect(quote!.payNowCents).toBe(20_000 + increment - 10_000);
    expect(quote!.currentCents).toBe(10_000);
  });

  it("calcula la cuota para una clínica sin puja previa (currentCents = 0)", () => {
    const ranked = makeRanked();
    const quote = outbidQuote(ranked, "newcomer", 3, increment);

    expect(quote).not.toBeNull();
    expect(quote!.currentCents).toBe(0);
    expect(quote!.requiredTotalCents).toBe(10_000 + increment);
    expect(quote!.payNowCents).toBe(10_000 + increment);
  });

  it("calcula el total mínimo cuando no hay ocupante por delante (primera posición libre)", () => {
    const ranked: RankedBid[] = [];
    const quote = outbidQuote(ranked, "newcomer", 1, increment);

    expect(quote).not.toBeNull();
    expect(quote!.requiredTotalCents).toBe(increment);
    expect(quote!.payNowCents).toBe(increment);
  });
});

describe("sortOrganic", () => {
  function clinic(overrides: Partial<OrganicClinic> & Pick<OrganicClinic, "id">): OrganicClinic {
    return {
      dentalRankScore: 50,
      distanceKm: 10,
      verified: false,
      externalRating: null,
      externalReviewCount: 0,
      ...overrides,
    };
  }

  it("prioriza las clínicas verificadas sobre las no verificadas", () => {
    const clinics = [
      clinic({ id: "unverified", verified: false, dentalRankScore: 95 }),
      clinic({ id: "verified", verified: true, dentalRankScore: 10 }),
    ];

    const sorted = sortOrganic(clinics);

    expect(sorted.map((c) => c.id)).toEqual(["verified", "unverified"]);
  });

  it("a igualdad de verificación, prioriza el DentalRank Score más alto", () => {
    const clinics = [
      clinic({ id: "low", verified: true, dentalRankScore: 40 }),
      clinic({ id: "high", verified: true, dentalRankScore: 80 }),
    ];

    const sorted = sortOrganic(clinics);

    expect(sorted.map((c) => c.id)).toEqual(["high", "low"]);
  });

  it("a igualdad de verificación y score, prioriza la distancia más corta", () => {
    const clinics = [
      clinic({ id: "far", verified: true, dentalRankScore: 60, distanceKm: 20 }),
      clinic({ id: "near", verified: true, dentalRankScore: 60, distanceKm: 2 }),
    ];

    const sorted = sortOrganic(clinics);

    expect(sorted.map((c) => c.id)).toEqual(["near", "far"]);
  });

  it("trata una distancia desconocida (null) como la peor opción", () => {
    const clinics = [
      clinic({ id: "unknown-distance", verified: true, dentalRankScore: 60, distanceKm: null }),
      clinic({ id: "known-distance", verified: true, dentalRankScore: 60, distanceKm: 500 }),
    ];

    const sorted = sortOrganic(clinics);

    expect(sorted.map((c) => c.id)).toEqual(["known-distance", "unknown-distance"]);
  });

  it("NUNCA usa el importe de la puja para ordenar: el dinero no interviene en sortOrganic", () => {
    // OrganicClinic no expone ningún campo de importe/puja: comprobamos que
    // enriquecer los datos con un importe de puja arbitrario (simulando lo
    // que haría un llamador malicioso o descuidado) no cambia el resultado,
    // porque sortOrganic solo lee verified/dentalRankScore/distanceKm/externalRating.
    type EnrichedClinic = OrganicClinic & { bidAmountCents: number };

    const highBidderLowScore: EnrichedClinic = {
      ...clinic({ id: "high-bidder", verified: true, dentalRankScore: 30, distanceKm: 5 }),
      bidAmountCents: 1_000_000,
    };
    const lowBidderHighScore: EnrichedClinic = {
      ...clinic({ id: "low-bidder", verified: true, dentalRankScore: 90, distanceKm: 5 }),
      bidAmountCents: 0,
    };

    const sorted = sortOrganic([highBidderLowScore, lowBidderHighScore]);

    // Gana la clínica con mejor score, a pesar de que la otra pagó mucho más.
    expect(sorted.map((c) => c.id)).toEqual(["low-bidder", "high-bidder"]);

    // Además, comprobamos que la función no lee la propiedad en absoluto:
    // invertir el importe de la puja sin tocar el resto de campos no altera
    // el orden ni un ápice.
    const swapped: EnrichedClinic[] = [
      { ...highBidderLowScore, bidAmountCents: 0 },
      { ...lowBidderHighScore, bidAmountCents: 1_000_000 },
    ];
    const sortedSwapped = sortOrganic(swapped);
    expect(sortedSwapped.map((c) => c.id)).toEqual(sorted.map((c) => c.id));
  });
});
