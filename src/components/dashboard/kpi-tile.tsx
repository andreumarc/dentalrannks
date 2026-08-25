import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiTile({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "cyan";
}) {
  return (
    <Card className="flex flex-col gap-2 p-5" accent={tone === "cyan"}>
      <div className="flex items-center justify-between">
        <span className="kicker-muted">{label}</span>
        {icon ? <span className="text-cyan-brand">{icon}</span> : null}
      </div>
      <p className={cn("font-display text-[26px] font-semibold leading-none text-ink")}>{value}</p>
      {hint ? <p className="text-[13px] text-grey">{hint}</p> : null}
    </Card>
  );
}
