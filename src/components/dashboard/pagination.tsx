import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageSize,
  total,
  makeHref,
}: {
  page: number;
  pageSize: number;
  total: number;
  makeHref: (page: number) => string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-1 py-3 text-[13.5px] text-grey">
      <p>
        Página {page} de {totalPages} · {total} resultados
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={makeHref(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={cn(
            "flex size-8 items-center justify-center rounded-brand border border-line",
            page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-mist",
          )}
        >
          <ChevronLeft className="size-4" />
        </Link>
        <Link
          href={makeHref(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={cn(
            "flex size-8 items-center justify-center rounded-brand border border-line",
            page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-mist",
          )}
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
