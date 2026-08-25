import { NextResponse } from "next/server";
import { safeRead } from "@/lib/safe";
import { getTreatments } from "@/server/catalog";
import { buildUrlset, SITEMAP_XML_HEADERS } from "@/lib/seo/xml";
import { absoluteUrl } from "@/lib/seo/config";
import { paths } from "@/lib/seo/urls";

export const revalidate = 3600;

export async function GET() {
  // Todas las páginas de tratamiento se indexan siempre (contenido
  // informacional nacional), así que aquí no hay que aplicar ninguna
  // política: se listan todos. `Treatment` no tiene `updatedAt` en el
  // esquema, así que no se emite `lastmod` (nunca se inventa una fecha).
  const treatments = await safeRead(getTreatments, [], "sitemap.tratamientos");

  const xml = buildUrlset(treatments.map((t) => ({ loc: absoluteUrl(paths.treatment(t.slug)) })));
  return new NextResponse(xml, { headers: SITEMAP_XML_HEADERS });
}
