import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ClinicCta() {
  return (
    <section className="section hero-gradient grid-lines relative overflow-hidden">
      <div className="wrap relative flex flex-col items-start gap-5 py-2 text-white sm:py-6">
        <p className="kicker text-cyan-soft">Para clínicas</p>
        <h2 className="display-h2 max-w-[22ch]">¿Diriges una clínica dental?</h2>
        <p className="max-w-[56ch] text-[15.5px] text-grey-soft">
          Aparece en las búsquedas de pacientes de tu municipio, recibe leads medibles y paga
          solo por resultados reales. Sin permanencia mínima.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild variant="white" size="lg">
            <Link href="/alta-clinica">Dar de alta mi clínica</Link>
          </Button>
          <Button asChild variant="ghostWhite" size="lg">
            <Link href="/para-clinicas">Ver cómo funciona para clínicas</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
