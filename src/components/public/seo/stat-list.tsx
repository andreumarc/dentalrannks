import { cn } from "@/lib/utils";

/**
 * Lista de texto editorial reutilizable: "qué compone el precio", "qué
 * preguntar antes de aceptar un presupuesto"... Sin numerar por defecto
 * (son puntos a tener en cuenta, no pasos en orden); `ordered` la convierte
 * en una lista de pasos cuando el orden sí importa.
 */
export function StatList({
  id,
  heading,
  items,
  ordered = false,
}: {
  id: string;
  heading: string;
  items: string[];
  ordered?: boolean;
}) {
  if (items.length === 0) return null;
  const ListTag = ordered ? "ol" : "ul";

  return (
    <section aria-labelledby={`${id}-heading`} className="border-t border-line py-10 sm:py-12">
      <h2 id={`${id}-heading`} className="display-h2 mb-5 text-ink">
        {heading}
      </h2>
      <ListTag
        className={cn(
          "max-w-[70ch] space-y-2.5",
          ordered && "list-decimal pl-5 marker:font-mono marker:text-[13px] marker:text-cyan-deep",
        )}
      >
        {items.map((text) => (
          <li key={text} className={cn("text-[14.5px] leading-relaxed text-grey", !ordered && "flex gap-2.5")}>
            {!ordered ? (
              <span className="mt-[8px] size-1.5 shrink-0 rounded-full bg-cyan-brand" aria-hidden="true" />
            ) : null}
            <span>{text}</span>
          </li>
        ))}
      </ListTag>
    </section>
  );
}
