import type { ClinicStatus } from "@prisma/client";
import { isPrivatePath } from "./urls";

/**
 * Política de indexación de DentalRank.
 *
 * Funciones puras: reciben los datos ya calculados (recuentos, estado) y
 * devuelven una decisión, sin tocar la base de datos. Así se pueden testear
 * de forma exhaustiva y reutilizar tanto en `generateMetadata` de cada
 * página como en los sitemaps (una página `noindex` no debe listarse en el
 * sitemap) y en el panel de administración (para explicar por qué una
 * página concreta no aparece en Google).
 */

/**
 * Umbral mínimo de clínicas publicadas para que una página de combinación
 * tratamiento×municipio se indexe. Por debajo de este número el contenido
 * (una tabla casi vacía) no aporta suficiente valor único frente a la
 * página de municipio o de tratamiento que ya cubren esa intención: Google
 * las trataría como "thin content" y podría penalizar el dominio completo,
 * no solo esa URL. La página se sigue sirviendo (con `noindex, follow`, para
 * transmitir enlace interno) en vez de devolver 404, salvo que no haya
 * ninguna clínica, en cuyo caso no hay nada que mostrar.
 */
export const MIN_CLINICS_FOR_INDEX = 3;

export type IndexDecision = {
  index: boolean;
  follow: boolean;
  /** Motivo legible, pensado para depuración y para el panel de administración. */
  reason: string;
};

/**
 * Página de combinación tratamiento×municipio (`/{tratamiento}/{municipio}`).
 *
 * `clinicCount` = número de clínicas con `status: "PUBLISHED"` que ofrecen
 * ese tratamiento en ese municipio.
 *
 * - 0 clínicas: la página no debe existir → quien la sirva debe devolver 404
 *   (no es una decisión de `index`/`follow`, por eso se documenta aparte).
 * - 1 o 2 clínicas: `noindex, follow`.
 * - `MIN_CLINICS_FOR_INDEX` (3) o más: `index, follow`.
 */
export function decideComboIndexing(clinicCount: number): IndexDecision {
  if (clinicCount < MIN_CLINICS_FOR_INDEX) {
    return {
      index: false,
      follow: true,
      reason: `combinación con ${clinicCount} clínica(s) publicada(s), por debajo del mínimo de ${MIN_CLINICS_FOR_INDEX}`,
    };
  }
  return {
    index: true,
    follow: true,
    reason: `combinación con ${clinicCount} clínicas publicadas, alcanza el mínimo de ${MIN_CLINICS_FOR_INDEX}`,
  };
}

/** True si la página de combinación no debe servirse (debe devolver 404). */
export function comboShouldBe404(clinicCount: number): boolean {
  return clinicCount <= 0;
}

/**
 * Página de municipio (`/dentistas/{municipio}`).
 *
 * `clinicCount` = número de clínicas `PUBLISHED` en ese municipio (de
 * cualquier tratamiento). A diferencia de la combinación, la página de
 * municipio siempre tiene sentido editorial (lista el municipio, sus barrios,
 * tratamientos disponibles…), así que con una sola clínica ya se indexa.
 */
export function decideCityIndexing(clinicCount: number): IndexDecision {
  if (clinicCount >= 1) {
    return {
      index: true,
      follow: true,
      reason: `municipio con ${clinicCount} clínica(s) publicada(s)`,
    };
  }
  return {
    index: false,
    follow: true,
    reason: "municipio sin ninguna clínica publicada todavía",
  };
}

/**
 * Ficha de clínica (`/clinica/{slug}`). Solo se indexa cuando está
 * publicada: en cualquier otro estado (borrador, pendiente de revisión o
 * suspendida) la ficha no debe aparecer en buscadores ni transmitir enlace,
 * porque su contenido puede cambiar o desaparecer.
 */
export function decideClinicIndexing(status: ClinicStatus): IndexDecision {
  if (status === "PUBLISHED") {
    return { index: true, follow: true, reason: "clínica publicada" };
  }
  return { index: false, follow: false, reason: `clínica en estado ${status}, no publicada` };
}

/**
 * Página de tratamiento (`/tratamientos/{tratamiento}`): contenido
 * informacional nacional, siempre útil independientemente del número de
 * clínicas que lo ofrezcan en cada municipio, así que siempre se indexa.
 */
export function decideTreatmentIndexing(): IndexDecision {
  return { index: true, follow: true, reason: "página informacional de tratamiento, siempre indexable" };
}

/**
 * Hubs de navegación y páginas estáticas de marca/confianza
 * (`/`, `/tratamientos`, `/ciudades`, `/como-funciona`, `/para-clinicas`,
 * `/legal/*`): siempre se indexan, salvo que caigan dentro de una ruta
 * privada (`/alta-clinica`, `/login`, `/dashboard/*`, `/admin/*`, `/r`), que
 * nunca deben indexarse ni rastrearse.
 */
export function decideStaticIndexing(pathname: string): IndexDecision {
  if (isPrivatePath(pathname)) {
    return { index: false, follow: false, reason: `ruta privada (${pathname}), fuera del índice` };
  }
  return { index: true, follow: true, reason: "página estática o de navegación" };
}
