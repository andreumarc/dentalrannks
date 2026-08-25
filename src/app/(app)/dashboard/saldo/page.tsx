import { requireActiveClinic, getWalletPageData } from "@/server/dashboard";
import { NoClinicsState } from "@/components/dashboard/no-clinics";
import { WalletTopUpButtons } from "@/components/dashboard/wallet-topup-buttons";
import { LedgerTable } from "@/components/dashboard/ledger-table";
import { Pagination } from "@/components/dashboard/pagination";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { Wallet, AlertTriangle, TrendingDown } from "lucide-react";
import { formatCents } from "@/lib/money";

export default async function SaldoPage({
  searchParams,
}: {
  searchParams: Promise<{ clinic?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { active } = await requireActiveClinic(sp.clinic);
  if (!active) return <NoClinicsState />;

  const clinicId = active.clinic.id;
  const page = Math.max(1, Number(sp.page) || 1);
  const { summary, total, pageSize, transactions } = await getWalletPageData(clinicId, page);

  const makeHref = (targetPage: number) => `/dashboard/saldo?clinic=${encodeURIComponent(clinicId)}&page=${targetPage}`;
  const isLow = summary.balanceCents < summary.lowBalanceThresholdCents;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-h3 text-ink">Saldo</h1>
        <p className="mt-1 text-[14.5px] text-grey">Libro mayor de {active.clinic.name}. El saldo nunca se modifica desde el cliente.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile
          label="Saldo disponible"
          value={formatCents(summary.balanceCents)}
          icon={<Wallet className="size-4" />}
          tone={isLow ? "default" : "cyan"}
        />
        <KpiTile
          label="Umbral de saldo bajo"
          value={formatCents(summary.lowBalanceThresholdCents)}
          icon={<AlertTriangle className="size-4" />}
        />
        <KpiTile
          label="Gasto histórico"
          value={formatCents(summary.lifetimeSpendCents)}
          icon={<TrendingDown className="size-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recargar saldo</CardTitle>
          <CardDescription>El pago se procesa a través de Stripe. El saldo se actualiza tras la confirmación del pago.</CardDescription>
        </CardHeader>
        <CardContent>
          <WalletTopUpButtons clinicId={clinicId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <LedgerTable transactions={transactions} />
          <Pagination page={page} pageSize={pageSize} total={total} makeHref={makeHref} />
        </CardContent>
      </Card>
    </div>
  );
}
