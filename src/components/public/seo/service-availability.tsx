import Link from "next/link";
import { formatNumber } from "@/lib/money";
import type { ComboStats } from "@/server/seo-stats";

/**
 * "Servicios disponibles en {municipio}" (punto 4 del encargo): cuántas de
 * las clínicas de esta combinación ofrecen primera visita gratuita,
 * financiación o urgencias, con enlace de vuelta al listado de resultados
 * de la propia página (no hay un filtro real que aplicar, así que el
 * enlace lleva a "verlas" en vez de fingir que filtra).
 *
 * Un servicio con recuento cero simplemente no se muestra: no aporta nada
 * decirle a quien compara que "0 de N clínicas" ofrecen algo, y evita una
 * fila vacía en cada combinación donde nadie lo ofrece.
 */
export function ServiceAvailability({
  cityName,
  stats,
  resultsHref,
}: {
  cityName: string;
  stats: ComboStats;
  resultsHref: string;
}) {
  const items = [
    { label: "Primera visita gratuita", count: stats.firstVisitFreeCount },
    { label: "Financiación", count: stats.financingCount },
    { label: "Urgencias", count: stats.emergencyCount },
  ].filter((item) => item.count > 0);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="servicios-heading" className="border-t border-line py-10 sm:py-12">
      <h2 id="servicios-heading" className="display-h2 mb-5 text-ink">
        Servicios disponibles en {cityName}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={resultsHref}
              className="block rounded-brand border border-line bg-white px-4 py-3.5 transition-colors hover:border-cyan-brand"
            >
              <p className="font-display text-[20px] font-semibold text-ink">
                {formatNumber(item.count)}{" "}
                <span className="text-[13px] font-normal text-grey">/ {formatNumber(stats.clinicCount)}</span>
              </p>
              <p className="mt-1 text-[13.5px] text-grey">{item.label}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
