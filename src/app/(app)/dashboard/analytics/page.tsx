import { requireActiveClinic, getTreatmentBreakdown, getCityBreakdown, parsePeriod } from "@/server/dashboard";
import { getClinicMarkets } from "@/server/bids";
import { marketInsights } from "@/server/markets";
import { NoClinicsState } from "@/components/dashboard/no-clinics";
import { PeriodTabs } from "@/components/dashboard/period-tabs";
import { BreakdownChart } from "@/components/dashboard/breakdown-chart";
import { BreakdownTable } from "@/components/dashboard/breakdown-table";
import { MarketInsightsCard } from "@/components/dashboard/market-insights-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ clinic?: string; period?: string }>;
}) {
  const sp = await searchParams;
  const { active } = await requireActiveClinic(sp.clinic);
  if (!active) return <NoClinicsState />;

  const period = parsePeriod(sp.period);
  const clinicId = active.clinic.id;

  const [treatmentRows, cityRows, markets] = await Promise.all([
    getTreatmentBreakdown(clinicId, period),
    getCityBreakdown(clinicId, period),
    getClinicMarkets(clinicId),
  ]);

  const insights = await Promise.all(
    markets.map(async (m) => ({
      marketId: m.marketId,
      treatmentName: m.treatmentName,
      cityName: m.cityName,
      data: await marketInsights(m.marketId),
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="display-h3 text-ink">Analítica</h1>
          <p className="mt-1 text-[14.5px] text-grey">Desglose de rendimiento de {active.clinic.name}.</p>
        </div>
        <PeriodTabs basePath="/dashboard/analytics" clinicId={clinicId} active={period} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Por tratamiento</CardTitle>
            <CardDescription>Gasto en el periodo seleccionado.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <BreakdownChart rows={treatmentRows} />
            <BreakdownTable rows={treatmentRows} dimensionLabel="Tratamiento" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por ciudad</CardTitle>
            <CardDescription>Origen geográfico de clics y leads.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <BreakdownChart rows={cityRows} />
            <BreakdownTable rows={cityRows} dimensionLabel="Ciudad" />
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="display-h3 mb-3 text-ink">Market insights</h2>
        {insights.length === 0 ? (
          <p className="text-[14.5px] text-grey">
            Todavía no operas en ningún mercado de tratamiento × ciudad con actividad registrada.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {insights.map((i) => (
              <MarketInsightsCard key={i.marketId} treatmentName={i.treatmentName} cityName={i.cityName} insights={i.data} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
