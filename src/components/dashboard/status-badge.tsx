import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@prisma/client";

const CONFIG: Record<LeadStatus, { label: string; variant: "neutral" | "cyan" | "positive" | "negative" | "warning" }> = {
  NEW: { label: "Nuevo", variant: "cyan" },
  CONTACTED: { label: "Contactado", variant: "neutral" },
  APPOINTMENT: { label: "Cita", variant: "warning" },
  ATTENDED: { label: "Asistido", variant: "warning" },
  BUDGET: { label: "Presupuesto", variant: "warning" },
  ACCEPTED: { label: "Aceptado", variant: "positive" },
  LOST: { label: "Perdido", variant: "negative" },
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const cfg = CONFIG[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = (
  Object.keys(CONFIG) as LeadStatus[]
).map((key) => ({ value: key, label: CONFIG[key].label }));
