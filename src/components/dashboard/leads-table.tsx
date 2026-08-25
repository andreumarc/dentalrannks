import Link from "next/link";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { LeadStatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/ui/states";
import type { LeadRow } from "@/server/crm";

const SOURCE_LABELS: Record<string, string> = {
  SEARCH_RESULTS: "Resultados de búsqueda",
  CLINIC_PROFILE: "Ficha de clínica",
  CITY_PAGE: "Página de ciudad",
  HOMEPAGE: "Portada",
  DIRECT: "Directo",
  IMPORT: "Importado",
};

export function LeadsTable({ rows, clinicId }: { rows: LeadRow[]; clinicId: string }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Sin leads con estos filtros"
        description="Ajusta los filtros o espera a que lleguen nuevas solicitudes desde el marketplace."
      />
    );
  }

  return (
    <TableWrap>
      <Table>
        <thead>
          <Tr>
            <Th>Fecha</Th>
            <Th>Paciente</Th>
            <Th>Tratamiento</Th>
            <Th>Ciudad</Th>
            <Th>Origen</Th>
            <Th>Estado</Th>
            <Th>Clínica</Th>
          </Tr>
        </thead>
        <tbody>
          {rows.map((lead) => (
            <Tr key={lead.id}>
              <Td className="whitespace-nowrap text-[13.5px] text-grey">
                {lead.createdAt.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </Td>
              <Td>
                <Link
                  href={`/dashboard/leads/${lead.id}?clinic=${encodeURIComponent(clinicId)}`}
                  className="font-medium text-cyan-deep hover:underline"
                >
                  {lead.name}
                </Link>
              </Td>
              <Td>{lead.treatmentName ?? "—"}</Td>
              <Td>{lead.cityName ?? "—"}</Td>
              <Td className="text-[13.5px] text-grey">{SOURCE_LABELS[lead.source] ?? lead.source}</Td>
              <Td>
                <LeadStatusBadge status={lead.status} />
              </Td>
              <Td className="text-[13.5px] text-grey">{lead.clinicName}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}
