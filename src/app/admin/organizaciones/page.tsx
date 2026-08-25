import type { Metadata } from "next";
import { getOrganizationsPage } from "@/server/adminOps";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/dashboard/pagination";

export const metadata: Metadata = { title: "Organizaciones", robots: { index: false, follow: false } };

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const filters = { q: sp.q || undefined, page: Math.max(1, Number(sp.page) || 1) };
  const { rows, total, page, pageSize } = await getOrganizationsPage(filters);

  const makeHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    params.set("page", String(targetPage));
    return `/admin/organizaciones?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-h3 text-ink">Organizaciones</h1>
        <p className="mt-1 text-[14.5px] text-grey">{total} organizaciones registradas.</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs">
          <Label htmlFor="q">Buscar</Label>
          <Input id="q" name="q" placeholder="Nombre de la organización" defaultValue={filters.q ?? ""} />
        </div>
        <Button type="submit" variant="dark">
          Filtrar
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Sin resultados" description="No hay organizaciones que coincidan con la búsqueda." />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Organización</Th>
                <Th>Razón social</Th>
                <Th>CIF</Th>
                <Th>Facturación</Th>
                <Th>Clínicas</Th>
                <Th>Miembros</Th>
                <Th>Alta</Th>
              </Tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <Tr key={o.id}>
                  <Td className="font-medium text-ink">{o.name}</Td>
                  <Td className="text-[13.5px] text-grey">{o.legalName ?? "—"}</Td>
                  <Td className="text-[13.5px] text-grey">{o.taxId ?? "—"}</Td>
                  <Td className="text-[13.5px] text-grey">{o.billingEmail ?? "—"}</Td>
                  <Td>{o._count.clinics}</Td>
                  <Td>{o._count.members}</Td>
                  <Td className="whitespace-nowrap text-[13px] text-grey-light">{o.createdAt.toLocaleDateString("es-ES")}</Td>
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
