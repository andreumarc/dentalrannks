import { NextResponse } from "next/server";
import { buildUrlset, SITEMAP_XML_HEADERS } from "@/lib/seo/xml";
import { absoluteUrl } from "@/lib/seo/config";
import { paths, LEGAL_SLUGS } from "@/lib/seo/urls";

// No hay datos de base de datos que leer aquí (solo rutas fijas), pero se
// mantiene el mismo intervalo de revalidación que el resto de sitemaps por
// consistencia y para que el índice y sus hijos envejezcan juntos.
export const revalidate = 3600;

export function GET() {
  const staticPaths = [
    paths.home(),
    paths.treatmentHub(),
    paths.cityHub(),
    paths.howItWorks(),
    paths.forClinics(),
    ...LEGAL_SLUGS.map((slug) => paths.legal(slug)),
  ];

  const xml = buildUrlset(staticPaths.map((path) => ({ loc: absoluteUrl(path) })));
  return new NextResponse(xml, { headers: SITEMAP_XML_HEADERS });
}
