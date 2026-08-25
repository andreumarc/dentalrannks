import type { Metadata } from "next";
import { Euro, TrendingUp, Building2, Gavel, MousePointerClick, Users, Target, BarChart3 } from "lucide-react";
import { getAdminOverview, parseAdminPeriod } from "@/server/adminOps";
import { AdminPeriodTabs } from "@/components/admin/period-tabs";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { InfoNote } from "@/components/ui/states";
import { formatCents, formatNumber } from "@/lib/money";

export const metadata: Metadata = { title: "Resumen", robots: { index: false, follow: false } };

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const sp = await searchParams;
  const days = parseAdminPeriod(sp.days);
  const overview = await getAdminOverview(days);

  const hasActivity = overview.gmvCents > 0 || overview.leads > 0 || overview.clicks > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="display-h3 text-ink">Resumen</h1>
          <p className="mt-1 text-[14.5px] text-grey">Actividad de la plataforma en los últimos {days} días.</p>
        </div>
        <AdminPeriodTabs basePath="/admin" active={days} />
      </div>

      {!hasActivity ? (
        <InfoNote>
          Todavía no hay actividad registrada en este periodo. Las cifras aparecerán en cuanto haya recargas, clics o
          leads.
        </InfoNote>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="GMV (recargas)"
          value={formatCents(overview.gmvCents)}
          icon={<Euro className="size-4" />}
          tone="cyan"
          hint="Recargas de saldo confirmadas por Stripe"
        />
        <KpiTile
          label="Ingresos reconocidos"
          value={formatCents(overview.recognizedRevenueCents)}
          icon={<TrendingUp className="size-4" />}
          hint="Débitos por clic, lead y patrocinio"
        />
        <KpiTile
          label="Clínicas activas"
          value={formatNumber(overview.activeClinics)}
          icon={<Building2 className="size-4" />}
          hint="Fichas publicadas"
        />
        <KpiTile
          label="Mercados con puja"
          value={formatNumber(overview.marketsWithBids)}
          icon={<Gavel className="size-4" />}
        />
        <KpiTile
          label="Clics"
          value={formatNumber(overview.clicks)}
          icon={<MousePointerClick className="size-4" />}
          hint="Clics válidos en el periodo"
        />
        <KpiTile label="Leads" value={formatNumber(overview.leads)} icon={<Users className="size-4" />} />
        <KpiTile
          label="CPL medio"
          value={overview.cplCents !== null ? formatCents(overview.cplCents) : "—"}
          icon={<Target className="size-4" />}
          hint="Gasto en leads facturados / leads facturados"
        />
        <KpiTile
          label="ARPA"
          value={overview.arpaCents !== null ? formatCents(overview.arpaCents) : "—"}
          icon={<BarChart3 className="size-4" />}
          hint="Ingreso reconocido / clínicas con gasto"
        />
      </div>
    </div>
  );
}
