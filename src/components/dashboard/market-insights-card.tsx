import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InfoNote } from "@/components/ui/states";
import { formatCents, formatNumber } from "@/lib/money";
import { MIN_MARKET_SAMPLE, type marketInsights } from "@/server/markets";

type Insights = Awaited<ReturnType<typeof marketInsights>>;

export function MarketInsightsCard({
  treatmentName,
  cityName,
  insights,
}: {
  treatmentName: string;
  cityName: string;
  insights: Insights;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{treatmentName}</CardTitle>
        <CardDescription>{cityName}</CardDescription>
      </CardHeader>
      <CardContent>
        {!insights.enoughSample ? (
          <InfoNote>
            Muestra insuficiente (mínimo {MIN_MARKET_SAMPLE} clínicas pujando) para publicar cifras de mercado sin
            riesgo de identificar a un competidor concreto.
          </InfoNote>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-[13.5px]">
            <div>
              <dt className="text-grey">Clínicas patrocinadas</dt>
              <dd className="font-medium text-ink">{formatNumber(insights.sponsoredClinics)} / {insights.sponsoredSlots} plazas</dd>
            </div>
            <div>
              <dt className="text-grey">Puja media</dt>
              <dd className="font-medium text-ink">{insights.averageBidCents !== null ? formatCents(insights.averageBidCents) : "—"}</dd>
            </div>
            <div>
              <dt className="text-grey">Puja más alta</dt>
              <dd className="font-medium text-ink">{insights.topBidCents !== null ? formatCents(insights.topBidCents) : "—"}</dd>
            </div>
            <div>
              <dt className="text-grey">CPL medio del mercado</dt>
              <dd className="font-medium text-ink">{insights.averageCplCents !== null ? formatCents(insights.averageCplCents) : "—"}</dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
