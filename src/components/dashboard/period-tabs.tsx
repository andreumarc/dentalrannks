import Link from "next/link";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
  { value: "90", label: "90 días" },
];

export function PeriodTabs({
  basePath,
  clinicId,
  active,
}: {
  basePath: string;
  clinicId: string;
  active: number;
}) {
  return (
    <div className="inline-flex rounded-brand border border-line bg-white p-1">
      {OPTIONS.map((opt) => {
        const isActive = String(active) === opt.value;
        return (
          <Link
            key={opt.value}
            href={`${basePath}?clinic=${encodeURIComponent(clinicId)}&period=${opt.value}`}
            className={cn(
              "rounded-[4px] px-3.5 py-1.5 font-display text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors",
              isActive ? "bg-anthracite text-white" : "text-grey hover:text-ink",
            )}
            aria-current={isActive ? "true" : undefined}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
