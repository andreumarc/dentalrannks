"use client";

import { useActionState, useRef, useEffect } from "react";
import { Textarea, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addLeadNoteAction } from "@/server/actions/crm";
import type { LeadFormState } from "@/server/crm";

const initialState: LeadFormState = { ok: false, message: "" };

export function LeadNoteForm({ leadId }: { leadId: string }) {
  const [state, formAction, pending] = useActionState(addLeadNoteAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form action={formAction} ref={formRef} className="flex flex-col gap-2">
      <input type="hidden" name="leadId" value={leadId} />
      <Textarea name="body" rows={3} placeholder="Añade una nota interna sobre este lead…" required />
      <div className="flex items-center justify-between gap-3">
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Guardando…" : "Añadir nota"}
        </Button>
        {!state.ok && state.message ? <FieldError>{state.message}</FieldError> : null}
      </div>
    </form>
  );
}
