import { STAGE_LABELS } from "@/server/dashboard";
import type { LeadEventType, LeadStatus } from "@prisma/client";

type TimelineEvent = {
  id: string;
  type: LeadEventType;
  fromStatus: LeadStatus | null;
  toStatus: LeadStatus | null;
  message: string | null;
  createdAt: Date;
  user: { name: string | null; email: string } | null;
};

const TYPE_LABELS: Record<LeadEventType, string> = {
  CREATED: "Lead recibido",
  STATUS_CHANGED: "Cambio de estado",
  ASSIGNED: "Reasignación",
  NOTE_ADDED: "Nota añadida",
  CONTACT_ATTEMPT: "Intento de contacto",
  EXPORTED: "Exportado",
  QUALITY_REVIEWED: "Calidad revisada",
};

function describe(event: TimelineEvent): string {
  if (event.type === "STATUS_CHANGED" && event.toStatus) {
    const from = event.fromStatus ? STAGE_LABELS[event.fromStatus] : "—";
    const to = STAGE_LABELS[event.toStatus];
    return `${from} → ${to}`;
  }
  if (event.type === "CREATED") return "Solicitud creada desde el marketplace";
  if (event.type === "NOTE_ADDED") return event.message ?? "Nota interna añadida";
  if (event.type === "ASSIGNED") return event.message ? "Reasignado" : "Sin asignar";
  return TYPE_LABELS[event.type];
}

export function LeadTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-[14px] text-grey">Todavía no hay actividad registrada.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {events.map((event) => (
        <li key={event.id} className="relative border-l-2 border-line pl-4">
          <span className="absolute -left-[5px] top-1 size-2 rounded-full bg-cyan-brand" />
          <p className="text-[13.5px] font-medium text-ink">{TYPE_LABELS[event.type]}</p>
          <p className="text-[13.5px] text-grey">{describe(event)}</p>
          <p className="mt-0.5 text-[11.5px] text-grey-light">
            {event.createdAt.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
            {event.user ? ` · ${event.user.name ?? event.user.email}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
