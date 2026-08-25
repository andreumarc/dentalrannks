import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";

export function LowBalanceBanner({
  balanceCents,
  thresholdCents,
  clinicId,
}: {
  balanceCents: number;
  thresholdCents: number;
  clinicId: string;
}) {
  if (balanceCents >= thresholdCents) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-brand border border-warning/40 bg-warning-tint px-5 py-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="size-5 shrink-0 text-warning" />
        <p className="text-[14.5px] text-ink">
          Saldo bajo: <span className="font-semibold">{formatCents(balanceCents)}</span> disponibles (umbral{" "}
          {formatCents(thresholdCents)}). Tus posiciones patrocinadas podrían perderse si el saldo llega a cero.
        </p>
      </div>
      <Button asChild size="sm" variant="dark">
        <Link href={`/dashboard/saldo?clinic=${encodeURIComponent(clinicId)}`}>Recargar saldo</Link>
      </Button>
    </div>
  );
}
