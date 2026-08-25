import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/states";
import { formatCents, formatNumber } from "@/lib/money";
import type { BreakdownRow } from "@/server/dashboard";

export function BreakdownTable({ rows, dimensionLabel }: { rows: BreakdownRow[]; dimensionLabel: string }) {
  if (rows.length === 0) {
    return <EmptyState title="Sin datos en el periodo" description="Todavía no hay clics ni leads que desglosar." />;
  }

  return (
    <TableWrap>
      <Table>
        <thead>
          <Tr>
            <Th>{dimensionLabel}</Th>
            <Th>Clics</Th>
            <Th>Leads</Th>
            <Th>Gasto</Th>
            <Th>CPL</Th>
          </Tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.id}>
              <Td className="font-medium text-ink">{r.name}</Td>
              <Td>{formatNumber(r.clicks)}</Td>
              <Td>{formatNumber(r.leads)}</Td>
              <Td>{formatCents(r.spendCents)}</Td>
              <Td>{r.cplCents !== null ? formatCents(r.cplCents) : "—"}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}
