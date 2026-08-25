import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTreatmentBySlug, getCityBySlug, getIndexableCombos } from "@/server/catalog";
import { searchByTreatmentAndCity } from "@/server/search";
import {
  getComboStats,
  getTreatmentsInCity,
  getNearbyCities,
  getCitiesForTreatment,
} from "@/server/seo-stats";
import { decideComboIndexing, comboShouldBe404 } from "@/lib/seo/indexing";
import { buildMetadata } from "@/lib/seo/metadata";
import { paths } from "@/lib/seo/urls";
import { treatmentContent } from "@/content/treatments";
import { formatNumber } from "@/lib/money";
import { ResultsWithMap } from "@/components/public/results-with-map";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/public/json-ld";
import { MarketSummary } from "@/components/public/seo/market-summary";
import { StatList } from "@/components/public/seo/stat-list";
import { ServiceAvailability } from "@/components/public/seo/service-availability";
import { FaqSection } from "@/components/public/seo/faq-section";
import { LinkGrid, type LinkGridItem } from "@/components/public/seo/link-grid";
import { faqPageJsonLd } from "@/components/public/seo/faq-jsonld";
import { comboTitle, comboDescription, comboPriceFaq, citiesWithTreatmentNearby, type FaqItem } from "@/components/public/seo/copy";
import { SITE_URL } from "@/lib/seo/config";
import { photoForTreatment } from "@/lib/images";

export const revalidate = 300;

export async function generateStaticParams() {
  // Si la base de datos no está disponible durante el build, las rutas se
  // generan bajo demanda en lugar de romper el despliegue.
  try {
    const combos = await getIndexableCombos();
    return combos.map((c) => ({ treatment: c.treatment, city: c.city }));
  } catch {
    return [];
  }
}

type Params = { treatment: string; city: string };

async function loadContext(params: Params) {
  const [treatment, city] = await Promise.all([
    getTreatmentBySlug(params.treatment),
    getCityBySlug(params.city),
  ]);
  return { treatment, city };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const resolved = await params;
  const { treatment, city } = await loadContext(resolved);
  if (!treatment || !city) return {};

  const stats = await getComboStats(treatment.id, city.id);
  if (comboShouldBe404(stats.clinicCount)) return {};

  const decision = decideComboIndexing(stats.clinicCount);

  return buildMetadata({
    title: comboTitle(treatment.name, city.name, stats.clinicCount, stats.price),
    description: comboDescription(treatment.name, city.name, stats),
    path: paths.combo(treatment.slug, city.slug),
    index: decision.index,
    follow: decision.follow,
  });
}

export default async function TreatmentCityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const resolved = await params;
  const { treatment, city } = await loadContext(resolved);
  if (!treatment || !city) notFound();

  const origin = { lat: city.lat, lng: city.lng };

  const [results, stats, treatmentsInCity, nearbyCities, citiesForTreatment] = await Promise.all([
    searchByTreatmentAndCity(treatment.id, city.id, origin),
    getComboStats(treatment.id, city.id),
    getTreatmentsInCity(city.id),
    getNearbyCities(city.id, 15),
    getCitiesForTreatment(treatment.id, 300),
  ]);

  if (comboShouldBe404(stats.clinicCount)) notFound();

  const content = treatmentContent(treatment.slug);

  const breadcrumbItems = [
    { label: "Inicio", href: paths.home() },
    { label: "Tratamientos", href: paths.treatmentHub() },
    { label: treatment.name, href: paths.treatment(treatment.slug) },
    { label: city.name },
  ];

  const originUrl = SITE_URL;
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [...results.sponsored, ...results.organic].map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${originUrl}${paths.clinic(c.slug)}`,
      name: c.name,
    })),
  };

  // FAQ visibles: las editoriales del tratamiento + una generada con datos
  // reales de precio, solo cuando hay muestra suficiente. El JSON-LD se
  // construye a partir de esta MISMA lista para que nunca diverjan.
  const faqItems: FaqItem[] = [
    ...(content?.faqs ?? []),
    ...(stats.price ? [comboPriceFaq(treatment.name, city.name, stats.price)] : []),
  ];
  const faqJsonLd = faqPageJsonLd(faqItems);

  const otherTreatmentsItems: LinkGridItem[] = treatmentsInCity
    .filter((t) => t.slug !== treatment.slug)
    .slice(0, 12)
    .map((t) => ({
      href: paths.combo(t.slug, city.slug),
      label: `${t.shortName ?? t.name} en ${city.name}`,
      meta: `${formatNumber(t.clinicCount)} ${t.clinicCount === 1 ? "clínica" : "clínicas"}`,
    }));

  const nearbyWithTreatment = citiesWithTreatmentNearby(nearbyCities, citiesForTreatment, 6);
  const nearbyItems: LinkGridItem[] = nearbyWithTreatment.map((c) => ({
    href: paths.combo(treatment.slug, c.slug),
    label: `${treatment.name} en ${c.name}`,
    meta: c.distanceKm !== null ? `${Math.round(c.distanceKm)} km` : undefined,
  }));

  const bannerPhoto = photoForTreatment(treatment.slug);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, originUrl)} />
      <JsonLd data={itemListJsonLd} />
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}

      {/* Banda superior en el mismo lenguaje visual del hero de home: foto +
          degradado de marca semitransparente + rejilla. */}
      <section className="relative overflow-hidden">
        <Image src={bannerPhoto.src} alt={bannerPhoto.alt} fill sizes="100vw" className="object-cover" />
        <div className="hero-gradient-photo absolute inset-0" aria-hidden="true" />
        <div className="grid-lines absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-0 bg-ink/30 sm:bg-ink/10" aria-hidden="true" />
        <div className="wrap relative py-14 sm:py-20">
          <p className="kicker text-cyan-soft">{city.name}</p>
          <h1 className="display-h1 mt-3 text-white">
            {treatment.name} en {city.name}
          </h1>
        </div>
      </section>

      <div className="wrap section">
        <Breadcrumbs items={breadcrumbItems} />

        <p className="mb-8 max-w-[70ch] text-[15.5px] text-grey">
          {results.total > 0
            ? `${results.total} ${results.total === 1 ? "clínica encontrada" : "clínicas encontradas"} para ${treatment.name.toLowerCase()} en ${city.name}.`
            : `Todavía no hay clínicas publicadas para ${treatment.name.toLowerCase()} en ${city.name}.`}
        </p>

        <div id="resultados">
          <ResultsWithMap
            sponsored={results.sponsored}
            organic={results.organic}
            center={origin}
            marketId={results.marketId}
            treatmentId={treatment.id}
            cityId={city.id}
            cityName={city.name}
          />
        </div>
      </div>

      <div className="wrap pb-16 sm:pb-24">
        <MarketSummary treatmentName={treatment.name} cityName={city.name} stats={stats} />

        {content ? (
          <StatList
            id="factores-precio"
            heading={`Qué compone el precio de ${treatment.name.toLowerCase()} en ${city.name}`}
            items={content.priceFactors}
          />
        ) : null}

        {content ? (
          <StatList
            id="que-preguntar"
            heading="Qué preguntar antes de aceptar un presupuesto"
            items={content.questionsToAsk}
            ordered
          />
        ) : null}

        <ServiceAvailability cityName={city.name} stats={stats} resultsHref={`${paths.combo(treatment.slug, city.slug)}#resultados`} />

        <FaqSection
          id="faq"
          heading={`Preguntas frecuentes sobre ${treatment.name.toLowerCase()} en ${city.name}`}
          items={faqItems}
        />

        <LinkGrid
          id="otros-tratamientos"
          heading={`Otros tratamientos disponibles en ${city.name}`}
          items={otherTreatmentsItems}
        />

        <LinkGrid
          id="municipios-cercanos"
          heading={`${treatment.name} en municipios cercanos`}
          items={nearbyItems}
        />

        <section className="border-t border-line py-10 sm:py-12" aria-label="Más enlaces relacionados">
          <p className="max-w-[70ch] text-[14.5px] text-grey">
            Consulta también{" "}
            <Link
              href={paths.city(city.slug)}
              className="text-cyan-deep underline underline-offset-2 hover:text-cyan-brand"
            >
              todas las clínicas dentales de {city.name}
            </Link>{" "}
            o infórmate sobre{" "}
            <Link
              href={paths.treatment(treatment.slug)}
              className="text-cyan-deep underline underline-offset-2 hover:text-cyan-brand"
            >
              {treatment.name.toLowerCase()}
            </Link>{" "}
            a nivel nacional.
          </p>
        </section>
      </div>
    </>
  );
}
