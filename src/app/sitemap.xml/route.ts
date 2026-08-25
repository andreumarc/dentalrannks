import { NextResponse } from "next/server";
import { countPublishedClinics, getIndexableComboCounts } from "@/lib/seo/sitemap-data";
import { buildSitemapIndex, SITEMAP_XML_HEADERS, SITEMAP_PAGE_SIZE } from "@/lib/seo/xml";
import { absoluteUrl } from "@/lib/seo/config";

/**
 * Índice de sitemaps (`<sitemapindex>`). Un sitemap único no aguanta el
 * volumen de este catálogo (miles de combinaciones tratamiento×municipio),
 * así que aquí solo se referencian los sitemaps segmentados de
 * `src/app/sitemaps/**`, cada uno responsable de una porción del catálogo.
 *
 * Las páginas de clínicas y combinaciones se referencian dinámicamente:
 * se calcula cuántas páginas de 5.000 URLs hacen falta a partir del
 * recuento real. Si la base de datos falla, el recuento tolerante devuelve
 * 0 y sencillamente no se referencia ninguna página de esa sección — el
 * índice sigue siendo XML válido, nunca un 500.
 */

export const revalidate = 3600;

export async function GET() {
  const [clinicCount, indexableCombos] = await Promise.all([
    countPublishedClinics(),
    getIndexableComboCounts(),
  ]);

  const clinicPages = Math.ceil(clinicCount / SITEMAP_PAGE_SIZE);
  const comboPages = Math.ceil(indexableCombos.length / SITEMAP_PAGE_SIZE);

  const entries = [
    { loc: absoluteUrl("/sitemaps/paginas.xml") },
    { loc: absoluteUrl("/sitemaps/tratamientos.xml") },
    { loc: absoluteUrl("/sitemaps/municipios.xml") },
    ...Array.from({ length: clinicPages }, (_, i) => ({
      loc: absoluteUrl(`/sitemaps/clinicas/${i + 1}`),
    })),
    ...Array.from({ length: comboPages }, (_, i) => ({
      loc: absoluteUrl(`/sitemaps/combinaciones/${i + 1}`),
    })),
  ];

  return new NextResponse(buildSitemapIndex(entries), { headers: SITEMAP_XML_HEADERS });
}
