"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { changeClinicStatusAction } from "@/server/actions/adminOps";
import type { AdminFormState } from "@/server/adminOps";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Borrador" },
  { value: "PENDING_REVIEW", label: "En revisión" },
  { value: "PUBLISHED", label: "Publicada" },
  { value: "SUSPENDED", label: "Suspendida" },
];

const initialState: AdminFormState = { ok: false };

export function ClinicStatusForm({ clinicId, currentStatus }: { clinicId: string; currentStatus: string }) {
  const [state, formAction, pending] = useActionState(changeClinicStatusAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="clinicId" value={clinicId} />
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
