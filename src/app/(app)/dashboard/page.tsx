import { MousePointerClick, Users, CalendarCheck, Wallet, Target, TrendingUp, Award } from "lucide-react";
import { requireActiveClinic, getDashboardKpis, getFunnel, parsePeriod } from "@/server/dashboard";
import { walletSummary } from "@/server/ledger";
import { NoClinicsState } from "@/components/dashboard/no-clinics";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { PeriodTabs } from "@/components/dashboard/period-tabs";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { Funnel } from "@/components/dashboard/funnel";
import { LowBalanceBanner } from "@/components/dashboard/low-balance-banner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCents, formatNumber } from "@/lib/money";

export default async function DashboardHomePage({
  searchParams,
}: {
  searchParams: Promise<{ clinic?: string; period?: string }>;
}) {
  const sp = await searchParams;
  const { active } = await requireActiveClinic(sp.clinic);
  if (!active) return <NoClinicsState />;

  const period = parsePeriod(sp.period);
  const clinicId = active.clinic.id;

  const [kpis, funnel, wallet] = await Promise.all([
    getDashboardKpis(clinicId, period),
    getFunnel(clinicId, period),
    walletSummary(clinicId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="display-h3 text-ink">Resumen</h1>
          <p className="mt-1 text-[14.5px] text-grey">Actividad de {active.clinic.name} en los últimos {period} días.</p>
        </div>
        <PeriodTabs basePath="/dashboard" clinicId={clinicId} active={period} />
      </div>

      <LowBalanceBanner
        balanceCents={wallet.balanceCents}
        thresholdCents={wallet.lowBalanceThresholdCents}
        clinicId={clinicId}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Leads" value={formatNumber(kpis.leads)} icon={<Users className="size-4" />} />
        <KpiTile label="Citas" value={formatNumber(kpis.appointments)} icon={<CalendarCheck className="size-4" />} />
        <KpiTile label="Clics" value={formatNumber(kpis.clicks)} icon={<MousePointerClick className="size-4" />} />
        <KpiTile label="Gasto" value={formatCents(kpis.spendCents)} icon={<Wallet className="size-4" />} />
        <KpiTile
          label="CPL medio"
          value={kpis.cplCents !== null ? formatCents(kpis.cplCents) : "—"}
          hint={kpis.cplCents === null ? "Sin leads en el periodo" : "Gasto total ÷ leads recibidos"}
          icon={<Target className="size-4" />}
        />
        <KpiTile
          label="Ratio de conversión"
          value={`${kpis.conversionRate}%`}
          hint="Leads que llegaron a Aceptado"
          icon={<TrendingUp className="size-4" />}
        />
        <KpiTile
          label="Mejor posición"
          value={kpis.bestPosition ? `#${kpis.bestPosition.position}` : "—"}
          hint={
            kpis.bestPosition
              ? `${kpis.bestPosition.treatmentName} · ${kpis.bestPosition.cityName}`
              : "Sin patrocinio activo"
          }
          icon={<Award className="size-4" />}
          tone="cyan"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Evolución</CardTitle>
            <CardDescription>Leads y clics diarios en el periodo seleccionado.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={kpis.series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Embudo de conversión</CardTitle>
            <CardDescription>Leads que alcanzaron cada etapa, sin importar el estado actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <Funnel stages={funnel.stages} totalLeads={funnel.totalLeads} lost={funnel.lost} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
