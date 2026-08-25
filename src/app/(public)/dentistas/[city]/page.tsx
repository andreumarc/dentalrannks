import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCityBySlug, getCitiesWithClinics } from "@/server/catalog";
import { clinicsInCity } from "@/server/search";
import { getTreatmentsInCity, getNearbyCities } from "@/server/seo-stats";
import { decideCityIndexing } from "@/lib/seo/indexing";
import { buildMetadata } from "@/lib/seo/metadata";
import { paths } from "@/lib/seo/urls";
import { ClinicResultCard } from "@/components/public/clinic-result-card";
import { ClinicMap } from "@/components/public/clinic-map";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/public/json-ld";
import { EmptyState } from "@/components/ui/states";
import { FactGrid, type Fact } from "@/components/public/seo/fact-grid";
import { LinkGrid, type LinkGridItem } from "@/components/public/seo/link-grid";
import { FaqSection } from "@/components/public/seo/faq-section";
import { faqPageJsonLd } from "@/components/public/seo/faq-jsonld";
import {
  cityTitle,
  cityDescription,
  citySummaryText,
  formatPostalCodes,
  cityClinicCountFaq,
  cityFirstVisitFreeFaq,
  cityEmergencyFaq,
  type FaqItem,
} from "@/components/public/seo/copy";
import { formatNumber } from "@/lib/money";
import { SITE_URL } from "@/lib/seo/config";

export const revalidate = 300;

export async function generateStaticParams() {
  // Si la base de datos no está disponible durante el build, las rutas se
  // generan bajo demanda en lugar de romper el despliegue.
  try {
    const cities = await getCitiesWithClinics();
    return cities.map((c) => ({ city: c.slug }));
  } catch {
    return [];
  }
}

type Params = { city: string };

/** Recuento ligero para `generateMetadata`, sin traer el listado completo de clínicas. */
async function getCityClinicCount(cityId: string): Promise<number> {
  return prisma.clinic.count({ where: { cityId, status: "PUBLISHED" } });
}

/** Códigos postales cubiertos por clínicas publicadas en el municipio, para el bloque de contexto. */
async function getCityPostalCodes(cityId: string): Promise<string[]> {
  const rows = await prisma.clinic.findMany({
    where: { cityId, status: "PUBLISHED" },
    select: { postalCode: true },
    distinct: ["postalCode"],
  });
  return [...new Set(rows.map((r) => r.postalCode))].sort();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) return {};

  const clinicCount = await getCityClinicCount(city.id);
  const decision = decideCityIndexing(clinicCount);

  return buildMetadata({
    title: cityTitle(city.name, clinicCount),
    description: cityDescription(city.name, city.province.name, clinicCount),
    path: paths.city(city.slug),
    index: decision.index,
    follow: decision.follow,
  });
}

export default async function CityPage({ params }: { params: Promise<Params> }) {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) notFound();

  const origin = { lat: city.lat, lng: city.lng };
  const [clinics, treatmentsInCity, nearbyCities, postalCodes] = await Promise.all([
    clinicsInCity(city.id, origin),
    getTreatmentsInCity(city.id),
    getNearbyCities(city.id, 8),
    getCityPostalCodes(city.id),
  ]);

  const clinicCount = clinics.length;
  const verifiedCount = clinics.filter((c) => c.verified).length;
  const firstVisitFreeCount = clinics.filter((c) => c.firstVisitFree).length;
  const emergencyCount = clinics.filter((c) => c.emergency24h).length;

  const originUrl = SITE_URL;
  const breadcrumbItems = [
    { label: "Inicio", href: paths.home() },
    { label: "Municipios", href: paths.cityHub() },
    { label: city.name },
  ];

  // FAQ visibles, generadas con datos reales: sin clínicas todavía no hay
  // nada honesto que responder, así que la sección (y su JSON-LD) se omiten
  // por completo en vez de mostrar ceros sin contexto.
  const faqItems: FaqItem[] =
    clinicCount > 0
      ? [
          cityClinicCountFaq(city.name, clinicCount),
          cityFirstVisitFreeFaq(city.name, clinicCount, firstVisitFreeCount),
          cityEmergencyFaq(city.name, clinicCount, emergencyCount),
        ]
      : [];
  const faqJsonLd = faqPageJsonLd(faqItems);

  // Solo se enlaza a combinaciones tratamiento×municipio reales: esta
  // página no compite con ellas por la intención "tratamiento + municipio",
  // les transfiere el enlace.
  const treatmentItems: LinkGridItem[] = treatmentsInCity.slice(0, 16).map((t) => ({
    href: paths.combo(t.slug, city.slug),
    label: `${t.shortName ?? t.name} en ${city.name}`,
    meta: `${formatNumber(t.clinicCount)} ${t.clinicCount === 1 ? "clínica" : "clínicas"}`,
  }));

  const nearbyItems: LinkGridItem[] = nearbyCities.map((c) => ({
    href: paths.city(c.slug),
    label: `Dentistas en ${c.name}`,
    meta: c.distanceKm !== null ? `${Math.round(c.distanceKm)} km` : undefined,
  }));

  const contextFacts: Fact[] = [
    { label: "Provincia", value: city.province.name },
    { label: "Comunidad autónoma", value: city.province.region.name },
    { label: "Clínicas publicadas", value: formatNumber(clinicCount) },
    { label: "Códigos postales", value: formatPostalCodes(postalCodes) },
  ];

  return (
    <div className="wrap section">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, originUrl)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: clinics.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${originUrl}${paths.clinic(c.slug)}`,
            name: c.name,
          })),
        }}
      />
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}

      <Breadcrumbs items={breadcrumbItems} />

      <header className="mb-8 max-w-[70ch]">
        <h1 className="display-h1 text-ink">Dentistas en {city.name}</h1>
        <p className="mt-3 text-[15.5px] text-grey">{citySummaryText(city.name, clinicCount, verifiedCount)}</p>
      </header>

      {clinics.length === 0 ? (
        <EmptyState
          icon={<Search className="size-5" />}
          title="Todavía no hay clínicas publicadas aquí"
          description={`En cuanto se den de alta clínicas en ${city.name}, aparecerán en este listado.`}
        />
      ) : (
        <div id="resultados" className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            {clinics.map((c, i) => (
              <ClinicResultCard key={c.id} clinic={c} rank={i + 1} cityId={city.id} source="CITY_PAGE" />
            ))}
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ClinicMap
              clinics={clinics.map((c) => ({
                id: c.id,
                slug: c.slug,
                name: c.name,
                lat: c.lat,
                lng: c.lng,
                sponsored: false,
                rating: c.externalRating,
                reviewCount: c.externalReviewCount,
              }))}
              center={origin}
              context={{ cityId: city.id }}
              ariaLabel={`Mapa de clínicas en ${city.name}`}
            />
          </div>
        </div>
      )}

      <FactGrid id="contexto" heading={`Sobre ${city.name}`} facts={contextFacts} />

      <LinkGrid
        id="tratamientos-disponibles"
        heading={`Tratamientos disponibles en ${city.name}`}
        items={treatmentItems}
      />

      <LinkGrid id="municipios-cercanos" heading="Municipios cercanos" items={nearbyItems} />

      <FaqSection
        id="faq"
        heading={`Preguntas frecuentes sobre clínicas dentales en ${city.name}`}
        items={faqItems}
      />
    </div>
  );
}
