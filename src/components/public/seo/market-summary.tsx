import { formatCentsCompact, formatNumber } from "@/lib/money";
import { InfoNote } from "@/components/ui/states";
import type { ComboStats } from "@/server/seo-stats";
import { comboSummaryText, priceUnavailableNote } from "./copy";

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-brand border border-line bg-white px-4 py-3.5">
      <p className="kicker-muted">{label}</p>
      <p className="mt-1 font-display text-[22px] font-semibold text-ink">{value}</p>
    </div>
  );
}

/**
 * "Resumen de mercado" + "Precios de {tratamiento} en {municipio}" (punto 1
 * del encargo), la sección que más distingue una página de combinación de
 * un molde reutilizado: cifras reales de `ComboStats`, nunca estimadas.
 *
 * Cuando `stats.price` es `null` no hay muestra suficiente
 * (`MIN_PRICE_SAMPLE` clínicas con precio declarado): se dice explícitamente
 * en vez de mostrar un rango inventado.
 */
export function MarketSummary({
  treatmentName,
  cityName,
  stats,
}: {
  treatmentName: string;
  cityName: string;
  stats: ComboStats;
}) {
  return (
    <section aria-labelledby="resumen-mercado-heading" className="py-10 sm:py-12">
      <h2 id="resumen-mercado-heading" className="display-h2 mb-4 text-ink">
        {treatmentName} en {cityName}: resumen
      </h2>
      <p className="max-w-[70ch] text-[15.5px] text-grey">{comboSummaryText(treatmentName, cityName, stats)}</p>

      <div className="mt-7">
        <h3 className="display-h3 mb-3 text-ink">
          Precios de {treatmentName.toLowerCase()} en {cityName}
        </h3>
        {stats.price ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatBox label="Desde" value={formatCentsCompact(stats.price.minCents)} />
              <StatBox label="Mediana" value={formatCentsCompact(stats.price.medianCents)} />
              <StatBox label="Hasta" value={formatCentsCompact(stats.price.maxCents)} />
            </div>
            <p className="mt-3 max-w-[70ch] text-[13px] text-grey-light">
              Precios &ldquo;desde&rdquo; declarados por {formatNumber(stats.price.sampleSize)}{" "}
              {stats.price.sampleSize === 1 ? "clínica" : "clínicas"}. No incluyen necesariamente las mismas
              pruebas, materiales o revisiones: pide presupuesto detallado antes de decidir.
            </p>
          </>
        ) : (
          <InfoNote tone="neutral">{priceUnavailableNote(cityName)}</InfoNote>
        )}
      </div>
    </section>
  );
}
