import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/jsonld";

// El constructor del JSON-LD vive en `src/lib/seo/jsonld.ts` (junto al resto
// de datos estructurados del sitio) y se reexporta aquí para no romper a
// quien ya lo importa desde este archivo.
export { breadcrumbJsonLd };
export type { BreadcrumbItem };

/**
 * Paletas de las migas según el fondo sobre el que se pintan. `onDark` no es
 * solo un color más claro en el contenedor: el enlace y la página actual
 * también cambian, porque `text-ink` sobre antracita no llega al contraste
 * mínimo. Se resuelve aquí y no en cada página para que ninguna vuelva a
 * inventarse su propia combinación.
 */
const TONES = {
  default: {
    list: "text-grey",
    link: "hover:text-cyan-deep",
    current: "text-ink",
    chevron: "text-grey-light",
  },
  onDark: {
    list: "text-grey-soft",
    link: "hover:text-cyan-brand",
    current: "text-white",
    chevron: "text-white/35",
  },
} as const;

export type BreadcrumbTone = keyof typeof TONES;

/**
 * Migas de pan visibles + JSON-LD BreadcrumbList a partir de la misma lista,
 * para no duplicar datos entre la UI y el marcado estructurado. El último
 * elemento (la página actual) nunca lleva `href`: no se enlaza a sí misma y
 * se marca con `aria-current="page"`.
 */
export function Breadcrumbs({
  items,
  tone = "default",
  className,
}: {
  items: BreadcrumbItem[];
  /** `onDark` para cabeceras sobre fondo antracita o foto oscurecida. */
  tone?: BreadcrumbTone;
  className?: string;
}) {
  const palette = TONES[tone];

  return (
    <nav aria-label="Migas de pan" className={cn("mb-6", className)}>
      <ol className={cn("flex flex-wrap items-center gap-1.5 text-[13px]", palette.list)}>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 ? (
              <ChevronRight className={cn("size-3.5", palette.chevron)} aria-hidden="true" />
            ) : null}
            {item.href ? (
              <Link href={item.href} className={palette.link}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className={palette.current}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
