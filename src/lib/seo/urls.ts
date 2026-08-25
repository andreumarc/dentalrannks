/**
 * Constructores de ruta relativa (sin host) para cada plantilla de URL del
 * sitio. Es la única fuente de verdad sobre la forma de cada ruta: cualquier
 * página, sitemap o componente que necesite enlazar internamente debería
 * construir la URL a partir de aquí en lugar de escribir la plantilla a mano,
 * para que un cambio de estructura solo se haga en un sitio.
 *
 * Funciones puras: solo concatenan slugs, no acceden a la base de datos ni a
 * variables de entorno. Para convertir una ruta relativa en absoluta, usa
 * `absoluteUrl` de `./config`.
 */

export const LEGAL_SLUGS = ["aviso-legal", "condiciones", "cookies", "privacidad"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export const paths = {
  home: () => "/",
  treatmentHub: () => "/tratamientos",
  cityHub: () => "/ciudades",
  howItWorks: () => "/como-funciona",
  forClinics: () => "/para-clinicas",
  legal: (slug: LegalSlug) => `/legal/${slug}`,

  /** Buscador de texto libre. El destino del SearchAction declarado en la home. */
  search: (query?: string) =>
    query ? `/buscar?q=${encodeURIComponent(query)}` : "/buscar",

  /** Página informacional nacional del tratamiento: /tratamientos/{tratamiento} */
  treatment: (treatmentSlug: string) => `/tratamientos/${treatmentSlug}`,

  /** Página de municipio: /dentistas/{municipio} */
  city: (citySlug: string) => `/dentistas/${citySlug}`,

  /** Página dinero (combinación tratamiento×municipio): /{tratamiento}/{municipio} */
  combo: (treatmentSlug: string, citySlug: string) => `/${treatmentSlug}/${citySlug}`,

  /** Ficha de clínica: /clinica/{slug} */
  clinic: (clinicSlug: string) => `/clinica/${clinicSlug}`,
} as const;

/**
 * Prefijos de ruta que nunca deben indexarse ni rastrearse: paneles privados,
 * autenticación, alta de clínica y el redirector de clics patrocinados.
 * La compara `robots.ts`, `middleware.ts` (áreas protegidas) y
 * `indexing.ts` (decisión de metadatos) deben coincidir; se centraliza aquí
 * para que no diverjan.
 */
export const PRIVATE_PATH_PREFIXES = ["/alta-clinica", "/login", "/dashboard", "/admin", "/r"] as const;

/** True si `pathname` cae dentro de una de las rutas privadas anteriores. */
export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Segmentos de primer nivel que ya usa la aplicación.
 *
 * La ruta `/{tratamiento}/{municipio}` es un comodín de dos segmentos, así que
 * un tratamiento cuyo slug coincida con uno de estos nombres quedaría
 * inalcanzable: en Next.js la ruta estática siempre gana a la dinámica. Se
 * valida al crear tratamientos y municipios para que no llegue a ocurrir.
 */
export const RESERVED_SLUGS = [
  "admin",
  "alta-clinica",
  "api",
  "buscar",
  "ciudades",
  "clinica",
  "como-funciona",
  "dashboard",
  "dentistas",
  "img",
  "legal",
  "llms.txt",
  "login",
  "opengraph-image",
  "para-clinicas",
  "r",
  "robots.txt",
  "sitemap.xml",
  "sitemaps",
  "tratamientos",
] as const;

const RESERVED = new Set<string>(RESERVED_SLUGS);

/** ¿Puede usarse este slug como primer segmento de una URL pública? */
export function isReservedSlug(slug: string): boolean {
  return RESERVED.has(slug.trim().toLowerCase());
}
