import { appUrl } from "@/lib/env";

/**
 * Fuerza https en producción (Vercel siempre sirve por https; si algún
 * despliegue define la variable con http:// por error, no queremos
 * publicar canonicals ni OpenGraph con el esquema equivocado). En
 * desarrollo se respeta el esquema tal cual, para que localhost siga
 * funcionando.
 */
function normalizeSiteUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production" && trimmed.startsWith("http://")) {
    return `https://${trimmed.slice("http://".length)}`;
  }
  return trimmed;
}

/**
 * Host canónico del sitio, sin barra final. Lee `NEXT_PUBLIC_SITE_URL`
 * (variable nueva y preferida) con `NEXT_PUBLIC_APP_URL` como respaldo vía
 * `appUrl()` — así todo el código que ya usaba `appUrl()` para enlaces
 * internos sigue funcionando sin cambios y ambas fuentes quedan alineadas.
 */
export const SITE_URL = normalizeSiteUrl(appUrl());

/** Convierte una ruta relativa ("/tratamientos/implantes") en una URL absoluta. */
export function absoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

/**
 * Identidad del sitio para metadatos. No hay cuenta de X/Twitter confirmada
 * todavía, así que `twitterHandle` queda sin definir en vez de inventar un
 * usuario — cuando exista, se rellena aquí.
 */
export const SITE = {
  name: "DentalRank",
  shortName: "DentalRank",
  description:
    "Compara clínicas dentales por ubicación, tratamiento, valoraciones y precio orientativo. Solicita una valoración sin coste.",
  /** Locale de Next.js Metadata (BCP 47). */
  locale: "es-ES",
  /** Locale de OpenGraph (usa guion bajo por convención de Open Graph Protocol). */
  ogLocale: "es_ES",
  twitterHandle: undefined as string | undefined,
} as const;

/**
 * Identificadores de verificación de motores de búsqueda. Se emiten en
 * `layout.tsx` (metadata.verification) solo si existen, para no publicar
 * etiquetas `meta` vacías o con valores de ejemplo.
 */
export const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined;
export const BING_SITE_VERIFICATION = process.env.BING_SITE_VERIFICATION?.trim() || undefined;
