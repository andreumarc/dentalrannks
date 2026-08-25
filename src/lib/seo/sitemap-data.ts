import { prisma } from "@/lib/prisma";
import { safeRead } from "@/lib/safe";
import { decideComboIndexing } from "./indexing";

/**
 * Datos de sitemap que requieren base de datos, compartidos entre el índice
 * (`src/app/sitemap.xml/route.ts`, que necesita el RECUENTO para saber
 * cuántas páginas de sitemap referenciar) y el sitemap paginado de
 * combinaciones (`src/app/sitemaps/combinaciones/[page]/route.ts`, que
 * necesita el LISTADO). Vive en `src/lib/seo` (no en `src/server`, que es de
 * otro agente) porque su única responsabilidad es servir a los sitemaps, no
 * al catálogo de la aplicación.
 */

export type ComboClinicCount = { treatment: string; city: string; count: number };

/**
 * Recuento de clínicas PUBLISHED por combinación tratamiento×municipio.
 *
 * Nota de escala: se agrupa en memoria a partir de `ClinicTreatment` (igual
 * que `getIndexableCombos` en `src/server/catalog.ts`), una sola consulta
 * sin N+1. Con miles de filas sigue siendo barato; si el catálogo creciera a
 * decenas de miles convendría mover el recuento a un `groupBy` de Prisma o a
 * una vista materializada.
 *
 * Orden determinista (por slug de tratamiento y luego de municipio):
 * imprescindible para que la paginación del sitemap sea estable entre
 * peticiones sucesivas — si el orden cambiara, una misma URL podría migrar
 * de página entre rastreos y Google la vería como movimiento, no como
 * contenido estable.
 */
async function fetchComboClinicCounts(): Promise<ComboClinicCount[]> {
  const rows = await prisma.clinicTreatment.findMany({
    where: { clinic: { status: "PUBLISHED" } },
    select: {
      treatment: { select: { slug: true } },
      clinic: { select: { city: { select: { slug: true } } } },
    },
  });

  const counts = new Map<string, ComboClinicCount>();
  for (const row of rows) {
    const key = `${row.treatment.slug}|${row.clinic.city.slug}`;
    const current = counts.get(key);
    if (current) current.count += 1;
    else counts.set(key, { treatment: row.treatment.slug, city: row.clinic.city.slug, count: 1 });
  }

  return [...counts.values()].sort((a, b) =>
    a.treatment === b.treatment ? a.city.localeCompare(b.city) : a.treatment.localeCompare(b.treatment),
  );
}

/**
 * Combinaciones que cumplen la política de indexación (`decideComboIndexing`,
 * `MIN_CLINICS_FOR_INDEX` clínicas o más). Tolerante a fallo de base de
 * datos: si la consulta falla, devuelve una lista vacía en vez de romper el
 * sitemap o el despliegue.
 */
export async function getIndexableComboCounts(): Promise<ComboClinicCount[]> {
  const all = await safeRead(fetchComboClinicCounts, [], "sitemap.combinaciones.counts");
  return all.filter((combo) => decideComboIndexing(combo.count).index);
}

export type PublishedClinicEntry = { slug: string; updatedAt: Date };

/**
 * Página (1-indexada) de clínicas `PUBLISHED`, ordenadas por `id` (orden
 * estable e independiente del contenido, para que ninguna URL cambie de
 * página de un rastreo a otro). Tolerante a fallo de base de datos.
 */
export async function getPublishedClinicsPage(
  page: number,
  pageSize: number,
): Promise<PublishedClinicEntry[]> {
  return safeRead(
    () =>
      prisma.clinic.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
        orderBy: { id: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    [],
    "sitemap.clinicas.page",
  );
}

/** Número total de clínicas `PUBLISHED`. Tolerante a fallo de base de datos. */
export async function countPublishedClinics(): Promise<number> {
  return safeRead(() => prisma.clinic.count({ where: { status: "PUBLISHED" } }), 0, "sitemap.clinicas.count");
}
