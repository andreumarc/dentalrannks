import { NextResponse } from "next/server";
import { getPublishedClinicsPage } from "@/lib/seo/sitemap-data";
import { buildUrlset, SITEMAP_XML_HEADERS, SITEMAP_PAGE_SIZE } from "@/lib/seo/xml";
import { absoluteUrl } from "@/lib/seo/config";
import { paths } from "@/lib/seo/urls";

export const revalidate = 3600;

type RouteParams = { page: string };

export async function GET(
  _request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const { page: pageParam } = await params;
  const page = Number(pageParam);

  // Un segmento que no es un número de página válido no es un recurso real
  // (a diferencia de una página fuera de rango o con la base de datos caída,
  // que devuelven un sitemap vacío pero válido: puede ser una petición
  // legítima de un rastreador para una página que aún no tiene URLs).
  if (!Number.isInteger(page) || page < 1) {
    return new NextResponse("Página de sitemap no válida", { status: 404 });
  }

  const clinics = await getPublishedClinicsPage(page, SITEMAP_PAGE_SIZE);

  const xml = buildUrlset(
    clinics.map((clinic) => ({ loc: absoluteUrl(paths.clinic(clinic.slug)), lastmod: clinic.updatedAt })),
  );
  return new NextResponse(xml, { headers: SITEMAP_XML_HEADERS });
}
