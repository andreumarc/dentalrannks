import Link from "next/link";
import { Info } from "lucide-react";
import { InfoNote } from "@/components/ui/states";

/**
 * Nota de transparencia que acompaña SIEMPRE a un bloque de posiciones patrocinadas.
 * Nunca se presenta el pago como una señal de calidad clínica.
 */
export function SponsoredExplainer() {
  return (
    <InfoNote tone="cyan">
      <span className="flex items-start gap-2.5">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          <strong className="font-semibold text-ink">Posición patrocinada:</strong> estas
          clínicas han pujado para aparecer primero en esta búsqueda. El importe pagado no
          influye en el DentalRank Score ni es un juicio sobre la calidad clínica.{" "}
          <Link href="/como-funciona" className="underline hover:text-cyan-brand">
            Cómo funciona
          </Link>
          .
        </span>
      </span>
    </InfoNote>
  );
}

export function OrganicExplainer() {
  return (
    <p className="text-[13.5px] text-grey">
      Ordenados por verificación, DentalRank Score y proximidad. El dinero no interviene en este
      orden.
    </p>
  );
}
