"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown, Search as SearchIcon } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { paths } from "@/lib/seo/urls";
import { SearchBox } from "@/components/public/search-box";

export type NavTreatment = { slug: string; name: string };
export type NavCity = { slug: string; name: string };

export function SiteHeader({
  treatments,
  cities,
}: {
  treatments: NavTreatment[];
  cities: NavCity[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="bg-anthracite text-[13.5px] text-grey-soft">
        <div className="wrap flex flex-wrap items-center justify-between gap-4 py-2.5">
          <p className="m-0">
            Compara clínicas dentales en España. Las posiciones patrocinadas van siempre
            etiquetadas.
          </p>
          <span className="hidden sm:block">
            <Link href="/para-clinicas" className="text-white hover:text-cyan-brand">
              ¿Eres una clínica?
            </Link>
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-line bg-white">
        <div className="wrap flex items-center justify-between gap-4 py-3">
          <Link href="/" aria-label="DentalRank, inicio">
            <Logo />
          </Link>

          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center gap-6">
              <li className="group relative">
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent py-2 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-anthracite hover:text-cyan-brand"
                >
                  Tratamientos <ChevronDown className="size-3.5" />
                </button>
                <div className="invisible absolute left-[-16px] top-full z-50 min-w-[280px] rounded-brand border border-line bg-white p-2 opacity-0 shadow-drop transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  {treatments.slice(0, 10).map((t) => (
                    <Link
                      key={t.slug}
                      href={`/tratamientos/${t.slug}`}
                      className="block rounded px-3.5 py-2.5 text-[15px] text-ink hover:bg-cyan-tint hover:text-cyan-deep"
                    >
                      {t.name}
                    </Link>
                  ))}
                  <Link
                    href="/tratamientos"
                    className="block rounded px-3.5 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-cyan-deep hover:bg-cyan-tint"
                  >
                    Ver todos
                  </Link>
                </div>
              </li>
              <li className="group relative">
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent py-2 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-anthracite hover:text-cyan-brand"
                >
                  Ciudades <ChevronDown className="size-3.5" />
                </button>
                <div className="invisible absolute left-[-16px] top-full z-50 grid min-w-[320px] grid-cols-2 rounded-brand border border-line bg-white p-2 opacity-0 shadow-drop transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  {cities.slice(0, 12).map((c) => (
                    <Link
                      key={c.slug}
                      href={`/dentistas/${c.slug}`}
                      className="block rounded px-3.5 py-2.5 text-[15px] text-ink hover:bg-cyan-tint hover:text-cyan-deep"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </li>
              <li>
                <Link
                  href="/como-funciona"
                  className="py-2 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-anthracite hover:text-cyan-brand"
                >
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link
                  href="/para-clinicas"
                  className="py-2 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-anthracite hover:text-cyan-brand"
                >
                  Para clínicas
                </Link>
              </li>
            </ul>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href={paths.search()}
              aria-label="Buscar tratamiento, municipio o clínica"
              className="grid size-10 place-items-center rounded-brand border border-line text-anthracite transition-colors hover:border-cyan-brand hover:text-cyan-deep"
            >
              <SearchIcon className="size-4" aria-hidden="true" />
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Acceder</Link>
            </Button>
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/alta-clinica">Dar de alta clínica</Link>
            </Button>
          </div>

          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
            className="cursor-pointer rounded-brand border border-line p-2.5 lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        <div className={cn("border-t border-line bg-white lg:hidden", open ? "block" : "hidden")}>
          <div className="wrap py-3 pb-6">
            <SearchBox compact className="mt-2" />
            <p className="kicker-muted mt-5 mb-1.5">Tratamientos</p>
            {treatments.slice(0, 8).map((t) => (
              <Link
                key={t.slug}
                href={`/tratamientos/${t.slug}`}
                onClick={() => setOpen(false)}
                className="block border-b border-line py-2.5 text-[16px]"
              >
                {t.name}
              </Link>
            ))}
            <p className="kicker-muted mt-5 mb-1.5">Ciudades</p>
            {cities.slice(0, 8).map((c) => (
              <Link
                key={c.slug}
                href={`/dentistas/${c.slug}`}
                onClick={() => setOpen(false)}
                className="block border-b border-line py-2.5 text-[16px]"
              >
                {c.name}
              </Link>
            ))}
            <div className="mt-5 flex flex-col gap-2.5">
              <Button asChild variant="outline" block>
                <Link href="/login">Acceder</Link>
              </Button>
              <Button asChild block>
                <Link href="/alta-clinica">Dar de alta clínica</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
