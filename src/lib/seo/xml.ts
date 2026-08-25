/**
 * Construcción de XML para sitemaps. Deliberadamente no usa
 * `MetadataRoute.Sitemap` de Next: con miles de combinaciones
 * tratamiento×municipio, un único sitemap generado en memoria no escala ni
 * es fácil de paginar, así que los `route.ts` de `src/app/sitemaps/**`
 * generan el XML a mano con estas funciones.
 *
 * Nunca se incluye `changefreq` ni `priority`: Google los ignora desde hace
 * años (lo confirmó públicamente el equipo de Search), así que un valor
 * inventado no aporta nada y sugiere al lector del código una precisión que
 * no existe. Sí se incluye `lastmod` cuando se conoce un valor real
 * (`updatedAt` de la base de datos) — nunca una fecha sintética.
 */

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

/** Escapa los cinco caracteres especiales de XML. Hay slugs con apóstrofos o "&". */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type SitemapUrlEntry = {
  loc: string;
  /** Fecha real de última modificación. Se omite si no se conoce. */
  lastmod?: Date;
};

export type SitemapIndexEntry = {
  loc: string;
  lastmod?: Date;
};

function isoDate(date: Date): string {
  return date.toISOString();
}

/** Genera un `<urlset>` con las URLs dadas. */
export function buildUrlset(entries: SitemapUrlEntry[]): string {
  const body = entries
    .map((entry) => {
      const loc = `<loc>${escapeXml(entry.loc)}</loc>`;
      const lastmod = entry.lastmod ? `<lastmod>${isoDate(entry.lastmod)}</lastmod>` : "";
      return `<url>${loc}${lastmod}</url>`;
    })
    .join("");

  return `${XML_HEADER}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

/** Genera un `<sitemapindex>` que referencia otros sitemaps. */
export function buildSitemapIndex(entries: SitemapIndexEntry[]): string {
  const body = entries
    .map((entry) => {
      const loc = `<loc>${escapeXml(entry.loc)}</loc>`;
      const lastmod = entry.lastmod ? `<lastmod>${isoDate(entry.lastmod)}</lastmod>` : "";
      return `<sitemap>${loc}${lastmod}</sitemap>`;
    })
    .join("");

  return `${XML_HEADER}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

/** Cabeceras HTTP comunes para una respuesta de sitemap XML. */
export const SITEMAP_XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
} as const;

/** Número máximo de URLs por archivo de sitemap (límite práctico habitual, muy por debajo del límite de 50.000 del protocolo). */
export const SITEMAP_PAGE_SIZE = 5000;
