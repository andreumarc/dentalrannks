import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { MIN_CLINICS_FOR_INDEX } from "@/lib/seo/indexing";

export const getTreatmentCategories = cache(async () =>
  prisma.treatmentCategory.findMany({
    orderBy: { order: "asc" },
    include: { treatments: { orderBy: { order: "asc" } } },
  }),
);

export const getTreatments = cache(async () =>
  prisma.treatment.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { category: true },
  }),
);

export const getTreatmentBySlug = cache(async (slug: string) =>
  prisma.treatment.findUnique({ where: { slug }, include: { category: true } }),
);

export const getCityBySlug = cache(async (slug: string) =>
  prisma.city.findUnique({
    where: { slug },
    include: { province: { include: { region: true } } },
  }),
);

export const getFeaturedCities = cache(async (limit = 12) =>
  prisma.city.findMany({
    where: { featured: true },
    orderBy: [{ population: "desc" }, { name: "asc" }],
    take: limit,
    include: { province: true, _count: { select: { clinics: true } } },
  }),
);

export const getCitiesWithClinics = cache(async () =>
  prisma.city.findMany({
    where: { clinics: { some: { status: "PUBLISHED" } } },
    orderBy: { name: "asc" },
    include: { province: true, _count: { select: { clinics: true } } },
  }),
);

export const getFeaturedTreatments = cache(async (limit = 8) =>
  prisma.treatment.findMany({
    where: { featured: true },
    orderBy: { order: "asc" },
    take: limit,
    include: { category: true },
  }),
);

/**
 * Combinaciones tratamiento×municipio con clínicas reales. Base del SEO
 * programático: alimenta `generateStaticParams` de `/{tratamiento}/{municipio}`
 * y el bloque de "búsquedas populares" de la home.
 *
 * Usa el mismo umbral que la política de indexación real
 * (`MIN_CLINICS_FOR_INDEX`, ver `src/lib/seo/indexing.ts`) para no generar en
 * build páginas estáticas que la propia política marcará `noindex` nada más
 * servirse — antes usaba un umbral de 2 propio, distinto del de la política,
 * que no tenía ninguna razón documentada para divergir.
 */
export const getIndexableCombos = cache(async (limit = 500) => {
  const rows = await prisma.clinicTreatment.findMany({
    where: { clinic: { status: "PUBLISHED" } },
    select: {
      treatment: { select: { slug: true } },
      clinic: { select: { city: { select: { slug: true } } } },
    },
    take: 5000,
  });

  const counts = new Map<string, { treatment: string; city: string; count: number }>();
  for (const row of rows) {
    const key = `${row.treatment.slug}|${row.clinic.city.slug}`;
    const current = counts.get(key);
    if (current) current.count += 1;
    else counts.set(key, { treatment: row.treatment.slug, city: row.clinic.city.slug, count: 1 });
  }

  return [...counts.values()]
    .filter((c) => c.count >= MIN_CLINICS_FOR_INDEX)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
});
