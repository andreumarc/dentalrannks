import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { formatCents } from "@/lib/money";
import type { LedgerEntryType, LedgerReason, WalletTransaction } from "@prisma/client";

const TYPE_LABELS: Record<LedgerEntryType, string> = {
  CREDIT: "Abono",
  DEBIT: "Cargo",
  REFUND: "Reembolso",
  ADJUSTMENT: "Ajuste",
};

const REASON_LABELS: Record<LedgerReason, string> = {
  TOPUP: "Recarga",
  CLICK: "Clic patrocinado",
  LEAD: "Lead facturado",
  SPONSORSHIP: "Patrocinio",
  MANUAL: "Manual",
  CHARGEBACK: "Contracargo",
  PROMO: "Promoción",
};

export function LedgerTable({ transactions }: { transactions: WalletTransaction[] }) {
  if (transactions.length === 0) {
    return <EmptyState title="Sin movimientos" description="Todavía no hay movimientos registrados en el saldo." />;
  }

  return (
    <TableWrap>
      <Table>
        <thead>
          <Tr>
            <Th>Fecha</Th>
            <Th>Tipo</Th>
            <Th>Motivo</Th>
            <Th>Importe</Th>
            <Th>Saldo resultante</Th>
            <Th>Referencia</Th>
          </Tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <Tr key={t.id}>
              <Td className="whitespace-nowrap text-[13.5px] text-grey">
                {t.createdAt.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
              </Td>
              <Td>
                <Badge variant={t.amountCents >= 0 ? "positive" : "negative"} size="sm">
                  {TYPE_LABELS[t.type]}
                </Badge>
              </Td>
              <Td>{REASON_LABELS[t.reason]}</Td>
              <Td className={t.amountCents >= 0 ? "font-medium text-positive" : "font-medium text-negative"}>
                {t.amountCents >= 0 ? "+" : ""}
                {formatCents(t.amountCents)}
              </Td>
              <Td>{formatCents(t.balanceAfterCents)}</Td>
              <Td className="text-[12.5px] text-grey-light">{t.reference ?? "—"}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}
