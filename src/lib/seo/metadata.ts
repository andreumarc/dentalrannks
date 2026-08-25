import type { Metadata } from "next";
import { absoluteUrl, SITE } from "./config";

/** Sufijo de marca que añade el `title.template` del layout raíz ("%s | DentalRank"). */
const BRAND_SUFFIX = " | DentalRank";

/**
 * Longitud objetivo del título TAL Y COMO se ve en el SERP, sufijo de marca
 * incluido (Google trunca alrededor de 55-60 caracteres o ~600px). Como el
 * layout raíz añade `BRAND_SUFFIX` automáticamente vía `title.template`,
 * `clampTitle` reserva ese espacio para que el título final (con marca) no
 * se pase, no el título "desnudo".
 */
const TITLE_TARGET = 60;

/** Longitud objetivo de la meta description (Google la trunca sobre los ~155-160 caracteres). */
const DESCRIPTION_TARGET = 155;

/**
 * Recorta `text` a `max` caracteres como máximo sin cortar una palabra por
 * la mitad, y añade "…" cuando recorta. Si ya cabe, lo devuelve tal cual.
 */
function clampAtWordBoundary(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;

  const ellipsis = "…";
  const budget = Math.max(1, max - ellipsis.length);
  const sliced = trimmed.slice(0, budget);
  const lastSpace = sliced.lastIndexOf(" ");
  const safe = lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced;
  return `${safe.trimEnd()}${ellipsis}`;
}

/**
 * Recorta un título de página reservando hueco para el sufijo de marca que
 * añade el layout raíz. Pasa `includeSuffix: false` para páginas que fijan
 * su propio título completo (sin plantilla), como la home.
 */
export function clampTitle(title: string, options?: { max?: number; includeSuffix?: boolean }): string {
  const max = options?.max ?? TITLE_TARGET;
  const suffixLength = options?.includeSuffix === false ? 0 : BRAND_SUFFIX.length;
  const budget = Math.max(10, max - suffixLength);
  return clampAtWordBoundary(title, budget);
}

/** Recorta una meta description al objetivo de ~155 caracteres. */
export function clampDescription(description: string, max = DESCRIPTION_TARGET): string {
  return clampAtWordBoundary(description, max);
}

export type MetadataImage = {
  url: string;
  width?: number;
  height?: number;
  alt: string;
};

export type BuildMetadataInput = {
  /** Título de la página, SIN el sufijo de marca (lo añade el layout raíz). */
  title: string;
  description: string;
  /** Ruta relativa, p. ej. "/implantes/barcelona". */
  path: string;
  images?: MetadataImage[];
  /** Por defecto true: se asume indexable salvo que la política diga lo contrario. */
  index?: boolean;
  follow?: boolean;
  /** ISO 8601. Solo tiene efecto cuando `type: "article"`. */
  publishedTime?: string;
  modifiedTime?: string;
  type?: "website" | "article";
};

/**
 * Construye un `Metadata` de Next.js completo y consistente: título y
 * description recortados, canonical absoluto, hreflang (hoy solo `es-ES` +
 * `x-default`, preparado para añadir `ca-ES` el día que haya contenido en
 * catalán sin más que añadir una entrada aquí), robots (incluido
 * `googleBot` con directivas de previsualización enriquecida), OpenGraph y
 * Twitter Card.
 */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const {
    title,
    description,
    path,
    images,
    index = true,
    follow = true,
    publishedTime,
    modifiedTime,
    type = "website",
  } = input;

  const clampedTitle = clampTitle(title);
  const clampedDescription = clampDescription(description);
  const url = absoluteUrl(path);

  const ogImages = images?.map((image) => ({
    url: image.url,
    width: image.width,
    height: image.height,
    alt: image.alt,
  }));

  const robots: Metadata["robots"] = {
    index,
    follow,
    googleBot: {
      index,
      follow,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };

  const openGraph: Metadata["openGraph"] =
    type === "article"
      ? {
          type: "article",
          title: clampedTitle,
          description: clampedDescription,
          url,
          siteName: SITE.name,
          locale: SITE.ogLocale,
          images: ogImages,
          publishedTime,
          modifiedTime,
        }
      : {
          type: "website",
          title: clampedTitle,
          description: clampedDescription,
          url,
          siteName: SITE.name,
          locale: SITE.ogLocale,
          images: ogImages,
        };

  return {
    title: clampedTitle,
    description: clampedDescription,
    alternates: {
      canonical: url,
      // Una sola versión lingüística por ahora (es-ES). El día que haya
      // contenido en catalán (ca-ES), se añade su URL real aquí — nunca
      // apuntar `x-default` ni `ca-ES` a una página que no existe.
      languages: {
        "es-ES": url,
        "x-default": url,
      },
    },
    robots,
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: clampedTitle,
      description: clampedDescription,
      images: images?.map((image) => image.url),
      ...(SITE.twitterHandle ? { site: SITE.twitterHandle } : {}),
    },
  };
}
