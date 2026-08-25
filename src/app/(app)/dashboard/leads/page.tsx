import { requireActiveClinic } from "@/server/dashboard";
import { getLeadsPage, getLeadFilterOptions, type LeadFilters } from "@/server/crm";
import { NoClinicsState } from "@/components/dashboard/no-clinics";
import { LeadsFilters } from "@/components/dashboard/leads-filters";
import { LeadsTable } from "@/components/dashboard/leads-table";
import { Pagination } from "@/components/dashboard/pagination";
import { ExportCsvButton } from "@/components/dashboard/export-csv-button";
import type { LeadStatus } from "@prisma/client";

const VALID_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "APPOINTMENT", "ATTENDED", "BUDGET", "ACCEPTED", "LOST"];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    clinic?: string;
    status?: string;
    treatmentId?: string;
    from?: string;
    to?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const { active } = await requireActiveClinic(sp.clinic);
  if (!active) return <NoClinicsState />;

  const clinicId = active.clinic.id;
  const filters: LeadFilters = {
    status: VALID_STATUSES.includes(sp.status as LeadStatus) ? (sp.status as LeadStatus) : undefined,
    treatmentId: sp.treatmentId || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    q: sp.q || undefined,
    page: Math.max(1, Number(sp.page) || 1),
  };

  const [{ rows, total, page, pageSize }, treatments] = await Promise.all([
    getLeadsPage(clinicId, active.clinic.name, filters),
    getLeadFilterOptions(clinicId),
  ]);

  const makeHref = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set("clinic", clinicId);
    if (filters.status) params.set("status", filters.status);
    if (filters.treatmentId) params.set("treatmentId", filters.treatmentId);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.q) params.set("q", filters.q);
    params.set("page", String(targetPage));
    return `/dashboard/leads?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="display-h3 text-ink">Leads</h1>
          <p className="mt-1 text-[14.5px] text-grey">{total} solicitudes de {active.clinic.name}.</p>
        </div>
        <ExportCsvButton clinicId={clinicId} clinicName={active.clinic.name} filters={filters} />
      </div>

      <LeadsFilters
        clinicId={clinicId}
        treatments={treatments}
        current={{ status: sp.status, treatmentId: sp.treatmentId, from: sp.from, to: sp.to, q: sp.q }}
      />

      <LeadsTable rows={rows} clinicId={clinicId} />
      <Pagination page={page} pageSize={pageSize} total={total} makeHref={makeHref} />
    </div>
  );
}
