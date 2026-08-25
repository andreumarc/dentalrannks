"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { markIpBurstAsSpamAction, markDuplicateBucketAction, changeClinicStatusAction } from "@/server/actions/adminOps";
import type { AdminFormState } from "@/server/adminOps";

const initialState: AdminFormState = { ok: false };

function ActionResult({ state }: { state: AdminFormState }) {
  if (!state.message) return null;
  return <p className={state.ok ? "mt-1 text-[12px] text-positive" : "mt-1 text-[12px] text-negative"}>{state.message}</p>;
}

export function MarkIpBurstSpamButton({ ipHash }: { ipHash: string }) {
  const [state, formAction, pending] = useActionState(markIpBurstAsSpamAction, initialState);
  return (
    <form action={formAction}>
      <input type="hidden" name="ipHash" value={ipHash} />
      <Button type="submit" variant="danger" size="sm" disabled={pending}>
        {pending ? "…" : "Marcar leads como spam"}
      </Button>
      <ActionResult state={state} />
    </form>
  );
}

export function MarkDuplicateBucketButton({ clinicId, phone }: { clinicId: string; phone: string }) {
  const [state, formAction, pending] = useActionState(markDuplicateBucketAction, initialState);
  return (
    <form action={formAction}>
      <input type="hidden" name="clinicId" value={clinicId} />
      <input type="hidden" name="phone" value={phone} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "…" : "Marcar duplicados"}
      </Button>
      <ActionResult state={state} />
    </form>
  );
}

export function SuspendClinicButton({ clinicId }: { clinicId: string }) {
  const [state, formAction, pending] = useActionState(changeClinicStatusAction, initialState);
  return (
    <form action={formAction}>
      <input type="hidden" name="clinicId" value={clinicId} />
      <input type="hidden" name="status" value="SUSPENDED" />
      <Button type="submit" variant="danger" size="sm" disabled={pending}>
        {pending ? "…" : "Suspender clínica"}
      </Button>
      <ActionResult state={state} />
    </form>
  );
}
