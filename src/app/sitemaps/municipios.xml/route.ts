import { NextResponse } from "next/server";
import { safeRead } from "@/lib/safe";
import { getCitiesWithClinics } from "@/server/catalog";
import { buildUrlset, SITEMAP_XML_HEADERS } from "@/lib/seo/xml";
import { absoluteUrl } from "@/lib/seo/config";
import { paths } from "@/lib/seo/urls";

export const revalidate = 3600;

export async function GET() {
  // `getCitiesWithClinics` ya filtra municipios con al menos una clínica
  // PUBLISHED, que es exactamente el umbral de `decideCityIndexing` (índice
  // con clinicCount >= 1). `City` no tiene `updatedAt` en el esquema, así
  // que no se emite `lastmod`.
  const cities = await safeRead(getCitiesWithClinics, [], "sitemap.municipios");

  const xml = buildUrlset(cities.map((c) => ({ loc: absoluteUrl(paths.city(c.slug)) })));
  return new NextResponse(xml, { headers: SITEMAP_XML_HEADERS });
}
