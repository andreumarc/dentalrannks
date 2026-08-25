"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { changeMarketStatusAction, updateMarketParamsAction } from "@/server/actions/adminOps";
import type { AdminFormState } from "@/server/adminOps";
import { centsToEuros } from "@/lib/money";

const initialState: AdminFormState = { ok: false };

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Activo" },
  { value: "PAUSED", label: "Pausado" },
  { value: "CLOSED", label: "Cerrado" },
];

const PRICING_OPTIONS = [
  { value: "BALANCE", label: "Saldo comprometido" },
  { value: "CPC", label: "Coste por clic" },
  { value: "CPL", label: "Coste por lead" },
];

export function MarketStatusControl({ marketId, currentStatus }: { marketId: string; currentStatus: string }) {
  const [state, formAction, pending] = useActionState(changeMarketStatusAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="marketId" value={marketId} />
      <div className="flex items-center gap-2">
        <Select name="status" defaultValue={currentStatus} className="h-9 text-[13px]" disabled={pending}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "…" : "Guardar"}
        </Button>
      </div>
      {state.message ? (
        <p className={state.ok ? "text-[12px] text-positive" : "text-[12px] text-negative"}>{state.message}</p>
      ) : null}
    </form>
  );
}

export function MarketParamsControl({
  marketId,
  minimumBidCents,
  bidIncrementCents,
  sponsoredSlots,
  pricingModel,
}: {
  marketId: string;
  minimumBidCents: number;
  bidIncrementCents: number;
  sponsoredSlots: number;
  pricingModel: string;
}) {
  const [state, formAction, pending] = useActionState(updateMarketParamsAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="marketId" value={marketId} />
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <input
          type="number"
          name="minimumBidEuros"
          defaultValue={centsToEuros(minimumBidCents)}
          min={0}
          step="1"
          className="h-9 w-full rounded-brand border border-line px-2 text-[13px]"
          aria-label="Puja mínima en euros"
        />
        <input
          type="number"
          name="bidIncrementEuros"
          defaultValue={centsToEuros(bidIncrementCents)}
          min={0.5}
          step="0.5"
          className="h-9 w-full rounded-brand border border-line px-2 text-[13px]"
          aria-label="Incremento en euros"
        />
        <input
          type="number"
          name="sponsoredSlots"
          defaultValue={sponsoredSlots}
          min={1}
          max={10}
          className="h-9 w-full rounded-brand border border-line px-2 text-[13px]"
          aria-label="Número de posiciones"
        />
        <Select name="pricingModel" defaultValue={pricingModel} className="h-9 text-[13px]">
          {PRICING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" variant="dark" size="sm" disabled={pending}>
        {pending ? "Guardando…" : "Actualizar parámetros"}
      </Button>
      {state.message ? (
        <p className={state.ok ? "text-[12px] text-positive" : "text-[12px] text-negative"}>{state.message}</p>
      ) : null}
    </form>
  );
}
