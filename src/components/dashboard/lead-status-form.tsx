"use client";

import { useActionState } from "react";
import { Select, Textarea, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { changeLeadStatusAction } from "@/server/actions/crm";
import type { LeadFormState } from "@/server/crm";
import { LEAD_STATUS_OPTIONS } from "@/components/dashboard/status-badge";
import type { LeadStatus } from "@prisma/client";

const initialState: LeadFormState = { ok: false, message: "" };

export function LeadStatusForm({ leadId, currentStatus }: { leadId: string; currentStatus: LeadStatus }) {
  const [state, formAction, pending] = useActionState(changeLeadStatusAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="leadId" value={leadId} />
      <div>
        <Label htmlFor="status">Cambiar estado</Label>
        <Select id="status" name="status" defaultValue={currentStatus}>
          {LEAD_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="note">Nota (opcional)</Label>
        <Textarea id="note" name="note" rows={2} placeholder="Contexto del cambio de estado…" />
      </div>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Guardando…" : "Actualizar estado"}
      </Button>
      {state.message ? (
        <FieldError>{!state.ok ? state.message : null}</FieldError>
      ) : null}
      {state.ok && state.message ? <p className="text-[13px] text-positive">{state.message}</p> : null}
    </form>
  );
}
