import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { getPaymentsPage, stripeDashboardUrl } from "@/server/adminOps";
import { Input, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/dashboard/pagination";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = { title: "Pagos", robots: { index: false, follow: false } };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  SUCCEEDED: "Completado",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
};
const STATUS_VARIANT: Record<string, "warning" | "positive" | "negative" | "neutral"> = {
  PENDING: "warning",
  SUCCEEDED: "positive",
  FAILED: "negative",
  REFUNDED: "neutral",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const filters = { status: sp.status || undefined, q: sp.q || undefined, page: Math.max(1, Number(sp.page) || 1) };
  const { rows, total, page, pageSize } = await getPaymentsPage(filters);

  const makeHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.q) params.set("q", filters.q);
    params.set("page", String(targetPage));
    return `/admin/pagos?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-h3 text-ink">Pagos</h1>
        <p className="mt-1 text-[14.5px] text-grey">{total} pagos. El saldo solo se actualiza desde el webhook de Stripe.</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs">
          <Label htmlFor="q">Buscar clínica</Label>
          <Input id="q" name="q" placeholder="Nombre de la clínica" defaultValue={filters.q ?? ""} />
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
        <Button type="submit" variant="dark">
          Filtrar
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Sin pagos" description="No hay pagos que coincidan con los filtros." />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Fecha</Th>
                <Th>Clínica</Th>
                <Th>Importe</Th>
                <Th>Estado</Th>
                <Th>Motivo del fallo</Th>
                <Th>Stripe</Th>
              </Tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const url = stripeDashboardUrl(p.stripePaymentIntentId);
                return (
                  <Tr key={p.id}>
                    <Td className="whitespace-nowrap text-[13px] text-grey-light">
                      {p.createdAt.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
                    </Td>
                    <Td className="font-medium text-ink">{p.clinic.name}</Td>
                    <Td>{formatCents(p.amountCents)}</Td>
                    <Td>
                      <Badge variant={STATUS_VARIANT[p.status]} size="sm">
                        {STATUS_LABEL[p.status]}
                      </Badge>
                    </Td>
                    <Td className="text-[13px] text-grey-light">{p.failureReason ?? "—"}</Td>
                    <Td>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-[13px] font-medium text-cyan-deep hover:text-cyan-brand"
                        >
                          Ver <ExternalLink className="size-3.5" />
                        </a>
                      ) : (
                        <span className="text-[13px] text-grey-light">—</span>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} makeHref={makeHref} />
    </div>
  );
}
