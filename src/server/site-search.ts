import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { parseQuery, routeFor, normalize, type CatalogEntry } from "@/lib/search-parse";
import { treatmentContent } from "@/content/treatments";
import { paths } from "@/lib/seo/urls";
import { decideComboIndexing } from "@/lib/seo/indexing";

/**
 * Buscador del sitio.
 *
 * Su trabajo no es devolver una lista de coincidencias, sino **enrutar**: si
 * alguien escribe «implantes barcelona» ya existe una página que responde esa
 * consulta mejor que cualquier lista, y ahí es donde hay que llevarle. Los
 * resultados por bloques son el plan B cuando no se reconoce la intención.
 */

/** Catálogo de tratamientos con sus sinónimos editoriales como alias. */
const getTreatmentCatalog = cache(async (): Promise<CatalogEntry[]> => {
  const treatments = await prisma.treatment.findMany({
    select: { slug: true, name: true, shortName: true },
    orderBy: { order: "asc" },
  });
  return treatments.map((t) => ({
    slug: t.slug,
    name: t.name,
    aliases: [
      ...(t.shortName ? [t.shortName] : []),
      ...(treatmentContent(t.slug)?.synonyms ?? []),
    ],
  }));
});

/** Solo municipios con clínicas publicadas: enrutar a uno vacío sería un callejón. */
const getCityCatalog = cache(async (): Promise<CatalogEntry[]> => {
  const cities = await prisma.city.findMany({
    where: { clinics: { some: { status: "PUBLISHED" } } },
    select: { slug: true, name: true },
  });
  return cities.map((c) => ({ slug: c.slug, name: c.name }));
});

export type SearchAnswer = {
  /** Página que responde directamente a la consulta. */
  href: string;
  label: string;
  detail: string;
  kind: "combo" | "city" | "treatment";
  /** Si es una combinación, cuántas clínicas hay detrás. */
  clinicCount?: number;
};

export type SearchResults = {
  query: string;
  answer: SearchAnswer | null;
  treatments: { slug: string; name: string; categoryName: string; href: string }[];
  cities: { slug: string; name: string; provinceName: string; clinicCount: number; href: string }[];
  clinics: {
    slug: string;
    name: string;
    cityName: string;
    verified: boolean;
    href: string;
  }[];
  total: number;
};

const VACIO: SearchResults = {
  query: "",
  answer: null,
  treatments: [],
  cities: [],
  clinics: [],
  total: 0,
};

export async function searchSite(rawQuery: string): Promise<SearchResults> {
  const query = rawQuery.trim().slice(0, 120);
  if (normalize(query).length < 2) return { ...VACIO, query };

  const [treatmentCatalog, cityCatalog] = await Promise.all([
    getTreatmentCatalog(),
    getCityCatalog(),
  ]);

  const intent = parseQuery(query, treatmentCatalog, cityCatalog);
  const route = routeFor(intent);

  // --- Respuesta directa -------------------------------------------------
  let answer: SearchAnswer | null = null;

  if (route?.kind === "combo") {
    const [treatment, city] = await Promise.all([
      prisma.treatment.findUnique({ where: { slug: route.treatment }, select: { id: true, name: true } }),
      prisma.city.findUnique({ where: { slug: route.city }, select: { id: true, name: true } }),
    ]);
    if (treatment && city) {
      const clinicCount = await prisma.clinicTreatment.count({
        where: { treatmentId: treatment.id, clinic: { cityId: city.id, status: "PUBLISHED" } },
      });
      if (clinicCount > 0) {
        answer = {
          kind: "combo",
          href: paths.combo(route.treatment, route.city),
          label: `${treatment.name} en ${city.name}`,
          detail:
            clinicCount === 1
              ? "1 clínica ofrece este tratamiento aquí"
              : `${clinicCount} clínicas ofrecen este tratamiento aquí`,
          clinicCount,
        };
      }
    }
  }

  if (!answer && route?.kind === "city") {
    const city = await prisma.city.findUnique({
      where: { slug: route.city },
      select: { name: true, province: { select: { name: true } }, _count: { select: { clinics: { where: { status: "PUBLISHED" } } } } },
    });
    if (city && city._count.clinics > 0) {
      answer = {
        kind: "city",
        href: paths.city(route.city),
        label: `Dentistas en ${city.name}`,
        detail: `${city._count.clinics} ${city._count.clinics === 1 ? "clínica" : "clínicas"} en ${city.province.name}`,
      };
    }
  }

  if (!answer && route?.kind === "treatment") {
    const treatment = await prisma.treatment.findUnique({
      where: { slug: route.treatment },
      select: { name: true, category: { select: { name: true } } },
    });
    if (treatment) {
      answer = {
        kind: "treatment",
        href: paths.treatment(route.treatment),
        label: treatment.name,
        detail: `${treatment.category.name} · elige municipio`,
      };
    }
  }

  // --- Bloques de resultados --------------------------------------------
  const texto = intent.rest.length > 0 ? intent.rest.join(" ") : normalize(query);

  const [treatments, cities, clinics] = await Promise.all([
    prisma.treatment.findMany({
      where: { OR: [{ name: { contains: texto, mode: "insensitive" } }, { slug: { contains: texto } }] },
      select: { slug: true, name: true, category: { select: { name: true } } },
      take: 6,
      orderBy: { order: "asc" },
    }),
    prisma.city.findMany({
      where: {
        clinics: { some: { status: "PUBLISHED" } },
        OR: [{ name: { contains: texto, mode: "insensitive" } }, { slug: { contains: texto } }],
      },
      select: {
        slug: true,
        name: true,
        province: { select: { name: true } },
        _count: { select: { clinics: { where: { status: "PUBLISHED" } } } },
      },
      take: 6,
    }),
    prisma.clinic.findMany({
      where: { status: "PUBLISHED", name: { contains: texto, mode: "insensitive" } },
      select: {
        slug: true,
        name: true,
        verificationStatus: true,
        city: { select: { name: true } },
      },
      take: 8,
      orderBy: { dentalRankScore: "desc" },
    }),
  ]);

  const mappedTreatments = treatments.map((t) => ({
    slug: t.slug,
    name: t.name,
    categoryName: t.category.name,
    href: paths.treatment(t.slug),
  }));
  const mappedCities = cities.map((c) => ({
    slug: c.slug,
    name: c.name,
    provinceName: c.province.name,
    clinicCount: c._count.clinics,
    href: paths.city(c.slug),
  }));
  const mappedClinics = clinics.map((c) => ({
    slug: c.slug,
    name: c.name,
    cityName: c.city.name,
    verified: c.verificationStatus === "VERIFIED",
    href: paths.clinic(c.slug),
  }));

  return {
    query,
    answer,
    treatments: mappedTreatments,
    cities: mappedCities,
    clinics: mappedClinics,
    total: mappedTreatments.length + mappedCities.length + mappedClinics.length,
  };
}

/** Búsquedas sugeridas cuando no hay consulta: las combinaciones con más oferta. */
export const getPopularSearches = cache(async (limit = 12) => {
  const rows = await prisma.clinicTreatment.findMany({
    where: { clinic: { status: "PUBLISHED" } },
    select: {
      treatment: { select: { slug: true, name: true } },
      clinic: { select: { city: { select: { slug: true, name: true } } } },
    },
    take: 8000,
  });

  const counts = new Map<
    string,
    { treatmentSlug: string; treatmentName: string; citySlug: string; cityName: string; count: number }
  >();
  for (const row of rows) {
    const key = `${row.treatment.slug}|${row.clinic.city.slug}`;
    const current = counts.get(key);
    if (current) current.count += 1;
    else
      counts.set(key, {
        treatmentSlug: row.treatment.slug,
        treatmentName: row.treatment.name,
        citySlug: row.clinic.city.slug,
        cityName: row.clinic.city.name,
        count: 1,
      });
  }

  return [...counts.values()]
    .filter((c) => decideComboIndexing(c.count).index)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((c) => ({
      label: `${c.treatmentName} en ${c.cityName}`,
      href: paths.combo(c.treatmentSlug, c.citySlug),
      clinicCount: c.count,
    }));
});
