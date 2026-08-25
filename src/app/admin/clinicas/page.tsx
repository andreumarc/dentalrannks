import type { Metadata } from "next";
import Link from "next/link";
import { getClinicsPage } from "@/server/adminOps";
import { Input, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/dashboard/pagination";
import { ClinicStatusForm } from "@/components/admin/clinic-status-form";

export const metadata: Metadata = { title: "Clínicas", robots: { index: false, follow: false } };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING_REVIEW: "En revisión",
  PUBLISHED: "Publicada",
  SUSPENDED: "Suspendida",
};

const STATUS_VARIANT: Record<string, "neutral" | "warning" | "positive" | "negative"> = {
  DRAFT: "neutral",
  PENDING_REVIEW: "warning",
  PUBLISHED: "positive",
  SUSPENDED: "negative",
};

const VERIFICATION_LABEL: Record<string, string> = {
  UNVERIFIED: "Sin verificar",
  PENDING: "Pendiente",
  VERIFIED: "Verificada",
  REJECTED: "Rechazada",
};

const VERIFICATION_VARIANT: Record<string, "neutral" | "warning" | "positive" | "negative"> = {
  UNVERIFIED: "neutral",
  PENDING: "warning",
  VERIFIED: "positive",
  REJECTED: "negative",
};

export default async function AdminClinicsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; verification?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const filters = {
    status: sp.status || undefined,
    verification: sp.verification || undefined,
    q: sp.q || undefined,
    page: Math.max(1, Number(sp.page) || 1),
  };
  const { rows, total, page, pageSize } = await getClinicsPage(filters);

  const makeHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.verification) params.set("verification", filters.verification);
    if (filters.q) params.set("q", filters.q);
    params.set("page", String(targetPage));
    return `/admin/clinicas?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-h3 text-ink">Clínicas</h1>
        <p className="mt-1 text-[14.5px] text-grey">{total} clínicas registradas en la plataforma.</p>
      </div>

      <form method="get" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-2">
          <Label htmlFor="q">Buscar</Label>
          <Input id="q" name="q" placeholder="Clínica, organización o municipio" defaultValue={filters.q ?? ""} />
        </div>
        <div>
          <Label htmlFor="status">Estado</Label>
          <Select id="status" name="status" defaultValue={filters.status ?? ""}>
            <option value="">Todos</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="verification">Verificación</Label>
          <Select id="verification" name="verification" defaultValue={filters.verification ?? ""}>
            <option value="">Todas</option>
            {Object.entries(VERIFICATION_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="col-span-2 flex items-end sm:col-span-4 sm:justify-end">
          <Button type="submit" variant="dark">
            Filtrar
          </Button>
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Sin resultados" description="No hay clínicas que coincidan con los filtros." />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Clínica</Th>
                <Th>Organización</Th>
                <Th>Municipio</Th>
                <Th>Estado</Th>
                <Th>Verificación</Th>
                <Th>Pujas</Th>
                <Th>Alta</Th>
                <Th>Ficha</Th>
              </Tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-medium text-ink">{c.name}</Td>
                  <Td className="text-[13.5px] text-grey">{c.organization.name}</Td>
                  <Td className="text-[13.5px] text-grey">{c.city.name}</Td>
                  <Td className="min-w-[220px]">
                    <div className="flex flex-col gap-1.5">
                      <Badge variant={STATUS_VARIANT[c.status]} size="sm">
                        {STATUS_LABEL[c.status]}
                      </Badge>
                      <ClinicStatusForm clinicId={c.id} currentStatus={c.status} />
                    </div>
                  </Td>
                  <Td>
                    <Badge variant={VERIFICATION_VARIANT[c.verificationStatus]} size="sm">
                      {VERIFICATION_LABEL[c.verificationStatus]}
                    </Badge>
                  </Td>
                  <Td className="text-[13.5px] text-grey">{c._count.bids}</Td>
                  <Td className="whitespace-nowrap text-[13px] text-grey-light">
                    {c.createdAt.toLocaleDateString("es-ES")}
                  </Td>
                  <Td>
                    <Link href={`/admin/clinicas/${c.id}`} className="text-[13.5px] font-medium text-cyan-deep hover:text-cyan-brand">
                      Gestionar
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} makeHref={makeHref} />
    </div>
  );
}
