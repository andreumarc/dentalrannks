import { describe, expect, it } from "vitest";
import { faqPageJsonLd } from "./faq-jsonld";

describe("faqPageJsonLd", () => {
  it("devuelve null sin preguntas, para poder omitir el <script>", () => {
    expect(faqPageJsonLd([])).toBeNull();
  });

  it("construye un FAQPage con exactamente las preguntas recibidas, en el mismo orden", () => {
    const items = [
      { question: "¿Uno?", answer: "Sí." },
      { question: "¿Dos?", answer: "También." },
    ];
    const jsonLd = faqPageJsonLd(items);
    expect(jsonLd).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "¿Uno?", acceptedAnswer: { "@type": "Answer", text: "Sí." } },
        { "@type": "Question", name: "¿Dos?", acceptedAnswer: { "@type": "Answer", text: "También." } },
      ],
    });
  });
});
