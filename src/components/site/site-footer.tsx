import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function SiteFooter({
  treatments,
  cities,
}: {
  treatments: { slug: string; name: string }[];
  cities: { slug: string; name: string }[];
}) {
  return (
    <footer className="bg-ink py-14 text-[14.5px] text-grey-light">
      <div className="wrap">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Logo inverted subtitle="Marketplace dental" />
            <p className="mt-4 max-w-[42ch] text-[14.5px] leading-relaxed">
              Comparador de clínicas dentales en España. Las clínicas pueden patrocinar su
              posición; esas posiciones se identifican siempre como tales y no alteran el
              DentalRank Score.
            </p>
          </div>

          <div>
            <h4 className="mb-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-white">
              Tratamientos
            </h4>
            <ul>
              {treatments.slice(0, 7).map((t) => (
                <li key={t.slug} className="py-1">
                  <Link href={`/tratamientos/${t.slug}`} className="hover:text-cyan-brand">
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-white">
              Ciudades
            </h4>
            <ul>
              {cities.slice(0, 7).map((c) => (
                <li key={c.slug} className="py-1">
                  <Link href={`/dentistas/${c.slug}`} className="hover:text-cyan-brand">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-white">
              DentalRank
            </h4>
            <ul>
              <li className="py-1">
                <Link href="/como-funciona" className="hover:text-cyan-brand">
                  Cómo funciona
                </Link>
              </li>
              <li className="py-1">
                <Link href="/para-clinicas" className="hover:text-cyan-brand">
                  Para clínicas
                </Link>
              </li>
              <li className="py-1">
                <Link href="/alta-clinica" className="hover:text-cyan-brand">
                  Dar de alta una clínica
                </Link>
              </li>
              <li className="py-1">
                <Link href="/login" className="hover:text-cyan-brand">
                  Acceso clínicas
                </Link>
              </li>
              <li className="py-1">
                <Link href="/legal/condiciones" className="hover:text-cyan-brand">
                  Condiciones para clínicas
                </Link>
              </li>
              <li className="py-1">
                <Link href="/legal/privacidad" className="hover:text-cyan-brand">
                  Privacidad
                </Link>
              </li>
              <li className="py-1">
                <Link href="/legal/cookies" className="hover:text-cyan-brand">
                  Cookies
                </Link>
              </li>
              <li className="py-1">
                <Link href="/legal/aviso-legal" className="hover:text-cyan-brand">
                  Aviso legal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-white/12 pt-5 text-[13px]">
          <p>© {new Date().getFullYear()} DentalRank. Proyecto en desarrollo.</p>
          <p>
            DentalRank no presta servicios sanitarios ni emite juicios clínicos. La información
            de cada ficha la aporta la propia clínica.
          </p>
        </div>
      </div>
    </footer>
  );
}
