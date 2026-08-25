import Link from "next/link";
import { MapPin, Stethoscope, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/states";
import { formatNumber } from "@/lib/money";
import { TreatmentIconTile } from "@/components/ui/treatment-icon";

export function FeaturedTreatments({
  treatments,
}: {
  treatments: { slug: string; name: string; description: string | null; categoryName: string }[];
}) {
  return (
    <section className="section" aria-labelledby="tratamientos-heading">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker mb-3">Tratamientos</p>
            <h2 id="tratamientos-heading" className="display-h2 text-ink">
              Tratamientos más buscados
            </h2>
          </div>
          <Link
            href="/tratamientos"
            className="inline-flex items-center gap-1.5 font-display text-[13px] font-semibold uppercase tracking-[0.06em] text-cyan-deep hover:text-cyan-brand"
          >
            Ver todos <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {treatments.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={<Stethoscope className="size-5" />}
              title="Todavía no hay tratamientos publicados"
              description="En cuanto se den de alta clínicas y tratamientos, aparecerán aquí."
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {treatments.map((t) => (
              <Link
                key={t.slug}
                href={`/tratamientos/${t.slug}`}
                className="group flex flex-col rounded-brand border border-line border-t-[3px] border-t-cyan-brand bg-white p-5 transition-colors hover:border-cyan-brand"
              >
                <TreatmentIconTile
                  slug={t.slug}
                  category={t.categoryName}
                  className="transition-colors group-hover:bg-cyan-brand group-hover:text-white"
                />
                <p className="kicker-muted mt-4">{t.categoryName}</p>
                <h3 className="mt-1.5 font-display text-[16px] font-semibold uppercase tracking-[0.02em] text-ink group-hover:text-cyan-deep">
                  {t.name}
                </h3>
                {t.description ? (
                  <p className="mt-1.5 line-clamp-2 text-[13.5px] text-grey">{t.description}</p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function FeaturedCities({
  cities,
}: {
  cities: { slug: string; name: string; provinceName: string; clinicCount: number }[];
}) {
  return (
    <section className="section bg-mist" aria-labelledby="ciudades-heading">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker mb-3">Municipios</p>
            <h2 id="ciudades-heading" className="display-h2 text-ink">
              Municipios con más clínicas
            </h2>
          </div>
          <Link
            href="/ciudades"
            className="inline-flex items-center gap-1.5 font-display text-[13px] font-semibold uppercase tracking-[0.06em] text-cyan-deep hover:text-cyan-brand"
          >
            Ver todos <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {cities.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={<MapPin className="size-5" />}
              title="Todavía no hay municipios con clínicas"
              description="En cuanto haya clínicas publicadas, sus municipios aparecerán aquí."
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cities.map((c) => (
              <Link
                key={c.slug}
                href={`/dentistas/${c.slug}`}
                className="group rounded-brand border border-line bg-white p-5 transition-colors hover:border-cyan-brand"
              >
                <p className="kicker-muted">{c.provinceName}</p>
                <h3 className="mt-2 font-display text-[16px] font-semibold uppercase tracking-[0.02em] text-ink group-hover:text-cyan-deep">
                  {c.name}
                </h3>
                <p className="mt-1.5 text-[13.5px] text-grey">
                  {formatNumber(c.clinicCount)} {c.clinicCount === 1 ? "clínica" : "clínicas"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
