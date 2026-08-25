"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/input";
import { assignLeadAction } from "@/server/actions/crm";
import type { LeadFormState } from "@/server/crm";

const initialState: LeadFormState = { ok: false, message: "" };

export function LeadAssignForm({
  leadId,
  currentUserId,
  members,
}: {
  leadId: string;
  currentUserId: string | null;
  members: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(assignLeadAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="leadId" value={leadId} />
      <Select
        name="userId"
        defaultValue={currentUserId ?? ""}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">Sin asignar</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </Select>
      {state.message ? (
        <p className={`text-[12.5px] ${state.ok ? "text-positive" : "text-negative"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
