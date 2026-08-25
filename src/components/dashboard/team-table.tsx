import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { TeamMemberRow, PendingInvitation } from "@/server/dashboard";

export function TeamTable({ members, invitations }: { members: TeamMemberRow[]; invitations: PendingInvitation[] }) {
  return (
    <div className="flex flex-col gap-6">
      <TableWrap>
        <Table>
          <thead>
            <Tr>
              <Th>Nombre</Th>
              <Th>Email</Th>
              <Th>Rol</Th>
              <Th>Desde</Th>
            </Tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <Tr key={m.userId}>
                <Td className="font-medium text-ink">{m.name}</Td>
                <Td className="text-grey">{m.email}</Td>
                <Td>
                  <Badge variant={m.role === "CLINIC_ADMIN" ? "cyan" : "neutral"}>
                    {m.role === "CLINIC_ADMIN" ? "Administrador" : "Equipo"}
                  </Badge>
                </Td>
                <Td className="text-[13.5px] text-grey">{m.joinedAt.toLocaleDateString("es-ES")}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>

      {invitations.length > 0 ? (
        <div>
          <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-grey">Invitaciones pendientes</p>
          <ul className="flex flex-col gap-2">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-brand border border-dashed border-line px-4 py-2.5 text-[13.5px]"
              >
                <span className="text-ink">{inv.email}</span>
                <span className="text-grey">
                  {inv.role === "CLINIC_ADMIN" ? "Administrador" : "Equipo"} · expira el{" "}
                  {inv.expiresAt.toLocaleDateString("es-ES")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
