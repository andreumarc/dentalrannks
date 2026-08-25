import Link from "next/link";
import { cn } from "@/lib/utils";

export type LinkGridItem = {
  href: string;
  label: string;
  meta?: string;
};

/**
 * Bloque de enlazado interno reutilizable: una rejilla de tarjetas-enlace
 * con texto ancla natural (viene ya resuelto en `item.label`, distinto en
 * cada fila) y un dato corto opcional (recuento, distancia). Se usa tanto
 * en la combinación (otros tratamientos del municipio, mismo tratamiento en
 * municipios cercanos) como en la página de municipio (tratamientos
 * disponibles, municipios cercanos).
 */
export function LinkGrid({
  id,
  heading,
  items,
}: {
  id: string;
  heading: string;
  items: LinkGridItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={`${id}-heading`} className="border-t border-line py-10 sm:py-12">
      <h2 id={`${id}-heading`} className="display-h2 mb-5 text-ink">
        {heading}
      </h2>
      <ul className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3")}>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center justify-between gap-3 rounded-brand border border-line px-4 py-3.5 text-[14.5px] text-ink transition-colors hover:border-cyan-brand hover:text-cyan-deep"
            >
              <span>{item.label}</span>
              {item.meta ? (
                <span className="shrink-0 font-mono text-[11px] text-grey">{item.meta}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
