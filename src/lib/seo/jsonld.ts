import { absoluteUrl, SITE, SITE_URL } from "./config";
import { paths } from "./urls";

/**
 * Constructores tipados de datos estructurados (JSON-LD) para las plantillas
 * públicas que este agente posee: home, hubs, ficha de clínica y página de
 * tratamiento. La combinación tratamiento×municipio y la página de municipio
 * construyen su propio `ItemList`/`FAQPage` en su propio archivo (no tocado
 * aquí); `breadcrumbJsonLd` sí es compartido — vivía en
 * `src/components/public/breadcrumbs.tsx` y se traslada aquí, con ese
 * archivo reexportándolo para no romper a quien ya lo importa de allí.
 *
 * Regla de todo este módulo, heredada del encargo: cada constructor devuelve
 * `undefined` en lugar de un objeto a medias cuando falta un dato
 * obligatorio (una clínica sin dirección, una lista de FAQ vacía…). Nunca se
 * inventa un dato para rellenar un campo — ni una reseña, ni un perfil
 * social, ni un horario. Quien llama decide si omite el `<script>` o no lo
 * renderiza en absoluto.
 */

// ---------------------------------------------------------------------------
// Organization / WebSite — identidad del sitio, se emiten en la home.
// ---------------------------------------------------------------------------

/**
 * `Organization` de DentalRank. Todos sus campos son conocidos de antemano
 * (nombre, URL, logo), así que nunca devuelve `undefined`. `sameAs` se omite
 * a propósito: hoy no hay perfiles sociales confirmados y no se inventan.
 * Cuando exista alguno real, se añade aquí como un array de URLs.
 */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE.name,
    url: SITE_URL,
    logo: absoluteUrl("/icon.svg"),
  };
}

export type WebSiteJsonLdInput = {
  /**
   * Plantilla de URL de búsqueda con el marcador `{search_term_string}`
   * (p. ej. `https://dentalrank.com/buscar?q={search_term_string}`). Solo
   * tiene sentido si existe de verdad una ruta de búsqueda por texto libre
   * que Google pueda invocar con GET. El buscador de la home
   * (`HeroSearch`) no lo es: es un formulario con dos `<select>` que navega
   * directamente a `/{tratamiento}/{municipio}`, sin query string ni caja de
   * texto libre — por eso hoy se llama a esta función sin argumento, y
   * devuelve `undefined`.
   */
  searchUrlTemplate?: string;
};

/**
 * `WebSite` con `potentialAction: SearchAction`. Devuelve `undefined` sin
 * `searchUrlTemplate`, para que la página que lo use pueda omitir el
 * `<script>` sin comprobaciones repetidas.
 */
export function webSiteJsonLd(input: WebSiteJsonLdInput = {}): Record<string, unknown> | undefined {
  if (!input.searchUrlTemplate) return undefined;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE.name,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: input.searchUrlTemplate,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ---------------------------------------------------------------------------
// BreadcrumbList — compartido por todas las plantillas.
// ---------------------------------------------------------------------------

export type BreadcrumbItem = { label: string; href?: string };

/** `BreadcrumbList` a partir de la misma lista que pintan las migas de pan visibles. */
export function breadcrumbJsonLd(items: BreadcrumbItem[], origin: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${origin}${item.href}` } : {}),
    })),
  };
}

// ---------------------------------------------------------------------------
// ItemList — listados internos genéricos (municipios, clínicas…).
// ---------------------------------------------------------------------------

export type ItemListEntry = { url: string; name: string };

/** `ItemList` a partir de una lista de enlaces internos. `undefined` si está vacía. */
export function itemListJsonLd(items: ItemListEntry[]): Record<string, unknown> | undefined {
  if (items.length === 0) return undefined;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: item.url,
      name: item.name,
    })),
  };
}

// ---------------------------------------------------------------------------
// MedicalProcedure — página de tratamiento.
// ---------------------------------------------------------------------------

export type MedicalProcedureJsonLdInput = {
  slug: string;
  name: string;
  /** Descripción editorial corta. Se omite el campo si no hay ninguna. */
  description?: string | null;
};

/**
 * `MedicalProcedure` para la página informacional de un tratamiento.
 * Deliberadamente no incluye afirmaciones clínicas (duración, tasa de
 * éxito, indicación): esos datos no existen en el contenido editorial del
 * proyecto (ver `src/content/treatments.ts`) y no se inventan aquí.
 */
export function medicalProcedureJsonLd(
  input: MedicalProcedureJsonLdInput,
): Record<string, unknown> | undefined {
  if (!input.slug || !input.name) return undefined;

  const url = absoluteUrl(paths.treatment(input.slug));
  return {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    "@id": url,
    name: input.name,
    url,
    ...(input.description ? { description: input.description } : {}),
  };
}

// ---------------------------------------------------------------------------
// Dentist — ficha de clínica.
// ---------------------------------------------------------------------------

export type DentistOpeningHours = {
  "@type": string;
  dayOfWeek: string;
  opens: string;
  closes: string;
};

export type DentistJsonLdInput = {
  slug: string;
  name: string;
  phone: string;
  website?: string | null;
  image?: string | null;
  address: string;
  postalCode: string;
  cityName: string;
  regionName: string;
  lat: number;
  lng: number;
  /**
   * Ya derivado y validado por quien llama (ver
   * `scheduleToOpeningHours` en `src/components/public/schedule.tsx`, la
   * única fuente de verdad para interpretar `Clinic.scheduleJson`). Esta
   * función no reparsea el horario: solo lo incrusta si se le pasa.
   */
  openingHoursSpecification?: DentistOpeningHours[];
  /** Nombres de los tratamientos que ofrece. Vacío u omitido si no tiene ninguno. */
  treatmentNames?: string[];
  /**
   * Valoración externa agregada. Solo se emite `aggregateRating` cuando hay
   * al menos una reseña real (`reviewCount > 0`) — nunca con un recuento a
   * cero ni con una valoración sin reseñas que la respalden.
   */
  externalRating?: number | null;
  externalReviewCount?: number;
};

/**
 * `Dentist` (subtipo de `MedicalBusiness`/`LocalBusiness`) para la ficha de
 * clínica. Devuelve `undefined` si falta cualquier dato obligatorio de
 * identidad o localización — en la práctica no debería ocurrir, porque esos
 * campos son obligatorios en el modelo `Clinic`, pero la función no asume
 * que quien la llama ya lo ha comprobado.
 */
export function dentistJsonLd(input: DentistJsonLdInput): Record<string, unknown> | undefined {
  if (
    !input.slug ||
    !input.name ||
    !input.phone ||
    !input.address ||
    !input.postalCode ||
    !input.cityName ||
    !input.regionName
  ) {
    return undefined;
  }

  const url = absoluteUrl(paths.clinic(input.slug));
  const treatmentNames = input.treatmentNames ?? [];
  const hasRating =
    input.externalRating !== null &&
    input.externalRating !== undefined &&
    (input.externalReviewCount ?? 0) > 0;

  return {
    "@context": "https://schema.org",
    "@type": "Dentist",
    "@id": url,
    name: input.name,
    url,
    telephone: input.phone,
    image: input.image ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: input.address,
      postalCode: input.postalCode,
      addressLocality: input.cityName,
      addressRegion: input.regionName,
      addressCountry: "ES",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: input.lat,
      longitude: input.lng,
    },
    ...(input.website ? { sameAs: [input.website] } : {}),
    ...(input.openingHoursSpecification && input.openingHoursSpecification.length > 0
      ? { openingHoursSpecification: input.openingHoursSpecification }
      : {}),
    ...(treatmentNames.length > 0
      ? {
          availableService: treatmentNames.map((name) => ({
            "@type": "MedicalProcedure",
            name,
          })),
        }
      : {}),
    ...(hasRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: input.externalRating,
            reviewCount: input.externalReviewCount,
          },
        }
      : {}),
  };
}
