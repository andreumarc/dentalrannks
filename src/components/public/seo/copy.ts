import { formatCentsCompact, formatNumber } from "@/lib/money";
import type { ComboStats, CityWithTreatment, PriceStats } from "@/server/seo-stats";
import { MIN_PRICE_SAMPLE } from "@/server/seo-stats";

/**
 * Generadores de texto puros para las dos plantillas de SEO programático
 * (`/{tratamiento}/{municipio}` y `/dentistas/{municipio}`).
 *
 * Se aíslan aquí, fuera de los componentes React, por dos razones: se
 * pueden testear con Vitest sin entorno DOM (el proyecto no tiene jsdom
 * configurado), y se reutilizan a la vez desde `generateMetadata` (title,
 * description) y desde el cuerpo de la página (FAQ, párrafos de resumen),
 * así ambos sitios dicen exactamente lo mismo con las mismas cifras.
 *
 * Regla de todo este módulo, heredada del encargo: nunca se redacta una
 * cifra que no venga de los datos reales pasados como argumento. Cuando el
 * dato no existe (`price: null`, un recuento a cero sin muestra), el texto
 * lo dice explícitamente en vez de inventar u omitir en silencio.
 */

export type FaqItem = { question: string; answer: string };

// ---------------------------------------------------------------------------
// Combinación tratamiento × municipio
// ---------------------------------------------------------------------------

/**
 * Título de la página de combinación. Solo promete "precios" en el title
 * cuando hay de verdad un rango de precios que mostrar (muestra suficiente);
 * si no, se limita al recuento de clínicas para no prometer algo que la
 * página no cumple.
 */
export function comboTitle(treatmentName: string, cityName: string, clinicCount: number, price: PriceStats | null): string {
  const clinicWord = clinicCount === 1 ? "clínica" : "clínicas";
  if (price) {
    return `${treatmentName} en ${cityName}: ${formatNumber(clinicCount)} clínicas y precios`;
  }
  return `${treatmentName} en ${cityName}: ${formatNumber(clinicCount)} ${clinicWord}`;
}

/** Meta description de la combinación, con cifras reales de `ComboStats`. */
export function comboDescription(treatmentName: string, cityName: string, stats: ComboStats): string {
  const lower = treatmentName.toLowerCase();
  const clinicWord = stats.clinicCount === 1 ? "clínica" : "clínicas";
  let summary = `${formatNumber(stats.clinicCount)} ${clinicWord} de ${lower} en ${cityName}`;
  if (stats.verifiedCount > 0) {
    summary += `, ${formatNumber(stats.verifiedCount)} ${stats.verifiedCount === 1 ? "verificada" : "verificadas"}`;
  }
  summary += ".";

  const parts = [summary];
  if (stats.price) {
    parts.push(`Precios desde ${formatCentsCompact(stats.price.minCents)}.`);
  }
  parts.push("Compara y solicita valoración sin coste.");
  return parts.join(" ");
}

/** Frase de resumen de mercado (punto 1 del encargo), para el cuerpo de la página. */
export function comboSummaryText(treatmentName: string, cityName: string, stats: ComboStats): string {
  const lower = treatmentName.toLowerCase();
  const verb = stats.clinicCount === 1 ? "ofrece" : "ofrecen";
  const clinicWord = stats.clinicCount === 1 ? "clínica" : "clínicas";
  let text = `${formatNumber(stats.clinicCount)} ${clinicWord} ${verb} ${lower} en ${cityName}`;
  if (stats.verifiedCount > 0) {
    text += `, ${formatNumber(stats.verifiedCount)} ${stats.verifiedCount === 1 ? "de ellas verificada" : "de ellas verificadas"}`;
  }
  text += ".";
  return text;
}

/** Nota honesta cuando no hay muestra suficiente para publicar un rango de precios. */
export function priceUnavailableNote(cityName: string): string {
  return `Todavía no hay muestra suficiente de precios declarados en ${cityName} (hacen falta al menos ${MIN_PRICE_SAMPLE} clínicas con precio) para publicar un rango fiable.`;
}

/** Pregunta y respuesta de FAQ generadas con datos reales de precio, solo si hay muestra. */
export function comboPriceFaq(treatmentName: string, cityName: string, price: PriceStats): FaqItem {
  const lower = treatmentName.toLowerCase();
  return {
    question: `¿Cuánto cuesta ${lower} en ${cityName}?`,
    answer:
      `Las clínicas publicadas en DentalRank en ${cityName} declaran precios de ${lower} desde ` +
      `${formatCentsCompact(price.minCents)} hasta ${formatCentsCompact(price.maxCents)}, con una mediana de ` +
      `${formatCentsCompact(price.medianCents)} (muestra de ${formatNumber(price.sampleSize)} clínicas). Son precios ` +
      `"desde" orientativos: pueden no incluir las mismas pruebas, materiales o revisiones, así que conviene pedir ` +
      `presupuesto detallado antes de decidir.`,
  };
}

/**
 * Municipios cercanos que además tienen clínicas con este tratamiento,
 * conservando el orden por distancia de `nearby` (no se reordena por
 * recuento). Evita una consulta N+1: cruza en memoria dos listados ya
 * calculados con una sola consulta cada uno (`getNearbyCities` y
 * `getCitiesForTreatment`).
 */
export function citiesWithTreatmentNearby(
  nearby: CityWithTreatment[],
  citiesForTreatment: CityWithTreatment[],
  limit = 6,
): CityWithTreatment[] {
  const withTreatment = new Set(citiesForTreatment.map((c) => c.slug));
  return nearby.filter((c) => withTreatment.has(c.slug)).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Municipio (/dentistas/{municipio})
// ---------------------------------------------------------------------------

export function cityTitle(cityName: string, clinicCount: number): string {
  if (clinicCount <= 0) return `Dentistas en ${cityName}`;
  const clinicWord = clinicCount === 1 ? "clínica" : "clínicas";
  return `Dentistas en ${cityName}: ${formatNumber(clinicCount)} ${clinicWord}`;
}

export function cityDescription(cityName: string, provinceName: string, clinicCount: number): string {
  if (clinicCount <= 0) {
    return `Todavía no hay clínicas dentales publicadas en ${cityName} (${provinceName}). En cuanto se den de alta, aparecerán aquí con valoraciones, tratamientos y precio orientativo.`;
  }
  const clinicWord = clinicCount === 1 ? "clínica dental" : "clínicas dentales";
  return `${formatNumber(clinicCount)} ${clinicWord} en ${cityName} (${provinceName}). Compara valoraciones, tratamientos y precio orientativo. Solicita valoración sin coste.`;
}

/** Frase de resumen para el cuerpo de la página de municipio. */
export function citySummaryText(cityName: string, clinicCount: number, verifiedCount: number): string {
  if (clinicCount <= 0) {
    return `Todavía no hay clínicas dentales publicadas en ${cityName}.`;
  }
  const clinicWord = clinicCount === 1 ? "clínica dental publicada" : "clínicas dentales publicadas";
  let text = `${formatNumber(clinicCount)} ${clinicWord} en ${cityName}`;
  if (verifiedCount > 0) {
    text += `, ${formatNumber(verifiedCount)} ${verifiedCount === 1 ? "de ellas verificada" : "de ellas verificadas"}`;
  }
  text += ".";
  return text;
}

/** Lista de códigos postales para el bloque de contexto, recortada para no desbordar la tarjeta. */
export function formatPostalCodes(codes: string[], max = 8): string {
  if (codes.length === 0) return "";
  if (codes.length <= max) return codes.join(", ");
  return `${codes.slice(0, max).join(", ")}…`;
}

export function cityClinicCountFaq(cityName: string, clinicCount: number): FaqItem {
  const clinicWord = clinicCount === 1 ? "clínica dental publicada" : "clínicas dentales publicadas";
  return {
    question: `¿Cuántas clínicas dentales hay en ${cityName} en DentalRank?`,
    answer: `En DentalRank hay ${formatNumber(clinicCount)} ${clinicWord} en ${cityName}.`,
  };
}

export function cityFirstVisitFreeFaq(cityName: string, clinicCount: number, freeCount: number): FaqItem {
  const answer =
    freeCount > 0
      ? `${formatNumber(freeCount)} de las ${formatNumber(clinicCount)} clínicas publicadas en ${cityName} indican primera visita gratuita en su ficha.`
      : `Ninguna de las clínicas publicadas en ${cityName} indica actualmente primera visita gratuita.`;
  return { question: `¿Qué clínicas de ${cityName} ofrecen primera visita gratuita?`, answer };
}

export function cityEmergencyFaq(cityName: string, clinicCount: number, emergencyCount: number): FaqItem {
  const answer =
    emergencyCount > 0
      ? `Sí: ${formatNumber(emergencyCount)} de las ${formatNumber(clinicCount)} clínicas publicadas en ${cityName} indican servicio de urgencias.`
      : `Ninguna de las clínicas publicadas en ${cityName} indica actualmente servicio de urgencias.`;
  return { question: `¿Hay urgencias dentales en ${cityName}?`, answer };
}
