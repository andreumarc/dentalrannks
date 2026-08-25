import { cn } from "@/lib/utils";
import { scoreLabel } from "@/lib/score";

const TONE_CLASSES = {
  high: "bg-positive-tint text-positive",
  mid: "bg-warning-tint text-warning",
  low: "bg-mist text-grey",
} as const;

/** Insignia compacta del DentalRank Score, separada visualmente de lo patrocinado. */
export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const { label, tone } = scoreLabel(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-brand px-2.5 py-1 text-[12.5px] font-medium",
        TONE_CLASSES[tone],
        className,
      )}
      title="DentalRank Score: señal de calidad de ficha y servicio. No depende del dinero pagado."
    >
      <span className="font-display font-bold">{score}</span>
      <span className="text-[11px]">/100 · {label}</span>
    </span>
  );
}
