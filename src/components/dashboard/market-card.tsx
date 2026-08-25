import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoNote } from "@/components/ui/states";
import { BidForm } from "@/components/dashboard/bid-form";
import { formatCents } from "@/lib/money";
import type { ClinicMarketRow } from "@/server/bids";

export function MarketCard({ market, clinicId }: { market: ClinicMarketRow; clinicId: string }) {
  const hasBid = market.myBid !== null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{market.treatmentName}</CardTitle>
          <CardDescription>{market.cityName}</CardDescription>
        </div>
        {market.myPosition ? (
          <Badge variant={market.myPosition === 1 ? "solid" : "cyan"} size="md">
            Tu posición #{market.myPosition}
          </Badge>
        ) : (
          <Badge variant="neutral">Sin patrocinio</Badge>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: market.sponsoredSlots }).map((_, i) => {
            const position = i + 1;
            const occupant = market.occupants.find((o) => o.position === position);
            return (
              <span
                key={position}
                className={
                  "inline-flex items-center gap-1.5 rounded-brand border px-3 py-1.5 text-[12.5px] " +
                  (occupant?.isMine
                    ? "border-cyan-brand bg-cyan-tint text-cyan-deep font-medium"
                    : occupant
                      ? "border-line bg-mist text-grey"
                      : "border-dashed border-line text-grey-light")
                }
              >
                #{position} {occupant ? (occupant.isMine ? "Tu clínica" : `Clínica patrocinada #${position}`) : "Libre"}
              </span>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 text-[13.5px]">
          <p className="text-grey">
            Comprometido actual: <span className="font-medium text-ink">{hasBid ? formatCents(market.myBid!.amountCents) : "0 €"}</span>
          </p>
          <p className="text-grey">
            Puja mínima: <span className="font-medium text-ink">{formatCents(market.minimumBidCents)}</span>
          </p>
        </div>

        {market.myPosition === 1 ? (
          <InfoNote tone="cyan">Ocupas la posición #1 en este mercado. No hay outbid disponible por ahora.</InfoNote>
        ) : market.outbid ? (
          <div className="rounded-brand border border-cyan-brand/30 bg-cyan-tint px-4 py-3">
            <p className="text-[13.5px] text-cyan-deep">
              Pasar de {market.myPosition ? `#${market.myPosition}` : "sin patrocinio"} a #{market.outbid.targetPosition} · Comprometido
              actual {formatCents(market.outbid.currentCents)} · Total necesario{" "}
              {formatCents(market.outbid.requiredTotalCents)} · Pagar ahora{" "}
              <span className="font-semibold">{formatCents(market.outbid.payNowCents)}</span>
            </p>
          </div>
        ) : null}
      </CardContent>

      <CardFooter>
        <BidForm
          marketId={market.marketId}
          clinicId={clinicId}
          minimumBidCents={market.minimumBidCents}
          suggestedCents={market.outbid?.requiredTotalCents ?? market.minimumBidCents}
          ctaLabel={market.outbid ? `Reclamar #${market.outbid.targetPosition}` : hasBid ? "Actualizar puja" : "Pujar"}
        />
      </CardFooter>
    </Card>
  );
}
