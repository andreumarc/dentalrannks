import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAdminClinicDetail } from "@/server/adminOps";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClinicStatusForm } from "@/components/admin/clinic-status-form";
import { ClinicVerificationForm } from "@/components/admin/clinic-verification-form";
import { EnrichmentPanel } from "@/components/admin/enrichment-panel";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = { title: "Ficha de clínica", robots: { index: false, follow: false } };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING_REVIEW: "En revisión",
  PUBLISHED: "Publicada",
  SUSPENDED: "Suspendida",
};

const VERIFICATION_LABEL: Record<string, string> = {
  UNVERIFIED: "Sin verificar",
  PENDING: "Pendiente",
  VERIFIED: "Verificada",
  REJECTED: "Rechazada",
};

export default async function AdminClinicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAdminClinicDetail(id);
  if (!detail) notFound();

  const { clinic, responsible, blockers } = detail;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/clinicas" className="inline-flex items-center gap-1 text-[13.5px] text-grey hover:text-ink">
          <ChevronLeft className="size-4" /> Volver a clínicas
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="display-h3 text-ink">{clinic.name}</h1>
          <Badge variant="outline">{STATUS_LABEL[clinic.status]}</Badge>
          <Badge variant="outline">{VERIFICATION_LABEL[clinic.verificationStatus]}</Badge>
        </div>
        <p className="mt-1 text-[14px] text-grey">
          {clinic.organization.name} · {clinic.city.name} ({clinic.city.province.name})
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos legales y de contacto</CardTitle>
              <CardDescription>Requeridos para poder verificar la ficha.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Razón social" value={clinic.legalName} />
              <Field label="CIF / NIF" value={clinic.taxId} />
              <Field label="Dirección" value={`${clinic.address}, ${clinic.postalCode}`} />
              <Field label="Teléfono" value={clinic.phone} />
              <Field label="Email" value={clinic.email} />
              <Field label="Web" value={clinic.website} />
              <Field
                label="Persona responsable"
                value={responsible?.user.name ?? null}
                hint={responsible?.user.email}
              />
              <Field label="Tratamientos ofrecidos" value={String(clinic.treatments.length)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enriquecer desde la web</CardTitle>
              <CardDescription>
                Sugerencia manual de título, descripción y logo a partir de la web pública de la clínica.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnrichmentPanel clinicId={clinic.id} website={clinic.website} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado de publicación</CardTitle>
            </CardHeader>
            <CardContent>
              <ClinicStatusForm clinicId={clinic.id} currentStatus={clinic.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verificación</CardTitle>
              <CardDescription>
                Exige razón social, CIF, dirección y una persona responsable con nombre registrado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClinicVerificationForm clinicId={clinic.id} blockers={blockers} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-[14px] text-ink">
              <p>
                Saldo: <span className="font-medium">{formatCents(clinic.wallet?.balanceCents ?? 0)}</span>
              </p>
              <p>
                Leads recibidos: <span className="font-medium">{clinic._count.leads}</span>
              </p>
              <p>
                Pagos: <span className="font-medium">{clinic._count.payments}</span>
              </p>
              <p>
                Pujas activas: <span className="font-medium">{clinic._count.bids}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, hint }: { label: string; value: string | null | undefined; hint?: string | null }) {
  return (
    <div>
      <p className="kicker-muted">{label}</p>
      <p className="mt-1 text-[14.5px] text-ink">{value?.trim() ? value : <span className="text-negative">Sin especificar</span>}</p>
      {hint ? <p className="text-[12px] text-grey-light">{hint}</p> : null}
    </div>
  );
}
