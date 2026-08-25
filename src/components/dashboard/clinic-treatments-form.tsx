"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveClinicTreatmentsAction } from "@/server/actions/dashboard";
import type { SimpleFormState } from "@/server/dashboard";
import { centsToEuros } from "@/lib/money";

const initialState: SimpleFormState = { ok: false, message: "" };

type Treatment = { id: string; name: string; category: { name: string } };
type ClinicTreatment = { treatmentId: string; priceFromCents: number | null };

export function ClinicTreatmentsForm({
  clinicId,
  allTreatments,
  clinicTreatments,
}: {
  clinicId: string;
  allTreatments: Treatment[];
  clinicTreatments: ClinicTreatment[];
}) {
  const [state, formAction, pending] = useActionState(saveClinicTreatmentsAction, initialState);
  const enabled = new Map(clinicTreatments.map((ct) => [ct.treatmentId, ct.priceFromCents]));

  const grouped = allTreatments.reduce<Record<string, Treatment[]>>((acc, t) => {
    (acc[t.category.name] ??= []).push(t);
    return acc;
  }, {});

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="clinicId" value={clinicId} />

      {Object.entries(grouped).map(([category, treatments]) => (
        <div key={category}>
          <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-grey">{category}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {treatments.map((t) => {
              const isEnabled = enabled.has(t.id);
              const price = enabled.get(t.id);
              return (
                <div key={t.id} className="flex items-center gap-2 rounded-brand border border-line px-3 py-2">
                  <input
                    type="checkbox"
                    name={`t_${t.id}`}
                    defaultChecked={isEnabled}
                    className="size-4 shrink-0 accent-cyan-brand"
                  />
                  <span className="flex-1 truncate text-[13.5px] text-ink">{t.name}</span>
                  <span className="flex items-center gap-1 text-[12.5px] text-grey">
                    desde
                    <Input
                      name={`p_${t.id}`}
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={price ? centsToEuros(price) : ""}
                      className="h-8 w-20 px-2 text-[13px]"
                      placeholder="€"
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Guardando…" : "Guardar tratamientos"}
        </Button>
        {state.message ? (
          <span className={`text-[13.5px] ${state.ok ? "text-positive" : "text-negative"}`}>{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
