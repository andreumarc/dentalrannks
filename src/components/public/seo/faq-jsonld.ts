import type { FaqItem } from "./copy";

/**
 * `FAQPage` JSON-LD a partir de EXACTAMENTE las preguntas visibles en la
 * página (la misma lista que recibe `<FaqSection>`). Nunca se debe construir
 * a partir de una lista distinta: Google penaliza el marcado de FAQ que no
 * coincide con el contenido visible.
 *
 * Devuelve `null` cuando no hay preguntas, para que la página pueda omitir
 * el `<script>` sin comprobaciones repetidas.
 */
export function faqPageJsonLd(items: FaqItem[]): Record<string, unknown> | null {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
