import Link from "next/link";
import { Megaphone, LineChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Bloque de transparencia obligatorio: explica sin ambigüedad la diferencia
 * entre posición patrocinada (paga la clínica) y DentalRank Score (nunca paga).
 */
export function TransparencyBlock() {
  return (
    <section className="section bg-mist" aria-labelledby="transparencia-heading">
      <div className="wrap">
        <p className="kicker mb-3">Transparencia</p>
        <h2 id="transparencia-heading" className="display-h2 max-w-[28ch] text-ink">
          Dos escalas distintas. Nunca se mezclan.
        </h2>
        <p className="mt-3 max-w-[60ch] text-[15.5px] text-grey">
          Cada resultado de búsqueda muestra hasta dos bloques, siempre etiquetados por
          separado, para que sepas exactamente qué estás viendo.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-brand border border-line bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-brand bg-cyan-brand text-white">
                <Megaphone className="size-5" aria-hidden="true" />
              </span>
              <Badge variant="solid">Patrocinado</Badge>
            </div>
            <h3 className="mt-4 font-display text-[16px] font-semibold uppercase tracking-[0.03em] text-ink">
              Posición patrocinada
            </h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-grey">
              Las clínicas pueden pujar por aparecer en las primeras posiciones de una búsqueda
              tratamiento × municipio. Es publicidad, se identifica siempre como tal y{" "}
              <strong className="text-ink">no es una señal de calidad clínica</strong>.
            </p>
          </div>

          <div className="rounded-brand border border-line bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-brand bg-anthracite text-white">
                <LineChart className="size-5" aria-hidden="true" />
              </span>
              <Badge variant="cyan">DentalRank Score</Badge>
            </div>
            <h3 className="mt-4 font-display text-[16px] font-semibold uppercase tracking-[0.03em] text-ink">
              DentalRank Score
            </h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-grey">
              Combina verificación, reseñas, tiempo de respuesta y lo completa que está la
              ficha. <strong className="text-ink">Ningún componente depende del dinero pagado.</strong>{" "}
              No es un juicio clínico ni una certificación sanitaria.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Button asChild variant="outline">
            <Link href="/como-funciona">Ver cómo funciona en detalle</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
