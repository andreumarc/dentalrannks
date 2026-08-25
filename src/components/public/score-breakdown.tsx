import type { ScoreBreakdown } from "@/lib/score";
import { scoreLabel } from "@/lib/score";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/** Desglose transparente del DentalRank Score. Nunca incluye una partida por dinero pagado. */
export function ScoreBreakdownCard({ breakdown }: { breakdown: ScoreBreakdown }) {
  const { label } = scoreLabel(breakdown.total);

  return (
    <Card accent>
      <CardHeader>
        <CardTitle>DentalRank Score</CardTitle>
        <CardDescription>
          Señal de calidad de ficha y servicio. No depende del importe pagado ni de la posición
          patrocinada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 flex items-baseline gap-2">
          <span className="font-display text-[36px] font-bold leading-none text-anthracite">
            {breakdown.total}
          </span>
          <span className="text-[14px] text-grey">/100 · {label}</span>
        </p>
        <ul className="space-y-2.5">
          {breakdown.components.map((c) => (
            <li key={c.key}>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-grey">{c.label}</span>
                <span className="font-medium text-ink">
                  {c.points}/{c.max}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-mist">
                <div
                  className="h-full rounded-full bg-cyan-brand"
                  style={{ width: `${c.max > 0 ? (c.points / c.max) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
