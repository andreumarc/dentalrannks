import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Phone, Mail, MapPin, Stethoscope } from "lucide-react";
import { requireActiveClinic } from "@/server/dashboard";
import { getLeadDetail, getOrgUsersForClinic } from "@/server/crm";
import { NoClinicsState } from "@/components/dashboard/no-clinics";
import { LeadStatusBadge } from "@/components/dashboard/status-badge";
import { LeadStatusForm } from "@/components/dashboard/lead-status-form";
import { LeadNoteForm } from "@/components/dashboard/lead-note-form";
import { LeadAssignForm } from "@/components/dashboard/lead-assign-form";
import { LeadTimeline } from "@/components/dashboard/lead-timeline";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";

const CONSENT_LABELS: Record<string, string> = {
  DATA_SHARING: "Envío de datos a la clínica",
  MARKETING: "Comunicaciones comerciales",
};

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ clinic?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { user, active } = await requireActiveClinic(sp.clinic);
  if (!active) return <NoClinicsState />;

  const lead = await getLeadDetail(user, id);
  if (!lead) notFound();

  const members = await getOrgUsersForClinic(lead.clinicId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/dashboard/leads?clinic=${encodeURIComponent(active.clinic.id)}`}
          className="inline-flex items-center gap-1 text-[13.5px] text-grey hover:text-ink"
        >
          <ChevronLeft className="size-4" /> Volver a leads
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="display-h3 text-ink">{lead.name}</h1>
          <LeadStatusBadge status={lead.status} />
          {lead.quality !== "UNREVIEWED" ? <Badge variant="outline">{lead.quality}</Badge> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos del paciente</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <p className="flex items-center gap-2 text-[14.5px] text-ink">
                <Phone className="size-4 text-cyan-brand" /> {lead.phone}
              </p>
              <p className="flex items-center gap-2 text-[14.5px] text-ink">
                <Mail className="size-4 text-cyan-brand" /> {lead.email}
              </p>
              <p className="flex items-center gap-2 text-[14.5px] text-ink">
                <Stethoscope className="size-4 text-cyan-brand" /> {lead.treatment?.name ?? "Sin tratamiento asociado"}
              </p>
              <p className="flex items-center gap-2 text-[14.5px] text-ink">
                <MapPin className="size-4 text-cyan-brand" /> {lead.city?.name ?? "—"}
              </p>
              {lead.comment ? (
                <p className="sm:col-span-2 rounded-brand bg-mist px-3.5 py-2.5 text-[14px] text-ink">
                  “{lead.comment}”
                </p>
              ) : null}
              {lead.priceCents > 0 ? (
                <p className="sm:col-span-2 text-[13.5px] text-grey">
                  Coste de este lead: <span className="font-medium text-ink">{formatCents(lead.priceCents)}</span>
                  {lead.billed ? " (facturado)" : " (pendiente de facturar)"}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas internas</CardTitle>
              <CardDescription>Solo visibles para tu equipo.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <LeadNoteForm leadId={lead.id} />
              {lead.notes.length > 0 ? (
                <ul className="flex flex-col gap-3 border-t border-line pt-4">
                  {lead.notes.map((note) => (
                    <li key={note.id} className="text-[14px] text-ink">
                      <p>{note.body}</p>
                      <p className="mt-0.5 text-[11.5px] text-grey-light">
                        {note.createdAt.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consentimientos</CardTitle>
              <CardDescription>Registro de solo lectura, con versión y fecha.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {lead.consents.length === 0 ? (
                <p className="text-[14px] text-grey">Sin consentimientos registrados.</p>
              ) : (
                lead.consents.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-brand bg-mist px-3.5 py-2.5 text-[13.5px]">
                    <span className="text-ink">{CONSENT_LABELS[c.type] ?? c.type}</span>
                    <span className="text-grey">
                      {c.granted ? "Concedido" : "Denegado"} · v{c.version} ·{" "}
                      {c.createdAt.toLocaleDateString("es-ES")}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <LeadStatusForm leadId={lead.id} currentStatus={lead.status} />
              <div className="border-t border-line pt-4">
                <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-grey">Asignado a</p>
                <LeadAssignForm leadId={lead.id} currentUserId={lead.assignedToId} members={members} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadTimeline events={lead.events} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
