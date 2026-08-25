import { NextResponse } from "next/server";
import { getIndexableComboCounts } from "@/lib/seo/sitemap-data";
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

  if (!Number.isInteger(page) || page < 1) {
    return new NextResponse("Página de sitemap no válida", { status: 404 });
  }

  // Solo las combinaciones que superan MIN_CLINICS_FOR_INDEX: una
  // combinación con 1-2 clínicas es `noindex` (ver `decideComboIndexing`) y
  // no debe listarse en el sitemap, aunque la página en sí exista.
  const combos = await getIndexableComboCounts();
  const start = (page - 1) * SITEMAP_PAGE_SIZE;
  const slice = combos.slice(start, start + SITEMAP_PAGE_SIZE);

  // Sin `lastmod`: el recuento de clínicas por combinación es un dato
  // calculado, no una fila con fecha de modificación propia.
  const xml = buildUrlset(slice.map((combo) => ({ loc: absoluteUrl(paths.combo(combo.treatment, combo.city)) })));
  return new NextResponse(xml, { headers: SITEMAP_XML_HEADERS });
}
