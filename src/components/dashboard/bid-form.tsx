"use client";

import { useActionState, useMemo, useState } from "react";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { placeBidAction } from "@/server/actions/bids";
import type { BidFormState } from "@/server/bids";
import { centsToEuros } from "@/lib/money";

const initialState: BidFormState = { ok: false, message: "" };

export function BidForm({
  marketId,
  clinicId,
  minimumBidCents,
  suggestedCents,
  ctaLabel,
}: {
  marketId: string;
  clinicId: string;
  minimumBidCents: number;
  suggestedCents: number;
  ctaLabel: string;
}) {
  const [state, formAction, pending] = useActionState(placeBidAction, initialState);
  const requestId = useMemo(() => `${marketId}:${clinicId}:${crypto.randomUUID()}`, [marketId, clinicId]);
  const [amount, setAmount] = useState(() => centsToEuros(Math.max(suggestedCents, minimumBidCents)).toFixed(2));

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="marketId" value={marketId} />
      <input type="hidden" name="clinicId" value={clinicId} />
      <input type="hidden" name="requestId" value={requestId} />
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor={`amount-${marketId}`}>Importe comprometido (€)</Label>
          <Input
            id={`amount-${marketId}`}
            name="amountEuros"
            type="number"
            min={centsToEuros(minimumBidCents)}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={pending} size="md">
          {pending ? "Procesando…" : ctaLabel}
        </Button>
      </div>
      {state.message ? (
        <FieldError>{!state.ok ? state.message : null}</FieldError>
      ) : null}
      {state.ok && state.message ? <p className="text-[13px] text-positive">{state.message}</p> : null}
    </form>
  );
}
