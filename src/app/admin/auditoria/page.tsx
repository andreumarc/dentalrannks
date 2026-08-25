import type { Metadata } from "next";
import { getAuditLogPage } from "@/server/adminOps";
import { Input, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/dashboard/pagination";

export const metadata: Metadata = { title: "Auditoría", robots: { index: false, follow: false } };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string; from?: string; to?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const filters = {
    action: sp.action || undefined,
    entity: sp.entity || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    page: Math.max(1, Number(sp.page) || 1),
  };
  const { rows, total, page, pageSize, actionOptions, entityOptions } = await getAuditLogPage(filters);

  const makeHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (filters.action) params.set("action", filters.action);
    if (filters.entity) params.set("entity", filters.entity);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("page", String(targetPage));
    return `/admin/auditoria?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-h3 text-ink">Auditoría</h1>
        <p className="mt-1 text-[14.5px] text-grey">{total} eventos registrados.</p>
      </div>

      <form method="get" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor="action">Acción</Label>
          <Select id="action" name="action" defaultValue={filters.action ?? ""}>
            <option value="">Todas</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="entity">Entidad</Label>
          <Select id="entity" name="entity" defaultValue={filters.entity ?? ""}>
            <option value="">Todas</option>
            {entityOptions.map((e) => (
              <option key={e} value={e}>
                {e}
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
        <div className="col-span-2 sm:col-span-4">
          <Button type="submit" variant="dark">
            Filtrar
          </Button>
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Sin eventos" description="No hay eventos de auditoría que coincidan con los filtros." />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Fecha</Th>
                <Th>Acción</Th>
                <Th>Entidad</Th>
                <Th>Actor</Th>
                <Th>Metadatos</Th>
              </Tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <Tr key={a.id}>
                  <Td className="whitespace-nowrap text-[13px] text-grey-light">
                    {a.createdAt.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
                  </Td>
                  <Td className="font-mono text-[12.5px] text-ink">{a.action}</Td>
                  <Td className="text-[13.5px] text-grey">
                    {a.entity}
                    {a.entityId ? ` · ${a.entityId.slice(0, 10)}…` : ""}
                  </Td>
                  <Td className="text-[13.5px] text-grey">{a.actorEmail ?? "Sistema"}</Td>
                  <Td className="max-w-[320px] truncate text-[12px] text-grey-light">
                    {a.metadata ? JSON.stringify(a.metadata) : "—"}
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
