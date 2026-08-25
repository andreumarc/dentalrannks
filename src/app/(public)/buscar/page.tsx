import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Search, Stethoscope, Building2 } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { paths } from "@/lib/seo/urls";
import { searchSite, getPopularSearches } from "@/server/site-search";
import { safeRead } from "@/lib/safe";
import { Badge } from "@/components/ui/badge";
import { EmptyState, InfoNote } from "@/components/ui/states";
import { SearchBox } from "@/components/public/search-box";
import { formatNumber } from "@/lib/money";

/**
 * Buscador del sitio.
 *
 * Las páginas de resultados de búsqueda interna NO se indexan: son infinitas,
 * no aportan nada que no esté ya en las páginas de destino y consumirían
 * presupuesto de rastreo. Van `noindex, follow`, así que Google sigue los
 * enlaces y descubre desde aquí, pero no guarda la URL con `?q=`.
 *
 * La ruta existe además para que el `SearchAction` de la home sea cierto.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Buscar clínicas y tratamientos",
  description:
    "Busca un tratamiento, un municipio o una clínica dental concreta y ve directo a la página que responde tu búsqueda.",
  path: paths.search(),
  index: false,
  follow: true,
});

function Bloque({
  titulo,
  icono,
  children,
}: {
  titulo: string;
  icono: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold uppercase tracking-[0.06em] text-anthracite">
        <span className="text-cyan-deep" aria-hidden="true">
          {icono}
        </span>
        {titulo}
      </h2>
      <ul className="grid gap-2">{children}</ul>
    </section>
  );
}

function Fila({
  href,
  titulo,
  detalle,
  distintivo,
}: {
  href: string;
  titulo: string;
  detalle: string;
  distintivo?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center justify-between gap-4 rounded-brand border border-line bg-white px-4 py-3 transition-colors hover:border-cyan-brand"
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink group-hover:text-cyan-deep">{titulo}</span>
            {distintivo}
          </span>
          <span className="mt-0.5 block text-[13.5px] text-grey">{detalle}</span>
        </span>
        <ArrowRight
          className="size-4 shrink-0 text-grey-light transition-colors group-hover:text-cyan-brand"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const results = query
    ? await safeRead(() => searchSite(query), null, "buscar")
    : null;
  const populares = await safeRead(() => getPopularSearches(12), [], "buscar:populares");

  return (
    <div className="wrap section max-w-[860px]">
      <header className="grid gap-4">
        <p className="kicker">Buscador</p>
        <h1 className="display-h1 text-ink">
          {query ? <>Resultados para «{query}»</> : <>¿Qué estás buscando?</>}
        </h1>
        <p className="max-w-[60ch] text-[15.5px] text-grey">
          Escribe un tratamiento y un municipio —por ejemplo «implantes Barcelona»— y te llevamos
          directo a la comparativa. También puedes buscar una clínica por su nombre.
        </p>
        <SearchBox defaultValue={query} autoFocus={!query} className="mt-1" />
      </header>

      {results?.answer ? (
        <section className="mt-10" aria-labelledby="respuesta">
          <h2 id="respuesta" className="kicker-muted mb-3">
            Mejor coincidencia
          </h2>
          <Link
            href={results.answer.href}
            className="group flex flex-wrap items-center justify-between gap-4 rounded-brand border border-cyan-brand bg-cyan-tint px-5 py-4 shadow-card transition-colors hover:bg-cyan-brand"
          >
            <span>
              <span className="block font-display text-[19px] font-semibold uppercase tracking-[0.03em] text-ink group-hover:text-white">
                {results.answer.label}
              </span>
              <span className="mt-1 block text-[14px] text-cyan-deep group-hover:text-white/90">
                {results.answer.detail}
              </span>
            </span>
            <span className="inline-flex items-center gap-2 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-cyan-deep group-hover:text-white">
              Ver <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </Link>
        </section>
      ) : null}

      {results && results.total > 0 ? (
        <div className="mt-10 grid gap-8">
          {results.treatments.length > 0 ? (
            <Bloque titulo="Tratamientos" icono={<Stethoscope className="size-4" />}>
              {results.treatments.map((t) => (
                <Fila key={t.slug} href={t.href} titulo={t.name} detalle={t.categoryName} />
              ))}
            </Bloque>
          ) : null}

          {results.cities.length > 0 ? (
            <Bloque titulo="Municipios" icono={<MapPin className="size-4" />}>
              {results.cities.map((c) => (
                <Fila
                  key={c.slug}
                  href={c.href}
                  titulo={`Dentistas en ${c.name}`}
                  detalle={`${c.provinceName} · ${formatNumber(c.clinicCount)} ${c.clinicCount === 1 ? "clínica" : "clínicas"}`}
                />
              ))}
            </Bloque>
          ) : null}

          {results.clinics.length > 0 ? (
            <Bloque titulo="Clínicas" icono={<Building2 className="size-4" />}>
              {results.clinics.map((c) => (
                <Fila
                  key={c.slug}
                  href={c.href}
                  titulo={c.name}
                  detalle={c.cityName}
                  distintivo={
                    c.verified ? (
                      <Badge variant="cyan" size="sm">
                        Verificada
                      </Badge>
                    ) : undefined
                  }
                />
              ))}
            </Bloque>
          ) : null}
        </div>
      ) : null}

      {query && results && results.total === 0 && !results.answer ? (
        <div className="mt-10">
          <EmptyState
            icon={<Search className="size-5" />}
            title="No hemos encontrado nada con esa búsqueda"
            description="Prueba con el nombre del tratamiento y tu municipio, por separado o juntos. Si buscas una clínica concreta, escribe su nombre tal como aparece en su rótulo."
          />
        </div>
      ) : null}

      {query && !results ? (
        <div className="mt-10">
          <InfoNote tone="warning">
            El buscador no está disponible en este momento. Puedes navegar por{" "}
            <Link href={paths.treatmentHub()} className="underline">
              tratamientos
            </Link>{" "}
            o por{" "}
            <Link href={paths.cityHub()} className="underline">
              municipios
            </Link>
            .
          </InfoNote>
        </div>
      ) : null}

      {populares.length > 0 ? (
        <section className="mt-14 border-t border-line pt-8" aria-labelledby="populares">
          <h2 id="populares" className="kicker-muted mb-4">
            {query ? "Otras búsquedas frecuentes" : "Búsquedas frecuentes"}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {populares.map((p) => (
              <li key={p.href}>
                <Link
                  href={p.href}
                  className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-[13.5px] text-ink transition-colors hover:border-cyan-brand hover:text-cyan-deep"
                >
                  {p.label}
                  <span className="font-mono text-[11px] text-grey">{p.clinicCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
