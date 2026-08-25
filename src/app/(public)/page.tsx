import type { Metadata } from "next";
import Image from "next/image";
import { HeroSearch } from "@/components/marketing/hero-search";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { TransparencyBlock } from "@/components/marketing/transparency-block";
import { FeaturedTreatments, FeaturedCities } from "@/components/marketing/featured-grid";
import { ClinicCta } from "@/components/marketing/clinic-cta";
import {
  getTreatments,
  getCitiesWithClinics,
  getFeaturedTreatments,
  getFeaturedCities,
  getIndexableCombos,
} from "@/server/catalog";
import { safeRead } from "@/lib/safe";
import { HERO_PHOTO } from "@/lib/images";
import { buildMetadata } from "@/lib/seo/metadata";
import { decideStaticIndexing, decideComboIndexing } from "@/lib/seo/indexing";
import { paths } from "@/lib/seo/urls";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo/jsonld";
import { absoluteUrl } from "@/lib/seo/config";
import { formatNumber } from "@/lib/money";
import { JsonLd } from "@/components/public/json-ld";
import { LinkGrid, type LinkGridItem } from "@/components/public/seo/link-grid";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const decision = decideStaticIndexing(paths.home());
  return buildMetadata({
    title: "Encuentra clínica dental, compara y solicita valoración",
    description:
      "Compara clínicas dentales por tratamiento y municipio: valoraciones, DentalRank Score y precio orientativo. Solicita valoración sin coste.",
    path: paths.home(),
    index: decision.index,
    follow: decision.follow,
  });
}

export default async function HomePage() {
  const [allTreatments, allCities, featuredTreatments, featuredCities, indexableCombos] = await Promise.all([
    safeRead(getTreatments, [], "home:treatments"),
    safeRead(getCitiesWithClinics, [], "home:cities"),
    safeRead(() => getFeaturedTreatments(8), [], "home:featuredTreatments"),
    safeRead(() => getFeaturedCities(8), [], "home:featuredCities"),
    safeRead(() => getIndexableCombos(24), [], "home:topCombos"),
  ]);

  // Enlazado a las combinaciones tratamiento×municipio con más oferta
  // (hub-and-spoke real desde la home hacia las páginas dinero, no solo
  // hacia sus hubs). Se reutilizan los nombres ya cargados de
  // `allTreatments`/`allCities` para no lanzar una consulta extra, y solo
  // se enlaza a combinaciones que además cumplen la política de indexación
  // (`decideComboIndexing`): enlazar desde la home a una página `noindex`
  // no ayuda a nadie.
  const treatmentBySlug = new Map(allTreatments.map((t) => [t.slug, t]));
  const cityBySlug = new Map(allCities.map((c) => [c.slug, c]));
  const popularComboItems: LinkGridItem[] = indexableCombos
    .filter((combo) => decideComboIndexing(combo.count).index)
    .map((combo): LinkGridItem | null => {
      const treatment = treatmentBySlug.get(combo.treatment);
      const city = cityBySlug.get(combo.city);
      if (!treatment || !city) return null;
      return {
        href: paths.combo(combo.treatment, combo.city),
        label: `${treatment.shortName ?? treatment.name} en ${city.name}`,
        meta: `${formatNumber(combo.count)} ${combo.count === 1 ? "clínica" : "clínicas"}`,
      };
    })
    .filter((item): item is LinkGridItem => item !== null)
    .slice(0, 12);

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      {/*
        `WebSite` con `SearchAction` apuntando a /buscar?q=, que es una ruta
        real: un formulario GET que funciona sin JavaScript y devuelve una URL
        compartible. Nota: Google retiró el resultado enriquecido de caja de
        búsqueda en octubre de 2024, así que esto ya no pinta nada en su SERP;
        se emite porque sigue siendo marcado válido que consumen otros motores
        y asistentes, y porque ahora describe algo que el sitio sí tiene.
      */}
      <JsonLd data={webSiteJsonLd({ searchUrlTemplate: absoluteUrl("/buscar?q={search_term_string}") })} />
      <section className="relative overflow-hidden">
        <Image
          src={HERO_PHOTO.src}
          alt={HERO_PHOTO.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Degradado antracita de marca (semitransparente sobre la foto) +
            rejilla, igual que el resto del sitio. En móvil se añade un velo
            extra para que el titular en blanco mantenga contraste holgado. */}
        <div className="hero-gradient-photo absolute inset-0" aria-hidden="true" />
        <div className="grid-lines absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-0 bg-ink/35 sm:bg-ink/10" aria-hidden="true" />

        <div className="wrap relative py-16 sm:py-24">
          <div className="max-w-[720px]">
            <p className="kicker text-cyan-soft">Marketplace dental</p>
            <h1 className="display-h1 mt-3 text-white">
              Encuentra clínica. Compara. Solicita valoración.
            </h1>
            <p className="mt-4 max-w-[54ch] text-[16.5px] text-grey-soft">
              Compara clínicas dentales por ubicación, tratamientos, información clínica y
              disponibilidad.
            </p>
          </div>

          <div className="mt-9 max-w-[760px]">
            <HeroSearch
              treatments={allTreatments.map((t) => ({ id: t.id, slug: t.slug, name: t.name }))}
              cities={allCities.map((c) => ({ id: c.id, slug: c.slug, name: c.name }))}
            />
          </div>
        </div>
      </section>

      <FeaturedTreatments
        treatments={featuredTreatments.map((t) => ({
          slug: t.slug,
          name: t.name,
          description: t.description,
          categoryName: t.category.name,
        }))}
      />

      <FeaturedCities
        cities={featuredCities.map((c) => ({
          slug: c.slug,
          name: c.name,
          provinceName: c.province.name,
          clinicCount: c._count.clinics,
        }))}
      />

      {popularComboItems.length > 0 ? (
        <div className="wrap">
          <LinkGrid id="busquedas-populares" heading="Búsquedas populares" items={popularComboItems} />
        </div>
      ) : null}

      <HowItWorks />
      <TransparencyBlock />
      <ClinicCta />
    </>
  );
}
