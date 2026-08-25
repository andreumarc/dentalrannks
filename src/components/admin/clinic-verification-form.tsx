"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { InfoNote } from "@/components/ui/states";
import { changeClinicVerificationAction } from "@/server/actions/adminOps";
import type { AdminFormState } from "@/server/adminOps";

const initialState: AdminFormState = { ok: false };

export function ClinicVerificationForm({ clinicId, blockers }: { clinicId: string; blockers: string[] }) {
  const [state, formAction, pending] = useActionState(changeClinicVerificationAction, initialState);

  return (
    <div className="flex flex-col gap-3">
      {blockers.length > 0 ? (
        <InfoNote tone="warning">
          No se puede verificar todavía: {blockers.join(", ")}.
        </InfoNote>
      ) : null}

      <form action={formAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="clinicId" value={clinicId} />
        <Button type="submit" name="decision" value="VERIFY" disabled={pending || blockers.length > 0} size="sm">
          Verificar
        </Button>
        <Button type="submit" name="decision" value="REJECT" variant="danger" disabled={pending} size="sm">
          Rechazar
        </Button>
        <Button type="submit" name="decision" value="RESET" variant="outline" disabled={pending} size="sm">
          Reiniciar a sin verificar
        </Button>
      </form>

      {state.message ? (
        <p className={state.ok ? "text-[13px] text-positive" : "text-[13px] text-negative"}>{state.message}</p>
      ) : null}
    </div>
  );
}
