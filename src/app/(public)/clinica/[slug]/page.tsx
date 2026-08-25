import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, MessageCircle, Globe, Navigation, BadgeCheck, AlarmClock, Wallet2, Accessibility, ParkingSquare, Languages, Stethoscope, ScanEye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { computeDentalRankScore } from "@/lib/score";
import { formatCents, formatNumber } from "@/lib/money";
import { isSafeExternalUrl } from "@/lib/validation";
import { trackedHref } from "@/lib/tracking";
import { initials } from "@/lib/utils";
import { SITE_URL } from "@/lib/seo/config";
import { buildMetadata } from "@/lib/seo/metadata";
import { decideClinicIndexing } from "@/lib/seo/indexing";
import { paths } from "@/lib/seo/urls";
import { dentistJsonLd as buildDentistJsonLd } from "@/lib/seo/jsonld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stars } from "@/components/ui/stars";
import { EmptyState } from "@/components/ui/states";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/public/breadcrumbs";
import { JsonLd } from "@/components/public/json-ld";
import { ClinicMap } from "@/components/public/clinic-map";
import { isCatalogPhoto } from "@/lib/images";
import { ScoreBreakdownCard } from "@/components/public/score-breakdown";
import { ScheduleList, scheduleToOpeningHours } from "@/components/public/schedule";
import { LeadForm } from "@/components/public/lead-form";
import { LinkGrid, type LinkGridItem } from "@/components/public/seo/link-grid";

export const revalidate = 300;

export async function generateStaticParams() {
  // Si la base de datos no está disponible durante el build, las rutas se
  // generan bajo demanda en lugar de romper el despliegue.
  try {
    const clinics = await prisma.clinic.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
      take: 2000,
    });
    return clinics.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

type Params = { slug: string };

/**
 * A propósito NO filtra por `status`: la política de indexación
 * (`decideClinicIndexing`) es la que decide si la ficha se indexa —
 * `PUBLISHED` sí, cualquier otro estado `noindex, nofollow` — pero la
 * página debe poder servirse igualmente (por ejemplo, para que la propia
 * clínica revise cómo queda su ficha antes de publicarla, o para que un
 * moderador la abra desde el enlace público). Un slug que no existe en
 * absoluto sigue devolviendo `null` y provocando el 404 habitual.
 */
async function getClinicFull(slug: string) {
  return prisma.clinic.findFirst({
    where: { slug },
    include: {
      city: { include: { province: { include: { region: true } } } },
      treatments: { include: { treatment: true }, orderBy: { featured: "desc" } },
      images: { orderBy: { order: "asc" } },
      team: { orderBy: { order: "asc" } },
      reviews: {
        where: { source: "INTERNAL", status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 20,
      },
    },
  });
}

type ClinicFull = NonNullable<Awaited<ReturnType<typeof getClinicFull>>>;

/** Otras clínicas publicadas en el mismo municipio, para enlazado interno. */
async function getNearbyClinicsInCity(cityId: string, excludeClinicId: string, limit = 6) {
  return prisma.clinic.findMany({
    where: { cityId, status: "PUBLISHED", id: { not: excludeClinicId } },
    select: { slug: true, name: true, externalRating: true, externalReviewCount: true },
    orderBy: { dentalRankScore: "desc" },
    take: limit,
  });
}

/**
 * Señal diferenciadora real para el title/description: se elige como mucho
 * una, en este orden de prioridad (la más verificable primero), y nunca se
 * usa una palabra vacía tipo "la mejor" o "líder". Si la clínica no declara
 * ninguna de estas señales, se devuelve `null` y el texto se queda sin ella.
 */
function clinicDifferentiator(clinic: ClinicFull): string | null {
  if (clinic.verificationStatus === "VERIFIED") return "clínica verificada";
  if (clinic.externalRating !== null && clinic.externalReviewCount > 0) {
    return `valorada ${clinic.externalRating.toFixed(1)}/5 (${formatNumber(clinic.externalReviewCount)} reseñas)`;
  }
  if (clinic.firstVisitFree) return "primera visita gratuita";
  return null;
}

function clinicTitle(clinic: ClinicFull): string {
  const diff = clinicDifferentiator(clinic);
  const base = `${clinic.name} — ${clinic.city.name}`;
  return diff ? `${base}, ${diff}` : base;
}

function clinicDescription(clinic: ClinicFull): string {
  const diff = clinicDifferentiator(clinic);
  const lead =
    clinic.tagline ?? `${clinic.name}, clínica dental en ${clinic.city.name} (${clinic.city.province.name})`;
  const parts = [diff ? `${lead}, ${diff}.` : `${lead}.`];
  parts.push("Consulta tratamientos, precio orientativo y reseñas, y solicita valoración sin coste.");
  return parts.join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const clinic = await getClinicFull(slug);
  if (!clinic) return {};

  const decision = decideClinicIndexing(clinic.status);

  return buildMetadata({
    title: clinicTitle(clinic),
    description: clinicDescription(clinic),
    path: paths.clinic(clinic.slug),
    index: decision.index,
    follow: decision.follow,
  });
}

const FEATURE_ROWS = [
  { key: "firstVisitFree" as const, label: "Primera visita gratis", icon: BadgeCheck },
  { key: "financing" as const, label: "Financiación disponible", icon: Wallet2 },
  { key: "emergency24h" as const, label: "Urgencias 24h", icon: AlarmClock },
  { key: "parking" as const, label: "Parking cercano", icon: ParkingSquare },
  { key: "accessible" as const, label: "Acceso accesible", icon: Accessibility },
];

export default async function ClinicProfilePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const clinic = await getClinicFull(slug);
  if (!clinic) notFound();

  const scoreBreakdown = computeDentalRankScore({
    verified: clinic.verificationStatus === "VERIFIED",
    profileCompleteness: clinic.profileCompleteness,
    externalRating: clinic.externalRating,
    externalReviewCount: clinic.externalReviewCount,
    internalRating: clinic.internalRating,
    internalReviewCount: clinic.internalReviewCount,
    avgResponseMinutes: clinic.avgResponseMinutes,
    treatmentCount: clinic.treatments.length,
    hasPhotos: clinic.images.length > 0,
    hasSchedule: Boolean(clinic.scheduleJson),
    hasTeam: clinic.team.length > 0,
  });

  const originUrl = SITE_URL;
  const breadcrumbItems = [
    { label: "Inicio", href: paths.home() },
    { label: "Municipios", href: paths.cityHub() },
    { label: clinic.city.name, href: paths.city(clinic.city.slug) },
    { label: clinic.name },
  ];

  const websiteSafe = clinic.website && isSafeExternalUrl(clinic.website) ? clinic.website : null;
  const nearbyClinics = await getNearbyClinicsInCity(clinic.cityId, clinic.id);

  const dentistJsonLdData = buildDentistJsonLd({
    slug: clinic.slug,
    name: clinic.name,
    phone: clinic.phone,
    website: websiteSafe,
    image: clinic.logoUrl ?? clinic.coverUrl ?? undefined,
    address: clinic.address,
    postalCode: clinic.postalCode,
    cityName: clinic.city.name,
    regionName: clinic.city.province.region.name,
    lat: clinic.lat,
    lng: clinic.lng,
    openingHoursSpecification: scheduleToOpeningHours(clinic.scheduleJson),
    treatmentNames: clinic.treatments.map((ct) => ct.treatment.name),
    externalRating: clinic.externalRating,
    externalReviewCount: clinic.externalReviewCount,
  });

  const nearbyClinicItems: LinkGridItem[] = nearbyClinics.map((c) => ({
    href: paths.clinic(c.slug),
    label: c.name,
    meta: c.externalRating !== null && c.externalReviewCount > 0 ? `${c.externalRating.toFixed(1)}★` : undefined,
  }));

  return (
    <div className="pb-16">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, originUrl)} />
      {dentistJsonLdData ? <JsonLd data={dentistJsonLdData} /> : null}

      {/* Portada */}
      <div className="relative h-[220px] w-full overflow-hidden bg-anthracite sm:h-[280px]">
        {clinic.coverUrl ? (
          // Se mantiene <img> a propósito: coverUrl es un campo de texto libre
          // que cualquier clínica puede rellenar desde su panel con un dominio
          // arbitrario, y next/image exige declarar cada hostname permitido
          // (remotePatterns) de antemano.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clinic.coverUrl} alt="" className="size-full object-cover opacity-80" />
        ) : (
          <div className="hero-gradient grid-lines size-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
      </div>

      <div className="wrap">
        <div className="-mt-14 mb-6 flex flex-wrap items-end gap-5 sm:-mt-16">
          {clinic.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clinic.logoUrl}
              alt={`Logo de ${clinic.name}`}
              className="size-28 shrink-0 rounded-brand border-4 border-white bg-white object-cover shadow-drop"
            />
          ) : (
            <span className="grid size-28 shrink-0 place-items-center rounded-brand border-4 border-white bg-mist font-display text-[26px] font-semibold text-anthracite shadow-drop">
              {initials(clinic.name)}
            </span>
          )}
          <div className="pb-1">
            <div className="flex flex-wrap items-center gap-2">
              {clinic.verificationStatus === "VERIFIED" ? (
                <Badge variant="cyan">
                  <BadgeCheck className="size-3" aria-hidden="true" /> Clínica verificada
                </Badge>
              ) : null}
            </div>
            <h1 className="display-h1 mt-1.5 text-ink">{clinic.name}</h1>
            {clinic.tagline ? <p className="mt-1 text-[15px] text-grey">{clinic.tagline}</p> : null}
            <div className="mt-2">
              <Stars rating={clinic.externalRating} count={clinic.externalReviewCount || undefined} />
            </div>
          </div>
        </div>

        <Breadcrumbs items={breadcrumbItems} />

        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-12">
            {clinic.description ? (
              <section aria-labelledby="sobre-heading">
                <h2 id="sobre-heading" className="display-h3 mb-3 text-anthracite">
                  Sobre la clínica
                </h2>
                <p className="whitespace-pre-line text-[15.5px] leading-relaxed text-ink/90">
                  {clinic.description}
                </p>
              </section>
            ) : null}

            {(clinic.firstVisitFree || clinic.financing || clinic.emergency24h || clinic.parking || clinic.accessible) ? (
              <section aria-labelledby="servicios-heading">
                <h2 id="servicios-heading" className="display-h3 mb-3 text-anthracite">
                  Servicios
                </h2>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {FEATURE_ROWS.filter((f) => clinic[f.key]).map((f) => (
                    <li key={f.key} className="flex items-center gap-2.5 text-[14.5px] text-ink">
                      <f.icon className="size-4 text-cyan-brand" aria-hidden="true" />
                      {f.label}
                      {f.key === "financing" && clinic.financingNote ? (
                        <span className="text-grey">— {clinic.financingNote}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section aria-labelledby="tratamientos-heading">
              <h2 id="tratamientos-heading" className="display-h3 mb-3 text-anthracite">
                Tratamientos
              </h2>
              {clinic.treatments.length === 0 ? (
                <p className="text-[14px] text-grey">Esta clínica todavía no ha detallado tratamientos.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Cada tratamiento enlaza a su combinación tratamiento×municipio
                      (p. ej. "implantes en Igualada"), la página que compara esta
                      clínica con el resto que ofrecen lo mismo en el municipio. */}
                  {clinic.treatments.map((ct) => (
                    <Link
                      key={ct.id}
                      href={paths.combo(ct.treatment.slug, clinic.city.slug)}
                      className="block rounded-brand border border-line p-4 transition-colors hover:border-cyan-brand"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-display text-[14.5px] font-semibold uppercase tracking-[0.02em] text-ink">
                          {ct.treatment.name}
                        </p>
                        {ct.featured ? <Badge variant="cyan" size="sm">Destacado</Badge> : null}
                      </div>
                      {ct.priceFromCents !== null ? (
                        <p className="mt-1.5 font-display text-[16px] font-semibold text-anthracite">
                          Desde {formatCents(ct.priceFromCents)}
                        </p>
                      ) : null}
                      {ct.priceNote ? <p className="mt-1 text-[12.5px] text-grey">{ct.priceNote}</p> : null}
                      {ct.description ? (
                        <p className="mt-1.5 text-[13.5px] text-grey">{ct.description}</p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {clinic.team.length > 0 ? (
              <section aria-labelledby="equipo-heading">
                <h2 id="equipo-heading" className="display-h3 mb-3 text-anthracite">
                  Equipo
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {clinic.team.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 rounded-brand border border-line p-4">
                      {member.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.photoUrl}
                          alt=""
                          className="size-12 shrink-0 rounded-full border border-line object-cover"
                        />
                      ) : (
                        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-mist font-display text-[13px] font-semibold text-anthracite">
                          {initials(member.name)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-[14.5px] font-medium text-ink">{member.name}</p>
                        {member.role ? <p className="text-[12.5px] text-grey">{member.role}</p> : null}
                        {member.collegiateNo ? (
                          <p className="text-[11.5px] text-grey-light">Col. nº {member.collegiateNo}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {clinic.images.length > 0 ? (
              <section aria-labelledby="instalaciones-heading">
                <h2 id="instalaciones-heading" className="display-h3 mb-3 text-anthracite">
                  Instalaciones
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {clinic.images.map((img) => {
                    // Honestidad: solo se rotula "aportada por la clínica" cuando la
                    // URL no pertenece al catálogo de banco (ver src/lib/images.ts).
                    // Para las de banco se deja el alt neutro del catálogo, sin dar a
                    // entender que son las instalaciones reales de esta clínica.
                    const providedByClinic = !isCatalogPhoto(img.url);
                    return (
                      <figure key={img.id}>
                        {/* Se mantiene <img> a propósito: img.url es un campo de texto
                            libre que la clínica puede rellenar con un dominio propio
                            arbitrario; next/image exige declarar cada hostname
                            permitido (remotePatterns) de antemano. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.alt ?? `Instalación de ${clinic.name}`}
                          loading="lazy"
                          title={providedByClinic ? "Imagen de ambiente aportada por la clínica" : undefined}
                          className="aspect-[4/3] w-full rounded-brand border border-line object-cover"
                        />
                        {providedByClinic ? (
                          <figcaption className="mt-1 text-[11px] text-grey-light">
                            Imagen de ambiente aportada por la clínica
                          </figcaption>
                        ) : null}
                      </figure>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {(clinic.languages.length > 0 || clinic.diagnostics.length > 0) ? (
              <section aria-labelledby="detalles-heading" className="grid gap-8 sm:grid-cols-2">
                {clinic.languages.length > 0 ? (
                  <div>
                    <h2 id="detalles-heading" className="display-h3 mb-3 flex items-center gap-2 text-anthracite">
                      <Languages className="size-[18px]" aria-hidden="true" /> Idiomas
                    </h2>
                    <ul className="flex flex-wrap gap-1.5">
                      {clinic.languages.map((l) => (
                        <li key={l}><Badge variant="neutral">{l}</Badge></li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {clinic.diagnostics.length > 0 ? (
                  <div>
                    <h2 className="display-h3 mb-3 flex items-center gap-2 text-anthracite">
                      <ScanEye className="size-[18px]" aria-hidden="true" /> Medios de diagnóstico
                    </h2>
                    <ul className="flex flex-wrap gap-1.5">
                      {clinic.diagnostics.map((d) => (
                        <li key={d}><Badge variant="neutral">{d}</Badge></li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ) : null}

            <section aria-labelledby="reviews-heading">
              <h2 id="reviews-heading" className="display-h3 mb-3 text-anthracite">
                Reseñas
              </h2>

              {clinic.externalRating !== null && clinic.externalReviewCount > 0 ? (
                <div className="mb-5 flex items-center gap-3 rounded-brand border border-line bg-mist px-4 py-3">
                  <Stars rating={clinic.externalRating} count={clinic.externalReviewCount} />
                  <span className="text-[12.5px] text-grey-light">
                    · fuente externa{clinic.externalSource ? `: ${clinic.externalSource}` : ""}
                  </span>
                </div>
              ) : null}

              {clinic.reviews.length === 0 ? (
                <EmptyState
                  icon={<Stethoscope className="size-5" />}
                  title="Todavía no hay reseñas en DentalRank"
                  description="Los pacientes que soliciten valoración a través de DentalRank podrán dejar su reseña tras la visita."
                />
              ) : (
                <div className="space-y-4">
                  {clinic.reviews.map((review) => (
                    <div key={review.id} className="rounded-brand border border-line p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Stars rating={review.rating} />
                          <span className="font-medium text-ink">{review.authorName}</span>
                        </div>
                        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-grey-light">
                          {review.verifiedPatient ? "Paciente verificado · " : ""}Reseña en DentalRank
                        </span>
                      </div>
                      {review.title ? <p className="mt-2 font-medium text-ink">{review.title}</p> : null}
                      {review.body ? <p className="mt-1 text-[14px] text-grey">{review.body}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section aria-labelledby="ubicacion-heading">
              <h2 id="ubicacion-heading" className="display-h3 mb-3 text-anthracite">
                Ubicación
              </h2>
              <p className="mb-3 text-[14.5px] text-ink">
                {clinic.address}, {clinic.postalCode} {clinic.city.name}
              </p>
              <ClinicMap
                clinics={[
                  {
                    id: clinic.id,
                    slug: clinic.slug,
                    name: clinic.name,
                    lat: clinic.lat,
                    lng: clinic.lng,
                    rating: clinic.externalRating,
                    reviewCount: clinic.externalReviewCount,
                  },
                ]}
                center={{ lat: clinic.lat, lng: clinic.lng }}
                ariaLabel={`Mapa de ubicación de ${clinic.name}`}
              />
              <div className="mt-3">
                <Button asChild variant="outline" size="sm">
                  <a
                    href={trackedHref({
                      clinicId: clinic.id,
                      type: "DIRECTIONS",
                      target: `https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}`,
                      cityId: clinic.cityId,
                    })}
                  >
                    <Navigation className="size-4" aria-hidden="true" /> Cómo llegar
                  </a>
                </Button>
              </div>
            </section>

            <ScheduleList scheduleJson={clinic.scheduleJson} />

            <LinkGrid
              id="otras-clinicas"
              heading={`Otras clínicas dentales en ${clinic.city.name}`}
              items={nearbyClinicItems}
            />

            <section aria-label="Más enlaces relacionados" className="border-t border-line pt-8">
              <p className="max-w-[70ch] text-[14.5px] text-grey">
                Consulta también{" "}
                <Link
                  href={paths.city(clinic.city.slug)}
                  className="text-cyan-deep underline underline-offset-2 hover:text-cyan-brand"
                >
                  todas las clínicas dentales de {clinic.city.name}
                </Link>
                .
              </p>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <Button asChild block variant="dark">
                  <a
                    href={trackedHref({
                      clinicId: clinic.id,
                      type: "PHONE",
                      target: `tel:${clinic.phone}`,
                      cityId: clinic.cityId,
                    })}
                  >
                    <Phone className="size-4" aria-hidden="true" /> Llamar a la clínica
                  </a>
                </Button>
                {clinic.whatsapp ? (
                  <Button asChild block variant="outline">
                    <a
                      href={trackedHref({
                        clinicId: clinic.id,
                        type: "WHATSAPP",
                        target: `https://wa.me/${clinic.whatsapp.replace(/\D/g, "")}`,
                        cityId: clinic.cityId,
                      })}
                    >
                      <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp
                    </a>
                  </Button>
                ) : null}
                {websiteSafe ? (
                  <Button asChild block variant="outline">
                    <a
                      href={trackedHref({
                        clinicId: clinic.id,
                        type: "WEBSITE",
                        target: websiteSafe,
                        cityId: clinic.cityId,
                      })}
                    >
                      <Globe className="size-4" aria-hidden="true" /> Sitio web
                    </a>
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Solicitar valoración</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadForm
                  clinicId={clinic.id}
                  clinicName={clinic.name}
                  cityId={clinic.cityId}
                  source="CLINIC_PROFILE"
                  treatments={clinic.treatments.map((ct) => ({ id: ct.treatmentId, name: ct.treatment.name }))}
                />
              </CardContent>
            </Card>

            <ScoreBreakdownCard breakdown={scoreBreakdown} />
          </aside>
        </div>
      </div>
    </div>
  );
}
