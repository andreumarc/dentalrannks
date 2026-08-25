"use client";

import { useActionState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InfoNote } from "@/components/ui/states";
import { updateClinicBudgetAction } from "@/server/actions/bids";
import { centsToEuros } from "@/lib/money";

const initialState = { ok: false, message: "" };

export function BudgetForm({
  clinicId,
  budget,
}: {
  clinicId: string;
  budget: { monthlyBudgetCents: number; maxCpcCents: number | null; targetCplCents: number | null } | null;
}) {
  const [state, formAction, pending] = useActionState(updateClinicBudgetAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="clinicId" value={clinicId} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="monthlyBudgetEuros">Presupuesto mensual (€)</Label>
          <Input
            id="monthlyBudgetEuros"
            name="monthlyBudgetEuros"
            type="number"
            min={0}
            step="1"
            defaultValue={budget ? centsToEuros(budget.monthlyBudgetCents) : 0}
          />
        </div>
        <div>
          <Label htmlFor="maxCpcEuros">CPC máximo (€)</Label>
          <Input
            id="maxCpcEuros"
            name="maxCpcEuros"
            type="number"
            min={0}
            step="0.01"
            defaultValue={budget?.maxCpcCents ? centsToEuros(budget.maxCpcCents) : ""}
            placeholder="Opcional"
          />
        </div>
        <div>
          <Label htmlFor="targetCplEuros">CPL objetivo (€)</Label>
          <Input
            id="targetCplEuros"
            name="targetCplEuros"
            type="number"
            min={0}
            step="0.01"
            defaultValue={budget?.targetCplCents ? centsToEuros(budget.targetCplCents) : ""}
            placeholder="Opcional"
          />
        </div>
      </div>

      <InfoNote tone="warning">
        Estos límites se guardan como referencia. El reparto automático del presupuesto todavía no está activo: hoy
        cada puja se aplica manualmente desde el panel de posiciones.
      </InfoNote>

      <div>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Guardando…" : "Guardar presupuesto"}
        </Button>
        {state.message ? (
          <span className={`ml-3 text-[13px] ${state.ok ? "text-positive" : "text-negative"}`}>{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
