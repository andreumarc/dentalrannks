import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Stethoscope } from "lucide-react";
import {
  getTreatmentBySlug,
  getTreatments,
  getTreatmentCategories,
} from "@/server/catalog";
import { getTreatmentStats, getCitiesForTreatment, type TreatmentStats } from "@/server/seo-stats";
import type { PriceStats } from "@/server/seo-stats";
import { decideTreatmentIndexing } from "@/lib/seo/indexing";
import { buildMetadata } from "@/lib/seo/metadata";
import { paths } from "@/lib/seo/urls";
import { medicalProcedureJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";
import { SITE_URL } from "@/lib/seo/config";
import { treatmentContent, type TreatmentContent } from "@/content/treatments";
import { formatNumber, formatCentsCompact } from "@/lib/money";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/public/json-ld";
import { StatList } from "@/components/public/seo/stat-list";
import { FactGrid, type Fact } from "@/components/public/seo/fact-grid";
import { LinkGrid, type LinkGridItem } from "@/components/public/seo/link-grid";
import { FaqSection } from "@/components/public/seo/faq-section";
import { faqPageJsonLd } from "@/components/public/seo/faq-jsonld";
import type { FaqItem } from "@/components/public/seo/copy";
import { EmptyState } from "@/components/ui/states";
import { photoForTreatment } from "@/lib/images";

export const revalidate = 300;

export async function generateStaticParams() {
  // Si la base de datos no está disponible durante el build, las rutas se
  // generan bajo demanda en lugar de romper el despliegue.
  try {
    const treatments = await getTreatments();
    return treatments.map((t) => ({ treatment: t.slug }));
  } catch {
    return [];
  }
}

type Params = { treatment: string };

/**
 * Título de la página informacional. A diferencia de la combinación
 * tratamiento×municipio (que promete "precios" solo con muestra real), aquí
 * la promesa es más modesta cuando todavía no hay ninguna clínica que lo
 * ofrezca: se limita a lo editorial, sin inventar un recuento.
 */
function treatmentPageTitle(name: string, stats: TreatmentStats): string {
  if (stats.clinicCount > 0) {
    return `${name}: precio orientativo y clínicas por municipio`;
  }
  return `${name}: en qué consiste y qué preguntar antes de decidir`;
}

function treatmentPageDescription(
  name: string,
  content: TreatmentContent | undefined,
  stats: TreatmentStats,
): string {
  const lower = name.toLowerCase();
  const parts: string[] = [
    content?.summary ?? `Todo sobre ${lower}: en qué consiste y qué comparar entre clínicas.`,
  ];
  if (stats.clinicCount > 0) {
    const clinicWord = stats.clinicCount === 1 ? "clínica" : "clínicas";
    const cityWord = stats.cityCount === 1 ? "municipio" : "municipios";
    parts.push(
      `${formatNumber(stats.clinicCount)} ${clinicWord} en ${formatNumber(stats.cityCount)} ${cityWord}.`,
    );
  }
  if (stats.price) {
    parts.push(`Precios desde ${formatCentsCompact(stats.price.minCents)}.`);
  }
  return parts.join(" ");
}

/** FAQ generada con el precio nacional real, solo cuando hay muestra suficiente. */
function nationalPriceFaq(name: string, price: PriceStats): FaqItem {
  const lower = name.toLowerCase();
  return {
    question: `¿Cuánto cuesta ${lower}?`,
    answer:
      `Las clínicas publicadas en DentalRank declaran precios de ${lower} desde ` +
      `${formatCentsCompact(price.minCents)} hasta ${formatCentsCompact(price.maxCents)}, con una mediana de ` +
      `${formatCentsCompact(price.medianCents)} (muestra de ${formatNumber(price.sampleSize)} clínicas en toda ` +
      `España). Son precios "desde" orientativos y varían mucho según el municipio: consulta el precio de tu ` +
      `zona en el listado de municipios de esta página.`,
  };
}

async function loadTreatment(slug: string) {
  return getTreatmentBySlug(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { treatment: slug } = await params;
  const treatment = await loadTreatment(slug);
  if (!treatment) return {};

  const stats = await getTreatmentStats(treatment.id);
  const content = treatmentContent(treatment.slug);
  const decision = decideTreatmentIndexing();

  return buildMetadata({
    title: treatmentPageTitle(treatment.name, stats),
    description: treatmentPageDescription(treatment.name, content, stats),
    path: paths.treatment(treatment.slug),
    index: decision.index,
    follow: decision.follow,
  });
}

export default async function TreatmentPage({ params }: { params: Promise<Params> }) {
  const { treatment: slug } = await params;
  const treatment = await loadTreatment(slug);
  if (!treatment) notFound();

  const [stats, cities, categories] = await Promise.all([
    getTreatmentStats(treatment.id),
    getCitiesForTreatment(treatment.id, 300),
    getTreatmentCategories(),
  ]);

  const content = treatmentContent(treatment.slug);
  const originUrl = SITE_URL;

  const breadcrumbItems = [
    { label: "Inicio", href: paths.home() },
    { label: "Tratamientos", href: paths.treatmentHub() },
    { label: treatment.name },
  ];

  const faqItems: FaqItem[] = [
    ...(content?.faqs ?? []),
    ...(stats.price ? [nationalPriceFaq(treatment.name, stats.price)] : []),
  ];
  const faqJsonLd = faqPageJsonLd(faqItems);
  const procedureJsonLd = medicalProcedureJsonLd({
    slug: treatment.slug,
    name: treatment.name,
    description: content?.summary ?? treatment.description,
  });
  const citiesItemListJsonLd = itemListJsonLd(
    cities.map((c) => ({ url: `${originUrl}${paths.combo(treatment.slug, c.slug)}`, name: c.name })),
  );

  const cityItems: LinkGridItem[] = cities.map((c) => ({
    href: paths.combo(treatment.slug, c.slug),
    label: `${c.name} · ${c.provinceName}`,
    meta: `${formatNumber(c.clinicCount)} ${c.clinicCount === 1 ? "clínica" : "clínicas"}`,
  }));

  const ownCategory = categories.find((cat) => cat.id === treatment.categoryId);
  const relatedTreatmentItems: LinkGridItem[] = (ownCategory?.treatments ?? [])
    .filter((t) => t.slug !== treatment.slug)
    .slice(0, 9)
    .map((t) => ({
      href: paths.treatment(t.slug),
      label: t.shortName ?? t.name,
    }));

  const contextFacts: Fact[] = [
    { label: "Categoría", value: treatment.category.name },
    { label: "Clínicas publicadas", value: stats.clinicCount > 0 ? formatNumber(stats.clinicCount) : "" },
    { label: "Municipios con oferta", value: stats.cityCount > 0 ? formatNumber(stats.cityCount) : "" },
    { label: "Precio desde", value: stats.price ? formatCentsCompact(stats.price.minCents) : "" },
  ];

  const bannerPhoto = photoForTreatment(treatment.slug);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, originUrl)} />
      {procedureJsonLd ? <JsonLd data={procedureJsonLd} /> : null}
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}
      {citiesItemListJsonLd ? <JsonLd data={citiesItemListJsonLd} /> : null}

      {/* Banda superior en el mismo lenguaje visual del hero de home: foto +
          degradado de marca semitransparente + rejilla. */}
      <section className="relative overflow-hidden">
        <Image src={bannerPhoto.src} alt={bannerPhoto.alt} fill sizes="100vw" className="object-cover" />
        <div className="hero-gradient-photo absolute inset-0" aria-hidden="true" />
        <div className="grid-lines absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-0 bg-ink/30 sm:bg-ink/10" aria-hidden="true" />
        <div className="wrap relative py-14 sm:py-20">
          <p className="kicker text-cyan-soft">{treatment.category.name}</p>
          <h1 className="display-h1 mt-3 text-white">{treatment.name}</h1>
          {content?.summary ? (
            <p className="mt-4 max-w-[60ch] text-[15.5px] text-grey-soft">{content.summary}</p>
          ) : null}
        </div>
      </section>

      <div className="wrap section">
        <Breadcrumbs items={breadcrumbItems} />

        {content?.intro && content.intro.length > 0 ? (
          <div className="mb-10 max-w-[70ch] space-y-3 text-[15px] leading-relaxed text-ink/90">
            {content.intro.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        ) : treatment.description ? (
          <p className="mb-10 max-w-[70ch] text-[15.5px] text-grey">{treatment.description}</p>
        ) : null}

        <FactGrid id="cifras" heading={`${treatment.name} en cifras`} facts={contextFacts} />

        {content ? (
          <StatList
            id="factores-precio"
            heading="Qué hace variar el precio entre clínicas"
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

        <section aria-labelledby="municipios-heading" className="border-t border-line py-10 sm:py-12">
          <h2 id="municipios-heading" className="display-h2 mb-5 text-ink">
            Municipios con {treatment.name.toLowerCase()} disponible
          </h2>
          {cities.length === 0 ? (
            <EmptyState
              icon={<MapPin className="size-5" />}
              title="Todavía no hay clínicas con este tratamiento"
              description="En cuanto se publiquen clínicas que lo ofrezcan, sus municipios aparecerán aquí."
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cityItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-brand border border-line px-4 py-3.5 text-[14.5px] text-ink transition-colors hover:border-cyan-brand hover:text-cyan-deep"
                  >
                    <span>{item.label}</span>
                    <span className="shrink-0 font-mono text-[11px] text-grey">{item.meta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <LinkGrid
          id="tratamientos-relacionados"
          heading={`Otros tratamientos de ${treatment.category.name.toLowerCase()}`}
          items={relatedTreatmentItems}
        />

        <FaqSection
          id="faq"
          heading={`Preguntas frecuentes sobre ${treatment.name.toLowerCase()}`}
          items={faqItems}
        />

        {stats.clinicCount === 0 ? (
          <div className="border-t border-line pt-10">
            <EmptyState
              icon={<Stethoscope className="size-5" />}
              title="Contenido informacional, sin clínicas todavía"
              description="Esta página describe el tratamiento con carácter general. En cuanto haya clínicas publicadas que lo ofrezcan, aparecerán arriba, agrupadas por municipio."
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
