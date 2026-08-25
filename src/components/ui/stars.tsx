import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({
  rating,
  count,
  size = 14,
  className,
}: {
  rating: number | null;
  count?: number;
  size?: number;
  className?: string;
}) {
  if (rating === null) {
    return <span className={cn("text-[13px] text-grey-light", className)}>Sin valoraciones</span>;
  }
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={cn(
              i <= rounded ? "fill-cyan-brand text-cyan-brand" : "fill-line text-line",
            )}
          />
        ))}
      </span>
      <span className="text-[13.5px] font-medium text-ink">
        {rating.toFixed(1).replace(".", ",")}
      </span>
      {typeof count === "number" ? (
        <span className="text-[13px] text-grey">
          · {count} {count === 1 ? "reseña" : "reseñas"}
        </span>
      ) : null}
      <span className="sr-only">
        Valoración {rating.toFixed(1)} sobre 5{typeof count === "number" ? ` con ${count} reseñas` : ""}
      </span>
    </span>
  );
}
