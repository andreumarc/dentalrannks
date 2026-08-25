import { Search, ClipboardCheck, MessageCircleHeart } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "1. Busca y compara",
    description:
      "Indica el tratamiento y el municipio. Verás clínicas con estrellas, DentalRank Score, tratamientos y precio orientativo.",
  },
  {
    icon: ClipboardCheck,
    title: "2. Solicita valoración",
    description:
      "Rellena un formulario breve, sin datos de salud. Tú decides con qué clínica quieres contactar, sin coste ni compromiso.",
  },
  {
    icon: MessageCircleHeart,
    title: "3. Habla con la clínica",
    description:
      "La clínica te contacta directamente para concretar cita. DentalRank no interviene en la atención ni en el precio final.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="section" aria-labelledby="como-funciona-heading">
      <div className="wrap">
        <p className="kicker mb-3">Cómo funciona</p>
        <h2 id="como-funciona-heading" className="display-h2 max-w-[24ch] text-ink">
          De la búsqueda a la primera cita, en tres pasos
        </h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.title} className="rounded-brand border border-line p-6">
              <span className="grid size-11 place-items-center rounded-brand bg-cyan-tint text-cyan-deep">
                <step.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-[16px] font-semibold uppercase tracking-[0.03em] text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-grey">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
