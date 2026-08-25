import { requireActiveClinic } from "@/server/dashboard";
import { getClinicMarkets, getBudget } from "@/server/bids";
import { NoClinicsState } from "@/components/dashboard/no-clinics";
import { MarketCard } from "@/components/dashboard/market-card";
import { BudgetForm } from "@/components/dashboard/budget-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";

export default async function PosicionesPage({
  searchParams,
}: {
  searchParams: Promise<{ clinic?: string }>;
}) {
  const sp = await searchParams;
  const { active } = await requireActiveClinic(sp.clinic);
  if (!active) return <NoClinicsState />;

  const clinicId = active.clinic.id;
  const [markets, budget] = await Promise.all([getClinicMarkets(clinicId), getBudget(clinicId)]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-h3 text-ink">Posiciones patrocinadas</h1>
        <p className="mt-1 text-[14.5px] text-grey">
          Mercados de tratamiento × municipio donde {active.clinic.name} puede pujar. Las posiciones se calculan
          siempre en servidor.
        </p>
      </div>

      {markets.length === 0 ? (
        <EmptyState
          title="Sin mercados disponibles"
          description="Añade tratamientos en tu ficha para que se abran mercados de puja en tu municipio."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {markets.map((m) => (
            <MarketCard key={m.marketId} market={m} clinicId={clinicId} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Presupuesto y límites</CardTitle>
          <CardDescription>Configura tu presupuesto de referencia para el patrocinio de esta clínica.</CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetForm clinicId={clinicId} budget={budget} />
        </CardContent>
      </Card>
    </div>
  );
}
