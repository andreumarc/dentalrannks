"use client";

import { useActionState } from "react";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toggleUserActiveAction, changeUserRoleAction } from "@/server/actions/adminOps";
import type { AdminFormState } from "@/server/adminOps";

const initialState: AdminFormState = { ok: false };

export function UserActiveControl({ userId, active }: { userId: string; active: boolean }) {
  const [state, formAction, pending] = useActionState(toggleUserActiveAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <Button type="submit" variant={active ? "danger" : "outline"} size="sm" disabled={pending}>
        {pending ? "…" : active ? "Desactivar" : "Activar"}
      </Button>
      {state.message ? (
        <p className={state.ok ? "text-[12px] text-positive" : "text-[12px] text-negative"}>{state.message}</p>
      ) : null}
    </form>
  );
}

export function UserRoleControl({ userId, role }: { userId: string; role: string }) {
  const [state, formAction, pending] = useActionState(changeUserRoleAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex items-center gap-2">
        <Select name="role" defaultValue={role} className="h-9 text-[13px]" disabled={pending}>
          <option value="USER">Usuario</option>
          <option value="SUPER_ADMIN">Super admin</option>
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
