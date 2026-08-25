import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/geo";

/**
 * Estadísticas reales para dar contenido propio a cada página del SEO
 * programático.
 *
 * La razón de existir de este módulo: una página de «implantes en Igualada»
 * que solo cambie dos palabras respecto a la de Barcelona es contenido pobre y
 * Google la trata como tal. Aquí se calculan cifras que **sí** son distintas en
 * cada combinación —cuántas clínicas, qué rango de precios declaran, cuántas
 * están verificadas, qué servicios ofrecen— y que además le sirven de verdad a
 * quien compara.
 *
 * Regla: nunca se inventa ni se estima. Si no hay muestra suficiente, se
 * devuelve `null` y la página dice que no hay datos suficientes.
 */

/** Por debajo de esta muestra no se publica un rango de precios agregado. */
export const MIN_PRICE_SAMPLE = 3;

export type PriceStats = {
  minCents: number;
  medianCents: number;
  maxCents: number;
  /** Cuántas clínicas han declarado precio. */
  sampleSize: number;
};

function priceStats(values: number[]): PriceStats | null {
  const clean = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (clean.length < MIN_PRICE_SAMPLE) return null;
  const mid = Math.floor(clean.length / 2);
  const median =
    clean.length % 2 === 0 ? Math.round((clean[mid - 1] + clean[mid]) / 2) : clean[mid];
  return {
    minCents: clean[0],
    medianCents: median,
    maxCents: clean[clean.length - 1],
    sampleSize: clean.length,
  };
}

export type ComboStats = {
  clinicCount: number;
  verifiedCount: number;
  price: PriceStats | null;
  /** Media de las valoraciones externas, solo si hay al menos tres clínicas con reseñas. */
  averageRating: number | null;
  ratedClinicCount: number;
  totalReviewCount: number;
  firstVisitFreeCount: number;
  financingCount: number;
  emergencyCount: number;
  /** Municipios distintos representados en los códigos postales de las clínicas. */
  postalCodes: string[];
};

/** Cifras de una combinación tratamiento × municipio. */
export const getComboStats = cache(
  async (treatmentId: string, cityId: string): Promise<ComboStats> => {
    const rows = await prisma.clinicTreatment.findMany({
      where: {
        treatmentId,
        clinic: { cityId, status: "PUBLISHED" },
      },
      select: {
        priceFromCents: true,
        clinic: {
          select: {
            verificationStatus: true,
            externalRating: true,
            externalReviewCount: true,
            firstVisitFree: true,
            financing: true,
            emergency24h: true,
            postalCode: true,
          },
        },
      },
    });

    const rated = rows.filter((r) => r.clinic.externalRating !== null);
    const totalReviewCount = rows.reduce((s, r) => s + r.clinic.externalReviewCount, 0);

    return {
      clinicCount: rows.length,
      verifiedCount: rows.filter((r) => r.clinic.verificationStatus === "VERIFIED").length,
      price: priceStats(rows.map((r) => r.priceFromCents ?? 0)),
      averageRating:
        rated.length >= MIN_PRICE_SAMPLE
          ? Math.round((rated.reduce((s, r) => s + (r.clinic.externalRating ?? 0), 0) / rated.length) * 10) / 10
          : null,
      ratedClinicCount: rated.length,
      totalReviewCount,
      firstVisitFreeCount: rows.filter((r) => r.clinic.firstVisitFree).length,
      financingCount: rows.filter((r) => r.clinic.financing).length,
      emergencyCount: rows.filter((r) => r.clinic.emergency24h).length,
      postalCodes: [...new Set(rows.map((r) => r.clinic.postalCode))].sort(),
    };
  },
);

export type TreatmentInCity = {
  slug: string;
  name: string;
  shortName: string | null;
  categoryName: string;
  clinicCount: number;
};

/** Tratamientos con clínicas publicadas en un municipio, de más a menos oferta. */
export const getTreatmentsInCity = cache(async (cityId: string): Promise<TreatmentInCity[]> => {
  const rows = await prisma.clinicTreatment.findMany({
    where: { clinic: { cityId, status: "PUBLISHED" } },
    select: {
      treatment: {
        select: { slug: true, name: true, shortName: true, category: { select: { name: true } } },
      },
    },
  });

  const counts = new Map<string, TreatmentInCity>();
  for (const row of rows) {
    const t = row.treatment;
    const current = counts.get(t.slug);
    if (current) current.clinicCount += 1;
    else
      counts.set(t.slug, {
        slug: t.slug,
        name: t.name,
        shortName: t.shortName,
        categoryName: t.category.name,
        clinicCount: 1,
      });
  }
  return [...counts.values()].sort((a, b) => b.clinicCount - a.clinicCount);
});

export type CityWithTreatment = {
  slug: string;
  name: string;
  provinceName: string;
  clinicCount: number;
  distanceKm: number | null;
};

/** Municipios donde ese tratamiento tiene clínicas, ordenados por oferta. */
export const getCitiesForTreatment = cache(
  async (treatmentId: string, limit = 60): Promise<CityWithTreatment[]> => {
    const rows = await prisma.clinicTreatment.findMany({
      where: { treatmentId, clinic: { status: "PUBLISHED" } },
      select: {
        clinic: {
          select: {
            city: { select: { slug: true, name: true, province: { select: { name: true } } } },
          },
        },
      },
    });

    const counts = new Map<string, CityWithTreatment>();
    for (const row of rows) {
      const c = row.clinic.city;
      const current = counts.get(c.slug);
      if (current) current.clinicCount += 1;
      else
        counts.set(c.slug, {
          slug: c.slug,
          name: c.name,
          provinceName: c.province.name,
          clinicCount: 1,
          distanceKm: null,
        });
    }
    return [...counts.values()].sort((a, b) => b.clinicCount - a.clinicCount).slice(0, limit);
  },
);

/**
 * Municipios cercanos con clínicas publicadas. Sirve para enlazar entre
 * páginas hermanas sin caer en listados arbitrarios: el orden es la distancia
 * real, calculada con Haversine sobre las coordenadas del municipio.
 */
export const getNearbyCities = cache(
  async (cityId: string, limit = 8): Promise<CityWithTreatment[]> => {
    const origin = await prisma.city.findUnique({
      where: { id: cityId },
      select: { id: true, lat: true, lng: true, provinceId: true },
    });
    if (!origin) return [];

    const candidates = await prisma.city.findMany({
      where: { id: { not: cityId }, clinics: { some: { status: "PUBLISHED" } } },
      select: {
        slug: true,
        name: true,
        lat: true,
        lng: true,
        province: { select: { name: true } },
        _count: { select: { clinics: { where: { status: "PUBLISHED" } } } },
      },
      take: 500,
    });

    return candidates
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        provinceName: c.province.name,
        clinicCount: c._count.clinics,
        distanceKm: haversineKm(origin, { lat: c.lat, lng: c.lng }),
      }))
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
      .slice(0, limit);
  },
);

export type TreatmentStats = {
  clinicCount: number;
  cityCount: number;
  price: PriceStats | null;
};

/** Cifras nacionales de un tratamiento, para su página informacional. */
export const getTreatmentStats = cache(async (treatmentId: string): Promise<TreatmentStats> => {
  const rows = await prisma.clinicTreatment.findMany({
    where: { treatmentId, clinic: { status: "PUBLISHED" } },
    select: { priceFromCents: true, clinic: { select: { cityId: true } } },
  });

  return {
    clinicCount: rows.length,
    cityCount: new Set(rows.map((r) => r.clinic.cityId)).size,
    price: priceStats(rows.map((r) => r.priceFromCents ?? 0)),
  };
});
