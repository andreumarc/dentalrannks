import type { Metadata } from "next";
import { getBidsPage } from "@/server/adminOps";
import { Input, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/dashboard/pagination";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = { title: "Pujas", robots: { index: false, follow: false } };

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Activa",
  PAUSED: "Pausada",
  CANCELLED: "Cancelada",
  DEPLETED: "Agotada",
};
const STATUS_VARIANT: Record<string, "positive" | "warning" | "neutral" | "negative"> = {
  ACTIVE: "positive",
  PAUSED: "warning",
  CANCELLED: "negative",
  DEPLETED: "neutral",
};

export default async function AdminBidsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const filters = { status: sp.status || undefined, q: sp.q || undefined, page: Math.max(1, Number(sp.page) || 1) };
  const { rows, total, page, pageSize } = await getBidsPage(filters);

  const makeHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.q) params.set("q", filters.q);
    params.set("page", String(targetPage));
    return `/admin/pujas?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-h3 text-ink">Pujas</h1>
        <p className="mt-1 text-[14.5px] text-grey">{total} pujas registradas. La posición se calcula siempre en servidor.</p>
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
        <EmptyState title="Sin pujas" description="No hay pujas que coincidan con los filtros." />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Clínica</Th>
                <Th>Mercado</Th>
                <Th>Importe</Th>
                <Th>CPC máx.</Th>
                <Th>CPL</Th>
                <Th>Estado</Th>
                <Th>Posición</Th>
                <Th>Actualizada</Th>
              </Tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <Tr key={b.id}>
                  <Td className="font-medium text-ink">{b.clinic.name}</Td>
                  <Td className="text-[13.5px] text-grey">
                    {b.market.treatment.name} · {b.market.city.name}
                  </Td>
                  <Td>{formatCents(b.amountCents)}</Td>
                  <Td className="text-[13.5px] text-grey">{b.maxCpcCents ? formatCents(b.maxCpcCents) : "—"}</Td>
                  <Td className="text-[13.5px] text-grey">{b.cplCents ? formatCents(b.cplCents) : "—"}</Td>
                  <Td>
                    <Badge variant={STATUS_VARIANT[b.status]} size="sm">
                      {STATUS_LABEL[b.status]}
                    </Badge>
                  </Td>
                  <Td>
                    {b.position ? (
                      <Badge variant="cyan" size="sm">
                        #{b.position} de {b.market.sponsoredSlots}
                      </Badge>
                    ) : (
                      <span className="text-[13px] text-grey-light">Fuera de posiciones</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-[13px] text-grey-light">
                    {b.updatedAt.toLocaleDateString("es-ES")}
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
