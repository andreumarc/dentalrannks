"use client";

import { useActionState, useState } from "react";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { reviewLeadQualityAction } from "@/server/actions/adminOps";
import type { AdminFormState } from "@/server/adminOps";

const initialState: AdminFormState = { ok: false };

const QUALITY_OPTIONS = [
  { value: "VALID", label: "Válido" },
  { value: "INVALID", label: "Inválido" },
  { value: "DUPLICATE", label: "Duplicado" },
  { value: "SPAM", label: "Spam" },
];

export function LeadQualityForm({ leadId, billed, priceCents }: { leadId: string; billed: boolean; priceCents: number }) {
  const [state, formAction, pending] = useActionState(reviewLeadQualityAction, initialState);
  const [quality, setQuality] = useState("VALID");

  const canRefund = billed && priceCents > 0 && quality !== "VALID";

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="leadId" value={leadId} />
      <div className="flex items-center gap-2">
        <Select
          name="quality"
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          className="h-9 text-[13px]"
          disabled={pending}
        >
          {QUALITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "…" : "Guardar"}
        </Button>
      </div>
      {canRefund ? (
        <label className="flex items-center gap-1.5 text-[12px] text-grey">
          <input type="checkbox" name="refund" className="size-3.5 accent-cyan-brand" />
          Reembolsar a la clínica
        </label>
      ) : null}
      {state.message ? (
        <p className={state.ok ? "text-[12px] text-positive" : "text-[12px] text-negative"}>{state.message}</p>
      ) : null}
    </form>
  );
}
