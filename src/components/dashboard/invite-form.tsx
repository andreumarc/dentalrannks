"use client";

import { useActionState, useRef, useEffect } from "react";
import { Input, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { inviteTeamMemberAction } from "@/server/actions/dashboard";
import type { SimpleFormState } from "@/server/dashboard";

const initialState: SimpleFormState = { ok: false, message: "" };

export function InviteForm({ organizationId }: { organizationId: string }) {
  const [state, formAction, pending] = useActionState(inviteTeamMemberAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form action={formAction} ref={formRef} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="organizationId" value={organizationId} />
      <div className="flex-1 min-w-[220px]">
        <Label htmlFor="invite-email">Email</Label>
        <Input id="invite-email" name="email" type="email" required placeholder="persona@clinica.com" />
      </div>
      <div>
        <Label htmlFor="invite-role">Rol</Label>
        <Select id="invite-role" name="role" defaultValue="CLINIC_USER" className="w-44">
          <option value="CLINIC_USER">Equipo</option>
          <option value="CLINIC_ADMIN">Administrador</option>
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Invitar"}
      </Button>
      {state.message ? (
        <p className={`w-full text-[13px] ${state.ok ? "text-positive" : "text-negative"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
