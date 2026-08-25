import type { FunnelStage } from "@/server/dashboard";
import { formatNumber } from "@/lib/money";

export function Funnel({ stages, totalLeads, lost }: { stages: FunnelStage[]; totalLeads: number; lost: number }) {
  if (totalLeads === 0) {
    return <p className="text-[14.5px] text-grey">Todavía no hay leads en este periodo.</p>;
  }

  const max = stages[0]?.count || 1;

  return (
    <div className="flex flex-col gap-3">
      {stages.map((stage, i) => {
        const widthPct = Math.max(6, Math.round((stage.count / max) * 100));
        const dropFromPrev = i === 0 ? null : stages[i - 1].count - stage.count;
        return (
          <div key={stage.key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between text-[13.5px]">
              <span className="font-medium text-ink">{stage.label}</span>
              <span className="text-grey">
                {formatNumber(stage.count)} · {stage.pct}%
              </span>
            </div>
            <div className="h-8 w-full overflow-hidden rounded-brand bg-mist">
              <div
                className="h-full rounded-brand bg-cyan-brand transition-[width]"
                style={{ width: `${widthPct}%` }}
              />
            </div>
            {dropFromPrev !== null && dropFromPrev > 0 ? (
              <p className="text-[11.5px] text-grey-light">−{formatNumber(dropFromPrev)} respecto a la etapa anterior</p>
            ) : null}
          </div>
        );
      })}
      {lost > 0 ? (
        <p className="mt-1 border-t border-line pt-3 text-[13px] text-grey">
          <span className="font-medium text-negative">{formatNumber(lost)} perdidos</span> en el periodo (no siguen en
          el embudo).
        </p>
      ) : null}
    </div>
  );
}
