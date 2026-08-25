"use client";

import { useId } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { paths } from "@/lib/seo/urls";

/**
 * Buscador de texto libre. Es un `<form method="get">` de verdad: funciona sin
 * JavaScript y produce URLs `?q=` compartibles, que es justo lo que hace
 * honesto el `SearchAction` declarado en la home.
 */
export function SearchBox({
  defaultValue = "",
  className,
  autoFocus = false,
  compact = false,
}: {
  defaultValue?: string;
  className?: string;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const id = useId();

  return (
    <form
      action={paths.search()}
      method="get"
      role="search"
      className={cn("flex w-full items-stretch gap-2", className)}
    >
      <label htmlFor={id} className="sr-only">
        Buscar tratamiento, municipio o clínica
      </label>
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-grey-light"
          aria-hidden="true"
        />
        <input
          id={id}
          type="search"
          name="q"
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          maxLength={120}
          autoComplete="off"
          placeholder="Implantes Barcelona, dentista Igualada…"
          className={cn(
            "w-full rounded-brand border border-line bg-white pl-10 pr-3.5 text-[15.5px] text-ink transition-colors placeholder:text-grey-light focus:border-cyan-brand focus:outline-none",
            compact ? "h-10" : "h-12",
          )}
        />
      </div>
      <button
        type="submit"
        className={cn(
          "shrink-0 rounded-brand border-2 border-cyan-brand bg-cyan-brand px-5 font-display text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:border-cyan-deep hover:bg-cyan-deep",
          compact ? "h-10 px-4 text-[12px]" : "h-12",
        )}
      >
        Buscar
      </button>
    </form>
  );
}
