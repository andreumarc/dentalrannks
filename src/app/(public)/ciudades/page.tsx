import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getCitiesWithClinics } from "@/server/catalog";
import { safeRead } from "@/lib/safe";
import { buildMetadata } from "@/lib/seo/metadata";
import { decideStaticIndexing } from "@/lib/seo/indexing";
import { paths } from "@/lib/seo/urls";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import { SITE_URL } from "@/lib/seo/config";
import { formatNumber } from "@/lib/money";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/public/json-ld";
import { EmptyState } from "@/components/ui/states";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const decision = decideStaticIndexing(paths.cityHub());
  return buildMetadata({
    title: "Municipios: clínicas dentales por municipio en España",
    description:
      "Todos los municipios de España con clínicas dentales publicadas en DentalRank, agrupados por provincia.",
    path: paths.cityHub(),
    index: decision.index,
    follow: decision.follow,
  });
}

export default async function CitiesIndexPage() {
  const cities = await safeRead(getCitiesWithClinics, [], "ciudades");

  const byRegion = new Map<string, { region: string; cities: typeof cities }>();
  for (const city of cities) {
    const regionName = city.province.name;
    const bucket = byRegion.get(regionName);
    if (bucket) bucket.cities.push(city);
    else byRegion.set(regionName, { region: regionName, cities: [city] });
  }
  const groups = [...byRegion.values()].sort((a, b) => a.region.localeCompare(b.region, "es"));

  const originUrl = SITE_URL;
  const breadcrumbItems = [{ label: "Inicio", href: paths.home() }, { label: "Municipios" }];
  const citiesItemListJsonLd = itemListJsonLd(
    cities.map((c) => ({ url: `${originUrl}${paths.city(c.slug)}`, name: c.name })),
  );

  return (
    <div className="wrap section">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, originUrl)} />
      {citiesItemListJsonLd ? <JsonLd data={citiesItemListJsonLd} /> : null}

      <Breadcrumbs items={breadcrumbItems} />

      <header className="mb-10 max-w-[70ch]">
        <h1 className="display-h1 text-ink">Municipios</h1>
        <p className="mt-3 text-[15.5px] text-grey">
          {formatNumber(cities.length)} {cities.length === 1 ? "municipio" : "municipios"} con clínicas
          publicadas, agrupados por provincia. Entra en cada uno para ver sus clínicas y los tratamientos
          disponibles.
        </p>
      </header>

      {cities.length === 0 ? (
        <EmptyState
          icon={<MapPin className="size-5" />}
          title="Todavía no hay municipios con clínicas"
          description="En cuanto se publiquen clínicas, sus municipios aparecerán aquí agrupados por provincia."
        />
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.region} aria-labelledby={`prov-${group.region}`}>
              <h2 id={`prov-${group.region}`} className="display-h3 mb-4 text-anthracite">
                {group.region}
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.cities.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={paths.city(c.slug)}
                      className="flex items-center justify-between gap-3 rounded-brand border border-line px-4 py-3 text-[14.5px] text-ink transition-colors hover:border-cyan-brand hover:text-cyan-deep"
                    >
                      {c.name}
                      <span className="font-mono text-[11px] text-grey">
                        {formatNumber(c._count.clinics)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
