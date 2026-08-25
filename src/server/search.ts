import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/geo";
import { sortOrganic } from "@/lib/ranking";
import { computePositions } from "@/server/markets";
import type { Prisma } from "@prisma/client";

export type ResultClinic = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  address: string;
  cityName: string;
  citySlug: string;
  phone: string;
  whatsapp: string | null;
  website: string | null;
  verified: boolean;
  dentalRankScore: number;
  externalRating: number | null;
  externalReviewCount: number;
  firstVisitFree: boolean;
  financing: boolean;
  emergency24h: boolean;
  lat: number;
  lng: number;
  distanceKm: number | null;
  priceFromCents: number | null;
  highlights: string[];
  sponsored: boolean;
  position: number | null;
};

const clinicSelect = {
  id: true,
  slug: true,
  name: true,
  logoUrl: true,
  coverUrl: true,
  address: true,
  phone: true,
  whatsapp: true,
  website: true,
  verificationStatus: true,
  dentalRankScore: true,
  externalRating: true,
  externalReviewCount: true,
  firstVisitFree: true,
  financing: true,
  emergency24h: true,
  lat: true,
  lng: true,
  city: { select: { name: true, slug: true } },
  treatments: {
    select: {
      priceFromCents: true,
      treatment: { select: { id: true, slug: true, shortName: true, name: true } },
    },
  },
} satisfies Prisma.ClinicSelect;

type ClinicRow = Prisma.ClinicGetPayload<{ select: typeof clinicSelect }>;

function toResult(
  clinic: ClinicRow,
  opts: {
    treatmentId?: string;
    origin?: { lat: number; lng: number } | null;
    sponsored?: boolean;
    position?: number | null;
  },
): ResultClinic {
  const match = opts.treatmentId
    ? clinic.treatments.find((t) => t.treatment.id === opts.treatmentId)
    : undefined;

  return {
    id: clinic.id,
    slug: clinic.slug,
    name: clinic.name,
    logoUrl: clinic.logoUrl,
    coverUrl: clinic.coverUrl,
    address: clinic.address,
    cityName: clinic.city.name,
    citySlug: clinic.city.slug,
    phone: clinic.phone,
    whatsapp: clinic.whatsapp,
    website: clinic.website,
    verified: clinic.verificationStatus === "VERIFIED",
    dentalRankScore: clinic.dentalRankScore,
    externalRating: clinic.externalRating,
    externalReviewCount: clinic.externalReviewCount,
    firstVisitFree: clinic.firstVisitFree,
    financing: clinic.financing,
    emergency24h: clinic.emergency24h,
    lat: clinic.lat,
    lng: clinic.lng,
    distanceKm: opts.origin ? haversineKm(opts.origin, { lat: clinic.lat, lng: clinic.lng }) : null,
    priceFromCents: match?.priceFromCents ?? null,
    highlights: clinic.treatments
      .slice(0, 4)
      .map((t) => t.treatment.shortName ?? t.treatment.name),
    sponsored: Boolean(opts.sponsored),
    position: opts.position ?? null,
  };
}

export type SearchOutcome = {
  sponsored: ResultClinic[];
  organic: ResultClinic[];
  total: number;
  marketId: string | null;
};

/**
 * Resultados para tratamiento × municipio.
 * Las posiciones patrocinadas se calculan en servidor y se devuelven SEPARADAS
 * de los resultados orgánicos: nunca se mezclan en una única lista sin etiquetar.
 */
export async function searchByTreatmentAndCity(
  treatmentId: string,
  cityId: string,
  origin: { lat: number; lng: number } | null,
): Promise<SearchOutcome> {
  const market = await prisma.auctionMarket.findUnique({
    where: { treatmentId_cityId: { treatmentId, cityId } },
    select: { id: true, status: true },
  });

  const ranked = market?.status === "ACTIVE" ? await computePositions(market.id) : [];
  const sponsoredIds = ranked.map((r) => r.clinicId);

  const clinics = await prisma.clinic.findMany({
    where: {
      status: "PUBLISHED",
      cityId,
      treatments: { some: { treatmentId } },
    },
    select: clinicSelect,
  });

  const byId = new Map(clinics.map((c) => [c.id, c]));

  const sponsored = ranked
    .map((r) => {
      const clinic = byId.get(r.clinicId);
      if (!clinic) return null;
      return toResult(clinic, {
        treatmentId,
        origin,
        sponsored: true,
        position: r.position,
      });
    })
    .filter((c): c is ResultClinic => c !== null);

  const organicRaw = clinics
    .filter((c) => !sponsoredIds.includes(c.id))
    .map((c) => toResult(c, { treatmentId, origin }));

  const organic = sortOrganic(
    organicRaw.map((c) => ({
      id: c.id,
      dentalRankScore: c.dentalRankScore,
      distanceKm: c.distanceKm,
      verified: c.verified,
      externalRating: c.externalRating,
      externalReviewCount: c.externalReviewCount,
    })),
  )
    .map((s) => organicRaw.find((c) => c.id === s.id))
    .filter((c): c is ResultClinic => Boolean(c));

  return {
    sponsored,
    organic,
    total: sponsored.length + organic.length,
    marketId: market?.id ?? null,
  };
}

/** Listado de todas las clínicas publicadas de un municipio. */
export async function clinicsInCity(
  cityId: string,
  origin: { lat: number; lng: number } | null,
): Promise<ResultClinic[]> {
  const clinics = await prisma.clinic.findMany({
    where: { status: "PUBLISHED", cityId },
    select: clinicSelect,
  });
  const mapped = clinics.map((c) => toResult(c, { origin }));
  return sortOrganic(
    mapped.map((c) => ({
      id: c.id,
      dentalRankScore: c.dentalRankScore,
      distanceKm: c.distanceKm,
      verified: c.verified,
      externalRating: c.externalRating,
      externalReviewCount: c.externalReviewCount,
    })),
  )
    .map((s) => mapped.find((c) => c.id === s.id))
    .filter((c): c is ResultClinic => Boolean(c));
}
