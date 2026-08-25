import { ChevronDown } from "lucide-react";
import type { FaqItem } from "./copy";

/**
 * Acordeón de preguntas frecuentes accesible: `<details>`/`<summary>`
 * nativos, así que el texto está en el HTML desde el primer render (no hace
 * falta JavaScript para leerlo ni para que un rastreador lo vea) y el
 * teclado y los lectores de pantalla lo manejan sin JS adicional.
 *
 * Debe recibir EXACTAMENTE la misma lista de preguntas que se pasa a
 * `faqPageJsonLd` en la página — es responsabilidad de quien llama a ambas
 * funciones mantenerlas sincronizadas, para que el marcado estructurado
 * nunca prometa contenido que no está a la vista.
 */
export function FaqSection({
  id,
  heading,
  items,
}: {
  id: string;
  heading: string;
  items: FaqItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={`${id}-heading`} className="border-t border-line py-10 sm:py-12">
      <h2 id={`${id}-heading`} className="display-h2 mb-6 text-ink">
        {heading}
      </h2>
      <div className="divide-y divide-line rounded-brand border border-line bg-white">
        {items.map((item) => (
          <details key={item.question} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <ChevronDown
                className="size-4 shrink-0 text-grey transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="mt-3 max-w-[70ch] text-[14.5px] leading-relaxed text-grey">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
