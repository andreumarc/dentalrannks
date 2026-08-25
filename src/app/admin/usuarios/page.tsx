import type { Metadata } from "next";
import { getUsersPage } from "@/server/adminOps";
import { Input, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { Pagination } from "@/components/dashboard/pagination";
import { UserActiveControl, UserRoleControl } from "@/components/admin/user-row-controls";

export const metadata: Metadata = { title: "Usuarios", robots: { index: false, follow: false } };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; active?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const filters = {
    q: sp.q || undefined,
    role: sp.role || undefined,
    active: sp.active || undefined,
    page: Math.max(1, Number(sp.page) || 1),
  };
  const { rows, total, page, pageSize } = await getUsersPage(filters);

  const makeHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.role) params.set("role", filters.role);
    if (filters.active) params.set("active", filters.active);
    params.set("page", String(targetPage));
    return `/admin/usuarios?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-h3 text-ink">Usuarios</h1>
        <p className="mt-1 text-[14.5px] text-grey">{total} cuentas registradas.</p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs">
          <Label htmlFor="q">Buscar</Label>
          <Input id="q" name="q" placeholder="Nombre o email" defaultValue={filters.q ?? ""} />
        </div>
        <div>
          <Label htmlFor="role">Rol</Label>
          <Select id="role" name="role" defaultValue={filters.role ?? ""}>
            <option value="">Todos</option>
            <option value="USER">Usuario</option>
            <option value="SUPER_ADMIN">Super admin</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="active">Estado</Label>
          <Select id="active" name="active" defaultValue={filters.active ?? ""}>
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </Select>
        </div>
        <Button type="submit" variant="dark">
          Filtrar
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Sin usuarios" description="No hay cuentas que coincidan con los filtros." />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Usuario</Th>
                <Th>Organizaciones</Th>
                <Th>Último acceso</Th>
                <Th>Estado</Th>
                <Th>Rol</Th>
              </Tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <p className="font-medium text-ink">{u.name ?? "Sin nombre"}</p>
                    <p className="text-[12.5px] text-grey">{u.email}</p>
                  </Td>
                  <Td>{u._count.memberships}</Td>
                  <Td className="whitespace-nowrap text-[13px] text-grey-light">
                    {u.lastLoginAt ? u.lastLoginAt.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" }) : "Nunca"}
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-1.5">
                      <Badge variant={u.active ? "positive" : "negative"} size="sm">
                        {u.active ? "Activo" : "Inactivo"}
                      </Badge>
                      <UserActiveControl userId={u.id} active={u.active} />
                    </div>
                  </Td>
                  <Td>
                    <UserRoleControl userId={u.id} role={u.role} />
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
