import type { Metadata } from "next";
import { getAdminLeadsPage } from "@/server/adminOps";
import { Input, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/dashboard/pagination";
import { LeadQualityForm } from "@/components/admin/lead-quality-form";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = { title: "Leads", robots: { index: false, follow: false } };

const QUALITY_LABEL: Record<string, string> = {
  UNREVIEWED: "Sin revisar",
  VALID: "Válido",
  INVALID: "Inválido",
  DUPLICATE: "Duplicado",
  SPAM: "Spam",
};
const QUALITY_VARIANT: Record<string, "neutral" | "positive" | "negative" | "warning"> = {
  UNREVIEWED: "neutral",
  VALID: "positive",
  INVALID: "negative",
  DUPLICATE: "warning",
  SPAM: "negative",
};

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ quality?: string; status?: string; q?: string; from?: string; to?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const filters = {
    quality: sp.quality || undefined,
    status: sp.status || undefined,
    q: sp.q || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    page: Math.max(1, Number(sp.page) || 1),
  };
  const { rows, total, page, pageSize } = await getAdminLeadsPage(filters);

  const makeHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (filters.quality) params.set("quality", filters.quality);
    if (filters.status) params.set("status", filters.status);
    if (filters.q) params.set("q", filters.q);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("page", String(targetPage));
    return `/admin/leads?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-h3 text-ink">Leads</h1>
        <p className="mt-1 text-[14.5px] text-grey">{total} solicitudes recibidas en toda la plataforma.</p>
      </div>

      <form method="get" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="q">Buscar</Label>
          <Input id="q" name="q" placeholder="Nombre, teléfono, clínica" defaultValue={filters.q ?? ""} />
        </div>
        <div>
          <Label htmlFor="quality">Calidad</Label>
          <Select id="quality" name="quality" defaultValue={filters.quality ?? ""}>
            <option value="">Todas</option>
            {Object.entries(QUALITY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="from">Desde</Label>
          <Input id="from" name="from" type="date" defaultValue={filters.from ?? ""} />
        </div>
        <div>
          <Label htmlFor="to">Hasta</Label>
          <Input id="to" name="to" type="date" defaultValue={filters.to ?? ""} />
        </div>
        <div className="flex items-end">
          <Button type="submit" variant="dark" block>
            Filtrar
          </Button>
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Sin leads" description="No hay solicitudes que coincidan con los filtros." />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Fecha</Th>
                <Th>Clínica</Th>
                <Th>Contacto</Th>
                <Th>Tratamiento</Th>
                <Th>Coste</Th>
                <Th className="min-w-[200px]">Calidad</Th>
              </Tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <Tr key={l.id}>
                  <Td className="whitespace-nowrap text-[13px] text-grey-light">{l.createdAt.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}</Td>
                  <Td className="font-medium text-ink">{l.clinic.name}</Td>
                  <Td className="text-[13.5px] text-grey">
                    {l.name} · {l.phone}
                  </Td>
                  <Td className="text-[13.5px] text-grey">{l.treatment?.name ?? "—"}</Td>
                  <Td className="text-[13.5px] text-grey">
                    {l.priceCents > 0 ? `${formatCents(l.priceCents)}${l.billed ? "" : " (pendiente)"}` : "—"}
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-1.5">
                      <Badge variant={QUALITY_VARIANT[l.quality]} size="sm">
                        {QUALITY_LABEL[l.quality]}
                      </Badge>
                      <LeadQualityForm leadId={l.id} billed={l.billed} priceCents={l.priceCents} />
                    </div>
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
